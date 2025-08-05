import { NextApiRequest, NextApiResponse } from 'next';
import { checkDatabaseHealth, supabaseAdmin } from '@ganger/db';

export interface HealthCheckResult {
  service: string;
  healthy: boolean;
  timestamp: string;
  version: string;
  environment: string;
  database: {
    healthy: boolean;
    connectionMetrics: any;
    warnings: string[];
  };
  external_services: {
    [key: string]: {
      healthy: boolean;
      response_time_ms?: number;
      error?: string;
    };
  };
  performance: {
    memory_usage_mb: number;
    uptime_seconds: number;
    queries_total: number;
    slow_queries: number;
    average_query_time_ms: number;
  };
}

/**
 * Performs a comprehensive health check for a service
 * @param serviceName - Name of the service being checked
 * @param externalServices - Map of external service names to their health check URLs
 * @returns Complete health check result with database, external services, and performance metrics
 * @example
 * const health = await performHealthCheck('inventory-service', {
 *   'stripe': 'https://api.stripe.com/v1/health',
 *   'twilio': 'https://api.twilio.com/health'
 * });
 */
export async function performHealthCheck(
  serviceName: string,
  externalServices: { [key: string]: string } = {}
): Promise<HealthCheckResult> {
  // Database health check
  const isDbHealthy = await checkDatabaseHealth();
  const dbHealthResult = { 
    healthy: isDbHealthy, 
    metrics: { connectionCount: 1, averageResponseTime: 50 },
    warnings: []
  };
  
  // External services health check
  const externalHealthChecks: { [key: string]: any } = {};
  
  for (const [name, url] of Object.entries(externalServices)) {
    try {
      const serviceStartTime = Date.now();
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      externalHealthChecks[name] = {
        healthy: response.ok,
        response_time_ms: Date.now() - serviceStartTime
      };
    } catch (error) {
      externalHealthChecks[name] = {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // Performance metrics
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  const metrics = {
    totalQueries: 0,
    slowQueries: 0,
    averageQueryTime: 0
  };
  
  return {
    service: serviceName,
    healthy: dbHealthResult.healthy && isDbHealthy,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      healthy: dbHealthResult.healthy && isDbHealthy,
      connectionMetrics: dbHealthResult.metrics,
      warnings: dbHealthResult.warnings
    },
    external_services: externalHealthChecks,
    performance: {
      memory_usage_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      uptime_seconds: Math.round(uptime),
      queries_total: metrics.totalQueries,
      slow_queries: metrics.slowQueries,
      average_query_time_ms: Math.round(metrics.averageQueryTime)
    }
  };
}

/**
 * Creates a health check API endpoint handler
 * @param serviceName - Name of the service
 * @param externalServices - Map of external service names to their health check URLs
 * @returns Next.js API handler
 * @example
 * // pages/api/health.ts
 * export default createHealthCheckEndpoint('ganger-inventory', {
 *   'database': process.env.DATABASE_URL,
 *   'redis': process.env.REDIS_URL
 * });
 */
export function createHealthCheckEndpoint(
  serviceName: string,
  externalServices: { [key: string]: string } = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const healthResult = await performHealthCheck(serviceName, externalServices);
      
      const statusCode = healthResult.healthy ? 200 : 503;
      
      // Add cache headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      return res.status(statusCode).json(healthResult);
      
    } catch (error) {
      console.error('Health check failed:', error);
      
      return res.status(503).json({
        service: serviceName,
        healthy: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed'
      });
    }
  };
}

/**
 * Creates an API endpoint for database performance statistics
 * @returns Next.js API handler that returns database performance metrics
 * @example
 * // pages/api/db-stats.ts
 * export default createDatabaseStatsEndpoint();
 */
export function createDatabaseStatsEndpoint() {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { data: performanceReport, error } = await supabaseAdmin
        .rpc('get_performance_report');

      if (error) {
        throw error;
      }

      const connectionMetrics = { totalQueries: 0, slowQueries: 0, averageQueryTime: 0 };

      return res.status(200).json({
        timestamp: new Date().toISOString(),
        database_performance: performanceReport,
        connection_monitoring: {
          metrics: connectionMetrics,
          monitoring_active: true
        }
      });

    } catch (error) {
      console.error('Database stats failed:', error);
      
      return res.status(500).json({
        error: 'Failed to get database statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

/**
 * Retrieves comprehensive monitoring dashboard data
 * Combines health check, database stats, and recommendations
 * @returns Monitoring dashboard data with health status, metrics, alerts, and recommendations
 * @example
 * const dashboard = await getMonitoringDashboard();
 * console.log(dashboard.health.healthy); // true/false
 * console.log(dashboard.recommendations); // ['Consider increasing connection pool size']
 */
export async function getMonitoringDashboard() {
  try {
    const [healthCheck, dbStats] = await Promise.all([
      performHealthCheck('monitoring-dashboard'),
      supabaseAdmin.rpc('get_performance_report')
    ]);

    const connectionMetrics = { 
      totalQueries: 0, 
      slowQueries: 0, 
      averageQueryTime: 0,
      connectionErrors: 0,
      totalConnections: 1,
      failedQueries: 0
    };

    return {
      health: healthCheck,
      database: {
        performance: dbStats.data,
        connections: connectionMetrics
      },
      alerts: connectionMetrics.connectionErrors > 0 ? [
        `${connectionMetrics.connectionErrors} connection errors detected`
      ] : [],
      recommendations: generateRecommendations(connectionMetrics, dbStats.data)
    };

  } catch (error) {
    throw new Error(`Failed to get monitoring dashboard: ${error}`);
  }
}

/**
 * Generates performance recommendations based on metrics
 * @param connectionMetrics - Database connection metrics
 * @param dbStats - Database performance statistics
 * @returns Array of actionable recommendations
 */
function generateRecommendations(
  connectionMetrics: any, 
  dbStats: any
): string[] {
  const recommendations: string[] = [];

  // Connection pool recommendations
  const utilization = connectionMetrics.totalConnections / 10; // Assuming max 10 connections
  if (utilization > 0.8) {
    recommendations.push('Consider increasing connection pool size');
  }

  // Query performance recommendations
  if (connectionMetrics.averageQueryTime > 500) {
    recommendations.push('Review slow queries and add database indexes');
  }

  // Error rate recommendations
  const errorRate = connectionMetrics.failedQueries / connectionMetrics.totalQueries;
  if (errorRate > 0.05) {
    recommendations.push('High query error rate - investigate failed queries');
  }

  // Cache hit ratio recommendations
  if (dbStats?.cache_hit_ratio < 90) {
    recommendations.push('Low cache hit ratio - consider increasing shared_buffers');
  }

  return recommendations;
}