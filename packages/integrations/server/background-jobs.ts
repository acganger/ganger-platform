import { CronJob } from 'cron';
import { ModMedFHIRClient } from './modmed-client';
import { DeputyClient } from './deputy-client';
import { ZenefitsClient } from './zenefits-client';
import { db } from '@ganger/db';
import { auditLog } from '@ganger/utils/server';

/**
 * Clinical Staffing Background Jobs Manager
 * 
 * Manages automated synchronization jobs for external integrations
 * and analytics generation for the clinical staffing system.
 */

interface JobMetrics {
  success: boolean;
  duration: number;
  recordsProcessed: number;
  errors: string[];
  timestamp: Date;
}

interface AnalyticsData {
  analytics_date: Date;
  location_id: string;
  total_provider_hours: number;
  total_support_hours: number;
  optimal_support_hours: number;
  coverage_percentage: number;
  understaffed_periods: number;
  overstaffed_periods: number;
  cross_location_assignments: number;
  overtime_hours: number;
  staff_utilization_rate: number;
  patient_satisfaction_impact?: number;
  cost_efficiency_score: number;
  optimization_suggestions: any;
}

export class StaffingBackgroundJobs {
  private modmedClient: ModMedFHIRClient;
  private deputyClient: DeputyClient;
  private zenefitsClient: ZenefitsClient;
  private jobs: CronJob[] = [];
  private isRunning: boolean = false;
  private jobMetrics: Map<string, JobMetrics[]> = new Map();

  constructor() {
    // Initialize clients with environment configuration
    this.modmedClient = new ModMedFHIRClient({
      baseUrl: process.env.MODMED_FHIR_URL || '',
      clientId: process.env.MODMED_CLIENT_ID || '',
      clientSecret: process.env.MODMED_CLIENT_SECRET || ''
    });

    this.deputyClient = new DeputyClient();
    this.zenefitsClient = new ZenefitsClient();
  }

  /**
   * Start all background jobs
   */
  startJobs(): void {
    if (this.isRunning) {
      console.warn('Background jobs are already running');
      return;
    }

    console.log('Starting clinical staffing background jobs...');

    // ModMed provider schedule sync - every 30 minutes
    const modmedSyncJob = new CronJob('0 */30 * * * *', async () => {
      await this.runJobWithMetrics('modmed_sync', async () => {
        console.log('Starting ModMed provider schedule sync...');
        
        // Sync for today and tomorrow
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todaySchedules = await this.modmedClient.syncProviderSchedules(today);
        const tomorrowSchedules = await this.modmedClient.syncProviderSchedules(tomorrow);
        
        return todaySchedules.length + tomorrowSchedules.length;
      });
    }, null, true);

    // Deputy staff availability sync - every hour
    const deputySyncJob = new CronJob('0 0 * * * *', async () => {
      await this.runJobWithMetrics('deputy_sync', async () => {
        console.log('Starting Deputy staff availability sync...');
        
        const availabilityRecords = await this.deputyClient.syncStaffAvailability();
        return availabilityRecords.length;
      });
    }, null, true);

    // Zenefits employee status sync - daily at 6 AM
    const zenefitsSyncJob = new CronJob('0 0 6 * * *', async () => {
      await this.runJobWithMetrics('zenefits_sync', async () => {
        console.log('Starting Zenefits employee status sync...');
        
        await this.zenefitsClient.syncEmployeeStatus();
        
        // Get summary for metrics
        const summary = await this.zenefitsClient.getEmployeeStatusSummary();
        return summary.total_employees;
      });
    }, null, true);

    // Daily analytics generation - at 11 PM
    const analyticsJob = new CronJob('0 0 23 * * *', async () => {
      await this.runJobWithMetrics('analytics_generation', async () => {
        console.log('Generating daily staffing analytics...');
        
        const analyticsCount = await this.generateDailyAnalytics();
        return analyticsCount;
      });
    }, null, true);

    // Weekly optimization suggestions - Sundays at 8 PM
    const optimizationJob = new CronJob('0 0 20 * * 0', async () => {
      await this.runJobWithMetrics('weekly_optimization', async () => {
        console.log('Generating weekly optimization suggestions...');
        
        const suggestionsCount = await this.generateWeeklyOptimizationSuggestions();
        return suggestionsCount;
      });
    }, null, true);

    // Health check and cleanup - daily at 2 AM
    const cleanupJob = new CronJob('0 0 2 * * *', async () => {
      await this.runJobWithMetrics('cleanup', async () => {
        console.log('Running health checks and cleanup...');
        
        const cleanupCount = await this.runHealthCheckAndCleanup();
        return cleanupCount;
      });
    }, null, true);

    // Store job references
    this.jobs = [
      modmedSyncJob,
      deputySyncJob,
      zenefitsSyncJob,
      analyticsJob,
      optimizationJob,
      cleanupJob
    ];

    this.isRunning = true;
    console.log(`Started ${this.jobs.length} clinical staffing background jobs successfully`);
  }

