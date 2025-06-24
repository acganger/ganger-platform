import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { z } from 'zod';

// Request validation schemas
const UpdatePermissionSchema = z.object({
  permission_level: z.enum(['read', 'write', 'admin']).optional(),
  config_section: z.string().optional(),
  specific_keys: z.array(z.string()).optional(),
  expires_at: z.string().datetime().optional().nullable(),
  is_active: z.boolean().optional()
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

    // Validate permission ID
    const idResult = IdSchema.safeParse(req.query.id);
    if (!idResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PERMISSION_ID',
          message: 'Invalid permission ID format'
        }
      });
      return;
    }

    const permissionId = idResult.data!;

    switch (req.method) {
      case 'GET':
        return await handleGetPermission(req, res, supabase, user, permissionId);
      case 'PUT':
        return await handleUpdatePermission(req, res, supabase, user, permissionId);
      case 'DELETE':
        return await handleDeletePermission(req, res, supabase, user, permissionId);
      default:
        res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `Method ${req.method} not allowed`
          }
        });
    }
  } catch (error) {
    console.error('Permission API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
}

async function handleGetPermission(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  user: any,
  permissionId: string
) {
  try {
    // Fetch the permission with related data
    const { data: permission, error: fetchError } = await supabase
      .from('app_config_permissions')
      .select(`
        *,
        platform_applications (
          app_name,
          display_name
        ),
        users (
          email,
          name
        ),
        granted_by_user:users!granted_by (
          email,
          name
        )
      `)
      .eq('id', permissionId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: {
            code: 'PERMISSION_NOT_FOUND',
            message: 'Permission not found'
          }
        });
      }
      console.error('Permission fetch error:', fetchError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch permission'
        }
      });
    }

    // Check if user has admin permission on the app
    const { data: userPermissions, error: permError } = await supabase
      .rpc('get_effective_permissions', { 
        p_user_id: user.id, 
        p_app_id: permission.app_id 
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

    // Require admin permission on the app or superadmin role
    const hasAccess = userPermissions?.some((perm: any) => 
      perm.permission_level === 'admin' || 
      perm.role_name === 'superadmin'
    );

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to view this permission'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: permission
    });

  } catch (error) {
    console.error('Get permission error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch permission'
      }
    });
  }
}

async function handleUpdatePermission(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  user: any,
  permissionId: string
) {
  try {
    // Validate request body
    const bodyResult = UpdatePermissionSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST_BODY',
          message: 'Invalid request body',
          details: bodyResult.error.issues
        }
      });
    }

    const updateData = bodyResult.data;

    // First, fetch the existing permission to check ownership
    const { data: existingPermission, error: fetchError } = await supabase
      .from('app_config_permissions')
      .select('*, platform_applications(app_name)')
      .eq('id', permissionId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: {
            code: 'PERMISSION_NOT_FOUND',
            message: 'Permission not found'
          }
        });
      }
      console.error('Permission fetch error:', fetchError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch permission'
        }
      });
    }

    // Check if user has admin permission on the app
    const { data: userPermissions, error: permError } = await supabase
      .rpc('get_effective_permissions', { 
        p_user_id: user.id, 
        p_app_id: existingPermission.app_id 
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

    // Require admin permission on the app or superadmin role
    const hasAccess = userPermissions?.some((perm: any) => 
      perm.permission_level === 'admin' || 
      perm.role_name === 'superadmin'
    );

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to modify this permission'
        }
      });
    }

    // Update the permission
    const { data: updatedPermission, error: updateError } = await supabase
      .from('app_config_permissions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', permissionId)
      .select(`
        *,
        platform_applications (
          app_name,
          display_name
        ),
        users (
          email,
          name
        ),
        granted_by_user:users!granted_by (
          email,
          name
        )
      `)
      .single();

    if (updateError) {
      console.error('Permission update error:', updateError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update permission'
        }
      });
    }

    // Log the permission modification action
    await supabase
      .from('config_change_audit')
      .insert([{
        app_id: existingPermission.app_id,
        user_id: user.id,
        action: 'PERMISSION_MODIFIED',
        description: `Modified permission ${permissionId}`,
        before_value: existingPermission,
        after_value: updateData,
        ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent']
      }]);

    res.status(200).json({
      success: true,
      data: updatedPermission
    });

  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update permission'
      }
    });
  }
}

async function handleDeletePermission(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  user: any,
  permissionId: string
) {
  try {
    // First, fetch the existing permission to check ownership
    const { data: existingPermission, error: fetchError } = await supabase
      .from('app_config_permissions')
      .select('*, platform_applications(app_name)')
      .eq('id', permissionId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: {
            code: 'PERMISSION_NOT_FOUND',
            message: 'Permission not found'
          }
        });
      }
      console.error('Permission fetch error:', fetchError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch permission'
        }
      });
    }

    // Check if user has admin permission on the app
    const { data: userPermissions, error: permError } = await supabase
      .rpc('get_effective_permissions', { 
        p_user_id: user.id, 
        p_app_id: existingPermission.app_id 
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

    // Require admin permission on the app or superadmin role
    const hasAccess = userPermissions?.some((perm: any) => 
      perm.permission_level === 'admin' || 
      perm.role_name === 'superadmin'
    );

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to delete this permission'
        }
      });
    }

    // Soft delete by setting is_active to false instead of hard delete
    const { error: deleteError } = await supabase
      .from('app_config_permissions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', permissionId);

    if (deleteError) {
      console.error('Permission deletion error:', deleteError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to revoke permission'
        }
      });
    }

    // Log the permission revocation action
    await supabase
      .from('config_change_audit')
      .insert([{
        app_id: existingPermission.app_id,
        user_id: user.id,
        action: 'PERMISSION_REVOKED',
        description: `Revoked permission ${permissionId} for ${
          existingPermission.permission_type === 'role' 
            ? `role: ${existingPermission.role_name}` 
            : `user: ${existingPermission.user_id}`
        }`,
        before_value: existingPermission,
        ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent']
      }]);

    res.status(200).json({
      success: true,
      data: { message: 'Permission revoked successfully' }
    });

  } catch (error) {
    console.error('Delete permission error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to revoke permission'
      }
    });
  }
}
// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
