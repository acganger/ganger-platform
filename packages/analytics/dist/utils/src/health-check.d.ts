import { NextApiRequest, NextApiResponse } from 'next';
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
export declare function performHealthCheck(serviceName: string, externalServices?: {
    [key: string]: string;
}): Promise<HealthCheckResult>;
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
export declare function createHealthCheckEndpoint(serviceName: string, externalServices?: {
    [key: string]: string;
}): (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
/**
 * Creates an API endpoint for database performance statistics
 * @returns Next.js API handler that returns database performance metrics
 * @example
 * // pages/api/db-stats.ts
 * export default createDatabaseStatsEndpoint();
 */
export declare function createDatabaseStatsEndpoint(): (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
/**
 * Retrieves comprehensive monitoring dashboard data
 * Combines health check, database stats, and recommendations
 * @returns Monitoring dashboard data with health status, metrics, alerts, and recommendations
 * @example
 * const dashboard = await getMonitoringDashboard();
 * console.log(dashboard.health.healthy); // true/false
 * console.log(dashboard.recommendations); // ['Consider increasing connection pool size']
 */
export declare function getMonitoringDashboard(): Promise<{
    health: HealthCheckResult;
    database: {
        performance: any;
        connections: {
            totalQueries: number;
            slowQueries: number;
            averageQueryTime: number;
            connectionErrors: number;
            totalConnections: number;
            failedQueries: number;
        };
    };
    alerts: string[];
    recommendations: string[];
}>;