  /**
   * Stop all background jobs
   */
  stopJobs(): void {
    if (!this.isRunning) {
      console.warn('Background jobs are not running');
      return;
    }

    console.log('Stopping clinical staffing background jobs...');

    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;

    console.log('All background jobs stopped successfully');
  }

  /**
   * Run a job with metrics tracking
   */
  private async runJobWithMetrics(
    jobName: string, 
    jobFunction: () => Promise<number>
  ): Promise<void> {
    const startTime = Date.now();
    let success = false;
    let recordsProcessed = 0;
    const errors: string[] = [];

    try {
      recordsProcessed = await jobFunction();
      success = true;
      console.log(`${jobName} completed successfully - processed ${recordsProcessed} records`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
      console.error(`${jobName} failed:`, error);
    } finally {
      const duration = Date.now() - startTime;
      
      // Store metrics
      const metrics: JobMetrics = {
        success,
        duration,
        recordsProcessed,
        errors,
        timestamp: new Date()
      };

      if (!this.jobMetrics.has(jobName)) {
        this.jobMetrics.set(jobName, []);
      }
      
      const jobHistory = this.jobMetrics.get(jobName)!;
      jobHistory.push(metrics);
      
      // Keep only last 50 executions
      if (jobHistory.length > 50) {
        jobHistory.splice(0, jobHistory.length - 50);
      }

      // Audit log the job execution
      await auditLog({
        action: `background_job_${success ? 'completed' : 'failed'}`,
        userId: 'system',
        resourceType: 'background_job',
        resourceId: jobName,
        metadata: {
          duration,
          records_processed: recordsProcessed,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    }
  }

  /**
   * Generate daily analytics for all locations
   */
  private async generateDailyAnalytics(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const locations = await db.locations.findMany({ where: { is_active: true } });
      let analyticsGenerated = 0;

      for (const location of locations) {
        try {
          const analytics = await this.calculateDailyAnalytics(today, location.id);
          
          await db.staffing_analytics.upsert({
            where: {
              analytics_date_location_id: {
                analytics_date: today,
                location_id: location.id
              }
            },
            update: analytics,
            create: {
              ...analytics,
              analytics_date: today,
              location_id: location.id
            }
          });
          
          analyticsGenerated++;
        } catch (locationError) {
          console.error(`Failed to generate analytics for location ${location.id}:`, locationError);
        }
      }

      return analyticsGenerated;
    } catch (error) {
      console.error('Failed to generate daily analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate daily analytics for a specific location
   */
  private async calculateDailyAnalytics(date: Date, locationId: string): Promise<Omit<AnalyticsData, 'analytics_date' | 'location_id'>> {
    try {
      // Get provider schedules for the day
      const providerSchedules = await db.provider_schedules_cache.findMany({
        where: {
          schedule_date: date,
          location_id: locationId
        }
      });

      // Get staff schedules for the day
      const staffSchedules = await db.staff_schedules.findMany({
        where: {
          schedule_date: date,
          location_id: locationId,
          status: { not: 'cancelled' }
        },
        include: {
          staff_member: {
            select: {
              role_type: true,
              max_hours_per_week: true
            }
          }
        }
      });

      // Calculate provider hours
      const totalProviderHours = providerSchedules.reduce((sum, schedule) => {
        const hours = this.calculateHoursBetween(schedule.start_time, schedule.end_time);
        return sum + hours;
      }, 0);

      // Calculate support hours
      const totalSupportHours = staffSchedules.reduce((sum, schedule) => {
        const hours = this.calculateHoursBetween(schedule.shift_start_time, schedule.shift_end_time);
        return sum + hours;
      }, 0);

      // Calculate optimal support hours based on provider needs
      const optimalSupportHours = providerSchedules.reduce((sum, schedule) => {
        return sum + (schedule.estimated_support_need || 0);
      }, 0);

      // Calculate coverage percentage
      const coveragePercentage = optimalSupportHours > 0 
        ? Math.round((totalSupportHours / optimalSupportHours) * 100 * 100) / 100
        : 100;

      // Identify understaffed and overstaffed periods
      const { understaffedPeriods, overstaffedPeriods } = this.analyzeStaffingPeriods(
        providerSchedules,
        staffSchedules
      );

      // Count cross-location assignments
      const crossLocationAssignments = staffSchedules.filter(schedule =>
        schedule.staff_member.primary_location_id !== locationId
      ).length;

      // Calculate overtime hours
      const overtimeHours = staffSchedules.reduce((sum, schedule) => {
        const regularHours = 8; // Standard 8-hour shift
        const actualHours = this.calculateHoursBetween(schedule.shift_start_time, schedule.shift_end_time);
        return sum + Math.max(0, actualHours - regularHours);
      }, 0);

      // Calculate staff utilization rate
      const staffUtilizationRate = this.calculateUtilizationRate(staffSchedules);

      // Calculate cost efficiency score
      const costEfficiencyScore = this.calculateCostEfficiencyScore({
        totalSupportHours,
        overtimeHours,
        crossLocationAssignments,
        coveragePercentage
      });

      // Generate optimization suggestions
      const optimizationSuggestions = await this.generateOptimizationSuggestions(
        date,
        locationId,
        {
          coveragePercentage,
          understaffedPeriods,
          overstaffedPeriods,
          overtimeHours,
          crossLocationAssignments
        }
      );

      return {
        total_provider_hours: Math.round(totalProviderHours * 100) / 100,
        total_support_hours: Math.round(totalSupportHours * 100) / 100,
        optimal_support_hours: Math.round(optimalSupportHours * 100) / 100,
        coverage_percentage: coveragePercentage,
        understaffed_periods: understaffedPeriods,
        overstaffed_periods: overstaffedPeriods,
        cross_location_assignments: crossLocationAssignments,
        overtime_hours: Math.round(overtimeHours * 100) / 100,
        staff_utilization_rate: Math.round(staffUtilizationRate * 100) / 100,
        patient_satisfaction_impact: this.estimatePatientSatisfactionImpact(coveragePercentage),
        cost_efficiency_score: Math.round(costEfficiencyScore * 100) / 100,
        optimization_suggestions: optimizationSuggestions
      };
    } catch (error) {
      console.error(`Failed to calculate analytics for ${locationId} on ${date}:`, error);
      throw error;
    }
  }

  /**
   * Calculate hours between two time strings
   */
  private calculateHoursBetween(startTime: string, endTime: string): number {
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      // Handle overnight shifts
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }
      
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    } catch (error) {
      console.error(`Failed to calculate hours between ${startTime} and ${endTime}:`, error);
      return 0;
    }
  }

  /**
   * Analyze staffing periods for gaps and overstaffing
   */
  private analyzeStaffingPeriods(
    providerSchedules: any[],
    staffSchedules: any[]
  ): { understaffedPeriods: number; overstaffedPeriods: number } {
    let understaffedPeriods = 0;
    let overstaffedPeriods = 0;

    // Create 30-minute time slots for analysis
    const timeSlots = this.createTimeSlots();

    timeSlots.forEach(slot => {
      const providersInSlot = providerSchedules.filter(ps =>
        this.timeOverlaps(ps.start_time, ps.end_time, slot.start, slot.end)
      );

      const staffInSlot = staffSchedules.filter(ss =>
        this.timeOverlaps(ss.shift_start_time, ss.shift_end_time, slot.start, slot.end)
      );

      const requiredStaff = providersInSlot.reduce((sum, ps) => 
        sum + (ps.estimated_support_need || 1), 0
      );

      const actualStaff = staffInSlot.length;

      if (actualStaff < requiredStaff) {
        understaffedPeriods++;
      } else if (actualStaff > requiredStaff * 1.5) { // 50% overstaffing threshold
        overstaffedPeriods++;
      }
    });

    return { understaffedPeriods, overstaffedPeriods };
  }

  /**
   * Create 30-minute time slots for analysis
   */
  private createTimeSlots(): Array<{ start: string; end: string }> {
    const slots = [];
    const startHour = 7; // 7 AM
    const endHour = 19;  // 7 PM

    for (let hour = startHour; hour < endHour; hour++) {
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:00:00`,
        end: `${hour.toString().padStart(2, '0')}:30:00`
      });
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:30:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00:00`
      });
    }

    return slots;
  }

  /**
   * Check if two time periods overlap
   */
  private timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Calculate staff utilization rate
   */
  private calculateUtilizationRate(staffSchedules: any[]): number {
    if (staffSchedules.length === 0) return 0;

    const totalScheduledHours = staffSchedules.reduce((sum, schedule) => {
      return sum + this.calculateHoursBetween(schedule.shift_start_time, schedule.shift_end_time);
    }, 0);

    const totalAvailableHours = staffSchedules.reduce((sum, schedule) => {
      return sum + (schedule.staff_member.max_hours_per_week || 40) / 5; // Daily hours
    }, 0);

    return totalAvailableHours > 0 ? (totalScheduledHours / totalAvailableHours) * 100 : 0;
  }

  /**
   * Calculate cost efficiency score
   */
  private calculateCostEfficiencyScore(metrics: {
    totalSupportHours: number;
    overtimeHours: number;
    crossLocationAssignments: number;
    coveragePercentage: number;
  }): number {
    let score = 100; // Start with perfect score

    // Penalize overtime (expensive)
    const overtimeRatio = metrics.overtimeHours / Math.max(metrics.totalSupportHours, 1);
    score -= overtimeRatio * 30; // Up to 30 point penalty

    // Penalize cross-location assignments (travel costs)
    score -= metrics.crossLocationAssignments * 2; // 2 points per cross-location assignment

    // Penalize poor coverage
    if (metrics.coveragePercentage < 100) {
      score -= (100 - metrics.coveragePercentage) * 0.5;
    }

    // Penalize overstaffing
    if (metrics.coveragePercentage > 120) {
      score -= (metrics.coveragePercentage - 120) * 0.3;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Estimate patient satisfaction impact
   */
  private estimatePatientSatisfactionImpact(coveragePercentage: number): number {
    // Simple linear relationship between coverage and satisfaction
    // 100% coverage = 4.5/5.0 satisfaction
    // Each 10% below optimal reduces satisfaction by 0.2 points
    const baseSatisfaction = 4.5;
    const coverageImpact = Math.max(0, (100 - coveragePercentage) / 10 * 0.2);
    
    return Math.max(1.0, Math.min(5.0, baseSatisfaction - coverageImpact));
  }

  /**
   * Generate optimization suggestions
   */
  private async generateOptimizationSuggestions(
    date: Date,
    locationId: string,
    metrics: {
      coveragePercentage: number;
      understaffedPeriods: number;
      overstaffedPeriods: number;
      overtimeHours: number;
      crossLocationAssignments: number;
    }
  ): Promise<any> {
    const suggestions = [];

    if (metrics.coveragePercentage < 90) {
      suggestions.push({
        type: 'coverage_improvement',
        priority: 'high',
        description: 'Increase staffing to improve coverage',
        impact: 'Better patient care and provider support',
        action: 'Review staff availability and consider additional scheduling'
      });
    }

    if (metrics.understaffedPeriods > 5) {
      suggestions.push({
        type: 'schedule_optimization',
        priority: 'medium',
        description: 'Optimize schedules to reduce understaffed periods',
        impact: 'More efficient staff utilization',
        action: 'Use AI optimization engine to redistribute staff'
      });
    }

    if (metrics.overtimeHours > 5) {
      suggestions.push({
        type: 'cost_reduction',
        priority: 'medium',
        description: 'Reduce overtime hours to control costs',
        impact: 'Lower labor costs and better work-life balance',
        action: 'Hire additional part-time staff or adjust schedules'
      });
    }

    if (metrics.crossLocationAssignments > 3) {
      suggestions.push({
        type: 'location_optimization',
        priority: 'low',
        description: 'Minimize cross-location assignments',
        impact: 'Reduced travel time and costs',
        action: 'Hire location-specific staff or adjust coverage models'
      });
    }

    return {
      suggestions,
      generated_at: new Date(),
      location_id: locationId,
      analysis_date: date
    };
  }

  /**
   * Generate weekly optimization suggestions
   */
  private async generateWeeklyOptimizationSuggestions(): Promise<number> {
    try {
      const locations = await db.locations.findMany({ where: { is_active: true } });
      let suggestionsGenerated = 0;

      for (const location of locations) {
        // Get last 7 days of analytics
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const weeklyAnalytics = await db.staffing_analytics.findMany({
          where: {
            location_id: location.id,
            analytics_date: {
              gte: weekAgo
            }
          },
          orderBy: { analytics_date: 'desc' }
        });

        if (weeklyAnalytics.length > 0) {
          const weeklyInsights = this.analyzeWeeklyTrends(weeklyAnalytics);
          // Store weekly insights somewhere or trigger notifications
          suggestionsGenerated++;
        }
      }

      return suggestionsGenerated;
    } catch (error) {
      console.error('Failed to generate weekly optimization suggestions:', error);
      throw error;
    }
  }

  /**
   * Analyze weekly trends
   */
  private analyzeWeeklyTrends(analytics: any[]): any {
    const avgCoverage = analytics.reduce((sum, a) => sum + a.coverage_percentage, 0) / analytics.length;
    const avgOvertimeHours = analytics.reduce((sum, a) => sum + a.overtime_hours, 0) / analytics.length;
    const totalCrossLocationAssignments = analytics.reduce((sum, a) => sum + a.cross_location_assignments, 0);

    return {
      week_avg_coverage: avgCoverage,
      week_avg_overtime: avgOvertimeHours,
      week_total_cross_location: totalCrossLocationAssignments,
      trend_analysis: {
        coverage_trend: this.calculateTrend(analytics.map(a => a.coverage_percentage)),
        overtime_trend: this.calculateTrend(analytics.map(a => a.overtime_hours))
      }
    };
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  /**
   * Run health checks and cleanup
   */
  private async runHealthCheckAndCleanup(): Promise<number> {
    let cleanupCount = 0;

    try {
      // Clean up old provider schedule cache (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedSchedules = await db.provider_schedules_cache.deleteMany({
        where: {
          schedule_date: {
            lt: thirtyDaysAgo
          }
        }
      });

      cleanupCount += deletedSchedules.count;

      // Clean up old analytics (older than 365 days)
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);

      const deletedAnalytics = await db.staffing_analytics.deleteMany({
        where: {
          analytics_date: {
            lt: oneYearAgo
          }
        }
      });

      cleanupCount += deletedAnalytics.count;

      // Test external service connections
      const connectionTests = await Promise.allSettled([
        this.modmedClient.testConnection(),
        this.deputyClient.testConnection(),
        this.zenefitsClient.testConnection()
      ]);

      // Log connection status
      connectionTests.forEach((result, index) => {
        const serviceName = ['ModMed', 'Deputy', 'Zenefits'][index];
        if (result.status === 'fulfilled' && result.value.success) {
          console.log(`${serviceName} connection: OK`);
        } else {
          console.error(`${serviceName} connection: FAILED`, 
            result.status === 'fulfilled' ? result.value.message : result.reason);
        }
      });

      console.log(`Health check and cleanup completed: ${cleanupCount} records cleaned up`);
      return cleanupCount;
    } catch (error) {
      console.error('Health check and cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get job metrics
   */
  getJobMetrics(): Record<string, JobMetrics[]> {
    const metrics: Record<string, JobMetrics[]> = {};
    
    this.jobMetrics.forEach((jobHistory, jobName) => {
      metrics[jobName] = [...jobHistory]; // Return copy
    });
    
    return metrics;
  }

  /**
   * Get job status
   */
  getJobStatus(): {
    isRunning: boolean;
    activeJobs: number;
    lastExecutions: Record<string, Date>;
  } {
    const lastExecutions: Record<string, Date> = {};
    
    this.jobMetrics.forEach((jobHistory, jobName) => {
      if (jobHistory.length > 0) {
        lastExecutions[jobName] = jobHistory[jobHistory.length - 1].timestamp;
      }
    });

    return {
      isRunning: this.isRunning,
      activeJobs: this.jobs.length,
      lastExecutions
    };
  }

  /**
   * Force run a specific job manually
   */
  async runJobManually(jobName: string): Promise<JobMetrics> {
    const startTime = Date.now();
    let success = false;
    let recordsProcessed = 0;
    const errors: string[] = [];

    try {
      switch (jobName) {
        case 'modmed_sync':
          const today = new Date();
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const todaySchedules = await this.modmedClient.syncProviderSchedules(today);
          const tomorrowSchedules = await this.modmedClient.syncProviderSchedules(tomorrow);
          recordsProcessed = todaySchedules.length + tomorrowSchedules.length;
          break;

        case 'deputy_sync':
          const availabilityRecords = await this.deputyClient.syncStaffAvailability();
          recordsProcessed = availabilityRecords.length;
          break;

        case 'zenefits_sync':
          await this.zenefitsClient.syncEmployeeStatus();
          const summary = await this.zenefitsClient.getEmployeeStatusSummary();
          recordsProcessed = summary.total_employees;
          break;

        case 'analytics_generation':
          recordsProcessed = await this.generateDailyAnalytics();
          break;

        case 'cleanup':
          recordsProcessed = await this.runHealthCheckAndCleanup();
          break;

        default:
          throw new Error(`Unknown job: ${jobName}`);
      }

      success = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
    }

    const duration = Date.now() - startTime;
    const metrics: JobMetrics = {
      success,
      duration,
      recordsProcessed,
      errors,
      timestamp: new Date()
    };

    // Store metrics
    if (!this.jobMetrics.has(jobName)) {
      this.jobMetrics.set(jobName, []);
    }
    this.jobMetrics.get(jobName)!.push(metrics);

    // Audit log
    await auditLog({
      action: `manual_job_${success ? 'completed' : 'failed'}`,
      userId: 'manual',
      resourceType: 'background_job',
      resourceId: jobName,
      metadata: {
        duration,
        records_processed: recordsProcessed,
        errors: errors.length > 0 ? errors : undefined
      }
    });

    return metrics;
  }
}

export default StaffingBackgroundJobs;