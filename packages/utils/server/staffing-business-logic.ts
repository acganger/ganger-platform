import { db } from '@ganger/db';
import { auditLog } from '@ganger/utils/server';

/**
 * Clinical Staffing Business Logic Utilities
 * 
 * Provides complex business logic functions for the clinical staffing system
 * including calculations, optimizations, and workflow automation.
 */

// ================================================
// TYPES AND INTERFACES
// ================================================

interface StaffingMetrics {
  totalProviderHours: number;
  totalSupportHours: number;
  optimalSupportHours: number;
  coveragePercentage: number;
  utilizationRate: number;
  costEfficiencyScore: number;
  overtimeHours: number;
  understaffedPeriods: number;
  overstaffedPeriods: number;
}

interface OptimizationSuggestion {
  type: 'coverage' | 'cost' | 'efficiency' | 'preference';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  impact: string;
  action: string;
  estimatedImprovement?: number;
  affectedStaff?: string[];
  implementationCost?: number;
}

interface SchedulingConstraints {
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  minRestHours: number;
  maxConsecutiveDays: number;
  preferredShiftLength: number;
  allowOvertimeThreshold: number;
}

interface LocationCapacity {
  locationId: string;
  maxStaff: number;
  requiredSkills: string[];
  operatingHours: { start: string; end: string };
  daysOfOperation: number[];
}

// ================================================
// STAFFING CALCULATION UTILITIES
// ================================================

/**
 * Calculate optimal staffing levels based on provider schedules and requirements
 */
