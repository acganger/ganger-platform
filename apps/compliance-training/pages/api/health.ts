import type { NextApiRequest, NextApiResponse } from 'next';
import { monitoring } from '../../lib/monitoring';
import { withMethods, withRateLimit } from '../../middleware/auth';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: Array<{
    service: string;
    status: 'healthy' | 'unhealthy' | 'warning';
    message?: string;
    responseTime?: number;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  compliance: {
    totalEmployees: number;
    complianceRate: number;
    dailyCompletions: number;
    overdueTrainings: number;
    lastSyncAt?: string;
    lastSyncStatus?: string;
  };
  performance: {
    totalRequests: number;
    avgResponseTime: number;
    maxResponseTime: number;
    statusCodes: Record<number, number>;
  };
  metadata: {
    uptime: number;
    version: string;
    environment: string;
    memoryUsage?: number;
  };
}

async function healthHandler(
  req: NextApiRequest, 
  res: NextApiResponse<HealthStatus | { error: string }>
) {
  try {
    const startTime = Date.now();

    // Perform health checks
    const healthChecks = await monitoring.performHealthCheck();
    
    // Get compliance metrics
    const complianceMetrics = await monitoring.getComplianceMetrics();
    
    // Get performance summary
    const performanceSummary = monitoring.getPerformanceSummary();

    // Calculate overall status
    const hasUnhealthyServices = healthChecks.some(check => check.status === 'unhealthy');
    const hasWarningServices = healthChecks.some(check => check.status === 'warning');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasUnhealthyServices) {
      overallStatus = 'unhealthy';
    } else if (hasWarningServices) {
      overallStatus = 'degraded';
    }

    // Calculate uptime (simplified - in production would use process start time)
    const uptime = process.uptime ? process.uptime() : 0;

    // Get memory usage
    const memoryUsage = process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : undefined;

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: healthChecks,
      compliance: {
        totalEmployees: complianceMetrics.totalEmployees || 0,
        complianceRate: complianceMetrics.complianceRate || 0,
        dailyCompletions: complianceMetrics.dailyCompletions || 0,
        overdueTrainings: complianceMetrics.overdueTrainings || 0,
        lastSyncAt: complianceMetrics.lastSyncAt,
        lastSyncStatus: complianceMetrics.lastSyncStatus
      },
      performance: {
        totalRequests: performanceSummary.totalRequests || 0,
        avgResponseTime: performanceSummary.avgResponseTime || 0,
        maxResponseTime: performanceSummary.maxResponseTime || 0,
        statusCodes: performanceSummary.statusCodes || {}
      },
      metadata: {
        uptime: Math.round(uptime),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        memoryUsage: memoryUsage ? Math.round(memoryUsage) : undefined
      }
    };

    // Record health check performance
    const responseTime = Date.now() - startTime;
    await monitoring.recordPerformance({
      endpoint: '/api/health',
      method: 'GET',
      responseTime,
      statusCode: 200
    });

    // Set appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    res.status(httpStatus).json(healthStatus);

  } catch (error) {
    // Health check failed - error logged to monitoring
    
    await monitoring.recordPerformance({
      endpoint: '/api/health',
      method: 'GET',
      responseTime: Date.now(),
      statusCode: 500
    });

    res.status(500).json({
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    } as any);
  }
}

export default withRateLimit(
  withMethods(healthHandler, ['GET']),
  { maxRequests: 60, windowMs: 60000 } // 60 requests per minute
);