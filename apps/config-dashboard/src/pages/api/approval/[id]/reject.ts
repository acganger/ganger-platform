import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { z } from 'zod';

// Request validation schema
const RejectionSchema = z.object({
  reason: z.string().min(10).max(500), // Reason is required for rejection
  feedback: z.string().max(1000).optional() // Optional additional feedback
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
    const bodyResult = RejectionSchema.safeParse(req.body);
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

    const { reason, feedback } = bodyResult.data!;

    // Fetch the pending change
    const { data: pendingChange, error: fetchError } = await supabase
      .from('pending_config_changes')
      .select(`
        *,
        platform_applications (
          app_name,
          display_name
        ),
        requested_by_user:users!requested_by (
          email,
          name
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

    // Require admin permission or superadmin role to reject changes
    const hasAccess = userPermissions?.some((perm: any) => 
      perm.permission_level === 'admin' || 
      perm.role_name === 'superadmin'
    );

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to reject changes'
        }
      });
    }

    // Update the pending change to rejected status
    const { data: rejectedChange, error: updateError } = await supabase
      .from('pending_config_changes')
      .update({
        status: 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_comments: reason,
        rejection_feedback: feedback
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
      console.error('Change rejection error:', updateError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to reject change'
        }
      });
    }

    // Log the rejection action
    await supabase
      .from('config_change_audit')
      .insert([{
        app_id: pendingChange.app_id,
        user_id: user.id,
        action: 'CHANGE_REJECTED',
        description: `Rejected ${pendingChange.change_type} change for ${pendingChange.config_key}. Reason: ${reason}${feedback ? `. Additional feedback: ${feedback}` : ''}`,
        metadata: {
          change_id: changeId,
          change_type: pendingChange.change_type,
          config_key: pendingChange.config_key,
          rejection_reason: reason,
          rejection_feedback: feedback,
          requested_by: pendingChange.requested_by_user?.email
        },
        ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent']
      }]);

    // TODO: Send notification to the requester about the rejection
    // This could be implemented with email notifications or in-app notifications

    res.status(200).json({
      success: true,
      data: {
        change: rejectedChange,
        message: 'Change rejected successfully'
      }
    });

  } catch (error) {
    console.error('Reject change error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to reject change'
      }
    });
  }
}