import { createClient } from '@supabase/supabase-js';
import { ZenefitsComplianceSync } from '../zenefits/ZenefitsComplianceSync';
import { GoogleClassroomComplianceSync } from '../google-classroom/GoogleClassroomComplianceSync';
import { ComplianceRealtimeService } from '../realtime/ComplianceRealtimeService';
import { auditLog } from '@ganger/utils/server';

interface JobResult {
  success: boolean;
  duration: number;
  recordsProcessed: number;
  errors: string[];
  metrics: Record<string, any>;
}

interface JobSchedule {
  name: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  errorCount: number;
}

export class ComplianceBackgroundJobs {
  private supabase;
  private zenefitsSync: ZenefitsComplianceSync;
  private googleClassroomSync: GoogleClassroomComplianceSync;
  private realtimeService: ComplianceRealtimeService;
  private jobSchedules: Map<string, JobSchedule> = new Map();
  private isRunning: boolean = false;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.zenefitsSync = new ZenefitsComplianceSync();
    this.googleClassroomSync = new GoogleClassroomComplianceSync();
    this.realtimeService = new ComplianceRealtimeService();

    this.initializeJobSchedules();
  }

  /**
   * Initialize default job schedules
   */
  private initializeJobSchedules(): void {
    this.jobSchedules.set('daily-zenefits-sync', {
      name: 'Daily Zenefits Employee Sync',
      cronExpression: '0 6 * * *', // 6 AM daily
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    this.jobSchedules.set('daily-classroom-sync', {
      name: 'Daily Google Classroom Sync',
      cronExpression: '0 7 * * *', // 7 AM daily
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    this.jobSchedules.set('hourly-status-check', {
      name: 'Hourly Compliance Status Check',
      cronExpression: '0 * * * *', // Every hour
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    this.jobSchedules.set('weekly-compliance-report', {
      name: 'Weekly Compliance Summary Report',
      cronExpression: '0 8 * * 1', // 8 AM every Monday
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    this.jobSchedules.set('daily-maintenance', {
      name: 'Daily System Maintenance',
      cronExpression: '0 2 * * *', // 2 AM daily
      enabled: true,
      runCount: 0,
      errorCount: 0
    });
  }

  /**
   * Start the background job scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Background jobs already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting Compliance Background Jobs service...');

    // Load job schedules from database
    await this.loadJobSchedulesFromDatabase();

    // Set up job execution intervals
    this.scheduleJobs();

    // Log service start
    await auditLog({
      action: 'background_jobs_started',
      resourceType: 'compliance_background_jobs',
      metadata: {
        totalJobs: this.jobSchedules.size,
        enabledJobs: Array.from(this.jobSchedules.values()).filter(j => j.enabled).length
      }
    });

    console.log('Compliance Background Jobs service started successfully');
  }

  /**
   * Stop the background job scheduler
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('Stopping Compliance Background Jobs service...');

    await auditLog({
      action: 'background_jobs_stopped',
      resourceType: 'compliance_background_jobs'
    });
  }

  /**
   * Schedule all enabled jobs
   */
  private scheduleJobs(): void {
    for (const [jobId, schedule] of this.jobSchedules.entries()) {
      if (!schedule.enabled) continue;

      this.scheduleNextRun(jobId, schedule);
    }
  }

  /**
   * Schedule the next run for a specific job
   */
  private scheduleNextRun(jobId: string, schedule: JobSchedule): void {
    const nextRun = this.calculateNextRun(schedule.cronExpression);
    schedule.nextRun = nextRun;

    const delay = nextRun.getTime() - Date.now();
    
    setTimeout(async () => {
      if (this.isRunning && schedule.enabled) {
        await this.executeJob(jobId, schedule);
        // Schedule the next run
        this.scheduleNextRun(jobId, schedule);
      }
    }, delay);

    console.log(`Scheduled job ${jobId} to run at ${nextRun.toISOString()}`);
  }

  /**
   * Execute a specific job
   */
  private async executeJob(jobId: string, schedule: JobSchedule): Promise<void> {
    const startTime = Date.now();
    let result: JobResult;

    try {
      console.log(`Executing job: ${schedule.name} (${jobId})`);
      
      // Update last run time
      schedule.lastRun = new Date();
      schedule.runCount++;

      // Execute the specific job
      switch (jobId) {
        case 'daily-zenefits-sync':
          result = await this.runZenefitsSync();
          break;
        case 'daily-classroom-sync':
          result = await this.runGoogleClassroomSync();
          break;
        case 'hourly-status-check':
          result = await this.runComplianceStatusCheck();
          break;
        case 'weekly-compliance-report':
          result = await this.runWeeklyComplianceReport();
          break;
        case 'daily-maintenance':
          result = await this.runDailyMaintenance();
          break;
        default:
          throw new Error(`Unknown job ID: ${jobId}`);
      }

      // Log successful execution
      await this.logJobExecution(jobId, schedule, result, null);

    } catch (error) {
      console.error(`Job execution failed: ${schedule.name}`, error);
      
      schedule.errorCount++;
      
      const failureResult: JobResult = {
        success: false,
        duration: Date.now() - startTime,
        recordsProcessed: 0,
        errors: [error.message],
        metrics: {}
      };

      await this.logJobExecution(jobId, schedule, failureResult, error);
    }
  }

  /**
   * Run Zenefits employee synchronization
   */
  private async runZenefitsSync(): Promise<JobResult> {
    const startTime = Date.now();

    // Create sync log entry
    const { data: syncLog } = await this.supabase
      .from('sync_logs')
      .insert({
        sync_type: 'zenefits_employees',
        status: 'in_progress',
        start_time: new Date().toISOString(),
        triggered_by: 'background_job'
      })
      .select()
      .single();

    try {
      const syncResult = await this.zenefitsSync.syncEmployees(syncLog.id, {
        batchSize: 50,
        skipExisting: false
      });

      // Update sync log
      await this.supabase
        .from('sync_logs')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          records_processed: syncResult.processed,
          records_total: syncResult.total,
          summary: syncResult.summary
        })
        .eq('id', syncLog.id);

      return {
        success: true,
        duration: Date.now() - startTime,
        recordsProcessed: syncResult.processed,
        errors: syncResult.errors || [],
        metrics: {
          added: syncResult.added,
          updated: syncResult.updated,
          skipped: syncResult.skipped,
          total: syncResult.total
        }
      };
    } catch (error) {
      // Update sync log with error
      await this.supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          end_time: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', syncLog.id);

      throw error;
    }
  }

  /**
   * Run Google Classroom training completion synchronization
   */
  private async runGoogleClassroomSync(): Promise<JobResult> {
    const startTime = Date.now();

    // Create sync log entry
    const { data: syncLog } = await this.supabase
      .from('sync_logs')
      .insert({
        sync_type: 'google_classroom_completions',
        status: 'in_progress',
        start_time: new Date().toISOString(),
        triggered_by: 'background_job'
      })
      .select()
      .single();

    try {
      const syncResult = await this.googleClassroomSync.syncCompletions(syncLog.id, {
        batchSize: 100,
        daysSince: 7 // Sync last 7 days of activity
      });

      // Update sync log
      await this.supabase
        .from('sync_logs')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          records_processed: syncResult.processed,
          records_total: syncResult.total,
          summary: syncResult.summary
        })
        .eq('id', syncLog.id);

      return {
        success: true,
        duration: Date.now() - startTime,
        recordsProcessed: syncResult.processed,
        errors: syncResult.errors || [],
        metrics: {
          coursesProcessed: syncResult.coursesProcessed,
          completionsFound: syncResult.completionsFound,
          gradesUpdated: syncResult.gradesUpdated
        }
      };
    } catch (error) {
      // Update sync log with error
      await this.supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          end_time: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', syncLog.id);

      throw error;
    }
  }

  /**
   * Run hourly compliance status check
   */
  private async runComplianceStatusCheck(): Promise<JobResult> {
    const startTime = Date.now();

    try {
      // Run the database function for status updates
      const { data: updateResult } = await this.supabase
        .rpc('manual_overdue_check');

      // Process any pending notifications
      const { data: notificationResult } = await this.supabase
        .rpc('process_realtime_notifications');

      return {
        success: true,
        duration: Date.now() - startTime,
        recordsProcessed: updateResult?.[0]?.updated_count || 0,
        errors: [],
        metrics: {
          statusUpdates: updateResult?.[0]?.updated_count || 0,
          overdueCount: updateResult?.[0]?.overdue_count || 0,
          notificationsQueued: updateResult?.[0]?.notifications_queued || 0,
          notificationsProcessed: notificationResult || 0
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate weekly compliance report
   */
  private async runWeeklyComplianceReport(): Promise<JobResult> {
    const startTime = Date.now();

    try {
      // Get compliance summary data
      const { data: complianceData } = await this.supabase
        .from('department_compliance_dashboard')
        .select('*');

      // Get overdue training data
      const { data: overdueData } = await this.supabase
        .from('training_completions')
        .select(`
          employee:employees(full_name, department),
          module:training_modules(module_name),
          overdue_days
        `)
        .eq('status', 'overdue')
        .eq('is_required', true);

      // Generate report summary
      const reportSummary = {
        reportDate: new Date().toISOString(),
        totalDepartments: complianceData?.length || 0,
        overallComplianceRate: complianceData?.reduce((sum, dept) => sum + dept.avg_compliance_rate, 0) / (complianceData?.length || 1),
        totalOverdueTrainings: overdueData?.length || 0,
        departmentSummary: complianceData?.map(dept => ({
          department: dept.department,
          complianceRate: dept.avg_compliance_rate,
          totalEmployees: dept.total_employees,
          overdueTrainings: dept.total_overdue_trainings
        }))
      };

      // Broadcast weekly report
      await this.realtimeService.broadcastComplianceUpdate('weekly_report_generated', {
        reportSummary,
        reportType: 'weekly_compliance_summary'
      }, {
        channel: 'compliance-reports',
        targetRoles: ['superadmin', 'hr_admin', 'manager']
      });

      return {
        success: true,
        duration: Date.now() - startTime,
        recordsProcessed: (complianceData?.length || 0) + (overdueData?.length || 0),
        errors: [],
        metrics: reportSummary
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Run daily system maintenance
   */
  private async runDailyMaintenance(): Promise<JobResult> {
    const startTime = Date.now();

    try {
      // Run database maintenance function
      await this.supabase.rpc('run_daily_compliance_maintenance');

      // Clean up old audit logs (older than 6 months)
      const { count: deletedAuditLogs } = await this.supabase
        .from('compliance_audit_log')
        .delete()
        .lt('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString());

      // Clean up old sync logs (older than 3 months)
      const { count: deletedSyncLogs } = await this.supabase
        .from('sync_logs')
        .delete()
        .lt('created_at', new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString());

      // Refresh materialized views
      await this.supabase.rpc('refresh_compliance_cache');

      return {
        success: true,
        duration: Date.now() - startTime,
        recordsProcessed: (deletedAuditLogs || 0) + (deletedSyncLogs || 0),
        errors: [],
        metrics: {
          auditLogsDeleted: deletedAuditLogs || 0,
          syncLogsDeleted: deletedSyncLogs || 0,
          cacheRefreshed: true
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate next run time based on cron expression
   */
  private calculateNextRun(cronExpression: string): Date {
    // Simple cron parser for common patterns
    // In production, use a proper cron library like node-cron or cron-parser
    const parts = cronExpression.split(' ');
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const now = new Date();
    const next = new Date(now);

    if (minute !== '*') {
      next.setMinutes(parseInt(minute), 0, 0);
    }
    if (hour !== '*') {
      next.setHours(parseInt(hour));
    }

    // If the calculated time is in the past, add appropriate interval
    if (next <= now) {
      if (hour !== '*') {
        next.setDate(next.getDate() + 1);
      } else {
        next.setHours(next.getHours() + 1);
      }
    }

    return next;
  }

  /**
   * Load job schedules from database
   */
  private async loadJobSchedulesFromDatabase(): Promise<void> {
    try {
      const { data: jobConfigs } = await this.supabase
        .from('background_job_schedules')
        .select('*');

      if (jobConfigs) {
        for (const config of jobConfigs) {
          if (this.jobSchedules.has(config.job_id)) {
            const schedule = this.jobSchedules.get(config.job_id)!;
            schedule.enabled = config.enabled;
            schedule.cronExpression = config.cron_expression;
            schedule.lastRun = config.last_run ? new Date(config.last_run) : undefined;
            schedule.runCount = config.run_count || 0;
            schedule.errorCount = config.error_count || 0;
          }
        }
      }
    } catch (error) {
      console.warn('Could not load job schedules from database, using defaults:', error.message);
    }
  }

  /**
   * Log job execution results
   */
  private async logJobExecution(
    jobId: string,
    schedule: JobSchedule,
    result: JobResult,
    error?: Error
  ): Promise<void> {
    try {
      // Update job schedule in database
      await this.supabase
        .from('background_job_schedules')
        .upsert({
          job_id: jobId,
          job_name: schedule.name,
          cron_expression: schedule.cronExpression,
          enabled: schedule.enabled,
          last_run: schedule.lastRun?.toISOString(),
          next_run: schedule.nextRun?.toISOString(),
          run_count: schedule.runCount,
          error_count: schedule.errorCount,
          last_result: result,
          updated_at: new Date().toISOString()
        });

      // Log to audit trail
      await auditLog({
        action: result.success ? 'background_job_completed' : 'background_job_failed',
        resourceType: 'compliance_background_job',
        metadata: {
          jobId,
          jobName: schedule.name,
          duration: result.duration,
          recordsProcessed: result.recordsProcessed,
          success: result.success,
          errors: result.errors,
          metrics: result.metrics,
          ...(error && { errorMessage: error.message, errorStack: error.stack })
        }
      });

      if (result.success) {
        console.log(`Job ${jobId} completed successfully in ${result.duration}ms, processed ${result.recordsProcessed} records`);
      } else {
        console.error(`Job ${jobId} failed after ${result.duration}ms:`, result.errors);
      }

    } catch (logError) {
      console.error('Failed to log job execution:', logError);
    }
  }

  /**
   * Get current job status
   */
  async getJobStatus(): Promise<Array<JobSchedule & { isRunning: boolean }>> {
    return Array.from(this.jobSchedules.entries()).map(([jobId, schedule]) => ({
      ...schedule,
      isRunning: this.isRunning
    }));
  }

  /**
   * Enable or disable a specific job
   */
  async toggleJob(jobId: string, enabled: boolean): Promise<boolean> {
    const schedule = this.jobSchedules.get(jobId);
    if (!schedule) {
      return false;
    }

    schedule.enabled = enabled;

    // Update in database
    await this.supabase
      .from('background_job_schedules')
      .upsert({
        job_id: jobId,
        job_name: schedule.name,
        cron_expression: schedule.cronExpression,
        enabled: enabled,
        updated_at: new Date().toISOString()
      });

    // If enabling and service is running, schedule the job
    if (enabled && this.isRunning) {
      this.scheduleNextRun(jobId, schedule);
    }

    return true;
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(jobId: string): Promise<JobResult> {
    const schedule = this.jobSchedules.get(jobId);
    if (!schedule) {
      throw new Error(`Job ${jobId} not found`);
    }

    console.log(`Manually triggering job: ${schedule.name}`);
    
    const startTime = Date.now();
    try {
      await this.executeJob(jobId, schedule);
      return {
        success: true,
        duration: Date.now() - startTime,
        recordsProcessed: 0, // Will be updated by executeJob
        errors: [],
        metrics: {}
      };
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        recordsProcessed: 0,
        errors: [error.message],
        metrics: {}
      };
    }
  }
}

// Export singleton instance
export const complianceBackgroundJobs = new ComplianceBackgroundJobs();