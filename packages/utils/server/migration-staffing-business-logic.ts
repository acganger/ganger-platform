/**
 * Migration-Aware Staffing Business Logic
 * Extends staffing business logic to work during database schema migration
 * Phase 2: Shared Package Migration
 */

import { migrationAdapter } from '@ganger/db';

// Local audit logging function to avoid circular dependency
const auditLog = async (entry: {
  action: string;
  userId?: string;
  userEmail?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  result?: 'success' | 'failure';
  error?: string;
}) => {
  console.log('Audit Log:', {
    timestamp: new Date().toISOString(),
    ...entry
  });
};

export interface MigrationStaffingConfig {
  enableMigrationMode: boolean;
  useNewSchema: boolean;
  logMigrationOperations: boolean;
}

/**
 * Migration-aware staffing business logic utilities
 */
export class MigrationStaffingBusinessLogic {
  private config: MigrationStaffingConfig;

  constructor(config?: Partial<MigrationStaffingConfig>) {
    // Merge with defaults
    this.config = {
      enableMigrationMode: true,
      useNewSchema: false,
      logMigrationOperations: process.env.NODE_ENV === 'development',
      ...config
    };
    
    // Configure migration adapter
    migrationAdapter.updateConfig({
      enableMigrationMode: this.config.enableMigrationMode,
      useNewSchema: this.config.useNewSchema,
      logMigrationQueries: this.config.logMigrationOperations
    });
  }

  /**
   * Get table names based on migration state
   */
  private getTableNames() {
    if (!this.config.enableMigrationMode) {
      return {
        staffMembers: 'staff_members',
        staffSchedules: 'staff_schedules',
        staffAvailability: 'staff_availability'
      };
    }

    return {
      staffMembers: this.config.useNewSchema ? 'profiles' : 'staff_members',
      staffSchedules: 'staff_schedules', // Remains same in both schemas
      staffAvailability: 'staff_availability' // Remains same in both schemas
    };
  }

  /**
   * Calculate optimal staffing with migration-aware queries
   */
  async calculateOptimalStaffingWithMigration(
    locationId: string,
    date: Date,
    providerSchedules: any[]
  ): Promise<{
    optimalStaffCount: number;
    requiredSkills: string[];
    timeSlotRequirements: Array<{
      startTime: string;
      endTime: string;
      requiredStaff: number;
      requiredSkills: string[];
    }>;
  }> {
    if (this.config.logMigrationOperations) {
      console.log(`[Migration Staffing] Calculating optimal staffing using ${this.config.useNewSchema ? 'new' : 'old'} schema`);
    }

    try {
      // Use migration adapter for database queries
      const supportRequirements = await migrationAdapter.rawQuery(`
        SELECT * FROM physician_support_requirements 
        WHERE location_id = $1 
          AND is_active = true 
          AND effective_start_date <= $2 
          AND (effective_end_date IS NULL OR effective_end_date >= $3)
      `, [locationId, date, date]);

      // Generate time slots (unchanged logic)
      const timeSlots = this.generateTimeSlots('07:00:00', '19:00:00', 30);
      const timeSlotRequirements: Array<{
        startTime: string;
        endTime: string;
        requiredStaff: number;
        requiredSkills: string[];
      }> = [];
      const allRequiredSkills = new Set<string>();

      for (const slot of timeSlots) {
        let requiredStaff = 0;
        const slotSkills = new Set<string>();

        // Check which providers are working during this slot
        for (const schedule of providerSchedules) {
          if (this.timeOverlaps(schedule.start_time, schedule.end_time, slot.start, slot.end)) {
            // Find support requirements for this provider
            const requirement = supportRequirements.find((req: any) => 
              req.physician_id === schedule.provider_id
            );

            if (requirement) {
              requiredStaff += requirement.support_staff_count;
              requirement.required_skills.forEach((skill: string) => {
                slotSkills.add(skill);
                allRequiredSkills.add(skill);
              });
            } else {
              // Default requirement if no specific requirement found
              requiredStaff += 1;
            }
          }
        }

        if (requiredStaff > 0) {
          timeSlotRequirements.push({
            startTime: slot.start,
            endTime: slot.end,
            requiredStaff,
            requiredSkills: Array.from(slotSkills)
          });
        }
      }

      // Calculate peak staffing requirement
      const optimalStaffCount = Math.max(...timeSlotRequirements.map(slot => slot.requiredStaff), 0);

      return {
        optimalStaffCount,
        requiredSkills: Array.from(allRequiredSkills),
        timeSlotRequirements
      };

    } catch (error) {
      console.error('[Migration Staffing] Failed to calculate optimal staffing:', error);
      throw error;
    }
  }

