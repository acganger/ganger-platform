// lib/services/monitoring-jobs.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';
import { HealthCheckService } from './health-check-service';
import { AlertEngine } from './alert-engine';

interface CronJob {
  pattern: string;
  name: string;
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class IntegrationMonitoringJobs {
  private supabase: ReturnType<typeof createClient<Database>>;
  private healthCheckService: HealthCheckService;
  private alertEngine: AlertEngine;
  private jobs: Map<string, CronJob> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.healthCheckService = new HealthCheckService();
    this.alertEngine = new AlertEngine();

    this.setupJobs();
  }

  private setupJobs(): void {
    // Health checks - every minute
    this.jobs.set('health-checks', {
      pattern: '0 * * * * *', // Every minute
      name: 'Scheduled Health Checks',
      handler: this.performScheduledHealthChecks.bind(this),
      enabled: true
    });

    // Metrics aggregation - every 5 minutes
    this.jobs.set('metrics-aggregation', {
      pattern: '0 */5 * * * *', // Every 5 minutes
      name: 'Metrics Aggregation',
      handler: this.aggregateMetrics.bind(this),
      enabled: true
    });

    // Alert evaluation - every 30 seconds (offset from health checks)
    this.jobs.set('alert-evaluation', {
      pattern: '30 * * * * *', // Every minute at 30 seconds
      name: 'Alert Evaluation',
      handler: this.evaluateAllAlerts.bind(this),
      enabled: true
    });

    // Cleanup old data - daily at 2 AM
    this.jobs.set('data-cleanup', {
      pattern: '0 0 2 * * *', // Daily at 2 AM
      name: 'Data Cleanup',
      handler: this.cleanupOldData.bind(this),
      enabled: true
    });

    // Calculate baselines - daily at 3 AM
    this.jobs.set('baseline-calculation', {
      pattern: '0 0 3 * * *', // Daily at 3 AM
      name: 'Baseline Calculation',
      handler: this.calculatePerformanceBaselines.bind(this),
      enabled: true
    });

    // Incident escalation check - every 15 minutes
    this.jobs.set('incident-escalation', {
      pattern: '0 */15 * * * *', // Every 15 minutes
      name: 'Incident Escalation',
      handler: this.checkIncidentEscalation.bind(this),
      enabled: true
    });

    // System health report - daily at 8 AM
    this.jobs.set('system-health-report', {
      pattern: '0 0 8 * * *', // Daily at 8 AM
      name: 'System Health Report',
      handler: this.generateSystemHealthReport.bind(this),
      enabled: true
    });
  }

  startJobs(): void {

    this.jobs.forEach((job, jobId) => {
      if (job.enabled) {
        this.scheduleJob(jobId, job);
      }
    });

  }

