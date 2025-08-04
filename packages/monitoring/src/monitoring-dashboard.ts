import { performanceMonitor } from './performance-monitor';
import { integrationHealthMonitor } from './integration-health';
import { hipaaErrorTracker } from './hipaa-compliant-error-tracking';
import { apiLatencyMonitor } from './api-latency-monitor';
import { databasePerformanceMonitor } from './database-performance-monitor';
import { uptimeMonitor } from './uptime-monitor';
import { customMetrics } from './custom-metrics';
import { webVitalsTracker } from './web-vitals';

export interface MonitoringDashboardData {
  timestamp: string;
  overview: {
    status: 'healthy' | 'degraded' | 'critical';
    healthScore: number;
    activeAlerts: number;
    activeIncidents: number;
  };
  performance: {
    current: any;
    trends: any[];
    webVitals?: any;
  };
  uptime: {
    summary: any;
    checks: any[];
    incidents: any[];
  };
  api: {
    summary: any;
    endpoints: any[];
    health: any;
  };
  database: {
    health: any;
    tableStats: any[];
    slowQueries: any[];
  };
  errors: {
    metrics: any;
    recentErrors: any[];
  };
  integrations: {
    health: any[];
    status: any;
  };
  customMetrics: {
    business: any[];
    technical: any[];
  };
}

export class MonitoringDashboard {
  private refreshInterval: NodeJS.Timeout | null = null;
  private cachedData: MonitoringDashboardData | null = null;
  private cacheExpiry = 30000; // 30 seconds
  private lastRefresh = 0;

  constructor() {
    // Start periodic refresh
    this.refreshInterval = setInterval(() => {
      this.refreshCache();
    }, this.cacheExpiry);
  }

  private async refreshCache() {
    try {
      this.cachedData = await this.collectAllMetrics();
      this.lastRefresh = Date.now();
    } catch (error) {
      console.error('Failed to refresh monitoring cache:', error);
    }
  }

  public async getDashboardData(forceRefresh = false): Promise<MonitoringDashboardData> {
    // Check cache
    if (!forceRefresh && 
        this.cachedData && 
        Date.now() - this.lastRefresh < this.cacheExpiry) {
      return this.cachedData;
    }

    // Collect fresh data
    const data = await this.collectAllMetrics();
    this.cachedData = data;
    this.lastRefresh = Date.now();
    
    return data;
  }

  private async collectAllMetrics(): Promise<MonitoringDashboardData> {
    // Collect all metrics in parallel
    const [
      performanceMetrics,
      performanceTrends,
      uptimeSummary,
      uptimeStats,
      uptimeIncidents,
      apiSummary,
      apiEndpoints,
      apiHealth,
      databaseHealth,
      tableStats,
      slowQueries,
      errorMetrics,
      integrationHealth,
      customMetricsSnapshot
    ] = await Promise.allSettled([
      performanceMonitor.getCurrentMetrics(),
      performanceMonitor.getPerformanceTrends(),
      uptimeMonitor.getSummary(),
      uptimeMonitor.getCheckStats(),
      uptimeMonitor.getIncidents(false),
      apiLatencyMonitor.getSummary(),
      apiLatencyMonitor.getEndpointStats(),
      apiLatencyMonitor.getHealthStatus(),
      databasePerformanceMonitor.getDatabaseHealth(),
      databasePerformanceMonitor.getTableStats(),
      databasePerformanceMonitor.getSlowQueries(10),
      hipaaErrorTracker.getErrorMetrics(),
      integrationHealthMonitor.getAllHealth(),
      customMetrics.getSnapshot()
    ]);

    // Calculate overall health
    const overview = this.calculateOverview({
      performanceMetrics: this.getSettledValue(performanceMetrics),
      uptimeSummary: this.getSettledValue(uptimeSummary),
      apiHealth: this.getSettledValue(apiHealth),
      databaseHealth: this.getSettledValue(databaseHealth),
      errorMetrics: this.getSettledValue(errorMetrics),
      integrationHealth: this.getSettledValue(integrationHealth)
    });

    // Get Web Vitals if available (client-side only)
    const webVitals = typeof window !== 'undefined' && webVitalsTracker ? 
      webVitalsTracker.getSummary() : null;

    // Separate custom metrics
    const customMetricsData = this.getSettledValue(customMetricsSnapshot) || [];
    const businessMetrics = customMetricsData.filter(m => 
      ['appointments_scheduled', 'appointments_cancelled', 'patient_wait_time', 
       'inventory_stock_level', 'prescription_processing_time'].includes(m.metric)
    );
    const technicalMetrics = customMetricsData.filter(m => 
      !businessMetrics.some(b => b.metric === m.metric)
    );

    return {
      timestamp: new Date().toISOString(),
      overview,
      performance: {
        current: this.getSettledValue(performanceMetrics),
        trends: this.getSettledValue(performanceTrends) || [],
        webVitals
      },
      uptime: {
        summary: this.getSettledValue(uptimeSummary),
        checks: this.getSettledValue(uptimeStats) || [],
        incidents: this.getSettledValue(uptimeIncidents) || []
      },
      api: {
        summary: this.getSettledValue(apiSummary),
        endpoints: this.getSettledValue(apiEndpoints) || [],
        health: this.getSettledValue(apiHealth)
      },
      database: {
        health: this.getSettledValue(databaseHealth),
        tableStats: this.getSettledValue(tableStats) || [],
        slowQueries: this.getSettledValue(slowQueries) || []
      },
      errors: {
        metrics: this.getSettledValue(errorMetrics),
        recentErrors: [] // Would fetch from error tracking
      },
      integrations: {
        health: this.getSettledValue(integrationHealth) || [],
        status: this.calculateIntegrationStatus(
          this.getSettledValue(integrationHealth) || []
        )
      },
      customMetrics: {
        business: businessMetrics,
        technical: technicalMetrics
      }
    };
  }

