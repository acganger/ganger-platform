// 🩺 Ganger Platform - Centralized Health Check System

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  response_time: number;
  checks: {
    database: boolean;
    authentication: boolean;
    external_apis: boolean;
    memory_usage: number;
    cpu_usage: number;
  };
  version: string;
  environment: string;
}

export interface PlatformHealth {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthStatus[];
  total_services: number;
  healthy_services: number;
  degraded_services: number;
  unhealthy_services: number;
  last_updated: string;
}

export class HealthChecker {
  private supabase: any;
  private serviceName: string;
  
  constructor(supabase: any, serviceName: string) {
    this.supabase = supabase;
    this.serviceName = serviceName;
  }
  
  async checkHealth(): Promise<HealthStatus> {
    const startTime = performance.now();
    
    try {
      // 🗄️ Database Health Check
      const dbCheck = await this.checkDatabase();
      
      // 🔐 Authentication Health Check  
      const authCheck = await this.checkAuthentication();
      
      // 🌐 External APIs Health Check
      const apiCheck = await this.checkExternalAPIs();
      
      // 📊 System Resources
      const memoryUsage = this.getMemoryUsage();
      const cpuUsage = await this.getCPUUsage();
      
      const responseTime = performance.now() - startTime;
      
      // ✅ Determine overall health
      const isHealthy = dbCheck && authCheck && apiCheck && memoryUsage < 90 && cpuUsage < 90;
      const isDegraded = (!dbCheck || !authCheck || !apiCheck) || (memoryUsage > 70 || cpuUsage > 70);
      
      return {
        service: this.serviceName,
        status: isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy',
        timestamp: new Date().toISOString(),
        response_time: Math.round(responseTime),
        checks: {
          database: dbCheck,
          authentication: authCheck,
          external_apis: apiCheck,
          memory_usage: memoryUsage,
          cpu_usage: cpuUsage
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      };
      
    } catch (error) {
      console.error(`Health check failed for ${this.serviceName}:`, error);
      
      return {
        service: this.serviceName,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        response_time: performance.now() - startTime,
        checks: {
          database: false,
          authentication: false,
          external_apis: false,
          memory_usage: 0,
          cpu_usage: 0
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      };
    }
  }
  
  private async checkDatabase(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('health_checks')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('[HealthCheck] Database check failed:', error.message);
        return false;
      }
      
      console.debug(`[HealthCheck] Database check successful, found ${data?.length || 0} records`);
      return true;
    } catch (err) {
      console.error('[HealthCheck] Database check error:', err);
      return false;
    }
  }
  
  private async checkAuthentication(): Promise<boolean> {
    try {
      const { data: user, error } = await this.supabase.auth.getUser();
      
      if (error) {
        console.debug('[HealthCheck] Auth check - no active session (expected in some contexts)');
        return true; // Auth service is responding, even if no user
      }
      
      console.debug(`[HealthCheck] Auth check successful${user ? `, user: ${user.id}` : ''}`);
      return true; // If no error, auth service is responding
    } catch (err) {
      console.error('[HealthCheck] Auth check error:', err);
      return false;
    }
  }
  
  private async checkExternalAPIs(): Promise<boolean> {
    try {
      // Check critical external services
      const checks = await Promise.allSettled([
        fetch('https://api.stripe.com/v1/ping', { method: 'HEAD' }),
        fetch('https://api.twilio.com/2010-04-01/.json', { method: 'HEAD' })
      ]);
      
      const successfulChecks = checks.filter(check => check.status === 'fulfilled');
      return successfulChecks.length >= checks.length * 0.7; // 70% success rate
    } catch {
      return false;
    }
  }
  
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return Math.round((usage.heapUsed / usage.heapTotal) * 100);
    }
    return 0;
  }
  
  private async getCPUUsage(): Promise<number> {
    // Simplified CPU usage estimation
    if (typeof process !== 'undefined' && process.cpuUsage) {
      const startUsage = process.cpuUsage();
      await new Promise(resolve => setTimeout(resolve, 100));
      const endUsage = process.cpuUsage(startUsage);
      
      const totalUsage = (endUsage.user + endUsage.system) / 1000; // Convert to milliseconds
      return Math.min(Math.round((totalUsage / 100) * 100), 100); // Cap at 100%
    }
    return 0;
  }
}

// 🚀 Express.js Health Check Endpoint Factory
export function createHealthEndpoint(serviceName: string) {
  return async (req: any, res: any) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
      );
      
      const healthChecker = new HealthChecker(supabase, serviceName);
      const health = await healthChecker.checkHealth();
      
      // Set appropriate HTTP status code
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 207 : 503;
      
      res.status(statusCode).json({
        ...health,
        _links: {
          self: `${req.protocol}://${req.get('host')}/api/health`,
          platform: 'https://staff.gangerdermatology.com/api/health/platform'
        }
      });
      
    } catch (error) {
      res.status(503).json({
        service: serviceName,
        status: 'unhealthy',
        error: 'Health check system failure',
        timestamp: new Date().toISOString()
      });
    }
  };
}

// 🌐 Next.js API Route Factory
export function createNextHealthRoute(serviceName: string) {
  return async (req: any, res: any) => {
    const healthEndpoint = createHealthEndpoint(serviceName);
    return healthEndpoint(req, res);
  };
}