  /**
   * Calculate staffing metrics with migration-aware queries
   */
  async calculateStaffingMetricsWithMigration(
    locationId: string,
    date: Date
  ): Promise<{
    totalProviderHours: number;
    totalSupportHours: number;
    optimalSupportHours: number;
    coveragePercentage: number;
    utilizationRate: number;
    costEfficiencyScore: number;
    overtimeHours: number;
    understaffedPeriods: number;
    overstaffedPeriods: number;
  }> {
    const tables = this.getTableNames();

    if (this.config.logMigrationOperations) {
      console.log(`[Migration Staffing] Calculating metrics using tables: ${JSON.stringify(tables)}`);
    }

    try {
      // Get provider schedules
      const providerSchedules = await migrationAdapter.rawQuery(`
        SELECT * FROM provider_schedules_cache 
        WHERE location_id = $1 AND schedule_date = $2
      `, [locationId, date]);

      // Get staff schedules with migration-aware field mapping
      const staffSchedulesQuery = this.config.useNewSchema ? `
        SELECT ss.*, p.name, p.metadata, p.role
        FROM ${tables.staffSchedules} ss
        JOIN ${tables.staffMembers} p ON ss.staff_member_id = p.id
        WHERE ss.location_id = $1 
          AND ss.schedule_date = $2 
          AND ss.status != 'cancelled'
      ` : `
        SELECT ss.*, sm.max_hours_per_week, sm.role_type,
               sm.first_name, sm.last_name
        FROM ${tables.staffSchedules} ss
        JOIN ${tables.staffMembers} sm ON ss.staff_member_id = sm.id
        WHERE ss.location_id = $1 
          AND ss.schedule_date = $2 
          AND ss.status != 'cancelled'
      `;

      const staffSchedules = await migrationAdapter.rawQuery(staffSchedulesQuery, [locationId, date]);

      // Calculate total provider hours
      const totalProviderHours = providerSchedules.reduce((total: number, schedule: any) => {
        return total + this.calculateHoursBetween(schedule.start_time, schedule.end_time);
      }, 0);

      // Calculate total support hours
      const totalSupportHours = staffSchedules.reduce((total: number, schedule: any) => {
        return total + this.calculateHoursBetween(schedule.shift_start_time, schedule.shift_end_time);
      }, 0);

      // Calculate optimal support hours
      const optimalStaffing = await this.calculateOptimalStaffingWithMigration(locationId, date, providerSchedules);
      const optimalSupportHours = optimalStaffing.timeSlotRequirements.reduce((total, slot) => {
        const slotDuration = this.calculateHoursBetween(slot.startTime, slot.endTime);
        return total + (slot.requiredStaff * slotDuration);
      }, 0);

      // Calculate coverage percentage
      const coveragePercentage = optimalSupportHours > 0 
        ? (totalSupportHours / optimalSupportHours) * 100 
        : 100;

      // Calculate utilization rate (with migration-aware field access)
      const totalAvailableHours = staffSchedules.reduce((total: number, schedule: any) => {
        let dailyMax: number;
        
        if (this.config.useNewSchema) {
          // New schema: get from metadata or default
          dailyMax = schedule.metadata?.max_hours_per_week ? schedule.metadata.max_hours_per_week / 5 : 8;
        } else {
          // Old schema: direct field access
          dailyMax = (schedule.max_hours_per_week || 40) / 5;
        }
        
        return total + dailyMax;
      }, 0);

      const utilizationRate = totalAvailableHours > 0 
        ? (totalSupportHours / totalAvailableHours) * 100 
        : 0;

      // Calculate overtime hours
      const overtimeHours = staffSchedules.reduce((total: number, schedule: any) => {
        const scheduledHours = this.calculateHoursBetween(schedule.shift_start_time, schedule.shift_end_time);
        const regularHours = 8; // Standard 8-hour shift
        return total + Math.max(0, scheduledHours - regularHours);
      }, 0);

      // Analyze staffing periods
      const { understaffedPeriods, overstaffedPeriods } = this.analyzeStaffingPeriods(
        providerSchedules,
        staffSchedules,
        optimalStaffing.timeSlotRequirements
      );

      // Calculate cost efficiency score
      const costEfficiencyScore = this.calculateCostEfficiencyScore({
        coveragePercentage,
        overtimeHours,
        totalSupportHours,
        understaffedPeriods,
        overstaffedPeriods
      });

      return {
        totalProviderHours,
        totalSupportHours,
        optimalSupportHours,
        coveragePercentage,
        utilizationRate,
        costEfficiencyScore,
        overtimeHours,
        understaffedPeriods,
        overstaffedPeriods
      };

    } catch (error) {
      console.error('[Migration Staffing] Failed to calculate staffing metrics:', error);
      throw error;
    }
  }

