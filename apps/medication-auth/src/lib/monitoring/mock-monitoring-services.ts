/**
 * Mock Monitoring Services
 * Provides the same interface as @ganger/monitoring for development
 */

export class IntegrationHealthMonitor {
  async checkAllIntegrations() {
    // Mock integration health check
    console.log('Mock checking all integrations');
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    
    return {
      overall: 'healthy',
      integrations: {
        modmed: {
          status: 'healthy',
          responseTime: 145,
          lastChecked: new Date().toISOString(),
          endpoint: 'https://api.modmed.com/fhir'
        },
        supabase: {
          status: 'healthy',
          responseTime: 89,
          lastChecked: new Date().toISOString(),
          endpoint: process.env.NEXT_PUBLIC_SUPABASE_URL
        },
        openai: {
          status: 'degraded',
          responseTime: 2100,
          lastChecked: new Date().toISOString(),
          endpoint: 'https://api.openai.com/v1',
          warning: 'High response time'
        },
        stripe: {
          status: 'healthy',
          responseTime: 67,
          lastChecked: new Date().toISOString(),
          endpoint: 'https://api.stripe.com'
        }
      }
    };
  }

  async checkIntegration(integrationName: string) {
    console.log(`Mock checking integration: ${integrationName}`);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      name: integrationName,
      status: Math.random() > 0.2 ? 'healthy' : 'unhealthy',
      responseTime: Math.floor(Math.random() * 500) + 50,
      lastChecked: new Date().toISOString()
    };
  }

  async getIntegrationHistory(integrationName: string, hours = 24) {
    console.log(`Mock getting ${hours}h history for: ${integrationName}`);
    
    const dataPoints = Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.1 ? 'healthy' : 'unhealthy',
      responseTime: Math.floor(Math.random() * 300) + 50
    }));
    
    return {
      integration: integrationName,
      period: `${hours}h`,
      dataPoints: dataPoints.reverse(),
      summary: {
        uptime: ((dataPoints.filter(d => d.status === 'healthy').length / dataPoints.length) * 100).toFixed(1),
        avgResponseTime: Math.floor(dataPoints.reduce((sum, d) => sum + d.responseTime, 0) / dataPoints.length)
      }
    };
  }
}

export class HealthAlertingService {
  async generateHealthAlerts() {
    console.log('Mock generating health alerts');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: 'alert-1',
        type: 'warning',
        service: 'openai',
        message: 'High response time detected (>2s)',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        acknowledged: false
      },
      {
        id: 'alert-2',
        type: 'info',
        service: 'database',
        message: 'Connection pool at 80% capacity',
        severity: 'low',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        acknowledged: true
      }
    ];
  }


  async checkAndAlert(metrics?: any) {
    console.log('Mock checking and alerting on metrics:', metrics);
    
    // Mock alert checking logic
    const alerts = [];
    
    if (metrics?.responseTime > 1000) {
      alerts.push({
        type: 'warning',
        message: `High response time: ${metrics.responseTime}ms`,
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      alertsGenerated: alerts.length,
      alerts
    };
  }

  async testAlert(ruleId: string) {
    console.log(`Mock sending test alert for rule: ${ruleId}`);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      message: `Test alert for rule ${ruleId} sent successfully`,
      timestamp: new Date().toISOString(),
      recipient: 'admin@gangerdermatology.com'
    };
  }

  async getAlertConfiguration() {
    console.log('Mock getting alert configuration');
    return {
      enabled: true,
      rules: [
        {
          id: 'response-time',
          name: 'High Response Time',
          threshold: 1000,
          enabled: true
        },
        {
          id: 'availability',
          name: 'Service Availability',
          threshold: 99.0,
          enabled: true
        }
      ]
    };
  }
}

export class ConnectionMonitor {
  async healthCheck() {
    console.log('Mock database health check');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      status: 'healthy',
      connections: {
        active: 8,
        idle: 12,
        total: 20
      },
      performance: {
        avgQueryTime: 45,
        slowQueries: 2
      },
      lastChecked: new Date().toISOString()
    };
  }
}

export class CacheManager {
  async getHealthStatus() {
    console.log('Mock cache health status');
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      status: 'healthy',
      hitRate: 0.87,
      memoryUsage: '245MB',
      totalKeys: 15234,
      lastEviction: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    };
  }
}

export class PerformanceMonitor {
  async collectSystemMetrics() {
    console.log('Mock collecting system metrics');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: Math.random() * 60 + 20, // 20-80%
        load: [1.2, 1.5, 1.8]
      },
      memory: {
        used: '1.2GB',
        total: '4GB',
        percentage: Math.random() * 40 + 30 // 30-70%
      },
      disk: {
        used: '15.2GB',
        total: '50GB',
        percentage: 30.4
      },
      network: {
        bytesIn: Math.floor(Math.random() * 1000000),
        bytesOut: Math.floor(Math.random() * 1000000)
      }
    };
  }

  async getPerformanceTrends(hours = 24) {
    console.log(`Mock getting ${hours}h performance trends`);
    
    const dataPoints = Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      cpuUsage: Math.random() * 60 + 20,
      memoryUsage: Math.random() * 40 + 30,
      responseTime: Math.random() * 200 + 50
    }));
    
    return {
      period: `${hours}h`,
      dataPoints: dataPoints.reverse(),
      summary: {
        avgCpuUsage: dataPoints.reduce((sum, d) => sum + d.cpuUsage, 0) / dataPoints.length,
        avgMemoryUsage: dataPoints.reduce((sum, d) => sum + d.memoryUsage, 0) / dataPoints.length,
        avgResponseTime: dataPoints.reduce((sum, d) => sum + d.responseTime, 0) / dataPoints.length
      }
    };
  }

  async getPerformanceSummary() {
    console.log('Mock getting performance summary');
    
    return {
      overall: 'good',
      trends: {
        cpu: 'stable',
        memory: 'increasing',
        responseTime: 'improving'
      },
      recommendations: [
        'Consider increasing memory allocation',
        'Monitor database query performance',
        'Review cache hit ratios'
      ]
    };
  }
}

// Export singleton instances
export const integrationHealthMonitor = new IntegrationHealthMonitor();
export const healthAlertingService = new HealthAlertingService();
export const connectionMonitor = new ConnectionMonitor();
export const cacheManager = new CacheManager();
export const performanceMonitor = new PerformanceMonitor();