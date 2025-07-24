export interface IntegrationHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  last_check: string;
  response_time_ms?: number;
  error_message?: string;
  metrics?: {
    uptime?: number;
    error_rate?: number;
    avg_response_time?: number;
  };
  details?: any;
}

export class IntegrationHealthMonitor {
  private healthCache: Map<string, IntegrationHealthStatus> = new Map();
  private lastCheckTimes: Map<string, number> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  async getAllHealth(): Promise<IntegrationHealthStatus[]> {
    const services = ['database', 'stripe', 'twilio', 'google', 'cloudflare'];
    const healthChecks = await Promise.allSettled(
      services.map(service => this.checkServiceHealth(service))
    );

    return healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          service: services[index],
          status: 'down' as const,
          last_check: new Date().toISOString(),
          error_message: result.reason?.message || 'Health check failed'
        };
      }
    });
  }

  async checkServiceHealth(service: string): Promise<IntegrationHealthStatus> {
    const cacheKey = service;
    const lastCheck = this.lastCheckTimes.get(cacheKey) || 0;
    const now = Date.now();

    // Return cached result if within TTL
    if (now - lastCheck < this.CACHE_TTL_MS && this.healthCache.has(cacheKey)) {
      return this.healthCache.get(cacheKey)!;
    }

    const startTime = Date.now();
    let healthStatus: IntegrationHealthStatus;

    try {
      switch (service) {
        case 'database':
          healthStatus = await this.checkDatabaseHealth();
          break;
        case 'stripe':
          healthStatus = await this.checkStripeHealth();
          break;
        case 'twilio':
          healthStatus = await this.checkTwilioHealth();
          break;
        case 'google':
          healthStatus = await this.checkGoogleApisHealth();
          break;
        case 'cloudflare':
          healthStatus = await this.checkCloudflareHealth();
          break;
        default:
          throw new Error(`Unknown service: ${service}`);
      }

      healthStatus.response_time_ms = Date.now() - startTime;
      healthStatus.last_check = new Date().toISOString();

    } catch (error) {
      healthStatus = {
        service,
        status: 'down',
        last_check: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Cache the result
    this.healthCache.set(cacheKey, healthStatus);
    this.lastCheckTimes.set(cacheKey, now);

    return healthStatus;
  }

  private async checkDatabaseHealth(): Promise<IntegrationHealthStatus> {
    try {
      const { checkDatabaseHealth } = await import('@ganger/db');
      const isHealthy = await checkDatabaseHealth();
      
      return {
        service: 'database',
        status: isHealthy ? 'healthy' : 'degraded',
        last_check: new Date().toISOString(),
        details: {
          connection_status: isHealthy ? 'connected' : 'failed'
        }
      };
    } catch (error) {
      throw new Error(`Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkStripeHealth(): Promise<IntegrationHealthStatus> {
    try {
      // Check Stripe status page
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://status.stripe.com/api/v2/status.json', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Stripe status API returned ${response.status}`);
      }
      
      const status = await response.json();
      
      // Test API key if available
      let apiKeyStatus = null;
      if (process.env.STRIPE_SECRET_KEY) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const apiResponse = await fetch('https://api.stripe.com/v1/balance', {
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
              'Stripe-Version': '2023-10-16'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (apiResponse.ok) {
            apiKeyStatus = 'valid';
          } else if (apiResponse.status === 401) {
            apiKeyStatus = 'invalid';
          } else {
            apiKeyStatus = 'error';
          }
        } catch (error) {
          apiKeyStatus = 'connection_failed';
        }
      }

      return {
        service: 'stripe',
        status: status.page?.status === 'operational' ? 'healthy' : 'degraded',
        last_check: new Date().toISOString(),
        details: {
          page_status: status.page?.status,
          api_key_status: apiKeyStatus,
          credentials_configured: !!process.env.STRIPE_SECRET_KEY
        }
      };
    } catch (error) {
      throw new Error(`Stripe health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkTwilioHealth(): Promise<IntegrationHealthStatus> {
    try {
      // Check Twilio status page
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://status.twilio.com/api/v2/status.json', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Twilio status API returned ${response.status}`);
      }
      
      const status = await response.json();
      
      // Test credentials if available
      let accountStatus = null;
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
          const authHeader = Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString('base64');
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const accountResponse = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}.json`,
            {
              headers: { Authorization: `Basic ${authHeader}` },
              signal: controller.signal
            }
          );
          
          clearTimeout(timeoutId);
          
          if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            accountStatus = {
              status: accountData.status,
              type: accountData.type
            };
          } else {
            accountStatus = 'authentication_failed';
          }
        } catch (error) {
          accountStatus = 'connection_failed';
        }
      }

      return {
        service: 'twilio',
        status: status.page?.status === 'operational' ? 'healthy' : 'degraded',
        last_check: new Date().toISOString(),
        details: {
          page_status: status.page?.status,
          account_status: accountStatus,
          credentials_configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
        }
      };
    } catch (error) {
      throw new Error(`Twilio health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkGoogleApisHealth(): Promise<IntegrationHealthStatus> {
    try {
      // Check Google Cloud status
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://status.cloud.google.com/incidents.json', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Google Cloud status API returned ${response.status}`);
      }
      
      const incidents = await response.json();
      const activeIncidents = incidents.filter((incident: any) => incident.status === 'open');

      return {
        service: 'google',
        status: activeIncidents.length === 0 ? 'healthy' : 'degraded',
        last_check: new Date().toISOString(),
        details: {
          active_incidents: activeIncidents.length,
          credentials_configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
        }
      };
    } catch (error) {
      throw new Error(`Google APIs health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkCloudflareHealth(): Promise<IntegrationHealthStatus> {
    try {
      // Check Cloudflare system status
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.cloudflarestatus.com/api/v2/status.json', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Cloudflare status API returned ${response.status}`);
      }
      
      const status = await response.json();

      return {
        service: 'cloudflare',
        status: status.page?.status === 'operational' ? 'healthy' : 'degraded',
        last_check: new Date().toISOString(),
        details: {
          page_status: status.page?.status,
          api_configured: !!process.env.CLOUDFLARE_API_TOKEN
        }
      };
    } catch (error) {
      throw new Error(`Cloudflare health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Cleanup old cache entries
  private cleanupCache(): void {
    const now = Date.now();
    Array.from(this.lastCheckTimes.entries()).forEach(([key, timestamp]) => {
      if (now - timestamp > this.CACHE_TTL_MS * 2) {
        this.healthCache.delete(key);
        this.lastCheckTimes.delete(key);
      }
    });
  }

  startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupCache();
    }, this.CACHE_TTL_MS);
  }

  // Additional methods required by medication-auth app
  async checkAllIntegrations(): Promise<IntegrationHealthStatus[]> {
    return this.getAllHealth();
  }

  async generateHealthAlerts(): Promise<{
    criticalAlerts: any[];
    warningAlerts: any[];
    infoAlerts: any[];
  }> {
    const healthStatuses = await this.getAllHealth();
    
    const criticalAlerts = healthStatuses
      .filter(status => status.status === 'down')
      .map(status => ({
        id: crypto.randomUUID(),
        service: status.service,
        message: `Service ${status.service} is down: ${status.error_message}`,
        timestamp: new Date().toISOString(),
        severity: 'critical'
      }));

    const warningAlerts = healthStatuses
      .filter(status => status.status === 'degraded')
      .map(status => ({
        id: crypto.randomUUID(),
        service: status.service,
        message: `Service ${status.service} is experiencing issues`,
        timestamp: new Date().toISOString(),
        severity: 'warning'
      }));

    const infoAlerts = healthStatuses
      .filter(status => status.status === 'healthy' && status.response_time_ms && status.response_time_ms > 1000)
      .map(status => ({
        id: crypto.randomUUID(),
        service: status.service,
        message: `Service ${status.service} response time is elevated (${status.response_time_ms}ms)`,
        timestamp: new Date().toISOString(),
        severity: 'info'
      }));

    return { criticalAlerts, warningAlerts, infoAlerts };
  }

  async getHealthSummary(): Promise<{
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    downServices: number;
    overallStatus: 'healthy' | 'degraded' | 'down';
  }> {
    const healthStatuses = await this.getAllHealth();
    
    const totalServices = healthStatuses.length;
    const healthyServices = healthStatuses.filter(s => s.status === 'healthy').length;
    const degradedServices = healthStatuses.filter(s => s.status === 'degraded').length;
    const downServices = healthStatuses.filter(s => s.status === 'down').length;

    let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (downServices > 0) {
      overallStatus = 'down';
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
    }

    return {
      totalServices,
      healthyServices,
      degradedServices,
      downServices,
      overallStatus
    };
  }
}

export const integrationHealthMonitor = new IntegrationHealthMonitor();