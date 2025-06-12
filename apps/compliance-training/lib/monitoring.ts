import { createClient } from '@supabase/supabase-js';

interface MetricData {
  name: string;
  value: number;
  timestamp: string;
  labels?: Record<string, string>;
  tags?: string[];
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message?: string;
  responseTime?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userId?: string;
  timestamp: string;
  memoryUsage?: number;
  cpuUsage?: number;
}

class ComplianceMonitoring {
  private supabase;
  private metrics: MetricData[] = [];
  private healthChecks: HealthCheck[] = [];
  private performanceMetrics: PerformanceMetric[] = [];

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Record custom metrics
  async recordMetric(name: string, value: number, labels?: Record<string, string>, tags?: string[]): Promise<void> {
    const metric: MetricData = {
      name,
      value,
      timestamp: new Date().toISOString(),
      labels,
      tags
    };

    this.metrics.push(metric);

    // Store in database for persistence
    try {
      await this.supabase
        .from('monitoring_metrics')
        .insert({
          metric_name: name,
          metric_value: value,
          labels: labels || {},
          tags: tags || [],
          recorded_at: metric.timestamp
        });
    } catch (error) {
      console.error('Failed to store metric:', error);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[METRIC] ${name}: ${value}`, { labels, tags });
    }
  }

  // Record performance metrics
  async recordPerformance(metric: Omit<PerformanceMetric, 'timestamp'>): Promise<void> {
    const performanceMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date().toISOString()
    };

    this.performanceMetrics.push(performanceMetric);

    // Store in database
    try {
      await this.supabase
        .from('performance_metrics')
        .insert({
          endpoint: metric.endpoint,
          method: metric.method,
          response_time_ms: metric.responseTime,
          status_code: metric.statusCode,
          user_id: metric.userId,
          memory_usage_mb: metric.memoryUsage,
          cpu_usage_percent: metric.cpuUsage,
          recorded_at: performanceMetric.timestamp
        });
    } catch (error) {
      console.error('Failed to store performance metric:', error);
    }

    // Alert on slow requests
    if (metric.responseTime > 5000) { // 5 seconds
      console.warn(`[SLOW REQUEST] ${metric.method} ${metric.endpoint}: ${metric.responseTime}ms`);
      await this.recordMetric('slow_request_count', 1, {
        endpoint: metric.endpoint,
        method: metric.method
      });
    }
  }

  // Health check for various services
  async performHealthCheck(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // Database health check
    try {
      const start = Date.now();
      await this.supabase.from('employees').select('count').limit(1);
      const responseTime = Date.now() - start;

      checks.push({
        service: 'database',
        status: responseTime < 1000 ? 'healthy' : 'warning',
        message: responseTime < 1000 ? 'Database responding normally' : 'Database responding slowly',
        responseTime,
        timestamp: new Date().toISOString(),
        metadata: { responseTime }
      });
    } catch (error) {
      checks.push({
        service: 'database',
        status: 'unhealthy',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    // External services health check
    const externalServices = [
      { name: 'zenefits', url: process.env.ZENEFITS_API_URL },
      { name: 'google-classroom', url: 'https://classroom.googleapis.com' }
    ];

    for (const service of externalServices) {
      if (service.url) {
        try {
          const start = Date.now();
          const response = await fetch(service.url, { 
            method: 'HEAD', 
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          const responseTime = Date.now() - start;

          checks.push({
            service: service.name,
            status: response.ok ? 'healthy' : 'warning',
            message: response.ok ? 'Service responding' : `HTTP ${response.status}`,
            responseTime,
            timestamp: new Date().toISOString(),
            metadata: { statusCode: response.status, responseTime }
          });
        } catch (error) {
          checks.push({
            service: service.name,
            status: 'unhealthy',
            message: `Service unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
            metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
          });
        }
      }
    }

    // Memory usage check
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;

      checks.push({
        service: 'memory',
        status: memUsageMB < 500 ? 'healthy' : memUsageMB < 1000 ? 'warning' : 'unhealthy',
        message: `Memory usage: ${memUsageMB.toFixed(2)} MB`,
        timestamp: new Date().toISOString(),
        metadata: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss
        }
      });

      await this.recordMetric('memory_usage_mb', memUsageMB);
    }

    this.healthChecks = checks;
    return checks;
  }

  // Get compliance-specific metrics
  async getComplianceMetrics(): Promise<Record<string, any>> {
    try {
      // Get current compliance statistics
      const { data: employees } = await this.supabase
        .from('employees')
        .select('compliance_status')
        .eq('active', true);

      const totalEmployees = employees?.length || 0;
      const compliantEmployees = employees?.filter(emp => emp.compliance_status === 'compliant').length || 0;
      const complianceRate = totalEmployees > 0 ? (compliantEmployees / totalEmployees) * 100 : 0;

      // Get training completions in the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: recentCompletions } = await this.supabase
        .from('training_completions')
        .select('id')
        .gte('completed_at', yesterday.toISOString())
        .not('completed_at', 'is', null);

      const dailyCompletions = recentCompletions?.length || 0;

      // Get overdue trainings count
      const { count: overdueCount } = await this.supabase
        .from('training_completions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'overdue');

      // Get sync status
      const { data: lastSync } = await this.supabase
        .from('sync_logs')
        .select('completed_at, status, source')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      const metrics = {
        totalEmployees,
        compliantEmployees,
        complianceRate: Math.round(complianceRate * 100) / 100,
        dailyCompletions,
        overdueTrainings: overdueCount || 0,
        lastSyncAt: lastSync?.completed_at,
        lastSyncStatus: lastSync?.status,
        lastSyncSource: lastSync?.source,
        timestamp: new Date().toISOString()
      };

      // Record key metrics
      await this.recordMetric('compliance_rate', complianceRate, { period: 'current' });
      await this.recordMetric('daily_completions', dailyCompletions, { period: '24h' });
      await this.recordMetric('overdue_trainings', overdueCount || 0, { period: 'current' });

      return metrics;
    } catch (error) {
      console.error('Failed to get compliance metrics:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get system performance summary
  getPerformanceSummary(): Record<string, any> {
    const recentMetrics = this.performanceMetrics.slice(-100); // Last 100 requests

    if (recentMetrics.length === 0) {
      return {
        message: 'No performance data available',
        timestamp: new Date().toISOString()
      };
    }

    const responseTimes = recentMetrics.map(m => m.responseTime);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);

    const statusCodes = recentMetrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const endpointStats = recentMetrics.reduce((acc, m) => {
      const key = `${m.method} ${m.endpoint}`;
      if (!acc[key]) {
        acc[key] = { count: 0, totalTime: 0, avgTime: 0 };
      }
      acc[key].count++;
      acc[key].totalTime += m.responseTime;
      acc[key].avgTime = acc[key].totalTime / acc[key].count;
      return acc;
    }, {} as Record<string, any>);

    return {
      totalRequests: recentMetrics.length,
      avgResponseTime: Math.round(avgResponseTime),
      maxResponseTime,
      minResponseTime,
      statusCodes,
      endpointStats,
      timestamp: new Date().toISOString()
    };
  }

  // Clear old metrics (for memory management)
  clearOldMetrics(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    this.metrics = this.metrics.filter(m => 
      new Date(m.timestamp).getTime() > oneHourAgo
    );
    
    this.performanceMetrics = this.performanceMetrics.filter(m =>
      new Date(m.timestamp).getTime() > oneHourAgo
    );
    
    this.healthChecks = this.healthChecks.filter(h =>
      new Date(h.timestamp).getTime() > oneHourAgo
    );
  }

  // Export all metrics for external monitoring systems
  exportMetrics(): {
    metrics: MetricData[];
    healthChecks: HealthCheck[];
    performanceMetrics: PerformanceMetric[];
    summary: Record<string, any>;
  } {
    return {
      metrics: this.metrics,
      healthChecks: this.healthChecks,
      performanceMetrics: this.performanceMetrics,
      summary: this.getPerformanceSummary()
    };
  }
}

// Singleton instance
export const monitoring = new ComplianceMonitoring();

// Express-style middleware for automatic performance tracking
export function withPerformanceTracking(
  handler: Function,
  endpoint: string
): Function {
  return async (req: any, res: any) => {
    const start = Date.now();
    let statusCode = 200;

    try {
      const result = await handler(req, res);
      statusCode = res.statusCode || 200;
      return result;
    } catch (error) {
      statusCode = 500;
      throw error;
    } finally {
      const responseTime = Date.now() - start;
      
      await monitoring.recordPerformance({
        endpoint,
        method: req.method || 'UNKNOWN',
        responseTime,
        statusCode,
        userId: req.user?.id,
        memoryUsage: process.memoryUsage?.()?.heapUsed / 1024 / 1024
      });
    }
  };
}

// Utility for measuring function execution time
export async function measureExecutionTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    await monitoring.recordMetric(`execution_time_${name}`, duration, { unit: 'ms' });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    await monitoring.recordMetric(`execution_time_${name}_error`, duration, { unit: 'ms' });
    throw error;
  }
}

export default monitoring;