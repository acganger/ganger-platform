import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { z } from 'zod';

interface Permission {
  id: string;
  app_id: string;
  permission_type: 'role' | 'user';
  role_name?: string;
  user_id?: string;
  permission_level: 'read' | 'write' | 'admin';
  config_section?: string;
  specific_keys?: string[];
  location_restricted: boolean;
  allowed_locations?: string[];
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  granted_by?: string;
}

interface PermissionWithDetails extends Permission {
  platform_applications: {
    app_name: string;
    display_name: string;
  };
  users?: {
    email: string;
    name?: string;
  };
  granted_by_user?: {
    email: string;
    name?: string;
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}

const BasePermissionSchema = z.object({
  app_id: z.string().uuid(),
  permission_type: z.enum(['role', 'user']),
  role_name: z.string().min(1).max(100).optional(),
  user_id: z.string().uuid().optional(),
  permission_level: z.enum(['read', 'write', 'admin']),
  config_section: z.string().max(100).optional(),
  specific_keys: z.array(z.string()).optional(),
  location_restricted: z.boolean().default(false),
  allowed_locations: z.array(z.string().uuid()).optional(),
  expires_at: z.string().datetime().optional()
});

const CreatePermissionSchema = BasePermissionSchema.refine(
  (data) => {
    // Ensure either role_name or user_id is provided, not both
    return (data.permission_type === 'role' && data.role_name && !data.user_id) ||
           (data.permission_type === 'user' && data.user_id && !data.role_name);
  },
  {
    message: "Must provide either role_name (for role type) or user_id (for user type), not both",
    path: ["permission_type"]
  }
);

const UpdatePermissionSchema = BasePermissionSchema.omit({ app_id: true, permission_type: true }).partial();

function successResponse<T>(data: T, meta?: Partial<ApiResponse['meta']>): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}

function errorResponse(code: string, message: string, details?: any): ApiResponse {
  return {
    success: false,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString()
    }
  };
}

async function checkPermissionManagementAccess(supabase: any, userId: string, appId?: string): Promise<boolean> {
  // Check if user is superadmin
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userProfile?.role === 'superadmin') {
    return true;
  }

  // Managers can manage permissions for apps they have admin access to
  if (userProfile?.role === 'manager' && appId) {
    const { data: hasAdminPermission } = await supabase
      .rpc('check_user_app_permission', {
        user_id: userId,
        app_id: appId,
        required_level: 'admin'
      });

    return hasAdminPermission || false;
  }

  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Authentication check
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    res.status(401).json(
      errorResponse('AUTHENTICATION_REQUIRED', 'Authentication required')
    );
    return;
  }

  if (req.method === 'GET') {
    try {
      // Parse query parameters
      const {
        app_id,
        permission_type,
        permission_level,
        user_id: filterUserId,
        role_name,
        is_active,
        page = '1',
        limit = '25',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100);
      const offset = (pageNum - 1) * limitNum;

      // Build query with detailed information
      let query = supabase
        .from('app_config_permissions')
        .select(`
          *,
          platform_applications!inner(
            app_name,
            display_name
          ),
          users(
            email,
            name
          ),
          granted_by_user:users!granted_by(
            email,
            name
          )
        `, { count: 'exact' });

      // Apply filters
      if (app_id) {
        query = query.eq('app_id', app_id);
        
        // Check if user can view permissions for this app
        const canManage = await checkPermissionManagementAccess(supabase, user.id, app_id as string);
        if (!canManage) {
          res.status(403).json(
            errorResponse('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions to view permissions for this application')
          );
          return;
        }
      } else {
        // If no specific app, check if user is superadmin
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userProfile?.role !== 'superadmin') {
          res.status(403).json(
            errorResponse('INSUFFICIENT_PERMISSIONS', 'Superadmin access required to view all permissions')
          );
          return;
        }
      }

      if (permission_type) {
        query = query.eq('permission_type', permission_type);
      }

      if (permission_level) {
        query = query.eq('permission_level', permission_level);
      }

      if (filterUserId) {
        query = query.eq('user_id', filterUserId);
      }

      if (role_name) {
        query = query.eq('role_name', role_name);
      }

      if (is_active !== undefined) {
        query = query.eq('is_active', is_active === 'true');
      }

      // Apply sorting
      const validSortColumns = ['created_at', 'permission_level', 'expires_at'];
      if (validSortColumns.includes(sortBy as string)) {
        query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + limitNum - 1);

      const { data: permissions, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        res.status(500).json(
          errorResponse('DATABASE_ERROR', 'Failed to fetch permissions')
        );
        return;
      }

      res.status(200).json(
        successResponse(permissions || [], {
          total: count || 0,
          page: pageNum,
          limit: limitNum
        })
      );

    } catch (error) {
      console.error('Permissions fetch error:', error);
      res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'Failed to fetch permissions')
      );
    }
  }

  if (req.method === 'POST') {
    try {
      // Validate request data
      const validation = CreatePermissionSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json(
          errorResponse('VALIDATION_ERROR', 'Invalid permission data', validation.error.errors)
        );
        return;
      }

      const permissionData = validation.data;

      // Check if user can manage permissions for this app
      const canManage = await checkPermissionManagementAccess(supabase, user.id, permissionData.app_id);
      if (!canManage) {
        res.status(403).json(
          errorResponse('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions to create permissions for this application')
        );
        return;
      }

      // Validate that the target user exists (if user permission)
      if (permissionData.permission_type === 'user') {
        const { data: targetUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', permissionData.user_id)
          .single();

        if (!targetUser) {
          res.status(400).json(
            errorResponse('USER_NOT_FOUND', 'Target user not found')
          );
          return;
        }
      }

      // Validate that the app exists
      const { data: app } = await supabase
        .from('platform_applications')
        .select('id')
        .eq('id', permissionData.app_id)
        .single();

      if (!app) {
        res.status(400).json(
          errorResponse('APPLICATION_NOT_FOUND', 'Application not found')
        );
        return;
      }

      // Check if similar permission already exists
      let duplicateQuery = supabase
        .from('app_config_permissions')
        .select('id')
        .eq('app_id', permissionData.app_id)
        .eq('permission_type', permissionData.permission_type)
        .eq('permission_level', permissionData.permission_level);

      if (permissionData.permission_type === 'user') {
        duplicateQuery = duplicateQuery.eq('user_id', permissionData.user_id);
      } else {
        duplicateQuery = duplicateQuery.eq('role_name', permissionData.role_name);
      }

      if (permissionData.config_section) {
        duplicateQuery = duplicateQuery.eq('config_section', permissionData.config_section);
      }

      const { data: existingPermission } = await duplicateQuery.single();

      if (existingPermission) {
        res.status(409).json(
          errorResponse('DUPLICATE_PERMISSION', 'Similar permission already exists')
        );
        return;
      }

      // Create permission
      const { data: newPermission, error } = await supabase
        .from('app_config_permissions')
        .insert({
          ...permissionData,
          granted_by: user.id,
          is_active: true
        })
        .select(`
          *,
          platform_applications!inner(
            app_name,
            display_name
          ),
          users(
            email,
            name
          ),
          granted_by_user:users!granted_by(
            email,
            name
          )
        `)
        .single();

      if (error) {
        console.error('Database error:', error);
        res.status(500).json(
          errorResponse('DATABASE_ERROR', 'Failed to create permission')
        );
        return;
      }

      res.status(201).json(
        successResponse(newPermission)
      );

    } catch (error) {
      console.error('Permission creation error:', error);
      res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'Failed to create permission')
      );
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json(
    errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed')
  );
}