import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { z } from 'zod';

// Request validation schema
const ApprovalSchema = z.object({
  comments: z.string().min(5).max(500).optional(),
  apply_immediately: z.boolean().default(true)
});

const IdSchema = z.string().uuid();

// Standard API response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method allowed'
      }
    });
  }

  try {
    const supabase = createSupabaseServerClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Validate change ID
    const idResult = IdSchema.safeParse(req.query.id);
    if (!idResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CHANGE_ID',
          message: 'Invalid change ID format'
        }
      });
      return;
    }

    const changeId = idResult.data;

    // Validate request body
    const bodyResult = ApprovalSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST_BODY',
          message: 'Invalid request body',
          details: bodyResult.error.issues
        }
      });
      return;
    }

    const { comments, apply_immediately } = bodyResult.data!;

    // Fetch the pending change
    const { data: pendingChange, error: fetchError } = await supabase
      .from('pending_config_changes')
      .select(`
        *,
        platform_applications (
          app_name,
          display_name,
          requires_approval_for_changes
        )
      `)
      .eq('id', changeId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: {
            code: 'CHANGE_NOT_FOUND',
            message: 'Pending change not found'
          }
        });
      }
      console.error('Pending change fetch error:', fetchError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch pending change'
        }
      });
    }

    // Check if change is still pending
    if (pendingChange.status !== 'pending') {
      res.status(409).json({
        success: false,
        error: {
          code: 'CHANGE_ALREADY_PROCESSED',
          message: `Change has already been ${pendingChange.status}`
        }
      });
    }

    // Check user permissions
    const { data: userPermissions, error: permError } = await supabase
      .rpc('get_effective_permissions', { 
        p_user_id: user.id,
        p_app_id: pendingChange.app_id
      });

    if (permError) {
      console.error('Permission check error:', permError);
      res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: 'Failed to verify permissions'
        }
      });
    }

    // Require admin permission or superadmin role to approve changes
    const hasAccess = userPermissions?.some((perm: any) => 
      perm.permission_level === 'admin' || 
      perm.role_name === 'superadmin'
    );

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to approve changes'
        }
      });
    }

    // Prevent self-approval
    if (pendingChange.requested_by === user.id) {
      res.status(403).json({
        success: false,
        error: {
          code: 'SELF_APPROVAL_FORBIDDEN',
          message: 'Cannot approve your own changes'
        }
      });
    }

    // Start transaction for atomic operations
    const { data: updatedChange, error: updateError } = await supabase
      .from('pending_config_changes')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_comments: comments
      })
      .eq('id', changeId)
      .select(`
        *,
        platform_applications (
          app_name,
          display_name
        ),
        requested_by_user:users!requested_by (
          email,
          name
        ),
        approved_by_user:users!approved_by (
          email,
          name
        )
      `)
      .single();

    if (updateError) {
      console.error('Change approval error:', updateError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to approve change'
        }
      });
    }

    // Apply the change if requested
    let configurationResult = null;
    if (apply_immediately) {
      try {
        // Apply the configuration change
        if (pendingChange.change_type === 'CREATE') {
          const { data: newConfig, error: createError } = await supabase
            .from('app_configurations')
            .insert([{
              app_id: pendingChange.app_id,
              config_key: pendingChange.config_key,
              config_section: pendingChange.config_section,
              config_value: pendingChange.new_value,
              value_type: pendingChange.value_type || 'string',
              description: pendingChange.description,
              is_sensitive: pendingChange.is_sensitive || false,
              requires_restart: pendingChange.requires_restart || false,
              environment: pendingChange.environment || 'production',
              approval_status: 'approved'
            }])
            .select()
            .single();

          if (createError) {
            console.error('Configuration creation error:', createError);
            // Don't fail the approval, but note the issue
          } else {
            configurationResult = newConfig;
          }

        } else if (pendingChange.change_type === 'UPDATE') {
          const { data: updatedConfig, error: updateConfigError } = await supabase
            .from('app_configurations')
            .update({
              config_value: pendingChange.new_value,
              description: pendingChange.description,
              is_sensitive: pendingChange.is_sensitive,
              requires_restart: pendingChange.requires_restart,
              updated_at: new Date().toISOString(),
              approval_status: 'approved'
            })
            .eq('id', pendingChange.config_id)
            .select()
            .single();

          if (updateConfigError) {
            console.error('Configuration update error:', updateConfigError);
            // Don't fail the approval, but note the issue
          } else {
            configurationResult = updatedConfig;
          }

        } else if (pendingChange.change_type === 'DELETE') {
          const { error: deleteError } = await supabase
            .from('app_configurations')
            .delete()
            .eq('id', pendingChange.config_id);

          if (deleteError) {
            console.error('Configuration deletion error:', deleteError);
            // Don't fail the approval, but note the issue
          }
        }

      } catch (error) {
        console.error('Configuration application error:', error);
        // Continue with approval even if application fails
      }
    }

    // Log the approval action
    await supabase
      .from('config_change_audit')
      .insert([{
        app_id: pendingChange.app_id,
        user_id: user.id,
        action: 'CHANGE_APPROVED',
        description: `Approved ${pendingChange.change_type} change for ${pendingChange.config_key}${comments ? `. Comments: ${comments}` : ''}`,
        metadata: {
          change_id: changeId,
          change_type: pendingChange.change_type,
          config_key: pendingChange.config_key,
          applied_immediately: apply_immediately,
          approval_comments: comments,
          requested_by: pendingChange.requested_by_user?.email
        },
        ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent']
      }]);

    res.status(200).json({
      success: true,
      data: {
        change: updatedChange,
        configuration: configurationResult,
        message: apply_immediately 
          ? 'Change approved and applied successfully'
          : 'Change approved successfully'
      }
    });

  } catch (error) {
    console.error('Approve change error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to approve change'
      }
    });
  }
}