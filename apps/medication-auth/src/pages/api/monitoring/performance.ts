import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest, respondWithSuccess, respondWithError, ErrorCodes, withStandardErrorHandling } from '../../../lib/utils/mock-response-utils';
import { performanceMonitor } from '../../../lib/monitoring/mock-monitoring-services';

async function performanceHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { action, timeframe } = req.query;

  try {
    switch (action) {
      case 'metrics':
        return await handleMetrics(req, res);
      case 'trends':
        return await handleTrends(req, res, timeframe as string);
      case 'summary':
        return await handleSummary(req, res);
      case 'alerts':
        return await handleAlerts(req, res);
      default:
        return await handleMetrics(req, res);
    }
  } catch (error) {
    return respondWithError(
      res,
      'Performance monitoring request failed',
      500,
      ErrorCodes.INTERNAL_ERROR,
      req,
      { action, error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

// Get current performance metrics
async function handleMetrics(req: AuthenticatedRequest, res: NextApiResponse) {
  const metrics = await performanceMonitor.collectSystemMetrics();
  
  const response = {
    current_metrics: metrics,
    collection_info: {
      collected_at: metrics.timestamp,
      collection_duration_ms: Date.now() - new Date(metrics.timestamp).getTime(),
      metrics_available: {
        system: true,
        database: true,
        cache: true,
        api: true
      }
    }
  };

  return respondWithSuccess(res, response);
}

// Get performance trends
async function handleTrends(req: AuthenticatedRequest, res: NextApiResponse, timeframe?: string) {
  const validTimeframes = ['1h', '6h', '24h', '7d'];
  const requestedTimeframe = timeframe || '24h';
  
  if (!validTimeframes.includes(requestedTimeframe)) {
    return respondWithError(
      res,
      'Invalid timeframe specified',
      400,
      ErrorCodes.VALIDATION_ERROR,
      req,
      { 
        requested_timeframe: requestedTimeframe,
        valid_timeframes: validTimeframes
      }
    );
  }

  const trendsData = await performanceMonitor.getPerformanceTrends(requestedTimeframe as any);
  
  const response = {
    timeframe: requestedTimeframe,
    trends: trendsData,
    trend_analysis: {
      total_data_points: trendsData.dataPoints?.length || 0,
      period: trendsData.period,
      summary: trendsData.summary
    },
    timestamp: new Date().toISOString()
  };

  return respondWithSuccess(res, response);
}

// Get performance summary
async function handleSummary(req: AuthenticatedRequest, res: NextApiResponse) {
  const [currentMetrics, summary] = await Promise.all([
    performanceMonitor.collectSystemMetrics(),
    performanceMonitor.getPerformanceSummary()
  ]);

  const response = {
    performance_summary: summary,
    current_status: {
      overall_health: 'good',
      critical_alerts: 0,
      warnings: 0
    },
    key_metrics: {
      cpu_usage_percent: currentMetrics.cpu.usage,
      memory_usage_percent: currentMetrics.memory.percentage,
      disk_usage_percent: currentMetrics.disk.percentage,
      network_bytes_in: currentMetrics.network.bytesIn,
      network_bytes_out: currentMetrics.network.bytesOut
    },
    timestamp: new Date().toISOString()
  };

  return respondWithSuccess(res, response);
}

// Get performance alerts
async function handleAlerts(req: AuthenticatedRequest, res: NextApiResponse) {
  const metrics = await performanceMonitor.collectSystemMetrics();
  
  // Mock alerts data since the metrics don't include alerts
  const mockAlerts = [
    { id: '1', severity: 'medium', type: 'performance', message: 'Mock alert' },
    { id: '2', severity: 'low', type: 'system', message: 'Mock alert 2' }
  ];

  const alertsSummary = {
    total_alerts: mockAlerts.length,
    by_severity: {
      critical: mockAlerts.filter((a: any) => a.severity === 'critical').length,
      high: mockAlerts.filter((a: any) => a.severity === 'high').length,
      medium: mockAlerts.filter((a: any) => a.severity === 'medium').length,
      low: mockAlerts.filter((a: any) => a.severity === 'low').length
    },
    alerts: mockAlerts.map((alert: any) => ({
      ...alert,
      action_required: alert.severity === 'critical' || alert.severity === 'high',
      escalation_threshold: getEscalationThreshold(alert.type)
    })),
    recommendations: generateAlertRecommendations(mockAlerts)
  };

  return respondWithSuccess(res, alertsSummary);
}

// Helper functions
function isImprovementMetric(metric: string): boolean {
  // Metrics where lower values are better
  const lowerIsBetter = [
    'memory_usage',
    'api_response_time',
    'api_error_rate',
    'database_pool_utilization'
  ];
  
  return !lowerIsBetter.includes(metric);
}

function getOverallHealth(metrics: any): 'excellent' | 'good' | 'fair' | 'poor' {
  const criticalAlerts = metrics.alerts.filter((a: any) => a.severity === 'critical').length;
  const highAlerts = metrics.alerts.filter((a: any) => a.severity === 'high').length;
  
  if (criticalAlerts > 0) return 'poor';
  if (highAlerts > 2) return 'fair';
  if (highAlerts > 0 || metrics.alerts.length > 5) return 'good';
  return 'excellent';
}

function getEscalationThreshold(alertType: string): number {
  const thresholds: Record<string, number> = {
    memory_usage: 1000, // MB
    database_pool: 95, // %
    cache_hit_rate: 50, // %
    api_error_rate: 15, // %
    api_response_time: 2000 // ms
  };
  
  return thresholds[alertType] || 0;
}

function generateAlertRecommendations(alerts: any[]): string[] {
  const recommendations = [];
  
  if (alerts.some(a => a.type === 'memory_usage')) {
    recommendations.push('Consider optimizing memory usage or increasing available memory');
  }
  
  if (alerts.some(a => a.type === 'database_pool')) {
    recommendations.push('Review database connection pool configuration and query optimization');
  }
  
  if (alerts.some(a => a.type === 'cache_hit_rate')) {
    recommendations.push('Analyze cache patterns and consider cache warming strategies');
  }
  
  if (alerts.some(a => a.type === 'api_error_rate')) {
    recommendations.push('Investigate error patterns and implement error handling improvements');
  }
  
  if (alerts.some(a => a.type === 'api_response_time')) {
    recommendations.push('Profile slow API endpoints and implement performance optimizations');
  }
  
  return recommendations;
}

export default withStandardErrorHandling(
  withAuth(performanceHandler, {
    roles: ['manager', 'superadmin'],
    auditLog: true,
    hipaaCompliant: false // Performance monitoring is not PHI
  })
);
// Cloudflare Workers Edge Runtime
