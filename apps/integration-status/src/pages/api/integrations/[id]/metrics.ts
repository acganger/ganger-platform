// pages/api/integrations/[id]/metrics.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../../types/database';

interface MetricsData {
  timestamp: string;
  uptime_percentage: number | null;
  avg_response_time_ms: number | null;
  error_rate: number | null;
  total_checks: number;
  successful_checks: number;
  failed_checks: number;
  p95_response_time_ms: number | null;
  p99_response_time_ms: number | null;
}

interface MetricsSummary {
  current_status: string;
  overall_uptime: number;
  avg_response_time: number;
  total_incidents: number;
  mttr_minutes: number; // Mean Time To Recovery
  last_incident: string | null;
  trend_analysis: {
    uptime_trend: 'improving' | 'stable' | 'degrading';
    performance_trend: 'improving' | 'stable' | 'degrading';
    confidence: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    integration_id: string;
    integration_name: string;
    timeframe: string;
    summary: MetricsSummary;
    metrics: MetricsData[];
    health_checks: any[];
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

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

  try {
    const { id: integrationId } = req.query;
    const { 
      timeframe = '24h',
      granularity = 'hour'
    } = req.query;

    if (!integrationId || typeof integrationId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Integration ID is required'
      });
    }

    // Get integration details
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('id, name, display_name, current_health_status')
      .eq('id', integrationId)
      .single();

    if (fetchError || !integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    // Calculate time range based on timeframe
    const timeRanges = {
      '1h': { hours: 1, minGranularity: 'minute' },
      '6h': { hours: 6, minGranularity: 'minute' },
      '24h': { hours: 24, minGranularity: 'hour' },
      '7d': { hours: 168, minGranularity: 'hour' },
      '30d': { hours: 720, minGranularity: 'day' }
    };

    const range = timeRanges[timeframe as keyof typeof timeRanges] || timeRanges['24h'];
    const startTime = new Date(Date.now() - range.hours * 60 * 60 * 1000);

    // Get aggregated metrics
    let metricsQuery = supabase
      .from('integration_metrics')
      .select('*')
      .eq('integration_id', integrationId)
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: true });

    const { data: metrics, error: metricsError } = await metricsQuery;

    if (metricsError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch metrics'
      });
    }

    // Get recent health checks for detailed analysis
    const { data: healthChecks, error: healthChecksError } = await supabase
      .from('integration_health_checks')
      .select('*')
      .eq('integration_id', integrationId)
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (healthChecksError) {
    }

    // Calculate summary statistics
    const summary = await calculateMetricsSummary(
      supabase,
      integrationId,
      integration.current_health_status,
      metrics || [],
      healthChecks || []
    );

    // Format metrics data for frontend
    const formattedMetrics: MetricsData[] = (metrics || []).map(metric => ({
      timestamp: metric.created_at,
      uptime_percentage: metric.uptime_percentage,
      avg_response_time_ms: metric.avg_response_time_ms,
      error_rate: metric.error_rate,
      total_checks: metric.total_checks,
      successful_checks: metric.successful_checks,
      failed_checks: metric.failed_checks,
      p95_response_time_ms: metric.p95_response_time_ms,
      p99_response_time_ms: metric.p99_response_time_ms
    }));

    return res.status(200).json({
      success: true,
      data: {
        integration_id: integrationId,
        integration_name: integration.display_name,
        timeframe: timeframe as string,
        summary,
        metrics: formattedMetrics,
        health_checks: healthChecks || []
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch integration metrics'
    });
  }
}

