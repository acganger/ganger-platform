import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
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

const UpdateConfigurationSchema = z.object({
  config_value: z.any().optional(),
  value_type: z.enum(['string', 'number', 'boolean', 'json', 'array']).optional(),
  description: z.string().max(1000).optional(),
  is_sensitive: z.boolean().optional(),
  requires_restart: z.boolean().optional(),
  change_reason: z.string().max(500).optional()
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

async function checkConfigurationPermissions(
  supabase: any, 
  userId: string, 
  appId: string, 
  configSection?: string, 
  configKey?: string
): Promise<{ hasRead: boolean; hasWrite: boolean; hasAdmin: boolean }> {
  // Check if user is superadmin
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userProfile?.role === 'superadmin') {
    return { hasRead: true, hasWrite: true, hasAdmin: true };
  }

  // Use the helper function to check permissions
  const { data: hasReadPermission } = await supabase
    .rpc('check_user_app_permission', {
      user_id: userId,
      app_id: appId,
      required_level: 'read',
      config_key: configKey,
      config_section: configSection
    });

  const { data: hasWritePermission } = await supabase
    .rpc('check_user_app_permission', {
      user_id: userId,
      app_id: appId,
      required_level: 'write',
      config_key: configKey,
      config_section: configSection
    });

  const { data: hasAdminPermission } = await supabase
    .rpc('check_user_app_permission', {
      user_id: userId,
      app_id: appId,
      required_level: 'admin',
      config_key: configKey,
      config_section: configSection
    });

  return {
    hasRead: hasReadPermission || false,
    hasWrite: hasWritePermission || false,
    hasAdmin: hasAdminPermission || false
  };
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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).json(
      errorResponse('INVALID_PARAMETER', 'Valid configuration ID required')
    );
    return;
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    res.status(400).json(
      errorResponse('INVALID_UUID', 'Invalid configuration ID format')
    );
    return;
  }

  if (req.method === 'GET') {
    try {
      // Fetch configuration with app details
      const { data: configuration, error } = await supabase
        .from('app_configurations')
        .select(`
          *,
          platform_applications!inner(
            app_name,
            display_name,
            requires_approval_for_changes
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          res.status(404).json(
            errorResponse('CONFIGURATION_NOT_FOUND', 'Configuration not found')
          );
          return;
        }
        console.error('Database error:', error);
        res.status(500).json(
          errorResponse('DATABASE_ERROR', 'Failed to fetch configuration')
        );
        return;
      }

      // Check read permissions
      const permissions = await checkConfigurationPermissions(
        supabase, 
        user.id, 
        configuration.app_id, 
        configuration.config_section, 
        configuration.config_key
      );

      if (!permissions.hasRead) {
        res.status(403).json(
          errorResponse('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions to read this configuration')
        );
        return;
      }

      // Filter sensitive values for non-admin users
      if (configuration.is_sensitive && !permissions.hasAdmin) {
        configuration.config_value = '[SENSITIVE - HIDDEN]';
      }

      res.status(200).json(
        successResponse(configuration)
      );

    } catch (error) {
      console.error('Configuration fetch error:', error);
      res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'Failed to fetch configuration')
      );
    }
  }

  if (req.method === 'PUT') {
    try {
      // First fetch the configuration to check permissions
      const { data: existingConfig, error: fetchError } = await supabase
        .from('app_configurations')
        .select(`
          *,
          platform_applications!inner(
            requires_approval_for_changes
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') { // Not found
          res.status(404).json(
            errorResponse('CONFIGURATION_NOT_FOUND', 'Configuration not found')
          );
          return;
        }
        console.error('Database error:', fetchError);
        res.status(500).json(
          errorResponse('DATABASE_ERROR', 'Failed to fetch configuration')
        );
        return;
      }

      // Check write permissions
      const permissions = await checkConfigurationPermissions(
        supabase, 
        user.id, 
        existingConfig.app_id, 
        existingConfig.config_section, 
        existingConfig.config_key
      );

      if (!permissions.hasWrite) {
        res.status(403).json(
          errorResponse('INSUFFICIENT_PERMISSIONS', 'Write permissions required to update this configuration')
        );
        return;
      }

      // Validate request data
      const validation = UpdateConfigurationSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json(
          errorResponse('VALIDATION_ERROR', 'Invalid configuration data', validation.error.errors)
        );
        return;
      }

      const updateData = validation.data;
      const changeReason = updateData.change_reason || 'Configuration updated';

      // Remove change_reason from update data
      const { change_reason, ...configUpdateData } = updateData;

      // Check if app requires approval for changes
      const requiresApproval = existingConfig.platform_applications.requires_approval_for_changes;

      let finalUpdateData: any = {
        ...configUpdateData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };

      if (requiresApproval) {
        // If approval required, create pending change and don't update config yet
        await supabase
          .from('pending_config_changes')
          .insert({
            app_id: existingConfig.app_id,
            config_key: existingConfig.config_key,
            change_type: 'update',
            current_value: existingConfig.config_value,
            proposed_value: updateData.config_value || existingConfig.config_value,
            change_reason: changeReason,
            requested_by: user.id
          });

        // Don't update the actual configuration, just return the existing one
        res.status(202).json(
          successResponse({
            ...existingConfig,
            pending_approval: true,
            message: 'Change submitted for approval'
          })
        );
      } else {
        // No approval required, update directly
        finalUpdateData.approval_status = 'approved';
        finalUpdateData.approved_by = user.id;
        finalUpdateData.approved_at = new Date().toISOString();
      }

      // Update configuration
      const { data: updatedConfiguration, error } = await supabase
        .from('app_configurations')
        .update(finalUpdateData)
        .eq('id', id)
        .select(`
          *,
          platform_applications!inner(
            app_name,
            display_name
          )
        `)
        .single();

      if (error) {
        console.error('Database error:', error);
        res.status(500).json(
          errorResponse('DATABASE_ERROR', 'Failed to update configuration')
        );
        return;
      }

      res.status(200).json(
        successResponse(updatedConfiguration)
      );

    } catch (error) {
      console.error('Configuration update error:', error);
      res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'Failed to update configuration')
      );
    }
  }

  if (req.method === 'DELETE') {
    try {
      // First fetch the configuration to check permissions
      const { data: existingConfig, error: fetchError } = await supabase
        .from('app_configurations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') { // Not found
          res.status(404).json(
            errorResponse('CONFIGURATION_NOT_FOUND', 'Configuration not found')
          );
          return;
        }
        console.error('Database error:', fetchError);
        res.status(500).json(
          errorResponse('DATABASE_ERROR', 'Failed to fetch configuration')
        );
        return;
      }

      // Check admin permissions for deletion
      const permissions = await checkConfigurationPermissions(
        supabase, 
        user.id, 
        existingConfig.app_id, 
        existingConfig.config_section, 
        existingConfig.config_key
      );

      if (!permissions.hasAdmin) {
        res.status(403).json(
          errorResponse('INSUFFICIENT_PERMISSIONS', 'Admin permissions required to delete configurations')
        );
        return;
      }

      // Delete configuration
      const { error } = await supabase
        .from('app_configurations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        res.status(500).json(
          errorResponse('DATABASE_ERROR', 'Failed to delete configuration')
        );
        return;
      }

      res.status(204).end();

    } catch (error) {
      console.error('Configuration deletion error:', error);
      res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'Failed to delete configuration')
      );
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).json(
    errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed')
  );
}
// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