export async function calculateOptimalStaffing(
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
  try {
    // Get support requirements for providers
    const supportRequirements = await db.query(`
      SELECT * FROM physician_support_requirements 
      WHERE location_id = $1 
        AND is_active = true 
        AND effective_start_date <= $2 
        AND (effective_end_date IS NULL OR effective_end_date >= $3)
    `, [locationId, date, date]);

    // Create 30-minute time slots
    const timeSlots = generateTimeSlots('07:00:00', '19:00:00', 30);
    const timeSlotRequirements = [];
    const allRequiredSkills = new Set<string>();

    for (const slot of timeSlots) {
      let requiredStaff = 0;
      const slotSkills = new Set<string>();

      // Check which providers are working during this slot
      for (const schedule of providerSchedules) {
        if (timeOverlaps(schedule.start_time, schedule.end_time, slot.start, slot.end)) {
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
    const optimalStaffCount = Math.max(...timeSlotRequirements.map((slot: any) => slot.requiredStaff), 0);

    return {
      optimalStaffCount,
      requiredSkills: Array.from(allRequiredSkills),
      timeSlotRequirements
    };
  } catch (error) {
    console.error('Failed to calculate optimal staffing:', error);
    throw error;
  }
}

/**
 * Calculate staffing metrics for a specific day and location
 */
export async function calculateStaffingMetrics(
  locationId: string,
  date: Date
): Promise<StaffingMetrics> {
  try {
    // Get provider schedules
    const providerSchedules = await db.query(`
      SELECT * FROM provider_schedules_cache 
      WHERE location_id = $1 AND schedule_date = $2
    `, [locationId, date]);

    // Get staff schedules
    const staffSchedules = await db.query(`
      SELECT ss.*, sm.max_hours_per_week, sm.role_type,
             sm.first_name, sm.last_name
      FROM staff_schedules ss
      JOIN staff_members sm ON ss.staff_member_id = sm.id
      WHERE ss.location_id = $1 
        AND ss.schedule_date = $2 
        AND ss.status != 'cancelled'
    `, [locationId, date]);

    // Calculate total provider hours
    const totalProviderHours = providerSchedules.reduce((total: number, schedule: any) => {
      return total + calculateHoursBetween(schedule.start_time, schedule.end_time);
    }, 0);

    // Calculate total support hours
    const totalSupportHours = staffSchedules.reduce((total: number, schedule: any) => {
      return total + calculateHoursBetween(schedule.shift_start_time, schedule.shift_end_time);
    }, 0);

    // Calculate optimal support hours
    const optimalStaffing = await calculateOptimalStaffing(locationId, date, providerSchedules);
    const optimalSupportHours = optimalStaffing.timeSlotRequirements.reduce((total: number, slot: any) => {
      const slotDuration = calculateHoursBetween(slot.startTime, slot.endTime);
      return total + (slot.requiredStaff * slotDuration);
    }, 0);

    // Calculate coverage percentage
    const coveragePercentage = optimalSupportHours > 0 
      ? (totalSupportHours / optimalSupportHours) * 100 
      : 100;

    // Calculate utilization rate
    const totalAvailableHours = staffSchedules.reduce((total: number, schedule: any) => {
      const dailyMax = (schedule.staff_member.max_hours_per_week || 40) / 5;
      return total + dailyMax;
    }, 0);

    const utilizationRate = totalAvailableHours > 0 
      ? (totalSupportHours / totalAvailableHours) * 100 
      : 0;

    // Calculate overtime hours
    const overtimeHours = staffSchedules.reduce((total: number, schedule: any) => {
      const scheduledHours = calculateHoursBetween(schedule.shift_start_time, schedule.shift_end_time);
      const regularHours = 8; // Standard 8-hour shift
      return total + Math.max(0, scheduledHours - regularHours);
    }, 0);

    // Analyze staffing periods
    const { understaffedPeriods, overstaffedPeriods } = analyzeStaffingPeriods(
      providerSchedules,
      staffSchedules,
      optimalStaffing.timeSlotRequirements
    );

    // Calculate cost efficiency score
    const costEfficiencyScore = calculateCostEfficiencyScore({
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
    console.error('Failed to calculate staffing metrics:', error);
    throw error;
  }
}

/**
 * Generate time slots for analysis
 */
function generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number): Array<{ start: string; end: string }> {
  const slots = [];
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

/**
 * Check if two time periods overlap
 */
function timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Calculate hours between two time strings
 */
function calculateHoursBetween(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  // Handle overnight shifts
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

/**
 * Analyze staffing periods for gaps and overstaffing
 */
function analyzeStaffingPeriods(
  providerSchedules: any[],
  staffSchedules: any[],
  requirements: any[]
): { understaffedPeriods: number; overstaffedPeriods: number } {
  let understaffedPeriods = 0;
  let overstaffedPeriods = 0;

  for (const requirement of requirements) {
    const staffInSlot = staffSchedules.filter((schedule: any) =>
      timeOverlaps(schedule.shift_start_time, schedule.shift_end_time, requirement.startTime, requirement.endTime)
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

/**
 * Calculate cost efficiency score
 */
function calculateCostEfficiencyScore(metrics: {
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

// ================================================
// SCHEDULE OPTIMIZATION UTILITIES
// ================================================

/**
 * Generate optimization suggestions for staffing
 */
export async function generateOptimizationSuggestions(
  locationId: string,
  date: Date,
  metrics: StaffingMetrics
): Promise<OptimizationSuggestion[]> {
  const suggestions: OptimizationSuggestion[] = [];

  try {
    // Coverage optimization
    if (metrics.coveragePercentage < 90) {
      suggestions.push({
        type: 'coverage',
        priority: metrics.coveragePercentage < 75 ? 'urgent' : 'high',
        description: `Coverage is ${metrics.coveragePercentage.toFixed(1)}%, below optimal threshold`,
        impact: 'Improved patient care and provider satisfaction',
        action: 'Add additional staff during understaffed periods',
        estimatedImprovement: 100 - metrics.coveragePercentage,
        implementationCost: estimateAdditionalStaffCost(metrics.optimalSupportHours - metrics.totalSupportHours)
      });
    }

    // Overtime reduction
    if (metrics.overtimeHours > 5) {
      suggestions.push({
        type: 'cost',
        priority: metrics.overtimeHours > 15 ? 'high' : 'medium',
        description: `${metrics.overtimeHours.toFixed(1)} hours of overtime scheduled`,
        impact: 'Reduced labor costs and improved work-life balance',
        action: 'Redistribute hours or hire additional part-time staff',
        estimatedImprovement: metrics.overtimeHours * 0.5, // 50% overtime premium savings
        implementationCost: estimateRecruitmentCost()
      });
    }

    // Efficiency optimization
    if (metrics.costEfficiencyScore < 70) {
      suggestions.push({
        type: 'efficiency',
        priority: 'medium',
        description: `Cost efficiency score is ${metrics.costEfficiencyScore.toFixed(1)}%`,
        impact: 'Better resource utilization and cost control',
        action: 'Optimize schedule patterns and reduce waste',
        estimatedImprovement: 85 - metrics.costEfficiencyScore
      });
    }

    // Understaffing alerts
    if (metrics.understaffedPeriods > 5) {
      const understaffedStaff = await getUnderstaffedPeriodStaff(locationId, date);
      suggestions.push({
        type: 'coverage',
        priority: 'high',
        description: `${metrics.understaffedPeriods} time periods are understaffed`,
        impact: 'Improved coverage and reduced provider stress',
        action: 'Adjust shift times or add staff during peak periods',
        affectedStaff: understaffedStaff,
        estimatedImprovement: metrics.understaffedPeriods * 2
      });
    }

    // Preference optimization
    const preferenceOptimization = await analyzePreferenceOptimization(locationId, date);
    if (preferenceOptimization.improvementPotential > 10) {
      suggestions.push({
        type: 'preference',
        priority: 'low',
        description: 'Staff preference alignment can be improved',
        impact: 'Higher staff satisfaction and retention',
        action: 'Adjust schedules to better match staff preferences',
        estimatedImprovement: preferenceOptimization.improvementPotential,
        affectedStaff: preferenceOptimization.affectedStaff
      });
    }

    // Sort suggestions by priority
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return suggestions;
  } catch (error) {
    console.error('Failed to generate optimization suggestions:', error);
    return [];
  }
}

/**
 * Estimate cost of additional staff hours
 */
function estimateAdditionalStaffCost(additionalHours: number): number {
  const averageHourlyRate = 25; // Base hourly rate
  return additionalHours * averageHourlyRate;
}

/**
 * Estimate recruitment cost
 */
function estimateRecruitmentCost(): number {
  return 2500; // Average recruitment cost per hire
}

/**
 * Get staff members affected by understaffed periods
 */
async function getUnderstaffedPeriodStaff(locationId: string, date: Date): Promise<string[]> {
  try {
    const staffSchedules = await db.query(`
      SELECT ss.*, sm.first_name, sm.last_name
      FROM staff_schedules ss
      JOIN staff_members sm ON ss.staff_member_id = sm.id
      WHERE ss.location_id = $1 
        AND ss.schedule_date = $2 
        AND ss.status != 'cancelled'
    `, [locationId, date]);

    return staffSchedules.map((schedule: any) => 
      `${schedule.staff_member.first_name} ${schedule.staff_member.last_name}`
    );
  } catch (error) {
    console.error('Failed to get understaffed period staff:', error);
    return [];
  }
}

/**
 * Analyze staff preference optimization potential
 */
async function analyzePreferenceOptimization(locationId: string, date: Date): Promise<{
  improvementPotential: number;
  affectedStaff: string[];
}> {
  try {
    // Get staff schedules and their availability preferences
    const schedules = await db.query(`
      SELECT ss.*, sm.first_name, sm.last_name
      FROM staff_schedules ss
      JOIN staff_members sm ON ss.staff_member_id = sm.id
      WHERE ss.location_id = $1 
        AND ss.schedule_date = $2 
        AND ss.status != 'cancelled'
    `, [locationId, date]);

    const availability = await db.query(`
      SELECT sa.*, sm.first_name, sm.last_name
      FROM staff_availability sa
      JOIN staff_members sm ON sa.staff_member_id = sm.id
      WHERE sa.date_range_start <= $1 
        AND sa.date_range_end >= $2 
        AND $3 = ANY(sa.days_of_week)
    `, [date, date, date.getDay()]);

    let misalignedCount = 0;
    const affectedStaff: string[] = [];

    for (const schedule of schedules) {
      const staffAvailability = availability.find((avail: any) => 
        avail.staff_member_id === schedule.staff_member_id
      );

      if (staffAvailability) {
        // Check if scheduled time aligns with preferred time
        const scheduleStart = new Date(`2000-01-01T${schedule.shift_start_time}`);
        const preferredStart = new Date(`2000-01-01T${staffAvailability.available_start_time}`);
        
        const timeDifference = Math.abs(scheduleStart.getTime() - preferredStart.getTime()) / (1000 * 60 * 60);
        
        if (timeDifference > 2) { // More than 2 hours difference
          misalignedCount++;
          affectedStaff.push(`${schedule.staff_member.first_name} ${schedule.staff_member.last_name}`);
        }

        // Check location preferences
        if (staffAvailability.location_preferences.length > 0 && 
            !staffAvailability.location_preferences.includes(locationId)) {
          misalignedCount++;
          if (!affectedStaff.includes(`${schedule.staff_member.first_name} ${schedule.staff_member.last_name}`)) {
            affectedStaff.push(`${schedule.staff_member.first_name} ${schedule.staff_member.last_name}`);
          }
        }
      }
    }

    const improvementPotential = schedules.length > 0 
      ? (misalignedCount / schedules.length) * 100 
      : 0;

    return {
      improvementPotential,
      affectedStaff
    };
  } catch (error) {
    console.error('Failed to analyze preference optimization:', error);
    return {
      improvementPotential: 0,
      affectedStaff: []
    };
  }
}

// ================================================
// WORKFLOW AUTOMATION UTILITIES
// ================================================

/**
 * Auto-approve schedules based on business rules
 */
export async function autoApproveSchedules(
  schedules: any[],
  userId: string
): Promise<{ approved: string[]; rejected: string[]; reasons: Record<string, string> }> {
  const approved: string[] = [];
  const rejected: string[] = [];
  const reasons: Record<string, string> = {};

  try {
    for (const schedule of schedules) {
      let shouldApprove = true;
      let rejectionReason = '';

      // Check if staff member is available
      const availabilityResult = await db.query(`
        SELECT * FROM staff_availability 
        WHERE staff_member_id = $1 
          AND date_range_start <= $2 
          AND date_range_end >= $3 
          AND $4 = ANY(days_of_week)
        LIMIT 1
      `, [schedule.staff_member_id, new Date(schedule.schedule_date), new Date(schedule.schedule_date), new Date(schedule.schedule_date).getDay()]);
      const availability = availabilityResult.length > 0 ? availabilityResult[0] : null;

      if (!availability) {
        shouldApprove = false;
        rejectionReason = 'Staff member not available on this day';
      }

      // Check for conflicts
      if (shouldApprove) {
        const conflicts = await db.query(`
          SELECT * FROM staff_schedules 
          WHERE staff_member_id = $1 
            AND schedule_date = $2 
            AND status IN ('scheduled', 'confirmed', 'in_progress') 
            AND id != $3
        `, [schedule.staff_member_id, new Date(schedule.schedule_date), schedule.id]);

        if (conflicts.length > 0) {
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

        const weeklySchedules = await db.query(`
          SELECT * FROM staff_schedules 
          WHERE staff_member_id = $1 
            AND schedule_date >= $2 
            AND schedule_date <= $3 
            AND status IN ('scheduled', 'confirmed', 'in_progress') 
            AND id != $4
        `, [schedule.staff_member_id, weekStart, weekEnd, schedule.id]);

        const totalWeeklyHours = weeklySchedules.reduce((total: number, s: any) => {
          return total + calculateHoursBetween(s.shift_start_time, s.shift_end_time);
        }, 0) + calculateHoursBetween(schedule.shift_start_time, schedule.shift_end_time);

        if (totalWeeklyHours > 60) {
          shouldApprove = false;
          rejectionReason = `Weekly hour limit exceeded (${totalWeeklyHours.toFixed(1)} hours)`;
        }
      }

      if (shouldApprove) {
        // Auto-approve the schedule
        await db.query(`
          UPDATE staff_schedules 
          SET status = 'confirmed', last_updated_by = $1, updated_at = NOW() 
          WHERE id = $2
        `, [userId, schedule.id]);

        approved.push(schedule.id);

        // Audit log
        await auditLog({
          action: 'schedule_auto_approved',
          userId,
          resourceType: 'staff_schedule',
          resourceId: schedule.id,
          metadata: {
            staff_member_id: schedule.staff_member_id,
            schedule_date: schedule.schedule_date,
            auto_approval_rules: 'availability_check,conflict_check,hour_limit_check'
          }
        });
      } else {
        rejected.push(schedule.id);
        reasons[schedule.id] = rejectionReason;

        // Audit log
        await auditLog({
          action: 'schedule_auto_rejected',
          userId,
          resourceType: 'staff_schedule',
          resourceId: schedule.id,
          metadata: {
            staff_member_id: schedule.staff_member_id,
            schedule_date: schedule.schedule_date,
            rejection_reason: rejectionReason
          }
        });
      }
    }

    return { approved, rejected, reasons };
  } catch (error) {
    console.error('Failed to auto-approve schedules:', error);
    throw error;
  }
}

/**
 * Calculate shift premium based on time and conditions
 */
export function calculateShiftPremium(
  schedule: any,
  baseHourlyRate: number
): { basePay: number; premiumPay: number; totalPay: number; premiumFactors: string[] } {
  const shiftHours = calculateHoursBetween(schedule.shift_start_time, schedule.shift_end_time);
  let premiumMultiplier = 1.0;
  const premiumFactors: string[] = [];

  // Night shift premium (10 PM - 6 AM)
  const shiftStart = new Date(`2000-01-01T${schedule.shift_start_time}`);
  const nightStart = new Date('2000-01-01T22:00:00');
  const nightEnd = new Date('2000-01-02T06:00:00');

  if (shiftStart >= nightStart || shiftStart <= new Date('2000-01-01T06:00:00')) {
    premiumMultiplier += 0.15; // 15% night premium
    premiumFactors.push('Night Shift (+15%)');
  }

  // Weekend premium
  const scheduleDate = new Date(schedule.schedule_date);
  const dayOfWeek = scheduleDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
    premiumMultiplier += 0.10; // 10% weekend premium
    premiumFactors.push('Weekend (+10%)');
  }

  // Holiday premium (would need holiday calendar)
  // premiumMultiplier += 0.25; // 25% holiday premium

  // Overtime premium
  if (shiftHours > 8) {
    const overtimeHours = shiftHours - 8;
    const regularPay = 8 * baseHourlyRate * premiumMultiplier;
    const overtimePay = overtimeHours * baseHourlyRate * (premiumMultiplier + 0.5); // Time and a half
    
    premiumFactors.push(`Overtime (${overtimeHours.toFixed(1)}h at 1.5x)`);
    
    return {
      basePay: 8 * baseHourlyRate,
      premiumPay: regularPay - (8 * baseHourlyRate) + overtimePay - (overtimeHours * baseHourlyRate),
      totalPay: regularPay + overtimePay,
      premiumFactors
    };
  }

  const basePay = shiftHours * baseHourlyRate;
  const totalPay = shiftHours * baseHourlyRate * premiumMultiplier;
  const premiumPay = totalPay - basePay;

  return {
    basePay,
    premiumPay,
    totalPay,
    premiumFactors
  };
}

/**
 * Generate staffing forecast for future dates
 */
export async function generateStaffingForecast(
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
  try {
    const forecast = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Get historical data for same day of week
      const dayOfWeek = currentDate.getDay();
      const ninetyDaysAgo = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      const historicalData = await db.query(`
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

        const factors = [];
        
        // Day of week factor
        if (dayOfWeek === 1) factors.push('Monday (typically high demand)');
        if (dayOfWeek === 5) factors.push('Friday (typically high demand)');
        if (dayOfWeek === 0 || dayOfWeek === 6) factors.push('Weekend (typically lower demand)');

        // Seasonal factors (simplified)
        const month = currentDate.getMonth();
        if (month >= 5 && month <= 7) factors.push('Summer season (typically higher demand)');
        if (month === 11 || month === 0) factors.push('Holiday season (variable demand)');

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
          factors: ['No historical data available']
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return forecast;
  } catch (error) {
    console.error('Failed to generate staffing forecast:', error);
    throw error;
  }
}

// Functions already exported above, no need to re-export