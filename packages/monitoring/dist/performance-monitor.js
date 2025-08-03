import { connectionMonitor } from '@ganger/db';
import { cacheManager } from '@ganger/cache';
export class PerformanceMonitor {
    constructor() {
        this.metricsHistory = new Map();
        this.apiMetrics = new Map();
        this.MAX_HISTORY_ENTRIES = 1000;
        this.API_METRICS_TTL = 24 * 60 * 60 * 1000; // 24 hours
    }
    async getCurrentMetrics() {
        const [systemMetrics, dbMetrics, cacheMetrics, apiMetrics] = await Promise.all([
            this.getSystemMetrics(),
            this.getDatabaseMetrics(),
            this.getCacheMetrics(),
            this.getApiMetrics()
        ]);
        const metrics = {
            timestamp: new Date().toISOString(),
            system: systemMetrics,
            database: dbMetrics,
            cache: cacheMetrics,
            api: apiMetrics,
            alerts: []
        };
        // Generate alerts based on current metrics
        metrics.alerts = this.generateAlerts(metrics);
        // Store metrics for trend analysis
        this.storeMetricsHistory(metrics);
        return metrics;
    }
    async getSystemMetrics() {
        const memUsage = process.memoryUsage();
        return {
            memory_usage: {
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                rss: memUsage.rss
            },
            cpu_usage: process.cpuUsage().system / 1000000, // Convert to seconds
            uptime: process.uptime()
        };
    }
    async getDatabaseMetrics() {
        try {
            const dbStats = connectionMonitor.getMetrics();
            return {
                active_connections: dbStats.activeConnections || 0,
                pool_utilization: ((dbStats.activeConnections || 0) / (dbStats.totalConnections || 10)) * 100,
                query_performance: {
                    total_queries: dbStats.totalQueries || 0,
                    slow_queries: dbStats.slowQueries || 0,
                    average_query_time: dbStats.averageQueryTime || 0,
                    failed_queries: dbStats.failedQueries || 0
                }
            };
        }
        catch (error) {
            console.error('Failed to get database metrics:', error);
            return {
                active_connections: 0,
                pool_utilization: 0,
                query_performance: {
                    total_queries: 0,
                    slow_queries: 0,
                    average_query_time: 0,
                    failed_queries: 0
                }
            };
        }
    }
    async getCacheMetrics() {
        try {
            const cacheStats = cacheManager.getMetrics();
            return {
                hit_rate: cacheStats.hitRate || 0,
                miss_rate: 100 - (cacheStats.hitRate || 0),
                total_requests: cacheStats.totalRequests || 0,
                memory_usage: 0 // Memory usage not tracked in current cache implementation
            };
        }
        catch (error) {
            console.error('Failed to get cache metrics:', error);
            return {
                hit_rate: 0,
                miss_rate: 0,
                total_requests: 0,
                memory_usage: 0
            };
        }
    }
    async getApiMetrics() {
        const now = Date.now();
        const cutoff = now - this.API_METRICS_TTL;
        let totalRequests = 0;
        let totalErrors = 0;
        let totalResponseTime = 0;
        const endpointStats = new Map();
        Array.from(this.apiMetrics.entries()).forEach(([endpoint, requests]) => {
            // Filter out old entries
            const recentRequests = requests.filter(req => req.timestamp > cutoff);
            this.apiMetrics.set(endpoint, recentRequests);
            if (recentRequests.length > 0) {
                const errors = recentRequests.filter(req => !req.success).length;
                const avgResponseTime = recentRequests.reduce((sum, req) => sum + req.response_time, 0) / recentRequests.length;
                endpointStats.set(endpoint, {
                    request_count: recentRequests.length,
                    average_response_time: avgResponseTime,
                    error_count: errors
                });
                totalRequests += recentRequests.length;
                totalErrors += errors;
                totalResponseTime += avgResponseTime * recentRequests.length;
            }
        });
        return {
            total_requests: totalRequests,
            error_rate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
            average_response_time: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
            endpoints: endpointStats
        };
    }
    // Track individual API requests
    trackApiRequest(endpoint, responseTime, success) {
        if (!this.apiMetrics.has(endpoint)) {
            this.apiMetrics.set(endpoint, []);
        }
        const requests = this.apiMetrics.get(endpoint);
        requests.push({
            timestamp: Date.now(),
            response_time: responseTime,
            success
        });
        // Keep only recent entries to prevent memory bloat
        const cutoff = Date.now() - this.API_METRICS_TTL;
        const recentRequests = requests.filter(req => req.timestamp > cutoff);
        this.apiMetrics.set(endpoint, recentRequests);
    }
    generateAlerts(metrics) {
        const alerts = [];
        // Memory usage alert
        const memoryUsageMB = metrics.system.memory_usage.heapUsed / 1024 / 1024;
        if (memoryUsageMB > 500) {
            alerts.push({
                type: 'memory_usage',
                severity: memoryUsageMB > 1000 ? 'critical' : 'high',
                message: `High memory usage: ${memoryUsageMB.toFixed(2)}MB`,
                threshold: 500,
                current_value: memoryUsageMB
            });
        }
        // Database pool utilization alert
        if (metrics.database.pool_utilization > 80) {
            alerts.push({
                type: 'database_pool',
                severity: metrics.database.pool_utilization > 95 ? 'critical' : 'high',
                message: `High database pool utilization: ${metrics.database.pool_utilization.toFixed(1)}%`,
                threshold: 80,
                current_value: metrics.database.pool_utilization
            });
        }
        // Slow query alert
        if (metrics.database.query_performance.average_query_time > 500) {
            alerts.push({
                type: 'slow_queries',
                severity: metrics.database.query_performance.average_query_time > 1000 ? 'high' : 'medium',
                message: `Slow database queries: ${metrics.database.query_performance.average_query_time.toFixed(1)}ms average`,
                threshold: 500,
                current_value: metrics.database.query_performance.average_query_time
            });
        }
        // Cache hit rate alert
        if (metrics.cache.hit_rate < 70 && metrics.cache.total_requests > 100) {
            alerts.push({
                type: 'cache_hit_rate',
                severity: metrics.cache.hit_rate < 50 ? 'medium' : 'low',
                message: `Low cache hit rate: ${metrics.cache.hit_rate.toFixed(1)}%`,
                threshold: 70,
                current_value: metrics.cache.hit_rate
            });
        }
        // API error rate alert
        if (metrics.api.error_rate > 5) {
            alerts.push({
                type: 'api_error_rate',
                severity: metrics.api.error_rate > 15 ? 'critical' : 'high',
                message: `High API error rate: ${metrics.api.error_rate.toFixed(1)}%`,
                threshold: 5,
                current_value: metrics.api.error_rate
            });
        }
        // API response time alert
        if (metrics.api.average_response_time > 1000) {
            alerts.push({
                type: 'api_response_time',
                severity: metrics.api.average_response_time > 2000 ? 'high' : 'medium',
                message: `Slow API responses: ${metrics.api.average_response_time.toFixed(0)}ms average`,
                threshold: 1000,
                current_value: metrics.api.average_response_time
            });
        }
        return alerts;
    }
    storeMetricsHistory(metrics) {
        const key = new Date(metrics.timestamp).toISOString().split('T')[0]; // Daily key
        if (!this.metricsHistory.has(key)) {
            this.metricsHistory.set(key, []);
        }
        const dayMetrics = this.metricsHistory.get(key);
        dayMetrics.push(metrics);
        // Keep only recent entries
        if (dayMetrics.length > this.MAX_HISTORY_ENTRIES) {
            dayMetrics.splice(0, dayMetrics.length - this.MAX_HISTORY_ENTRIES);
        }
    }
    getTrends(metric, timeframe) {
        const now = new Date();
        const timeframMs = {
            '1h': 60 * 60 * 1000,
            '6h': 6 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000
        };
        const cutoff = new Date(now.getTime() - timeframMs[timeframe]);
        const dataPoints = [];
        // Collect data points from history
        Array.from(this.metricsHistory.entries()).forEach(([day, metrics]) => {
            for (const metric_data of metrics) {
                const metricTime = new Date(metric_data.timestamp);
                if (metricTime >= cutoff) {
                    const value = this.extractMetricValue(metric_data, metric);
                    if (value !== null) {
                        dataPoints.push({
                            timestamp: metric_data.timestamp,
                            value
                        });
                    }
                }
            }
        });
        if (dataPoints.length < 2) {
            return null;
        }
        // Sort by timestamp
        dataPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        // Calculate trend
        const firstValue = dataPoints[0].value;
        const lastValue = dataPoints[dataPoints.length - 1].value;
        const changePercentage = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
        let trendDirection = 'stable';
        if (Math.abs(changePercentage) > 5) {
            trendDirection = changePercentage > 0 ? 'up' : 'down';
        }
        return {
            metric,
            timeframe,
            data_points: dataPoints,
            trend_direction: trendDirection,
            change_percentage: changePercentage
        };
    }
    extractMetricValue(metrics, metricPath) {
        // Simple dot notation path extraction
        const parts = metricPath.split('.');
        let value = metrics;
        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            }
            else {
                return null;
            }
        }
        return typeof value === 'number' ? value : null;
    }
    // Cleanup old metrics data
    cleanupOldData() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        Array.from(this.metricsHistory.entries()).forEach(([key]) => {
            if (new Date(key) < thirtyDaysAgo) {
                this.metricsHistory.delete(key);
            }
        });
    }
    startPeriodicCleanup() {
        // Clean up old data every hour
        setInterval(() => {
            this.cleanupOldData();
        }, 60 * 60 * 1000);
    }
    // Additional methods required by medication-auth app
    async collectSystemMetrics() {
        return this.getCurrentMetrics();
    }
    async getPerformanceTrends(period = 'day') {
        const timeframe = period === 'hour' ? '1h' : period === 'day' ? '24h' : '7d';
        const metrics = ['system.cpu_usage', 'system.memory_usage.heapUsed', 'database.pool_utilization', 'api.error_rate', 'api.average_response_time'];
        const trends = [];
        for (const metric of metrics) {
            const trend = this.getTrends(metric, timeframe);
            if (trend) {
                trends.push(trend);
            }
        }
        return trends;
    }
    async generatePerformanceAlerts() {
        const currentMetrics = await this.getCurrentMetrics();
        return currentMetrics.alerts.map(alert => ({
            id: crypto.randomUUID(),
            metric: alert.type,
            threshold: alert.threshold,
            current_value: alert.current_value,
            severity: alert.severity,
            message: alert.message,
            timestamp: new Date().toISOString()
        }));
    }
    async getMetricsHistory(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        const history = [];
        Array.from(this.metricsHistory.entries()).forEach(([day, metrics]) => {
            for (const metric of metrics) {
                if (new Date(metric.timestamp) >= cutoff) {
                    history.push(metric);
                }
            }
        });
        return history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    async getAverageMetrics(period = 'day') {
        const history = await this.getMetricsHistory(period === 'hour' ? 1 : period === 'day' ? 24 : 168);
        if (history.length === 0) {
            return {};
        }
        // Calculate averages
        const avgCpuUsage = history.reduce((sum, m) => sum + m.system.cpu_usage, 0) / history.length;
        const avgMemoryUsage = history.reduce((sum, m) => sum + m.system.memory_usage.heapUsed, 0) / history.length;
        const avgDbPoolUtil = history.reduce((sum, m) => sum + m.database.pool_utilization, 0) / history.length;
        const avgApiErrorRate = history.reduce((sum, m) => sum + m.api.error_rate, 0) / history.length;
        const avgApiResponseTime = history.reduce((sum, m) => sum + m.api.average_response_time, 0) / history.length;
        return {
            timestamp: new Date().toISOString(),
            system: {
                memory_usage: {
                    heapUsed: avgMemoryUsage,
                    heapTotal: 0,
                    external: 0,
                    rss: 0
                },
                cpu_usage: avgCpuUsage,
                uptime: 0
            },
            database: {
                active_connections: 0,
                pool_utilization: avgDbPoolUtil,
                query_performance: {
                    total_queries: 0,
                    slow_queries: 0,
                    average_query_time: 0,
                    failed_queries: 0
                }
            },
            cache: {
                hit_rate: 0,
                miss_rate: 0,
                total_requests: 0,
                memory_usage: 0
            },
            api: {
                total_requests: 0,
                error_rate: avgApiErrorRate,
                average_response_time: avgApiResponseTime,
                endpoints: new Map()
            },
            alerts: []
        };
    }
}
export const performanceMonitor = new PerformanceMonitor();
//# sourceMappingURL=performance-monitor.js.map