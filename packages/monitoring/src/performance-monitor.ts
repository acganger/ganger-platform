import { connectionMonitor } from '@ganger/db';
import { cacheManager } from '@ganger/cache';

export interface PerformanceMetrics {
  timestamp: string;
  system: {
    memory_usage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    cpu_usage: number;
    uptime: number;
  };
  database: {
    active_connections: number;
    pool_utilization: number;
    query_performance: {
      total_queries: number;
      slow_queries: number;
      average_query_time: number;
      failed_queries: number;
    };
  };
  cache: {
    hit_rate: number;
    miss_rate: number;
    total_requests: number;
    memory_usage: number;
  };
  api: {
    total_requests: number;
    error_rate: number;
    average_response_time: number;
    endpoints: Map<string, {
      request_count: number;
      average_response_time: number;
      error_count: number;
    }>;
  };
  alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    threshold: number;
    current_value: number;
  }>;
}

export interface PerformanceTrend {
  metric: string;
  timeframe: '1h' | '6h' | '24h' | '7d';
  data_points: Array<{
    timestamp: string;
    value: number;
  }>;
  trend_direction: 'up' | 'down' | 'stable';
  change_percentage: number;
}

export class PerformanceMonitor {
  private metricsHistory: Map<string, PerformanceMetrics[]> = new Map();
  private apiMetrics: Map<string, Array<{ timestamp: number; response_time: number; success: boolean }>> = new Map();
  private readonly MAX_HISTORY_ENTRIES = 1000;
  private readonly API_METRICS_TTL = 24 * 60 * 60 * 1000; // 24 hours