  private getSettledValue<T>(result: PromiseSettledResult<T>): T | null {
    return result.status === 'fulfilled' ? result.value : null;
  }

  private calculateOverview(data: any): MonitoringDashboardData['overview'] {
    let healthScore = 100;
    let status: MonitoringDashboardData['overview']['status'] = 'healthy';
    let activeAlerts = 0;
    let activeIncidents = 0;

    // Performance impact
    if (data.performanceMetrics) {
      activeAlerts += data.performanceMetrics.alerts?.length || 0;
      
      if (data.performanceMetrics.alerts?.some((a: any) => a.severity === 'critical')) {
        healthScore -= 30;
        status = 'critical';
      } else if (data.performanceMetrics.alerts?.some((a: any) => a.severity === 'high')) {
        healthScore -= 20;
        // Only degrade if not already critical
        status = (status as string) === 'critical' ? 'critical' : 'degraded';
      }
    }

    // Uptime impact
    if (data.uptimeSummary) {
      activeIncidents = data.uptimeSummary.activeIncidents || 0;
      
      if (data.uptimeSummary.overallUptime < 95) {
        healthScore -= 25;
        status = 'critical';
      } else if (data.uptimeSummary.overallUptime < 99) {
        healthScore -= 15;
        // Only degrade if not already critical
        status = (status as string) === 'critical' ? 'critical' : 'degraded';
      }
    }

    // API health impact
    if (data.apiHealth && !data.apiHealth.healthy) {
      healthScore -= data.apiHealth.degraded ? 15 : 10;
      if (data.apiHealth.degraded && status === 'healthy') {
        status = 'degraded';
      }
    }

    // Database health impact
    if (data.databaseHealth) {
      const poorTables = data.databaseHealth.tableHealth?.filter(
        (t: any) => t.health === 'poor'
      ).length || 0;
      
      if (poorTables > 0) {
        healthScore -= poorTables * 10;
        status = 'critical';
      }
    }

    // Error rate impact
    if (data.errorMetrics) {
      if (data.errorMetrics.bySeverity?.critical > 0) {
        healthScore -= 20;
        status = 'critical';
      }
      if (data.errorMetrics.bySeverity?.high > 5) {
        healthScore -= 10;
        // Only degrade if not already critical
        status = (status as string) === 'critical' ? 'critical' : 'degraded';
      }
    }

    // Integration health impact
    if (data.integrationHealth) {
      const downIntegrations = data.integrationHealth.filter(
        (i: any) => i.status === 'down'
      ).length;
      
      if (downIntegrations > 0) {
        healthScore -= downIntegrations * 15;
        status = 'critical';
      }
    }

    return {
      status,
      healthScore: Math.max(0, healthScore),
      activeAlerts,
      activeIncidents
    };
  }

  private calculateIntegrationStatus(integrations: any[]) {
    const total = integrations.length;
    const healthy = integrations.filter(i => i.status === 'healthy').length;
    const degraded = integrations.filter(i => i.status === 'degraded').length;
    const down = integrations.filter(i => i.status === 'down').length;

    return {
      total,
      healthy,
      degraded,
      down,
      healthPercentage: total > 0 ? (healthy / total) * 100 : 100
    };
  }

  public async getMetricHistory(
    metricType: 'performance' | 'api' | 'database' | 'errors' | 'custom',
    metricName: string,
    hours = 24
  ): Promise<any[]> {
    switch (metricType) {
      case 'performance':
        return performanceMonitor.getMetricsHistory(hours);
      
      case 'api':
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - hours * 3600000);
        return apiLatencyMonitor.getMetricsByTimeRange(startTime, endTime);
      
      case 'database':
        // Database metrics don't have a time range method yet
        return [];
      
      case 'custom':
        return customMetrics.query({
          metric: metricName,
          startTime: new Date(Date.now() - hours * 3600000)
        });
      
      default:
        return [];
    }
  }

  public destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// Global instance
export const monitoringDashboard = new MonitoringDashboard();

// Express/Next.js API endpoint handler
export async function handleMonitoringDashboardRequest(
  req: any,
  res: any
): Promise<void> {
  try {
    const { 
      refresh = false,
      metricType,
      metricName,
      hours = 24
    } = req.query || {};

    // Handle metric history requests
    if (metricType && metricName) {
      const history = await monitoringDashboard.getMetricHistory(
        metricType,
        metricName,
        parseInt(hours)
      );
      
      res.status(200).json({
        success: true,
        data: history,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get dashboard data
    const data = await monitoringDashboard.getDashboardData(refresh === 'true');
    
    res.status(200).json({
      success: true,
      data,
      cached: !refresh && Date.now() - monitoringDashboard['lastRefresh'] < 30000
    });
  } catch (error) {
    console.error('Monitoring dashboard error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monitoring data',
      timestamp: new Date().toISOString()
    });
  }
}

// Next.js API route export
export default function createMonitoringDashboardRoute() {
  return async (req: any, res: any) => {
    // Add CORS headers for dashboard access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    
    return handleMonitoringDashboardRequest(req, res);
  };
}