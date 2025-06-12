// Dashboard Background Jobs Service
// Terminal 2: Backend Implementation

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ServerCacheService } from './cache-service';

export class DashboardBackgroundJobs {
  private supabase: any;
  private cache: ServerCacheService;
  private isRunning: boolean = false;
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.supabase = createServerSupabaseClient();
    this.cache = new ServerCacheService();
  }

  startJobs(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Update search index every hour
    const searchIndexJob = setInterval(async () => {
      try {
        await this.updateSearchIndex();
      } catch (error) {
      }
    }, 60 * 60 * 1000); // 1 hour

    // Clean expired widget cache every 30 minutes
    const cacheCleanupJob = setInterval(async () => {
      try {
        await this.cleanExpiredCache();
      } catch (error) {
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Generate daily analytics at midnight
    const analyticsJob = setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        try {
          await this.generateDailyAnalytics();
        } catch (error) {
        }
      }
    }, 60 * 1000); // Check every minute for midnight

    // Check application health every 5 minutes
    const healthCheckJob = setInterval(async () => {
      try {
        await this.checkApplicationHealth();
      } catch (error) {
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Clean up old activity logs every day at 2 AM
    const logCleanupJob = setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        try {
          await this.cleanupOldLogs();
        } catch (error) {
        }
      }
    }, 60 * 1000); // Check every minute for 2 AM

    // Store interval references for cleanup
    this.intervals = [searchIndexJob, cacheCleanupJob, analyticsJob, healthCheckJob, logCleanupJob];

  }

  stopJobs(): void {
    if (!this.isRunning) {
      return;
    }

    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;
  }

  private async cleanExpiredCache(): Promise<void> {
    try {
      // Clean database cache
      const { error: dbError } = await this.supabase
        .from('widget_data_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (dbError) {
      }

      // Clean memory cache
      await this.cache.cleanup();

    } catch (error) {
      throw error;
    }
  }

  private async generateDailyAnalytics(): Promise<void> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      // Calculate daily active users
      const { data: dailyActiveUsers } = await this.supabase
        .from('user_activity_log')
        .select('user_id')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      const uniqueUsers = new Set((dailyActiveUsers || []).map((log: any) => log.user_id));
      await this.recordMetric('daily_active_users', yesterday, uniqueUsers.size);

      // Calculate app launches by application
      const { data: appLaunches } = await this.supabase
        .from('user_activity_log')
        .select('target_app')
        .eq('activity_type', 'app_launch')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      const appLaunchCounts = (appLaunches || []).reduce((acc: Record<string, number>, launch: any) => {
        if (launch.target_app) {
          acc[launch.target_app] = (acc[launch.target_app] || 0) + 1;
        }
        return acc;
      }, {});

      for (const [appName, count] of Object.entries(appLaunchCounts)) {
        await this.recordMetric(
          'app_launches',
          yesterday,
          count as number,
          { application_name: appName }
        );
      }

      // Calculate widget interactions
      const { data: widgetInteractions } = await this.supabase
        .from('user_activity_log')
        .select('id')
        .eq('activity_type', 'widget_interaction')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      await this.recordMetric('widget_interactions', yesterday, (widgetInteractions || []).length);

      // Calculate search queries
      const { data: searchQueries } = await this.supabase
        .from('user_activity_log')
        .select('id')
        .eq('activity_type', 'search')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      await this.recordMetric('search_queries', yesterday, (searchQueries || []).length);

    } catch (error) {
      throw error;
    }
  }

  private async recordMetric(
    metricType: string,
    date: Date,
    value: number,
    metadata: any = {}
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('dashboard_metrics')
        .upsert(
          {
            metric_type: metricType,
            metric_date: date.toISOString().split('T')[0],
            metric_value: value,
            metric_metadata: metadata,
            user_role: metadata.user_role || null,
            location_name: metadata.location_name || null,
            application_name: metadata.application_name || null,
            recorded_at: new Date().toISOString()
          },
          { 
            onConflict: 'metric_type,metric_date,user_role,location_name,application_name',
            ignoreDuplicates: false 
          }
        );

      if (error) {
      }
    } catch (error) {
    }
  }

  private async checkApplicationHealth(): Promise<void> {
    try {
      // Get applications with health check URLs
      const { data: applications } = await this.supabase
        .from('platform_applications')
        .select('app_name, display_name, health_check_url')
        .eq('is_active', true)
        .not('health_check_url', 'is', null);

      if (!applications || applications.length === 0) {
        return;
      }

      for (const app of applications) {
        try {
          const startTime = Date.now();
          
          // Perform health check with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(app.health_check_url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Ganger-Platform-Health-Check/1.0'
            }
          });

          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;

          const status = response.ok ? 'healthy' : 'unhealthy';
          const errorMessage = response.ok ? null : `HTTP ${response.status}: ${response.statusText}`;

          // Update health status
          await this.supabase
            .from('application_health_status')
            .upsert(
              {
                application_name: app.app_name,
                health_check_url: app.health_check_url,
                current_status: status,
                last_check_at: new Date().toISOString(),
                response_time_ms: responseTime,
                error_message: errorMessage,
                updated_at: new Date().toISOString()
              },
              { onConflict: 'application_name' }
            );

          // Send alert if unhealthy
          if (!response.ok) {
            await this.sendHealthAlert(app, responseTime, errorMessage);
          }

        } catch (error) {
          
          const errorMessage = error instanceof Error ? error.message : 'Health check failed';
          
          await this.supabase
            .from('application_health_status')
            .upsert(
              {
                application_name: app.app_name,
                health_check_url: app.health_check_url,
                current_status: 'unhealthy',
                last_check_at: new Date().toISOString(),
                error_message: errorMessage,
                updated_at: new Date().toISOString()
              },
              { onConflict: 'application_name' }
            );

          await this.sendHealthAlert(app, 0, errorMessage);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  private async sendHealthAlert(app: any, responseTime: number, errorMessage: string | null): Promise<void> {
    try {
      // Get administrators
      const { data: admins } = await this.supabase
        .from('users')
        .select('id')
        .eq('role', 'superadmin')
        .eq('is_active', true);

      if (!admins || admins.length === 0) {
        return;
      }

      // Create notifications for all admins
      const notifications = admins.map((admin: any) => ({
        user_id: admin.id,
        title: `Application Health Alert: ${app.display_name}`,
        message: `${app.display_name} is experiencing issues. Response time: ${responseTime}ms. Error: ${errorMessage}`,
        type: 'warning',
        category: 'system_health',
        created_at: new Date().toISOString()
      }));

      const { error } = await this.supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
      }
    } catch (error) {
    }
  }

  private async updateSearchIndex(): Promise<void> {
    try {
      // This would call the search index update function
      // For now, we'll just log that it would update
      
      // In a full implementation, this would:
      // 1. Re-index platform applications
      // 2. Update help articles
      // 3. Refresh user directory (if enabled)
      // 4. Index new documents from integrations
      
    } catch (error) {
      throw error;
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      // Clean up activity logs older than 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const { error } = await this.supabase
        .from('user_activity_log')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
      } else {
      }
    } catch (error) {
      throw error;
    }
  }

  // Manual job execution methods
  async runAnalyticsNow(date?: Date): Promise<void> {
    const targetDate = date || new Date();
    targetDate.setDate(targetDate.getDate() - 1); // Previous day
    
    await this.generateDailyAnalytics();
  }

  async runHealthCheckNow(): Promise<void> {
    await this.checkApplicationHealth();
  }

  async runCacheCleanupNow(): Promise<void> {
    await this.cleanExpiredCache();
  }

  getJobStatus(): { isRunning: boolean; intervalCount: number } {
    return {
      isRunning: this.isRunning,
      intervalCount: this.intervals.length
    };
  }
}

// Export singleton instance
export const dashboardJobs = new DashboardBackgroundJobs();

// Auto-start jobs in production
if (process.env.NODE_ENV === 'production') {
  dashboardJobs.startJobs();
}