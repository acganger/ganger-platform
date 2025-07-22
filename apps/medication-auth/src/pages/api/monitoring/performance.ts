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
        return await handleTrends(timeframe);
      
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
      response_times: currentMetrics.response_times,
      error_rate: currentMetrics.error_rate,
      request_count: currentMetrics.request_count,
      active_users: currentMetrics.active_users,
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
  const endDate = new Date();
  const startDate = new Date();
  
  switch (timeframe) {
    case '1h':
      startDate.setHours(startDate.getHours() - 1);
      break;
    case '6h':
      startDate.setHours(startDate.getHours() - 6);
      break;
    case '24h':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
  }
  
  const trends = await performanceMonitor.getTrends(startDate, endDate);
  
  return {
    timeframe,
    trends: trends.map(trend => ({
      timestamp: trend.timestamp,
      avg_response_time: trend.avgResponseTime,
      error_rate: trend.errorRate,
      request_count: trend.requestCount
    })),
    trend_analysis: {
      total_data_points: trends.length,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        avg_response_time_change: calculateTrendChange(trends, 'avgResponseTime'),
        error_rate_change: calculateTrendChange(trends, 'errorRate'),
        request_volume_change: calculateTrendChange(trends, 'requestCount')
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
      avg_response_time_ms: currentMetrics.response_times.percentiles.p50,
      p95_response_time_ms: currentMetrics.response_times.percentiles.p95,
      error_rate_percent: (currentMetrics.error_rate * 100).toFixed(2),
      requests_per_minute: Math.round(currentMetrics.request_count / 60),
      active_users: currentMetrics.active_users
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
      escalation_threshold: getEscalationThreshold(alert.metric)
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
  const alertTypes = new Set(alerts.map(a => a.metric));
  
  if (alertTypes.has('response_time')) {
    recommendations.push('Consider optimizing slow API endpoints or scaling infrastructure');
  }
  
  if (alertTypes.has('error_rate')) {
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