  stopJobs(): void {

    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });

    this.intervals.clear();
  }

  private scheduleJob(jobId: string, job: CronJob): void {
    // Simple interval-based scheduling (in production, use a proper cron library)
    const intervalMs = this.parseScheduleToInterval(job.pattern);
    
    if (intervalMs > 0) {
      const interval = setInterval(async () => {
        try {
          await job.handler();
          
          // Update job status
          job.lastRun = new Date();
          job.nextRun = new Date(Date.now() + intervalMs);
          
        } catch (error) {
        }
      }, intervalMs);

      this.intervals.set(jobId, interval);
    }
  }

  private parseScheduleToInterval(pattern: string): number {
    // Simple pattern parsing - in production use node-cron or similar
    if (pattern === '0 * * * * *') return 60 * 1000; // Every minute
    if (pattern === '30 * * * * *') return 60 * 1000; // Every minute at 30s
    if (pattern === '0 */5 * * * *') return 5 * 60 * 1000; // Every 5 minutes
    if (pattern === '0 */15 * * * *') return 15 * 60 * 1000; // Every 15 minutes
    if (pattern === '0 0 2 * * *') return 24 * 60 * 60 * 1000; // Daily
    if (pattern === '0 0 3 * * *') return 24 * 60 * 60 * 1000; // Daily
    if (pattern === '0 0 8 * * *') return 24 * 60 * 60 * 1000; // Daily
    
    return 0; // Unknown pattern
  }

  private async performScheduledHealthChecks(): Promise<void> {
    try {
      // Get integrations that need health checks
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const { data: integrations, error } = await this.supabase
        .from('integrations')
        .select('*')
        .eq('is_active', true)
        .eq('monitoring_enabled', true)
        .or(`last_health_check.is.null,last_health_check.lt.${fiveMinutesAgo.toISOString()}`);

      if (error) {
        return;
      }

      if (!integrations || integrations.length === 0) {
        return;
      }


      // Process health checks in parallel but with concurrency limit
      const concurrencyLimit = 5;
      const chunks = this.chunkArray(integrations, concurrencyLimit);

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(integration => this.performSingleHealthCheck(integration))
        );
      }


    } catch (error) {
    }
  }

  private async performSingleHealthCheck(integration: any): Promise<void> {
    try {
      const result = await this.healthCheckService.performHealthCheck(integration);
      
      // Store health check result
      const { error: insertError } = await this.supabase
        .from('integration_health_checks')
        .insert({
          integration_id: integration.id,
          response_time_ms: result.responseTime,
          status_code: result.statusCode,
          response_body: result.responseBody?.substring(0, 1000),
          error_message: result.error,
          is_successful: result.isSuccessful,
          health_status: result.healthStatus,
          check_type: 'automated',
          availability_score: result.isSuccessful ? 1.0000 : 0.0000,
          performance_score: result.responseTime ? Math.max(0, Math.min(1, (5000 - result.responseTime) / 5000)) : null
        });

      if (insertError) {
      }

      // Update integration status
      const statusChanged = integration.current_health_status !== result.healthStatus;
      
      const updateData: any = {
        current_health_status: result.healthStatus,
        last_health_check: new Date().toISOString(),
        consecutive_failures: result.isSuccessful ? 0 : integration.consecutive_failures + 1
      };

      if (result.isSuccessful) {
        updateData.last_successful_check = new Date().toISOString();
      }

      const { error: updateError } = await this.supabase
        .from('integrations')
        .update(updateData)
        .eq('id', integration.id);

      if (updateError) {
      }

      // Broadcast status update if changed
      if (statusChanged) {
        await this.broadcastStatusUpdate({
          integration_id: integration.id,
          health_status: result.healthStatus,
          previous_status: integration.current_health_status,
          display_name: integration.display_name || integration.name,
          updated_at: new Date().toISOString()
        });
      }

      // Evaluate alerts
      await this.alertEngine.evaluateAlerts(integration, result);

    } catch (error) {
    }
  }

  private async aggregateMetrics(): Promise<void> {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const { data: integrations, error } = await this.supabase
        .from('integrations')
        .select('id, name')
        .eq('is_active', true);

      if (error || !integrations) {
        return;
      }


      for (const integration of integrations) {
        try {
          await this.aggregateIntegrationMetrics(integration.id, currentDate, currentHour);
        } catch (error) {
        }
      }


    } catch (error) {
    }
  }

  private async aggregateIntegrationMetrics(
    integrationId: string, 
    date: Date, 
    hour: number
  ): Promise<void> {
    // Get health checks for the current hour
    const hourStart = new Date(date.getTime() + hour * 60 * 60 * 1000);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    const { data: healthChecks, error } = await this.supabase
      .from('integration_health_checks')
      .select('*')
      .eq('integration_id', integrationId)
      .gte('check_timestamp', hourStart.toISOString())
      .lt('check_timestamp', hourEnd.toISOString())
      .order('check_timestamp', { ascending: true });

    if (error) {
      return;
    }

    if (!healthChecks || healthChecks.length === 0) {
      return; // No data to aggregate
    }

    // Calculate metrics
    const metrics = this.calculateHourlyMetrics(healthChecks);

    // Upsert metrics record
    const { error: upsertError } = await this.supabase
      .from('integration_metrics')
      .upsert({
        integration_id: integrationId,
        metric_date: date.toISOString().split('T')[0],
        metric_hour: hour,
        ...metrics
      }, {
        onConflict: 'integration_id,metric_date,metric_hour'
      });

    if (upsertError) {
    }
  }

  private calculateHourlyMetrics(healthChecks: any[]): any {
    const totalChecks = healthChecks.length;
    const successfulChecks = healthChecks.filter(check => check.is_successful).length;
    const failedChecks = totalChecks - successfulChecks;
    
    const responseTimes = healthChecks
      .filter(check => check.response_time_ms !== null)
      .map(check => check.response_time_ms)
      .sort((a, b) => a - b);

    const statusCodes = healthChecks
      .filter(check => check.status_code !== null)
      .map(check => check.status_code);

    return {
      total_checks: totalChecks,
      successful_checks: successfulChecks,
      failed_checks: failedChecks,
      avg_response_time_ms: responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : null,
      min_response_time_ms: responseTimes.length > 0 ? responseTimes[0] : null,
      max_response_time_ms: responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : null,
      p50_response_time_ms: responseTimes.length > 0 
        ? responseTimes[Math.floor(responseTimes.length * 0.5)] 
        : null,
      p95_response_time_ms: responseTimes.length > 0 
        ? responseTimes[Math.floor(responseTimes.length * 0.95)] 
        : null,
      p99_response_time_ms: responseTimes.length > 0 
        ? responseTimes[Math.floor(responseTimes.length * 0.99)] 
        : null,
      error_count: failedChecks,
      status_2xx_count: statusCodes.filter(code => code >= 200 && code < 300).length,
      status_3xx_count: statusCodes.filter(code => code >= 300 && code < 400).length,
      status_4xx_count: statusCodes.filter(code => code >= 400 && code < 500).length,
      status_5xx_count: statusCodes.filter(code => code >= 500).length,
      timeout_count: healthChecks.filter(check => 
        check.error_message && check.error_message.toLowerCase().includes('timeout')
      ).length,
      availability_score: totalChecks > 0 ? successfulChecks / totalChecks : null,
      performance_score: responseTimes.length > 0 
        ? Math.max(0, Math.min(1, (5000 - (responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)) / 5000))
        : null,
      reliability_score: totalChecks > 0 
        ? (successfulChecks / totalChecks) * (responseTimes.length > 0 ? Math.max(0, Math.min(1, (5000 - (responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)) / 5000)) : 1)
        : null
    };
  }

  private async evaluateAllAlerts(): Promise<void> {
    try {
      // This method would trigger alert evaluation for all integrations
      // In practice, alerts are evaluated during health checks
    } catch (error) {
    }
  }

  private async cleanupOldData(): Promise<void> {
    try {

      // Get retention configuration
      const { data: config } = await this.supabase
        .from('integration_system_config')
        .select('config_key, config_value')
        .in('config_key', ['metrics_retention_days', 'health_check_retention_days']);

      const configMap = new Map(
        config?.map(c => [c.config_key, parseInt(c.config_value as string)]) || []
      );

      const metricsRetentionDays = configMap.get('metrics_retention_days') || 90;
      const healthCheckRetentionDays = configMap.get('health_check_retention_days') || 30;

      const metricsThreshold = new Date(Date.now() - metricsRetentionDays * 24 * 60 * 60 * 1000);
      const healthCheckThreshold = new Date(Date.now() - healthCheckRetentionDays * 24 * 60 * 60 * 1000);

      // Clean up old metrics
      await this.supabase
        .from('integration_metrics')
        .delete({ count: 'exact' })
        .lt('created_at', metricsThreshold.toISOString());

      // Clean up old health checks
      await this.supabase
        .from('integration_health_checks')
        .delete({ count: 'exact' })
        .lt('check_timestamp', healthCheckThreshold.toISOString());

      // Clean up resolved incidents older than 30 days
      const incidentThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await this.supabase
        .from('alert_incidents')
        .delete({ count: 'exact' })
        .eq('status', 'resolved')
        .lt('resolved_at', incidentThreshold.toISOString());



    } catch (error) {
    }
  }

  private async calculatePerformanceBaselines(): Promise<void> {
    try {

      const { data: integrations, error } = await this.supabase
        .from('integrations')
        .select('id, name')
        .eq('is_active', true);

      if (error || !integrations) {
        return;
      }

      for (const integration of integrations) {
        await this.calculateIntegrationBaseline(integration.id);
      }


    } catch (error) {
    }
  }

  private async calculateIntegrationBaseline(integrationId: string): Promise<void> {
    try {
      // Calculate rolling 30-day baseline
      const endDate = new Date();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const { data: metrics, error } = await this.supabase
        .from('integration_metrics')
        .select('avg_response_time_ms, uptime_percentage, error_rate, total_checks')
        .eq('integration_id', integrationId)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .lte('metric_date', endDate.toISOString().split('T')[0]);

      if (error || !metrics || metrics.length === 0) {
        return; // No data to calculate baseline
      }

      // Calculate baseline metrics
      const validResponseTimes = metrics
        .filter(m => m.avg_response_time_ms !== null)
        .map(m => m.avg_response_time_ms!);
      
      const validUptimes = metrics
        .filter(m => m.uptime_percentage !== null)
        .map(m => m.uptime_percentage!);

      const validErrorRates = metrics
        .filter(m => m.error_rate !== null)
        .map(m => m.error_rate!);

      if (validResponseTimes.length === 0) return;

      const baselineResponseTime = validResponseTimes.reduce((sum, val) => sum + val, 0) / validResponseTimes.length;
      const baselineUptime = validUptimes.reduce((sum, val) => sum + val, 0) / validUptimes.length;
      const baselineErrorRate = validErrorRates.reduce((sum, val) => sum + val, 0) / validErrorRates.length;
      const totalRequests = metrics.reduce((sum, m) => sum + (m.total_checks || 0), 0);

      // Calculate standard deviations
      const responseTimeStdDev = this.calculateStandardDeviation(validResponseTimes);
      const uptimeStdDev = this.calculateStandardDeviation(validUptimes);

      // Upsert baseline record
      await this.supabase
        .from('integration_baselines')
        .upsert({
          integration_id: integrationId,
          baseline_start_date: startDate.toISOString().split('T')[0],
          baseline_end_date: endDate.toISOString().split('T')[0],
          baseline_type: 'rolling_30d',
          baseline_response_time_ms: baselineResponseTime,
          baseline_uptime_percentage: baselineUptime,
          baseline_error_rate: baselineErrorRate,
          baseline_requests_per_hour: totalRequests / 24, // Rough average
          response_time_std_dev: responseTimeStdDev,
          uptime_std_dev: uptimeStdDev,
          sample_size: validResponseTimes.length,
          confidence_level: 95.0,
          is_active: true,
          last_calculated: new Date().toISOString()
        }, {
          onConflict: 'integration_id,baseline_type,baseline_start_date'
        });

    } catch (error) {
    }
  }

  private async checkIncidentEscalation(): Promise<void> {
    try {
      // Check for incidents that need escalation
      const { data: incidents, error } = await this.supabase
        .from('alert_incidents')
        .select(`
          *,
          alert_rules!inner(
            escalation_enabled,
            escalation_after_minutes,
            escalation_recipients
          )
        `)
        .in('status', ['open', 'acknowledged'])
        .eq('alert_rules.escalation_enabled', true)
        .eq('escalation_level', 0);

      if (error) {
        return;
      }

      for (const incident of incidents || []) {
        const escalationTime = new Date(
          new Date(incident.triggered_at).getTime() + 
          incident.alert_rules.escalation_after_minutes * 60 * 1000
        );

        if (new Date() >= escalationTime) {
          await this.escalateIncident(incident);
        }
      }

    } catch (error) {
    }
  }

  private async escalateIncident(incident: any): Promise<void> {
    try {
      // Update incident escalation level
      await this.supabase
        .from('alert_incidents')
        .update({
          escalation_level: incident.escalation_level + 1,
          escalated_at: new Date().toISOString(),
          escalated_to: incident.alert_rules.escalation_recipients
        })
        .eq('id', incident.id);

      // Send escalation notifications

    } catch (error) {
    }
  }

  private async generateSystemHealthReport(): Promise<void> {
    try {

      // Get overall system health statistics
      const { data: integrations, count: totalIntegrations } = await this.supabase
        .from('integrations')
        .select('current_health_status', { count: 'exact' })
        .eq('is_active', true);

      const healthStats = {
        total: totalIntegrations || 0,
        healthy: integrations?.filter(i => i.current_health_status === 'healthy').length || 0,
        warning: integrations?.filter(i => i.current_health_status === 'warning').length || 0,
        critical: integrations?.filter(i => i.current_health_status === 'critical').length || 0,
        unknown: integrations?.filter(i => i.current_health_status === 'unknown').length || 0
      };

      // Get active incidents
      const { count: activeIncidents } = await this.supabase
        .from('alert_incidents')
        .select('id', { count: 'exact' })
        .in('status', ['open', 'acknowledged']);

      await this.broadcastStatusUpdate({
        timestamp: new Date().toISOString(),
        integrations: healthStats,
        active_incidents: activeIncidents || 0
      });

      // Store report or send to monitoring system

    } catch (error) {
      console.error('Health report generation failed:', error);
    }
  }

  private async broadcastStatusUpdate(data: any): Promise<void> {
    try {
      const channel = this.supabase.channel('integration-status');
      await channel.send({
        type: 'broadcast',
        event: 'status_update',
        payload: data
      });
    } catch (error) {
    }
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    
    return Math.sqrt(avgSquareDiff);
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Public methods for external control

  getJobStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    this.jobs.forEach((job, jobId) => {
      status[jobId] = {
        name: job.name,
        enabled: job.enabled,
        pattern: job.pattern,
        lastRun: job.lastRun?.toISOString() || null,
        nextRun: job.nextRun?.toISOString() || null,
        isRunning: this.intervals.has(jobId)
      };
    });

    return status;
  }

  enableJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.enabled = true;
    if (!this.intervals.has(jobId)) {
      this.scheduleJob(jobId, job);
    }
    return true;
  }

  disableJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.enabled = false;
    const interval = this.intervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(jobId);
    }
    return true;
  }

  async runJobNow(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    try {
      await job.handler();
      job.lastRun = new Date();
      return true;
    } catch (error) {
      return false;
    }
  }
}