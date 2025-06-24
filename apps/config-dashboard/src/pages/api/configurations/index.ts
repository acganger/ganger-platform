import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { z } from 'zod';

interface Configuration {
  id: string;
  app_id: string;
  config_key: string;
  config_section?: string;
  config_value: any;
  value_type: string;
  description?: string;
  is_sensitive: boolean;
  requires_restart: boolean;
  environment: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

interface ConfigurationWithApp extends Configuration {
  platform_applications: {
    app_name: string;
    display_name: string;
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

const CreateConfigurationSchema = z.object({
  app_id: z.string().uuid(),
  config_key: z.string().min(1).max(255),
  config_section: z.string().max(100).optional(),
  config_value: z.any(),
  value_type: z.enum(['string', 'number', 'boolean', 'json', 'array']).default('json'),
  description: z.string().max(1000).optional(),
  is_sensitive: z.boolean().default(false),
  requires_restart: z.boolean().default(false),
  environment: z.enum(['development', 'staging', 'production']).default('production')
});

const UpdateConfigurationSchema = CreateConfigurationSchema.omit({ app_id: true }).partial();

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
  const { data: hasPermission } = await supabase
    .rpc('check_user_app_permission', {
      user_id: userId,
      app_id: appId,
      required_level: 'read',
      config_key: configKey,
      config_section: configSection
    });

  if (!hasPermission) {
    return { hasRead: false, hasWrite: false, hasAdmin: false };
  }

  // Check write permission
  const { data: hasWritePermission } = await supabase
    .rpc('check_user_app_permission', {
      user_id: userId,
      app_id: appId,
      required_level: 'write',
      config_key: configKey,
      config_section: configSection
    });

  // Check admin permission
  const { data: hasAdminPermission } = await supabase
    .rpc('check_user_app_permission', {
      user_id: userId,
      app_id: appId,
      required_level: 'admin',
      config_key: configKey,
      config_section: configSection
    });

  return {
    hasRead: true,
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

  if (req.method === 'GET') {
    try {
      // Parse query parameters
      const {
        app_id,
        config_section,
        environment = 'production',
        is_sensitive,
        approval_status,
        search,
        page = '1',
        limit = '25',
        sortBy = 'config_key',
        sortOrder = 'asc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100);
      const offset = (pageNum - 1) * limitNum;

      // Build query with app details
      let query = supabase
        .from('app_configurations')
        .select(`
          *,
          platform_applications!inner(
            app_name,
            display_name
          )
        `, { count: 'exact' });

      // Apply filters
      if (app_id) {
        query = query.eq('app_id', app_id);
      }

      if (config_section) {
        query = query.eq('config_section', config_section);
      }

      if (environment) {
        query = query.eq('environment', environment);
      }

      if (is_sensitive !== undefined) {
        query = query.eq('is_sensitive', is_sensitive === 'true');
      }

      if (approval_status) {
        query = query.eq('approval_status', approval_status);
      }

      if (search) {
        query = query.or(`config_key.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply sorting
      const validSortColumns = ['config_key', 'config_section', 'environment', 'created_at', 'updated_at'];
      if (validSortColumns.includes(sortBy as string)) {
        query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });
      } else {
        query = query.order('config_key', { ascending: true });
      }

      // Apply pagination
      query = query.range(offset, offset + limitNum - 1);

      const { data: configurations, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        res.status(500).json(
          errorResponse('DATABASE_ERROR', 'Failed to fetch configurations')
        );
      }

      // Filter configurations based on user permissions
      const filteredConfigurations = [];
      
      for (const config of configurations || []) {
        const permissions = await checkConfigurationPermissions(
          supabase, 
          user.id, 
          config.app_id, 
          config.config_section, 
          config.config_key
        );

        if (permissions.hasRead) {
          // Filter sensitive values for non-admin users
          if (config.is_sensitive && !permissions.hasAdmin) {
            config.config_value = '[SENSITIVE - HIDDEN]';
          }
          filteredConfigurations.push(config);
        }
      }

      res.status(200).json(
        successResponse(filteredConfigurations, {
          total: count || 0,
          page: pageNum,
          limit: limitNum
        })
      );

    } catch (error) {
      console.error('Configurations fetch error:', error);
      res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'Failed to fetch configurations')
      );
    }
  }

  if (req.method === 'POST') {
    try {
      // Validate request data
      const validation = CreateConfigurationSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json(
          errorResponse('VALIDATION_ERROR', 'Invalid configuration data', validation.error.errors)
        );
        return;
      }

      const configData = validation.data!;

      // Check write permissions for the app
      const permissions = await checkConfigurationPermissions(
        supabase, 
        user.id, 
        configData.app_id, 
        configData.config_section, 
        configData.config_key
      );

      if (!permissions.hasWrite) {
        res.status(403).json(
          errorResponse('INSUFFICIENT_PERMISSIONS', 'Write permissions required for this configuration')
        );
      }

      // Check if configuration already exists
      const { data: existingConfig } = await supabase
        .from('app_configurations')
        .select('id')
        .eq('app_id', configData.app_id)
        .eq('config_key', configData.config_key)
        .eq('environment', configData.environment)
        .single();

      if (existingConfig) {
        res.status(409).json(
          errorResponse('DUPLICATE_CONFIGURATION', 'Configuration already exists for this app/key/environment')
        );
      }

      // Check if app requires approval for changes
      const { data: app } = await supabase
        .from('platform_applications')
        .select('requires_approval_for_changes')
        .eq('id', configData.app_id)
        .single();

      const approvalStatus = app?.requires_approval_for_changes ? 'pending' : 'approved';
      const approvedBy = approvalStatus === 'approved' ? user.id : null;
      const approvedAt = approvalStatus === 'approved' ? new Date().toISOString() : null;

      // Create configuration
      const { data: newConfiguration, error } = await supabase
        .from('app_configurations')
        .insert({
          ...configData,
          updated_by: user.id,
          approval_status: approvalStatus,
          approved_by: approvedBy,
          approved_at: approvedAt
        })
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
          errorResponse('DATABASE_ERROR', 'Failed to create configuration')
        );
      }

      // If approval required, create pending change record
      if (app?.requires_approval_for_changes) {
        await supabase
          .from('pending_config_changes')
          .insert({
            app_id: configData.app_id,
            config_key: configData.config_key,
            change_type: 'create',
            proposed_value: configData.config_value,
            change_reason: 'New configuration created',
            requested_by: user.id
          });
      }

      res.status(201).json(
        successResponse(newConfiguration)
      );

    } catch (error) {
      console.error('Configuration creation error:', error);
      res.status(500).json(
        errorResponse('INTERNAL_ERROR', 'Failed to create configuration')
      );
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json(
    errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed')
  );
}
// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
