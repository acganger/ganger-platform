import type { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest, createSupabaseServerClient } from '@ganger/auth/server';
import { z } from 'zod';

interface Application {
  id: string;
  app_name: string;
  display_name: string;
  description?: string;
  app_version?: string;
  app_url?: string;
  health_check_endpoint?: string;
  documentation_url?: string;
  config_schema?: any;
  default_config?: any;
  is_active: boolean;
  last_discovered_at: string;
  discovery_method: string;
  requires_approval_for_changes: boolean;
  config_change_notification_roles: string[];
  created_at: string;
  updated_at: string;
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

const CreateApplicationSchema = z.object({
  app_name: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  display_name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  app_version: z.string().max(50).optional(),
  app_url: z.string().url().optional(),
  health_check_endpoint: z.string().optional(),
  documentation_url: z.string().url().optional(),
  config_schema: z.any().optional(),
  default_config: z.any().optional(),
  requires_approval_for_changes: z.boolean().optional()
});

const UpdateApplicationSchema = CreateApplicationSchema.partial();

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

async function checkUserPermissions(supabase: any, userId: string, appId?: string): Promise<{ hasRead: boolean; hasWrite: boolean; hasAdmin: boolean }> {
  // Check if user is superadmin
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userProfile?.role === 'superadmin') {
    return { hasRead: true, hasWrite: true, hasAdmin: true };
  }

  // Check specific app permissions if appId provided
  if (appId) {
    const { data: permissions } = await supabase
      .rpc('get_user_effective_permissions', { user_id: userId })
      .eq('app_id', appId);

    if (permissions && permissions.length > 0) {
      const permission = permissions[0];
      return {
        hasRead: ['read', 'write', 'admin'].includes(permission.permission_level),
        hasWrite: ['write', 'admin'].includes(permission.permission_level),
        hasAdmin: permission.permission_level === 'admin'
      };
    }
  }

  // Default permissions for managers
  return {
    hasRead: userProfile?.role === 'manager',
    hasWrite: false,
    hasAdmin: false
  };
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const user = req.user;
  if (!user) {
    res.status(401).json(
      errorResponse('AUTHENTICATION_REQUIRED', 'Authentication required')
    );
    return;
  }
  
  const supabase = createSupabaseServerClient();

  if (req.method === 'GET') {
    try {
      // Check read permissions
      const permissions = await checkUserPermissions(supabase, user.id);
      if (!permissions.hasRead) {
        res.status(403).json(
          errorResponse('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions to read applications')
        );
        return;
      }

      // Parse query parameters
      const {
        page = '1',
        limit = '25',
        search,
        is_active,
        sortBy = 'display_name',
        sortOrder = 'asc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 per page
      const offset = (pageNum - 1) * limitNum;

      // Build query
      let query = supabase
        .from('platform_applications')
        .select('*', { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`app_name.ilike.%${search}%,display_name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (is_active !== undefined) {
        query = query.eq('is_active', is_active === 'true');
      }

      // Apply sorting
      const validSortColumns = ['app_name', 'display_name', 'created_at', 'updated_at', 'last_discovered_at'];
      if (validSortColumns.includes(sortBy as string)) {
        query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });
      } else {
        query = query.order('display_name', { ascending: true });
      }

      // Apply pagination
      query = query.range(offset, offset + limitNum - 1);

      const { data: applications, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        res.status(500).json(
          errorResponse('DATABASE_ERROR', 'Failed to fetch applications')
        );
        return;
      }

      res.status(200).json(
        successResponse(applications || [], {
          total: count || 0,
          page: pageNum,
          limit: limitNum
        })
      );

    } catch (error) {
      console.error('Applications fetch error:', error);
      res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'Failed to fetch applications')
      );
    }
  }

  if (req.method === 'POST') {
    try {
      // Check write permissions
      const permissions = await checkUserPermissions(supabase, user.id);
      if (!permissions.hasAdmin) {
        res.status(403).json(
          errorResponse('INSUFFICIENT_PERMISSIONS', 'Admin permissions required to create applications')
        );
        return;
      }

      // Validate request data
      const validation = CreateApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json(
          errorResponse('VALIDATION_ERROR', 'Invalid application data', validation.error.errors)
        );
        return;
      }

      const applicationData = validation.data;

      // Check if application with same name already exists
      const { data: existingApp } = await supabase
        .from('platform_applications')
        .select('id')
        .eq('app_name', applicationData.app_name)
        .single();

      if (existingApp) {
        res.status(409).json(
          errorResponse('DUPLICATE_APPLICATION', 'Application with this name already exists')
        );
        return;
      }

      // Create application
      const { data: newApplication, error } = await supabase
        .from('platform_applications')
        .insert({
          ...applicationData,
          is_active: true,
          last_discovered_at: new Date().toISOString(),
          discovery_method: 'manual'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        res.status(500).json(
          errorResponse('DATABASE_ERROR', 'Failed to create application')
        );
        return;
      }

      // Grant admin permissions to creator
      await supabase
        .from('app_config_permissions')
        .insert({
          app_id: newApplication.id,
          permission_type: 'user',
          user_id: user.id,
          permission_level: 'admin',
          granted_by: user.id
        });

      res.status(201).json(
        successResponse(newApplication)
      );

    } catch (error) {
      console.error('Application creation error:', error);
      res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'Failed to create application')
      );
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json(
    errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed')
  );
}

export default withAuth(handler);
// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