  async getCurrentMetrics(): Promise<PerformanceMetrics> {
    const [systemMetrics, dbMetrics, cacheMetrics, apiMetrics] = await Promise.all([
      this.getSystemMetrics(),
      this.getDatabaseMetrics(),
      this.getCacheMetrics(),
      this.getApiMetrics()
    ]);

    const metrics: PerformanceMetrics = {
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

  private async getSystemMetrics() {
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

  private async getDatabaseMetrics() {
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
    } catch (error) {
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

  private async getCacheMetrics() {
    try {
      const cacheStats = cacheManager.getMetrics();
      
      return {
        hit_rate: cacheStats.hitRate || 0,
        miss_rate: 100 - (cacheStats.hitRate || 0),
        total_requests: cacheStats.totalRequests || 0,
        memory_usage: 0 // Memory usage not tracked in current cache implementation
      };
    } catch (error) {
      console.error('Failed to get cache metrics:', error);
      return {
        hit_rate: 0,
        miss_rate: 0,
        total_requests: 0,
        memory_usage: 0
      };
    }
  }

  private async getApiMetrics() {
    const now = Date.now();
    const cutoff = now - this.API_METRICS_TTL;
    
    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    const endpointStats = new Map();

    for (const [endpoint, requests] of this.apiMetrics.entries()) {
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
    }

    return {
      total_requests: totalRequests,
      error_rate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      average_response_time: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      endpoints: endpointStats
    };
  }

  // Track individual API requests
  trackApiRequest(endpoint: string, responseTime: number, success: boolean): void {
    if (!this.apiMetrics.has(endpoint)) {
      this.apiMetrics.set(endpoint, []);
    }

    const requests = this.apiMetrics.get(endpoint)!;
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

  private generateAlerts(metrics: PerformanceMetrics): Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    threshold: number;
    current_value: number;
  }> {
    const alerts: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      threshold: number;
      current_value: number;
    }> = [];

    // Memory usage alert
    const memoryUsageMB = metrics.system.memory_usage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 500) {
      alerts.push({
        type: 'memory_usage',
        severity: memoryUsageMB > 1000 ? 'critical' : 'high' as const,
        message: `High memory usage: ${memoryUsageMB.toFixed(2)}MB`,
        threshold: 500,
        current_value: memoryUsageMB
      });
    }

    // Database pool utilization alert
    if (metrics.database.pool_utilization > 80) {
      alerts.push({
        type: 'database_pool',
        severity: metrics.database.pool_utilization > 95 ? 'critical' : 'high' as const,
        message: `High database pool utilization: ${metrics.database.pool_utilization.toFixed(1)}%`,
        threshold: 80,
        current_value: metrics.database.pool_utilization
      });
    }

    // Slow query alert
    if (metrics.database.query_performance.average_query_time > 500) {
      alerts.push({
        type: 'slow_queries',
        severity: metrics.database.query_performance.average_query_time > 1000 ? 'high' : 'medium' as const,
        message: `Slow database queries: ${metrics.database.query_performance.average_query_time.toFixed(1)}ms average`,
        threshold: 500,
        current_value: metrics.database.query_performance.average_query_time
      });
    }

    // Cache hit rate alert
    if (metrics.cache.hit_rate < 70 && metrics.cache.total_requests > 100) {
      alerts.push({
        type: 'cache_hit_rate',
        severity: metrics.cache.hit_rate < 50 ? 'medium' : 'low' as const,
        message: `Low cache hit rate: ${metrics.cache.hit_rate.toFixed(1)}%`,
        threshold: 70,
        current_value: metrics.cache.hit_rate
      });
    }

    // API error rate alert
    if (metrics.api.error_rate > 5) {
      alerts.push({
        type: 'api_error_rate',
        severity: metrics.api.error_rate > 15 ? 'critical' : 'high' as const,
        message: `High API error rate: ${metrics.api.error_rate.toFixed(1)}%`,
        threshold: 5,
        current_value: metrics.api.error_rate
      });
    }

    // API response time alert
    if (metrics.api.average_response_time > 1000) {
      alerts.push({
        type: 'api_response_time',
        severity: metrics.api.average_response_time > 2000 ? 'high' : 'medium' as const,
        message: `Slow API responses: ${metrics.api.average_response_time.toFixed(0)}ms average`,
        threshold: 1000,
        current_value: metrics.api.average_response_time
      });
    }

    return alerts;
  }

  private storeMetricsHistory(metrics: PerformanceMetrics): void {
    const key = new Date(metrics.timestamp).toISOString().split('T')[0]; // Daily key
    
    if (!this.metricsHistory.has(key)) {
      this.metricsHistory.set(key, []);
    }
    
    const dayMetrics = this.metricsHistory.get(key)!;
    dayMetrics.push(metrics);
    
    // Keep only recent entries
    if (dayMetrics.length > this.MAX_HISTORY_ENTRIES) {
      dayMetrics.splice(0, dayMetrics.length - this.MAX_HISTORY_ENTRIES);
    }
  }

  getTrends(metric: string, timeframe: '1h' | '6h' | '24h' | '7d'): PerformanceTrend | null {
    const now = new Date();
    const timeframMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const cutoff = new Date(now.getTime() - timeframMs[timeframe]);
    const dataPoints: Array<{ timestamp: string; value: number }> = [];

    // Collect data points from history
    for (const [day, metrics] of this.metricsHistory.entries()) {
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
    }

    if (dataPoints.length < 2) {
      return null;
    }

    // Sort by timestamp
    dataPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Calculate trend
    const firstValue = dataPoints[0].value;
    const lastValue = dataPoints[dataPoints.length - 1].value;
    const changePercentage = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
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

  private extractMetricValue(metrics: PerformanceMetrics, metricPath: string): number | null {
    // Simple dot notation path extraction
    const parts = metricPath.split('.');
    let value: any = metrics;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return null;
      }
    }
    
    return typeof value === 'number' ? value : null;
  }

  // Cleanup old metrics data
  cleanupOldData(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const [key] of this.metricsHistory.entries()) {
      if (new Date(key) < thirtyDaysAgo) {
        this.metricsHistory.delete(key);
      }
    }
  }

  startPeriodicCleanup(): void {
    // Clean up old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
  }

  // Additional methods required by medication-auth app
  async collectSystemMetrics(): Promise<PerformanceMetrics> {
    return this.getCurrentMetrics();
  }

  async getPerformanceTrends(period: 'hour' | 'day' | 'week' = 'day'): Promise<PerformanceTrend[]> {
    const timeframe = period === 'hour' ? '1h' : period === 'day' ? '24h' : '7d';
    const metrics = ['system.cpu_usage', 'system.memory_usage.heapUsed', 'database.pool_utilization', 'api.error_rate', 'api.average_response_time'];
    
    const trends: PerformanceTrend[] = [];
    
    for (const metric of metrics) {
      const trend = this.getTrends(metric, timeframe);
      if (trend) {
        trends.push(trend);
      }
    }
    
    return trends;
  }

  async generatePerformanceAlerts(): Promise<Array<{
    id: string;
    metric: string;
    threshold: number;
    current_value: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
  }>> {
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

  async getMetricsHistory(hours: number = 24): Promise<PerformanceMetrics[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const history: PerformanceMetrics[] = [];
    
    for (const [day, metrics] of this.metricsHistory.entries()) {
      for (const metric of metrics) {
        if (new Date(metric.timestamp) >= cutoff) {
          history.push(metric);
        }
      }
    }
    
    return history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getAverageMetrics(period: 'hour' | 'day' | 'week' = 'day'): Promise<Partial<PerformanceMetrics>> {
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