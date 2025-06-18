// pages/api/integrations/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/database';

interface IntegrationWithMetrics {
  id: string;
  name: string;
  display_name: string;
  description: string;
  service_type: string;
  category: string;
  current_health_status: 'healthy' | 'warning' | 'critical' | 'unknown';
  is_critical: boolean;
  is_active: boolean;
  monitoring_enabled: boolean;
  last_health_check: string | null;
  last_successful_check: string | null;
  consecutive_failures: number;
  icon_url: string | null;
  responsible_team: string | null;
  environment: 'development' | 'staging' | 'production';
  recent_metrics?: {
    uptime_percentage: number | null;
    avg_response_time_ms: number | null;
    error_rate: number | null;
  };
  open_incidents_count: number;
}

interface ApiResponse {
  success: boolean;
  data?: IntegrationWithMetrics[];
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    filters: Record<string, any>;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Authentication check
  const supabase = createServerSupabaseClient<Database>({ req, res });
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Check user permissions
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['staff', 'manager', 'superadmin'].includes(userProfile.role)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }

  if (req.method === 'GET') {
    try {
      // Parse query parameters
      const {
        status,
        category,
        search,
        page = '1',
        limit = '20',
        sortBy = 'display_name',
        sortOrder = 'asc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause
      let query = supabase
        .from('integrations')
        .select(`
          id,
          name,
          display_name,
          description,
          service_type,
          category,
          current_health_status,
          is_critical,
          is_active,
          monitoring_enabled,
          last_health_check,
          last_successful_check,
          consecutive_failures,
          icon_url,
          responsible_team,
          environment
        `)
        .eq('is_active', true);

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('current_health_status', status);
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`display_name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply sorting
      const sortColumn = sortBy as string;
      const isValidSortColumn = ['display_name', 'service_type', 'current_health_status', 'last_health_check'].includes(sortColumn);
      
      if (isValidSortColumn) {
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' });
      } else {
        // Default sorting
        query = query.order('is_critical', { ascending: false })
                   .order('current_health_status', { ascending: true })
                   .order('display_name', { ascending: true });
      }

      // Apply pagination
      query = query.range(offset, offset + limitNum - 1);

      const { data: integrations, error, count } = await query;

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch integrations'
        });
      }

      // Get recent metrics and open incidents for each integration
      const integrationsWithMetrics = await Promise.all(
        (integrations || []).map(async (integration) => {
          // Get recent metrics
          const { data: recentMetrics } = await supabase
            .from('integration_metrics')
            .select('uptime_percentage, avg_response_time_ms, error_rate')
            .eq('integration_id', integration.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get open incidents count
          const { count: incidentsCount } = await supabase
            .from('alert_incidents')
            .select('id', { count: 'exact' })
            .eq('integration_id', integration.id)
            .in('status', ['open', 'acknowledged']);

          return {
            ...integration,
            recent_metrics: recentMetrics || {
              uptime_percentage: null,
              avg_response_time_ms: null,
              error_rate: null
            },
            open_incidents_count: incidentsCount || 0
          };
        })
      );

      // Get total count for pagination
      const { count: totalCount } = await supabase
        .from('integrations')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

      return res.status(200).json({
        success: true,
        data: integrationsWithMetrics,
        meta: {
          total: totalCount || 0,
          page: pageNum,
          limit: limitNum,
          filters: {
            status: status || 'all',
            category: category || 'all',
            search: search || ''
          }
        }
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch integrations'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        name,
        display_name,
        description,
        service_type,
        category = 'external',
        base_url,
        health_check_endpoint,
        auth_type,
        auth_config,
        is_critical = false,
        monitoring_enabled = true,
        health_check_interval_minutes = 5,
        timeout_seconds = 30,
        responsible_team,
        environment = 'production',
        custom_headers,
        expected_response_codes = [200],
        health_check_method = 'GET',
        health_check_body
      } = req.body;

      // Validation
      if (!name || !display_name || !service_type || !auth_type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, display_name, service_type, auth_type'
        });
      }

      // Check if integration with same name already exists
      const { data: existingIntegration } = await supabase
        .from('integrations')
        .select('id')
        .eq('name', name)
        .single();

      if (existingIntegration) {
        return res.status(409).json({
          success: false,
          error: 'Integration with this name already exists'
        });
      }

      // Create new integration
      const { data: newIntegration, error } = await supabase
        .from('integrations')
        .insert({
          name,
          display_name,
          description,
          service_type,
          category,
          base_url,
          health_check_endpoint,
          auth_type,
          auth_config,
          is_critical,
          monitoring_enabled,
          health_check_interval_minutes,
          timeout_seconds,
          responsible_team,
          environment,
          custom_headers,
          expected_response_codes,
          health_check_method,
          health_check_body,
          current_health_status: 'unknown'
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create integration'
        });
      }

      // Log the creation
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: user.id,
          action: 'integration_created',
          resource_type: 'integration',
          resource_id: newIntegration.id,
          metadata: {
            integration_name: name,
            service_type,
            is_critical
          }
        });

      return res.status(201).json({
        success: true,
        data: [newIntegration]
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create integration'
      });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}
// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