  /**
   * Auto-approve schedules with migration-aware queries
   */
  async autoApproveSchedulesWithMigration(
    schedules: any[],
    userId: string
  ): Promise<{ approved: string[]; rejected: string[]; reasons: Record<string, string> }> {
    const approved: string[] = [];
    const rejected: string[] = [];
    const reasons: Record<string, string> = {};
    const tables = this.getTableNames();

    if (this.config.logMigrationOperations) {
      console.log(`[Migration Staffing] Auto-approving ${schedules.length} schedules using ${this.config.useNewSchema ? 'new' : 'old'} schema`);
    }

    try {
      for (const schedule of schedules) {
        let shouldApprove = true;
        let rejectionReason = '';

        // Check if staff member is available using migration adapter
        const availabilityResult = await migrationAdapter.select(
          'staff_availability',
          '*',
          {
            staff_member_id: schedule.staff_member_id
          }
        );

        const availability = availabilityResult.find((avail: any) => {
          const scheduleDate = new Date(schedule.schedule_date);
          const startDate = new Date(avail.date_range_start);
          const endDate = new Date(avail.date_range_end);
          return scheduleDate >= startDate && scheduleDate <= endDate && 
                 avail.days_of_week.includes(scheduleDate.getDay());
        });

        if (!availability) {
          shouldApprove = false;
          rejectionReason = 'Staff member not available on this day';
        }

        // Check for conflicts using migration adapter
        if (shouldApprove) {
          const conflicts = await migrationAdapter.select(
            'staff_schedules',
            '*',
            {
              staff_member_id: schedule.staff_member_id,
              schedule_date: new Date(schedule.schedule_date)
            }
          );

          const conflictingSchedules = conflicts.filter((s: any) => 
            ['scheduled', 'confirmed', 'in_progress'].includes(s.status) && s.id !== schedule.id
          );

          if (conflictingSchedules.length > 0) {
            shouldApprove = false;
            rejectionReason = 'Schedule conflicts with existing shifts';
          }
        }

        // Check weekly hour limits
        if (shouldApprove) {
          const weekStart = new Date(schedule.schedule_date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);

          const weeklySchedules = await migrationAdapter.rawQuery(`
            SELECT * FROM ${tables.staffSchedules}
            WHERE staff_member_id = $1 
              AND schedule_date >= $2 
              AND schedule_date <= $3 
              AND status IN ('scheduled', 'confirmed', 'in_progress') 
              AND id != $4
          `, [schedule.staff_member_id, weekStart, weekEnd, schedule.id]);

          const totalWeeklyHours = weeklySchedules.reduce((total: number, s: any) => {
            return total + this.calculateHoursBetween(s.shift_start_time, s.shift_end_time);
          }, 0) + this.calculateHoursBetween(schedule.shift_start_time, schedule.shift_end_time);

          if (totalWeeklyHours > 60) {
            shouldApprove = false;
            rejectionReason = `Weekly hour limit exceeded (${totalWeeklyHours.toFixed(1)} hours)`;
          }
        }

        if (shouldApprove) {
          // Auto-approve the schedule using migration adapter
          await migrationAdapter.update(
            'staff_schedules',
            { 
              status: this.config.useNewSchema ? 'confirmed' : 'confirmed',
              last_updated_by: userId, 
              updated_at: new Date().toISOString() 
            },
            { id: schedule.id }
          );

          approved.push(schedule.id);

          // Audit log with migration context
          await auditLog({
            action: 'schedule_auto_approved',
            userId,
            resourceType: 'staff_schedule',
            resourceId: schedule.id,
            metadata: {
              staff_member_id: schedule.staff_member_id,
              schedule_date: schedule.schedule_date,
              auto_approval_rules: 'availability_check,conflict_check,hour_limit_check',
              migration_mode: this.config.useNewSchema ? 'new_schema' : 'old_schema'
            }
          });
        } else {
          rejected.push(schedule.id);
          reasons[schedule.id] = rejectionReason;

          // Audit log with migration context
          await auditLog({
            action: 'schedule_auto_rejected',
            userId,
            resourceType: 'staff_schedule',
            resourceId: schedule.id,
            metadata: {
              staff_member_id: schedule.staff_member_id,
              schedule_date: schedule.schedule_date,
              rejection_reason: rejectionReason,
              migration_mode: this.config.useNewSchema ? 'new_schema' : 'old_schema'
            }
          });
        }
      }

      if (this.config.logMigrationOperations) {
        console.log(`[Migration Staffing] Auto-approval completed. Approved: ${approved.length}, Rejected: ${rejected.length}`);
      }

      return { approved, rejected, reasons };

    } catch (error) {
      console.error('[Migration Staffing] Failed to auto-approve schedules:', error);
      throw error;
    }
  }

