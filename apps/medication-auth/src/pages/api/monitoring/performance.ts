import { createApiRoute } from '@ganger/utils/server';
import { performanceMonitor, getSystemHealth } from '@ganger/monitoring';
import { z } from 'zod';

// Query schema for performance endpoint
const querySchema = z.object({
  action: z.enum(['metrics', 'trends', 'summary', 'alerts']).optional().default('metrics'),
  timeframe: z.enum(['1h', '6h', '24h', '7d']).optional().default('24h')
});

export default createApiRoute(
  {
    requireAuth: true,
    allowedRoles: ['manager', 'superadmin'],
    querySchema,
    cache: {
      enabled: true,
      ttl: 60 // Cache for 1 minute
    }
  },
  async ({ query }) => {
    const { action, timeframe } = query;

    switch (action) {
      case 'metrics':
        return await handleMetrics();
      
      case 'trends':
        return await handleTrends(timeframe as string);
      
      case 'summary':
        return await handleSummary();
      
      case 'alerts':
        return await handleAlerts();
      
      default:
        return await handleMetrics();
    }
  }
);

async function handleMetrics() {
  const systemHealth = await getSystemHealth();
  const currentMetrics = await performanceMonitor.getCurrentMetrics();
  
  return {
    current_metrics: {
      system_health: systemHealth.overall_status,
      api_metrics: currentMetrics.api,
      database_metrics: currentMetrics.database,
      cache_metrics: currentMetrics.cache,
      system_metrics: currentMetrics.system,
      timestamp: new Date().toISOString()
    },
    collection_info: {
      collected_at: new Date().toISOString(),
      metrics_available: {
        system: true,
        database: true,
        cache: true,
        api: true
      }
    }
  };
}

async function handleTrends(timeframe: string) {
  // Map timeframe to period for getPerformanceTrends
  const periodMap: Record<string, 'hour' | 'day' | 'week'> = {
    '1h': 'hour',
    '6h': 'hour',
    '24h': 'day',
    '7d': 'week'
  };
  
  const period = periodMap[timeframe] || 'day';
  const trends = await performanceMonitor.getPerformanceTrends(period);
  
  return {
    timeframe,
    trends: trends.map(trend => ({
      metric: trend.metric,
      data_points: trend.data_points,
      trend_direction: trend.trend_direction,
      change_percentage: trend.change_percentage
    })),
    trend_analysis: {
      total_trends: trends.length,
      period: timeframe,
      summary: {
        improving_metrics: trends.filter(t => t.trend_direction === 'down' && ['error_rate', 'response_time'].includes(t.metric)).length,
        degrading_metrics: trends.filter(t => t.trend_direction === 'up' && ['error_rate', 'response_time'].includes(t.metric)).length,
        stable_metrics: trends.filter(t => t.trend_direction === 'stable').length
      }
    },
    timestamp: new Date().toISOString()
  };
}

async function handleSummary() {
  const [systemHealth, currentMetrics] = await Promise.all([
    getSystemHealth(),
    performanceMonitor.getCurrentMetrics()
  ]);
  
  return {
    performance_summary: {
      overall_status: systemHealth.overall_status,
      integrations_health: systemHealth.integrations,
      performance_metrics: systemHealth.performance
    },
    current_status: {
      overall_health: systemHealth.overall_status,
      critical_alerts: currentMetrics.alerts.filter(a => a.severity === 'critical').length,
      warnings: currentMetrics.alerts.filter(a => a.severity === 'high').length
    },
    key_metrics: {
      avg_response_time_ms: currentMetrics.api.average_response_time,
      error_rate_percent: currentMetrics.api.error_rate.toFixed(2),
      total_requests: currentMetrics.api.total_requests,
      database_pool_utilization: currentMetrics.database.pool_utilization,
      cache_hit_rate: currentMetrics.cache.hit_rate
    },
    timestamp: new Date().toISOString()
  };
}

async function handleAlerts() {
  const currentMetrics = await performanceMonitor.getCurrentMetrics();
  const alerts = currentMetrics.alerts || [];
  
  const alertsSummary = {
    total_alerts: alerts.length,
    by_severity: {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length
    },
    alerts: alerts.map(alert => ({
      ...alert,
      action_required: alert.severity === 'critical' || alert.severity === 'high',
      escalation_threshold: getEscalationThreshold(alert.type)
    })),
    recommendations: generateAlertRecommendations(alerts)
  };
  
  return alertsSummary;
}

// Helper functions
function calculateTrendChange(trends: any[], metric: string): string {
  if (trends.length < 2) return '0%';
  
  const firstValue = trends[0][metric] || 0;
  const lastValue = trends[trends.length - 1][metric] || 0;
  
  if (firstValue === 0) return '0%';
  
  const change = ((lastValue - firstValue) / firstValue) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
}

function getEscalationThreshold(metric: string): number {
  const thresholds: Record<string, number> = {
    response_time: 3000, // ms
    error_rate: 0.05, // 5%
    memory_usage: 90, // %
    cpu_usage: 80, // %
    database_connections: 100 // count
  };
  
  return thresholds[metric] || 0;
}

function generateAlertRecommendations(alerts: any[]): string[] {
  const recommendations: string[] = [];
  const alertTypes = new Set(alerts.map(a => a.type));
  
  if (alertTypes.has('api_response_time')) {
    recommendations.push('Consider optimizing slow API endpoints or scaling infrastructure');
  }
  
  if (alertTypes.has('api_error_rate')) {
    recommendations.push('Investigate error patterns and implement better error handling');
  }
  
  if (alertTypes.has('memory_usage')) {
    recommendations.push('Review memory leaks and consider increasing available memory');
  }
  
  if (alertTypes.has('database_connections')) {
    recommendations.push('Optimize database queries and connection pooling');
  }
  
  return recommendations;
}