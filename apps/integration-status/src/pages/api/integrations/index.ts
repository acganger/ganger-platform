import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { cacheManager } from '@ganger/cache';
import { z } from 'zod';

const integrationsWithMetricsQueryKey = (filters: any) => 
  `integrations:${filters.status || 'all'}:${filters.category || 'all'}:${filters.search || ''}:${filters.page}:${filters.limit}`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createSupabaseServerClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  if (req.method === 'GET') {
    try {
      const {
        page = '1',
        limit = '20',
        status,
        category,
        search,
        sortBy = 'display_name',
        sortOrder = 'asc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Check cache first
      const cacheKey = integrationsWithMetricsQueryKey({ status, category, search, page, limit });
      const cachedData = await cacheManager.get(cacheKey);
      
      if (cachedData) {
        return res.status(200).json(cachedData);
      }

      // Build base query
      let query = supabase
        .from('integrations')
        .select(`
          *,
          integration_metrics!inner (
            uptime_percentage,
            avg_response_time_ms,
            error_rate,
            created_at
          )
        `, { count: 'exact' })
        .eq('is_active', true)
        .order('display_name', { ascending: sortOrder === 'asc' });

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`display_name.ilike.%${search}%,description.ilike.%${search}%`);
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

      // Get all integration IDs
      const integrationIds = (integrations || []).map(i => i.id);

      // Batch fetch latest metrics for all integrations
      const { data: latestMetrics } = await supabase
        .from('integration_metrics')
        .select('integration_id, uptime_percentage, avg_response_time_ms, error_rate, created_at')
        .in('integration_id', integrationIds)
        .order('created_at', { ascending: false });

      // Batch fetch open incidents count
      const { data: incidentCounts } = await supabase
        .from('alert_incidents')
        .select('integration_id')
        .in('integration_id', integrationIds)
        .in('status', ['open', 'acknowledged']);

      // Create maps for efficient lookup
      const metricsMap = new Map();
      const incidentsMap = new Map();

      // Group latest metrics by integration
      latestMetrics?.forEach(metric => {
        if (!metricsMap.has(metric.integration_id) || 
            new Date(metric.created_at) > new Date(metricsMap.get(metric.integration_id).created_at)) {
          metricsMap.set(metric.integration_id, metric);
        }
      });

      // Count incidents per integration
      incidentCounts?.forEach(incident => {
        incidentsMap.set(
          incident.integration_id, 
          (incidentsMap.get(incident.integration_id) || 0) + 1
        );
      });

      // Combine data efficiently
      const integrationsWithMetrics = (integrations || []).map(integration => ({
        ...integration,
        recent_metrics: metricsMap.get(integration.id) || {
          uptime_percentage: null,
          avg_response_time_ms: null,
          error_rate: null
        },
        open_incidents_count: incidentsMap.get(integration.id) || 0
      }));

      const responseData = {
        success: true,
        data: integrationsWithMetrics,
        meta: {
          total: count || 0,
          page: pageNum,
          limit: limitNum,
          filters: {
            status: status || 'all',
            category: category || 'all',
            search: search || ''
          }
        }
      };

      // Cache for 5 minutes
      await cacheManager.set(cacheKey, responseData, 300);

      return res.status(200).json(responseData);

    } catch (error) {
      console.error('Error in integrations API:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch integrations'
      });
    }
  }

  // ... rest of the POST, PUT, DELETE methods remain the same
}