  /**
   * Generate staffing forecast with migration-aware queries
   */
  async generateStaffingForecastWithMigration(
    locationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    date: Date;
    predictedDemand: number;
    recommendedStaff: number;
    confidence: number;
    factors: string[];
  }>> {
    if (this.config.logMigrationOperations) {
      console.log(`[Migration Staffing] Generating forecast from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    }

    try {
      const forecast: Array<{
        date: Date;
        predictedDemand: number;
        recommendedStaff: number;
        confidence: number;
        factors: string[];
      }> = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        // Get historical data for same day of week
        const dayOfWeek = currentDate.getDay();
        const ninetyDaysAgo = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        
        const historicalData = await migrationAdapter.rawQuery(`
          SELECT * FROM staffing_analytics 
          WHERE location_id = $1 
            AND analytics_date >= $2
        `, [locationId, ninetyDaysAgo]);

        const sameDayData = historicalData.filter((data: any) => 
          new Date(data.analytics_date).getDay() === dayOfWeek
        );

        if (sameDayData.length > 0) {
          const avgDemand = sameDayData.reduce((sum: number, data: any) => 
            sum + (data.total_support_hours || 0), 0
          ) / sameDayData.length;

          const avgStaff = sameDayData.reduce((sum: number, data: any) => 
            sum + (data.total_support_hours || 0) / 8, 0
          ) / sameDayData.length; // Assuming 8-hour shifts

          const confidence = Math.min(95, 60 + (sameDayData.length * 2)); // Higher confidence with more data

          const factors = this.generateForecastFactors(currentDate, dayOfWeek);

          forecast.push({
            date: new Date(currentDate),
            predictedDemand: Math.round(avgDemand * 100) / 100,
            recommendedStaff: Math.ceil(avgStaff),
            confidence,
            factors
          });
        } else {
          // Default forecast if no historical data
          forecast.push({
            date: new Date(currentDate),
            predictedDemand: 24, // Default 8 hours * 3 staff
            recommendedStaff: 3,
            confidence: 30,
            factors: ['No historical data available', `Migration mode: ${this.config.useNewSchema ? 'new schema' : 'old schema'}`]
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return forecast;

    } catch (error) {
      console.error('[Migration Staffing] Failed to generate staffing forecast:', error);
      throw error;
    }
  }

  /**
   * Helper methods (unchanged from original but made private)
   */
  private generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number): Array<{ start: string; end: string }> {
    const slots: Array<{ start: string; end: string }> = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    let current = new Date(start);
    
    while (current < end) {
      const slotEnd = new Date(current.getTime() + intervalMinutes * 60000);
      
      slots.push({
        start: current.toTimeString().substring(0, 8),
        end: slotEnd.toTimeString().substring(0, 8)
      });
      
      current = slotEnd;
    }
    
    return slots;
  }

  private timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  }

  private calculateHoursBetween(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Handle overnight shifts
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  private analyzeStaffingPeriods(
    _providerSchedules: any[],
    _staffSchedules: any[],
    _requirements: any[]
  ): { understaffedPeriods: number; overstaffedPeriods: number } {
    let understaffedPeriods = 0;
    let overstaffedPeriods = 0;

    for (const requirement of _requirements) {
      const staffInSlot = _staffSchedules.filter((schedule: any) =>
        this.timeOverlaps(schedule.shift_start_time, schedule.shift_end_time, requirement.startTime, requirement.endTime)
      );

      const actualStaff = staffInSlot.length;
      const requiredStaff = requirement.requiredStaff;

      if (actualStaff < requiredStaff) {
        understaffedPeriods++;
      } else if (actualStaff > requiredStaff * 1.5) { // 50% overstaffing threshold
        overstaffedPeriods++;
      }
    }

    return { understaffedPeriods, overstaffedPeriods };
  }

  private calculateCostEfficiencyScore(metrics: {
    coveragePercentage: number;
    overtimeHours: number;
    totalSupportHours: number;
    understaffedPeriods: number;
    overstaffedPeriods: number;
  }): number {
    let score = 100; // Start with perfect score

    // Penalize poor coverage
    if (metrics.coveragePercentage < 100) {
      score -= (100 - metrics.coveragePercentage) * 0.5;
    }

    // Penalize overstaffing
    if (metrics.coveragePercentage > 120) {
      score -= (metrics.coveragePercentage - 120) * 0.3;
    }

    // Penalize overtime
    const overtimeRatio = metrics.overtimeHours / Math.max(metrics.totalSupportHours, 1);
    score -= overtimeRatio * 30;

    // Penalize understaffing
    score -= metrics.understaffedPeriods * 2;

    // Penalize overstaffing
    score -= metrics.overstaffedPeriods * 1;

    return Math.max(0, Math.min(100, score));
  }

  private generateForecastFactors(date: Date, dayOfWeek: number): string[] {
    const factors: string[] = [];
    
    // Day of week factor
    if (dayOfWeek === 1) factors.push('Monday (typically high demand)');
    if (dayOfWeek === 5) factors.push('Friday (typically high demand)');
    if (dayOfWeek === 0 || dayOfWeek === 6) factors.push('Weekend (typically lower demand)');

    // Seasonal factors (simplified)
    const month = date.getMonth();
    if (month >= 5 && month <= 7) factors.push('Summer season (typically higher demand)');
    if (month === 11 || month === 0) factors.push('Holiday season (variable demand)');

    // Migration factor
    factors.push(`Migration mode: ${this.config.useNewSchema ? 'new schema' : 'old schema'}`);

    return factors;
  }

  /**
   * Update migration configuration
   */
  updateConfig(newConfig: Partial<MigrationStaffingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update migration adapter config as well
    migrationAdapter.updateConfig({
      enableMigrationMode: this.config.enableMigrationMode,
      useNewSchema: this.config.useNewSchema,
      logMigrationQueries: this.config.logMigrationOperations
    });
    
    if (this.config.logMigrationOperations) {
      console.log('[Migration Staffing] Configuration updated:', this.config);
    }
  }

  /**
   * Get current migration configuration
   */
  getConfig(): MigrationStaffingConfig {
    return { ...this.config };
  }

  /**
   * Check migration status for staffing business logic
   */
  async checkMigrationStatus(): Promise<{
    migrationMode: boolean;
    usingNewSchema: boolean;
    businessLogicCompatible: boolean;
    tablesMigrated: Record<string, boolean>;
  }> {
    const adapterStatus = await migrationAdapter.checkMigrationStatus();
    const tables = this.getTableNames();

    return {
      migrationMode: this.config.enableMigrationMode,
      usingNewSchema: this.config.useNewSchema,
      businessLogicCompatible: true, // Migration adapter handles compatibility
      tablesMigrated: {
        staff_members: adapterStatus.tablesExist[tables.staffMembers] || false,
        staff_schedules: adapterStatus.tablesExist[tables.staffSchedules] || false,
        staff_availability: adapterStatus.tablesExist[tables.staffAvailability] || false
      }
    };
  }
}

// Factory function
export function createMigrationStaffingBusinessLogic(
  config?: Partial<MigrationStaffingConfig>
): MigrationStaffingBusinessLogic {
  return new MigrationStaffingBusinessLogic(config);
}

// Singleton instance
export const migrationStaffingBusinessLogic = new MigrationStaffingBusinessLogic();