// Helper function to calculate summary statistics
async function calculateMetricsSummary(
    supabase: any,
    integrationId: string,
    currentStatus: string,
    metrics: any[],
    healthChecks: any[]
  ): Promise<MetricsSummary> {
    try {
      // Calculate overall uptime
      const totalChecks = healthChecks.length;
      const successfulChecks = healthChecks.filter(check => check.is_successful).length;
      const overallUptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

      // Calculate average response time
      const validResponseTimes = healthChecks
        .filter(check => check.response_time_ms !== null)
        .map(check => check.response_time_ms);
      const avgResponseTime = validResponseTimes.length > 0
        ? validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length
        : 0;

      // Get total incidents in timeframe
      const { count: totalIncidents } = await supabase
        .from('alert_incidents')
        .select('id', { count: 'exact' })
        .eq('integration_id', integrationId)
        .gte('triggered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Calculate MTTR (Mean Time To Recovery)
      const { data: resolvedIncidents } = await supabase
        .from('alert_incidents')
        .select('triggered_at, resolved_at, duration_minutes')
        .eq('integration_id', integrationId)
        .eq('status', 'resolved')
        .not('duration_minutes', 'is', null)
        .limit(10);

      const mttr = resolvedIncidents && resolvedIncidents.length > 0
        ? resolvedIncidents.reduce((sum: number, incident: any) => sum + (incident.duration_minutes || 0), 0) / resolvedIncidents.length
        : 0;

      // Get last incident
      const { data: lastIncident } = await supabase
        .from('alert_incidents')
        .select('triggered_at')
        .eq('integration_id', integrationId)
        .order('triggered_at', { ascending: false })
        .limit(1)
        .single();

      // Calculate trend analysis
      const trendAnalysis = calculateTrendAnalysis(metrics, healthChecks);

      return {
        current_status: currentStatus,
        overall_uptime: Math.round(overallUptime * 100) / 100,
        avg_response_time: Math.round(avgResponseTime * 100) / 100,
        total_incidents: totalIncidents || 0,
        mttr_minutes: Math.round(mttr * 100) / 100,
        last_incident: lastIncident?.triggered_at || null,
        trend_analysis: trendAnalysis
      };

    } catch (error) {
      return {
        current_status: currentStatus,
        overall_uptime: 0,
        avg_response_time: 0,
        total_incidents: 0,
        mttr_minutes: 0,
        last_incident: null,
        trend_analysis: {
          uptime_trend: 'stable',
          performance_trend: 'stable',
          confidence: 0
        }
      };
    }
  }

// Helper function to calculate trend analysis
function calculateTrendAnalysis(metrics: any[], healthChecks: any[]): {
    uptime_trend: 'improving' | 'stable' | 'degrading';
    performance_trend: 'improving' | 'stable' | 'degrading';
    confidence: number;
  } {
    if (metrics.length < 3) {
      return {
        uptime_trend: 'stable',
        performance_trend: 'stable',
        confidence: 0
      };
    }

    // Analyze uptime trend
    const recentUptime = metrics.slice(-3).map(m => m.uptime_percentage || 0);
    const earlierUptime = metrics.slice(0, 3).map(m => m.uptime_percentage || 0);

    const recentUptimeAvg = recentUptime.reduce((sum, val) => sum + val, 0) / recentUptime.length;
    const earlierUptimeAvg = earlierUptime.reduce((sum, val) => sum + val, 0) / earlierUptime.length;

    const uptimeDiff = recentUptimeAvg - earlierUptimeAvg;
    const uptimeTrend = uptimeDiff > 5 ? 'improving' : uptimeDiff < -5 ? 'degrading' : 'stable';

    // Analyze performance trend
    const recentResponseTimes = healthChecks.slice(0, 10)
      .filter(check => check.response_time_ms !== null)
      .map(check => check.response_time_ms);
    const earlierResponseTimes = healthChecks.slice(-10)
      .filter(check => check.response_time_ms !== null)
      .map(check => check.response_time_ms);

    let performanceTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    
    if (recentResponseTimes.length >= 3 && earlierResponseTimes.length >= 3) {
      const recentAvg = recentResponseTimes.reduce((sum, val) => sum + val, 0) / recentResponseTimes.length;
      const earlierAvg = earlierResponseTimes.reduce((sum, val) => sum + val, 0) / earlierResponseTimes.length;
      
      const performanceDiff = earlierAvg - recentAvg; // Negative diff means performance degraded
      performanceTrend = performanceDiff > 100 ? 'improving' : performanceDiff < -100 ? 'degrading' : 'stable';
    }

    // Calculate confidence based on data availability
    const confidence = Math.min(100, (metrics.length / 24) * 100); // Higher confidence with more data points

    return {
      uptime_trend: uptimeTrend,
      performance_trend: performanceTrend,
      confidence: Math.round(confidence)
    };
  }