import type { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest, createSupabaseServerClient } from '@ganger/auth/server';
import { z } from 'zod';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
  };
}

const UpdateApplicationSchema = z.object({
  display_name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  app_version: z.string().max(50).optional(),
  app_url: z.string().url().optional(),
  health_check_endpoint: z.string().optional(),
  documentation_url: z.string().url().optional(),
  config_schema: z.any().optional(),
  default_config: z.any().optional(),
  is_active: z.boolean().optional(),
  requires_approval_for_changes: z.boolean().optional(),
  config_change_notification_roles: z.array(z.string()).optional()
});

function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString()
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

async function checkUserPermissions(supabase: any, userId: string, appId: string): Promise<{ hasRead: boolean; hasWrite: boolean; hasAdmin: boolean }> {
  // Check if user is superadmin
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userProfile?.role === 'superadmin') {
    return { hasRead: true, hasWrite: true, hasAdmin: true };
  }

  // Check specific app permissions
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

  // Default permissions for managers
  return {
    hasRead: userProfile?.role === 'manager',
    hasWrite: false,
    hasAdmin: false
  };
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<void> {
  const user = req.user;
  if (!user) {
    res.status(401).json(
      errorResponse('AUTHENTICATION_REQUIRED', 'Authentication required')
    );
    return;
  }
  
  const supabase = createSupabaseServerClient();

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).json(
      errorResponse('INVALID_PARAMETER', 'Valid application ID required')
    );
    return;
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    res.status(400).json(
      errorResponse('INVALID_UUID', 'Invalid application ID format')
    );
    return;
  }

  if (req.method === 'GET') {
    try {
      // Check read permissions
      const permissions = await checkUserPermissions(supabase, user.id, id);
      if (!permissions.hasRead) {
        res.status(403).json(
          errorResponse('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions to read this application')
        );
        return;
      }

      // Fetch application
      const { data: application, error } = await supabase
        .from('platform_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          res.status(404).json(
            errorResponse('APPLICATION_NOT_FOUND', 'Application not found')
          );
          return;
        }
        console.error('Database error:', error);
        res.status(500).json(
          errorResponse('DATABASE_ERROR', 'Failed to fetch application')
        );
        return;
      }

      res.status(200).json(
        successResponse(application)
      );

    } catch (error) {
      console.error('Application fetch error:', error);
      res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'Failed to fetch application')
      );
    }
  }

  if (req.method === 'PUT') {
    try {
      // Check write permissions
      const permissions = await checkUserPermissions(supabase, user.id, id);
      if (!permissions.hasWrite) {
        res.status(403).json(
          errorResponse('INSUFFICIENT_PERMISSIONS', 'Write permissions required to update applications')
        );
        return;
      }

      // Validate request data
      const validation = UpdateApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json(
          errorResponse('VALIDATION_ERROR', 'Invalid application data', validation.error.errors)
        );
        return;
      }

      const updateData = validation.data;

      // Update application
      const { data: updatedApplication, error } = await supabase
        .from('platform_applications')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          res.status(404).json(
            errorResponse('APPLICATION_NOT_FOUND', 'Application not found')
          );
          return;
        }
        console.error('Database error:', error);
        res.status(500).json(
          errorResponse('DATABASE_ERROR', 'Failed to update application')
        );
        return;
      }

      res.status(200).json(
        successResponse(updatedApplication)
      );

    } catch (error) {
      console.error('Application update error:', error);
      res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'Failed to update application')
      );
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Check admin permissions
      const permissions = await checkUserPermissions(supabase, user.id, id);
      if (!permissions.hasAdmin) {
        res.status(403).json(
          errorResponse('INSUFFICIENT_PERMISSIONS', 'Admin permissions required to delete applications')
        );
        return;
      }

      // Check if application has any configurations
      const { count: configCount } = await supabase
        .from('app_configurations')
        .select('id', { count: 'exact' })
        .eq('app_id', id);

      if (configCount && configCount > 0) {
        res.status(409).json(
          errorResponse('APPLICATION_HAS_CONFIGURATIONS', 'Cannot delete application with existing configurations')
        );
        return;
      }

      // Delete application (cascade will handle permissions)
      const { error } = await supabase
        .from('platform_applications')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          res.status(404).json(
            errorResponse('APPLICATION_NOT_FOUND', 'Application not found')
          );
          return;
        }
        console.error('Database error:', error);
        res.status(500).json(
          errorResponse('DATABASE_ERROR', 'Failed to delete application')
        );
        return;
      }

      res.status(204).end();

    } catch (error) {
      console.error('Application deletion error:', error);
      res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'Failed to delete application')
      );
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).json(
    errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed')
  );
}

export default withAuth(handler);
// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
