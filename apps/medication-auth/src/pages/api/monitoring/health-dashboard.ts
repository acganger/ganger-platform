import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest, respondWithSuccess, respondWithError, ErrorCodes, withStandardErrorHandling } from '../../../lib/utils/mock-response-utils';
import { integrationHealthMonitor, healthAlertingService, connectionMonitor, cacheManager } from '../../../lib/monitoring/mock-monitoring-services';

async function healthDashboardHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'overview':
        return await handleOverview(req, res);
      case 'integrations':
        return await handleIntegrations(req, res);
      case 'alerts':
        return await handleAlerts(req, res);
      case 'test-alert':
        return await handleTestAlert(req, res);
      case 'check-alerts':
        return await handleCheckAlerts(req, res);
      default:
        return await handleOverview(req, res);
    }
  } catch (error) {
    return respondWithError(
      res,
      'Health dashboard request failed',
      500,
      ErrorCodes.INTERNAL_ERROR,
      req,
      { action, error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

// Overview endpoint - comprehensive system health
async function handleOverview(req: AuthenticatedRequest, res: NextApiResponse) {
  const [
    integrationHealth,
    databaseMetrics,
    cacheHealth
  ] = await Promise.allSettled([
    integrationHealthMonitor.checkAllIntegrations(),
    connectionMonitor.healthCheck(),
    cacheManager.getHealthStatus()
  ]);

  const dashboard = {
    timestamp: new Date().toISOString(),
    
    // System overview
    system_health: {
      overall_status: integrationHealth.status === 'fulfilled' 
        ? integrationHealth.value.overall 
        : 'unknown',
      
      services: integrationHealth.status === 'fulfilled' 
        ? {
            healthy: Object.values(integrationHealth.value.integrations).filter((i: any) => i.status === 'healthy').length,
            total: Object.keys(integrationHealth.value.integrations).length,
            critical_issues: Object.values(integrationHealth.value.integrations).filter((i: any) => i.status === 'unhealthy').length,
            warnings: Object.values(integrationHealth.value.integrations).filter((i: any) => i.status === 'degraded').length
          }
        : null,
      
      database: databaseMetrics.status === 'fulfilled'
        ? {
            status: databaseMetrics.value.status,
            connections: databaseMetrics.value.connections,
            performance: databaseMetrics.value.performance
          }
        : { healthy: false, error: 'Database health check failed' },
      
      cache: cacheHealth.status === 'fulfilled'
        ? {
            available: cacheHealth.value.status === 'healthy',
            hit_rate: cacheHealth.value.hitRate,
            memory_usage: cacheHealth.value.memoryUsage,
            total_keys: cacheHealth.value.totalKeys
          }
        : { available: false, error: 'Cache health check failed' }
    },

    // Recent alerts and issues
    alerts: integrationHealth.status === 'fulfilled' 
      ? await healthAlertingService.generateHealthAlerts()
      : [],

    // Performance metrics
    performance: {
      database: databaseMetrics.status === 'fulfilled' 
        ? {
            average_query_time: databaseMetrics.value.performance.avgQueryTime,
            slow_queries: databaseMetrics.value.performance.slowQueries,
            connections: databaseMetrics.value.connections
          }
        : null,
      
      cache: cacheHealth.status === 'fulfilled'
        ? {
            hit_rate: `${(cacheHealth.value.hitRate * 100).toFixed(2)}%`,
            memory_usage: cacheHealth.value.memoryUsage,
            total_keys: cacheHealth.value.totalKeys
          }
        : null
    },

    // Environment info
    environment: {
      node_env: process.env.NODE_ENV || 'development',
      platform_version: '1.6.0',
      deployment_time: process.env.DEPLOYMENT_TIME || new Date().toISOString()
    }
  };

  return respondWithSuccess(res, dashboard);
}

// Detailed integrations status
async function handleIntegrations(req: AuthenticatedRequest, res: NextApiResponse) {
  const healthCheck = await integrationHealthMonitor.checkAllIntegrations();
  
  const detailedStatus = {
    ...healthCheck,
    integration_details: Object.entries(healthCheck.integrations).map(([name, integration]: [string, any]) => ({
      name,
      ...integration,
      response_time_category: categorizeResponseTime(integration.responseTime),
      status_emoji: getStatusEmoji(integration.status),
      next_check: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
    }))
  };

  return respondWithSuccess(res, detailedStatus);
}

// Alert management
async function handleAlerts(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get alert configuration and history
    const alertConfig = await healthAlertingService.getAlertConfiguration();
    return respondWithSuccess(res, alertConfig);
  }
  
  if (req.method === 'POST') {
    // Trigger alert check manually
    const result = await healthAlertingService.checkAndAlert();
    return respondWithSuccess(res, {
      message: 'Alert check completed',
      ...result,
      timestamp: new Date().toISOString()
    });
  }

  return respondWithError(
    res,
    'Method not allowed',
    405,
    ErrorCodes.OPERATION_NOT_ALLOWED,
    req
  );
}

// Test alert functionality
async function handleTestAlert(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return respondWithError(
      res,
      'Method not allowed',
      405,
      ErrorCodes.OPERATION_NOT_ALLOWED,
      req
    );
  }

  const { rule_id } = req.body;
  
  if (!rule_id) {
    return respondWithError(
      res,
      'Rule ID required',
      400,
      ErrorCodes.MISSING_REQUIRED_FIELD,
      req
    );
  }

  const result = await healthAlertingService.testAlert(rule_id);
  
  if (result.success) {
    return respondWithSuccess(res, result);
  } else {
    return respondWithError(
      res,
      result.message,
      400,
      ErrorCodes.OPERATION_NOT_ALLOWED,
      req
    );
  }
}

// Automated alert checking (can be called by cron job)
async function handleCheckAlerts(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return respondWithError(
      res,
      'Method not allowed',
      405,
      ErrorCodes.OPERATION_NOT_ALLOWED,
      req
    );
  }

  const result = await healthAlertingService.checkAndAlert();
  
  return respondWithSuccess(res, {
    message: 'Automated alert check completed',
    ...result,
    timestamp: new Date().toISOString()
  });
}

// Helper functions
function categorizeResponseTime(responseTime: number): string {
  if (responseTime < 100) return 'excellent';
  if (responseTime < 500) return 'good';
  if (responseTime < 1000) return 'acceptable';
  if (responseTime < 3000) return 'slow';
  return 'very_slow';
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'healthy': return '✅';
    case 'degraded': return '⚠️';
    case 'unhealthy': return '❌';
    default: return '❓';
  }
}

export default withStandardErrorHandling(
  withAuth(healthDashboardHandler, {
    roles: ['manager', 'superadmin'],
    auditLog: true,
    hipaaCompliant: false // Health monitoring is not PHI
  })
);
// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
