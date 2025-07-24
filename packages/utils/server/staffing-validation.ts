import { z } from 'zod';

/**
 * Clinical Staffing Data Validation and Business Logic Utilities
 * 
 * Provides comprehensive validation schemas and business logic functions
 * for the clinical staffing system to ensure data integrity and enforce
 * business rules across all operations.
 */

// ================================================
// BASE VALIDATION SCHEMAS
// ================================================

// Time validation schema (HH:MM:SS format)
const TimeSchema = z.string().regex(
  /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
  'Time must be in HH:MM:SS format'
);

// Date validation schema
const DateSchema = z.string().datetime().or(z.date());

// UUID validation schema
const UUIDSchema = z.string().uuid('Invalid UUID format');

// Days of week schema (0=Sunday, 6=Saturday)
const DaysOfWeekSchema = z.array(z.number().min(0).max(6)).min(1, 'At least one day must be selected');

// Employment status enum
const EmploymentStatusSchema = z.enum(['active', 'inactive', 'on_leave', 'terminated']);

// Schedule type enum
const ScheduleTypeSchema = z.enum(['regular', 'overtime', 'on_call', 'substitute', 'training']);

// Schedule status enum
const ScheduleStatusSchema = z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']);

// Role type enum - aligned with database schema
const RoleTypeSchema = z.enum(['medical_assistant', 'scribe', 'nurse', 'technician', 'nurse_practitioner', 'physician_assistant']);

// Skill level enum
const SkillLevelSchema = z.enum(['entry', 'intermediate', 'advanced', 'expert']);

// ================================================
// STAFF MEMBER VALIDATION SCHEMA
// ================================================

export const StaffMemberSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
  role_type: RoleTypeSchema,
  skill_level: SkillLevelSchema.default('entry'),
  employment_status: EmploymentStatusSchema.default('active'),
  hire_date: DateSchema,
  termination_date: DateSchema.optional(),
  primary_location_id: UUIDSchema,
  additional_locations: z.array(UUIDSchema).default([]),
  department: z.string().min(1, 'Department is required'),
  max_hours_per_week: z.number().min(1, 'Max hours must be positive').max(80, 'Max hours cannot exceed 80').default(40),
  preferred_schedule_type: z.enum(['full_time', 'part_time', 'per_diem', 'flexible']).default('full_time'),
  certification_expiry: DateSchema.optional(),
  emergency_contact: z.string().optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  user_id: UUIDSchema.optional(),
  deputy_user_id: z.string().optional(),
  zenefits_employee_id: z.string().optional()
}).refine(data => {
  // Business rule: Termination date must be after hire date
  if (data.termination_date && data.hire_date) {
    const hireDate = new Date(data.hire_date);
    const termDate = new Date(data.termination_date);
    return termDate > hireDate;
  }
  return true;
}, {
  message: 'Termination date must be after hire date',
  path: ['termination_date']
});

// ================================================
// STAFF SCHEDULE VALIDATION SCHEMA
// ================================================

export const StaffScheduleSchema = z.object({
  staff_member_id: UUIDSchema,
  schedule_date: DateSchema,
  location_id: UUIDSchema,
  shift_start_time: TimeSchema,
  shift_end_time: TimeSchema,
  assigned_providers: z.array(z.string()).default([]),
  schedule_type: ScheduleTypeSchema.default('regular'),
  status: ScheduleStatusSchema.default('scheduled'),
  notes: z.string().max(500, 'Notes too long').optional(),
  deputy_schedule_id: z.string().optional(),
  break_start_time: TimeSchema.optional(),
  break_end_time: TimeSchema.optional(),
  overtime_approved: z.boolean().default(false),
  last_updated_by: UUIDSchema.optional()
}).refine(data => {
  // Business rule: End time must be after start time (without mutating dates)
  const start = new Date(`2000-01-01T${data.shift_start_time}`);
  let end = new Date(`2000-01-01T${data.shift_end_time}`);
  
  // Handle overnight shifts - create new date object
  if (end < start) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
  }
  
  const shiftDurationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  
  // Must be valid time range and not exceed 16 hours
  return end > start && shiftDurationHours <= 16;
}, {
  message: 'Shift end time must be after start time and shift cannot exceed 16 hours',
  path: ['shift_end_time']
}).refine(data => {
  // Business rule: Break times must be within shift hours
  if (data.break_start_time && data.break_end_time) {
    const shiftStart = new Date(`2000-01-01T${data.shift_start_time}`);
    const shiftEnd = new Date(`2000-01-01T${data.shift_end_time}`);
    const breakStart = new Date(`2000-01-01T${data.break_start_time}`);
    const breakEnd = new Date(`2000-01-01T${data.break_end_time}`);
    
    // Handle overnight shifts
    if (shiftEnd < shiftStart) {
      shiftEnd.setDate(shiftEnd.getDate() + 1);
    }
    
    return breakStart >= shiftStart && breakEnd <= shiftEnd && breakEnd > breakStart;
  }
  return true;
}, {
  message: 'Break times must be within shift hours and break end must be after break start',
  path: ['break_end_time']
});

// ================================================
// STAFF AVAILABILITY VALIDATION SCHEMA
// ================================================

export const StaffAvailabilitySchema = z.object({
  staff_member_id: UUIDSchema,
  date_range_start: DateSchema,
  date_range_end: DateSchema,
  days_of_week: DaysOfWeekSchema,
  available_start_time: TimeSchema,
  available_end_time: TimeSchema,
  location_preferences: z.array(UUIDSchema).default([]),
  unavailable_dates: z.array(DateSchema).default([]),
  preferred_providers: z.array(z.string()).default([]),
  max_consecutive_days: z.number().min(1, 'Max consecutive days must be positive').max(14, 'Max consecutive days cannot exceed 14').default(5),
  min_hours_between_shifts: z.number().min(8, 'Minimum 8 hours between shifts required').max(24, 'Hours between shifts cannot exceed 24').default(12),
  overtime_willing: z.boolean().default(false),
  cross_location_willing: z.boolean().default(false),
  notes: z.string().max(500, 'Notes too long').optional(),
  deputy_availability_id: z.string().optional(),
  last_updated_by: UUIDSchema.optional()
}).refine(data => {
  // Business rule: End date must be after start date
  const start = new Date(data.date_range_start);
  const end = new Date(data.date_range_end);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['date_range_end']
}).refine(data => {
  // Business rule: Available end time must be after start time
  const start = new Date(`2000-01-01T${data.available_start_time}`);
  const end = new Date(`2000-01-01T${data.available_end_time}`);
  
  // Handle overnight availability
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  return end > start;
}, {
  message: 'Available end time must be after start time',
  path: ['available_end_time']
}).refine(data => {
  // Business rule: Date range should not exceed 1 year
  const start = new Date(data.date_range_start);
  const end = new Date(data.date_range_end);
  const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff <= 365;
}, {
  message: 'Availability date range cannot exceed 1 year',
  path: ['date_range_end']
});

// ================================================
// PHYSICIAN SUPPORT REQUIREMENTS VALIDATION SCHEMA
// ================================================

export const PhysicianSupportRequirementsSchema = z.object({
  physician_name: z.string().min(1, 'Physician name is required').max(100, 'Physician name too long'),
  physician_id: z.string().min(1, 'Physician ID is required'),
  location_id: UUIDSchema,
  specialty: z.string().min(1, 'Specialty is required'),
  support_staff_count: z.number().min(0, 'Support staff count cannot be negative').max(10, 'Support staff count too high'),
  required_skills: z.array(z.string()).default([]),
  preferred_staff_members: z.array(UUIDSchema).default([]),
  schedule_preferences: z.object({
    preferred_days: DaysOfWeekSchema.optional(),
    preferred_start_time: TimeSchema.optional(),
    preferred_end_time: TimeSchema.optional()
  }).optional(),
  special_requirements: z.string().max(1000, 'Special requirements too long').optional(),
  priority_level: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  effective_start_date: DateSchema,
  effective_end_date: DateSchema.optional(),
  is_active: z.boolean().default(true)
}).refine(data => {
  // Business rule: End date must be after start date
  if (data.effective_end_date) {
    const start = new Date(data.effective_start_date);
    const end = new Date(data.effective_end_date);
    return end > start;
  }
  return true;
}, {
  message: 'Effective end date must be after start date',
  path: ['effective_end_date']
});

// ================================================
// PROVIDER SCHEDULE CACHE VALIDATION SCHEMA
// ================================================

export const ProviderScheduleCacheSchema = z.object({
  provider_id: z.string().min(1, 'Provider ID is required'),
  provider_name: z.string().min(1, 'Provider name is required'),
  location_id: UUIDSchema,
  schedule_date: DateSchema,
  start_time: TimeSchema,
  end_time: TimeSchema,
  appointment_count: z.number().min(0, 'Appointment count cannot be negative').default(0),
  estimated_support_need: z.number().min(0, 'Support need cannot be negative').max(10, 'Support need too high').default(1),
  specialty: z.string().optional(),
  modmed_appointment_id: z.string().optional(),
  sync_status: z.enum(['pending', 'synced', 'failed', 'stale']).default('pending'),
  last_synced_at: DateSchema.optional(),
  sync_error_message: z.string().optional()
}).refine(data => {
  // Business rule: End time must be after start time
  const start = new Date(`2000-01-01T${data.start_time}`);
  const end = new Date(`2000-01-01T${data.end_time}`);
  
  // Handle overnight schedules
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['end_time']
});

// ================================================
// STAFFING OPTIMIZATION RULES VALIDATION SCHEMA
// ================================================

export const StaffingOptimizationRulesSchema = z.object({
  rule_name: z.string().min(1, 'Rule name is required').max(100, 'Rule name too long'),
  rule_type: z.enum(['coverage_ratio', 'skill_matching', 'cost_optimization', 'preference_weighting']),
  location_id: UUIDSchema.optional(), // null for global rules
  rule_parameters: z.record(z.unknown()), // JSON object with rule-specific parameters
  priority: z.number().min(1, 'Priority must be positive').max(100, 'Priority too high').default(50),
  is_active: z.boolean().default(true),
  effective_start_date: DateSchema,
  effective_end_date: DateSchema.optional(),
  created_by: UUIDSchema,
  description: z.string().max(500, 'Description too long').optional()
}).refine(data => {
  // Business rule: End date must be after start date
  if (data.effective_end_date) {
    const start = new Date(data.effective_start_date);
    const end = new Date(data.effective_end_date);
    return end > start;
  }
  return true;
}, {
  message: 'Effective end date must be after start date',
  path: ['effective_end_date']
});

// ================================================
// STAFFING ANALYTICS VALIDATION SCHEMA
// ================================================

export const StaffingAnalyticsSchema = z.object({
  analytics_date: DateSchema,
  location_id: UUIDSchema,
  total_provider_hours: z.number().min(0, 'Provider hours cannot be negative'),
  total_support_hours: z.number().min(0, 'Support hours cannot be negative'),
  optimal_support_hours: z.number().min(0, 'Optimal support hours cannot be negative'),
  coverage_percentage: z.number().min(0, 'Coverage percentage cannot be negative').max(1000, 'Coverage percentage too high'),
  understaffed_periods: z.number().min(0, 'Understaffed periods cannot be negative'),
  overstaffed_periods: z.number().min(0, 'Overstaffed periods cannot be negative'),
  cross_location_assignments: z.number().min(0, 'Cross location assignments cannot be negative'),
  overtime_hours: z.number().min(0, 'Overtime hours cannot be negative'),
  staff_utilization_rate: z.number().min(0, 'Staff utilization rate cannot be negative').max(200, 'Staff utilization rate too high'),
  patient_satisfaction_impact: z.number().min(1, 'Patient satisfaction must be at least 1').max(5, 'Patient satisfaction cannot exceed 5').optional(),
  cost_efficiency_score: z.number().min(0, 'Cost efficiency score cannot be negative').max(100, 'Cost efficiency score cannot exceed 100'),
  optimization_suggestions: z.record(z.unknown()).optional() // JSON object
});

// ================================================
// BUSINESS LOGIC VALIDATION FUNCTIONS
// ================================================

/**
 * Validate staffing data based on type
 */
export async function validateStaffingData(data: any, type: string): Promise<{
  isValid: boolean;
  errors: string[];
  data?: any;
}> {
  try {
    let schema;
    let validatedData;

    switch (type) {
      case 'staff_member':
        schema = StaffMemberSchema;
        break;
      case 'staff_schedule':
        schema = StaffScheduleSchema;
        break;
      case 'staff_availability':
        schema = StaffAvailabilitySchema;
        break;
      case 'physician_support_requirements':
        schema = PhysicianSupportRequirementsSchema;
        break;
      case 'provider_schedule_cache':
        schema = ProviderScheduleCacheSchema;
        break;
      case 'staffing_optimization_rules':
        schema = StaffingOptimizationRulesSchema;
        break;
      case 'staffing_analytics':
        schema = StaffingAnalyticsSchema;
        break;
      default:
        return {
          isValid: false,
          errors: [`Unknown validation type: ${type}`]
        };
    }

    validatedData = schema.parse(data);

    return {
      isValid: true,
      errors: [],
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }

    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Business rule: Check for schedule conflicts
 */
export function validateScheduleConflicts(
  newSchedule: any,
  existingSchedules: any[]
): { hasConflicts: boolean; conflicts: string[] } {
  const conflicts: string[] = [];
  const newStart = new Date(`${newSchedule.schedule_date}T${newSchedule.shift_start_time}`);
  const newEnd = new Date(`${newSchedule.schedule_date}T${newSchedule.shift_end_time}`);

  // Handle overnight shifts
  if (newEnd < newStart) {
    newEnd.setDate(newEnd.getDate() + 1);
  }

  for (const existingSchedule of existingSchedules) {
    if (existingSchedule.id === newSchedule.id) continue; // Skip self when updating

    const existingStart = new Date(`${existingSchedule.schedule_date}T${existingSchedule.shift_start_time}`);
    const existingEnd = new Date(`${existingSchedule.schedule_date}T${existingSchedule.shift_end_time}`);

    // Handle overnight shifts
    if (existingEnd < existingStart) {
      existingEnd.setDate(existingEnd.getDate() + 1);
    }

    // Check for overlap
    if (newStart < existingEnd && existingStart < newEnd) {
      conflicts.push(
        `Schedule conflicts with existing schedule from ${existingSchedule.shift_start_time} to ${existingSchedule.shift_end_time}`
      );
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  };
}

/**
 * Business rule: Validate maximum working hours per day/week
 */
export function validateWorkingHoursLimits(
  staffMemberId: string,
  newSchedule: any,
  existingSchedules: any[]
): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  // Calculate hours for the new schedule
  const newStart = new Date(`2000-01-01T${newSchedule.shift_start_time}`);
  const newEnd = new Date(`2000-01-01T${newSchedule.shift_end_time}`);
  if (newEnd < newStart) newEnd.setDate(newEnd.getDate() + 1);
  
  const newScheduleHours = (newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60);

  // Check daily hour limits (16 hours max per day)
  if (newScheduleHours > 16) {
    violations.push(`Single shift cannot exceed 16 hours (${newScheduleHours.toFixed(1)} hours scheduled)`);
  }

  // Check for same-day schedules
  const sameDaySchedules = existingSchedules.filter((schedule: any) => 
    schedule.staff_member_id === staffMemberId &&
    schedule.schedule_date.toDateString() === new Date(newSchedule.schedule_date).toDateString() &&
    schedule.id !== newSchedule.id
  );

  const totalDailyHours = sameDaySchedules.reduce((total: number, schedule: any) => {
    const start = new Date(`2000-01-01T${schedule.shift_start_time}`);
    const end = new Date(`2000-01-01T${schedule.shift_end_time}`);
    if (end < start) end.setDate(end.getDate() + 1);
    return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0) + newScheduleHours;

  if (totalDailyHours > 16) {
    violations.push(`Total daily hours cannot exceed 16 hours (${totalDailyHours.toFixed(1)} hours scheduled)`);
  }

  // Check weekly hour limits (get week's schedules)
  const scheduleDate = new Date(newSchedule.schedule_date);
  const weekStart = new Date(scheduleDate);
  weekStart.setDate(scheduleDate.getDate() - scheduleDate.getDay());
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weeklySchedules = existingSchedules.filter((schedule: any) =>
    schedule.staff_member_id === staffMemberId &&
    new Date(schedule.schedule_date) >= weekStart &&
    new Date(schedule.schedule_date) <= weekEnd &&
    schedule.id !== newSchedule.id
  );

  const totalWeeklyHours = weeklySchedules.reduce((total: number, schedule: any) => {
    const start = new Date(`2000-01-01T${schedule.shift_start_time}`);
    const end = new Date(`2000-01-01T${schedule.shift_end_time}`);
    if (end < start) end.setDate(end.getDate() + 1);
    return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0) + newScheduleHours;

  if (totalWeeklyHours > 60) {
    violations.push(`Total weekly hours cannot exceed 60 hours (${totalWeeklyHours.toFixed(1)} hours scheduled)`);
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Business rule: Validate minimum rest time between shifts
 */
export function validateRestTimeBetweenShifts(
  staffMemberId: string,
  newSchedule: any,
  existingSchedules: any[]
): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];
  const minRestHours = 12; // Minimum 12 hours between shifts

  const newStart = new Date(`${newSchedule.schedule_date}T${newSchedule.shift_start_time}`);
  const newEnd = new Date(`${newSchedule.schedule_date}T${newSchedule.shift_end_time}`);
  if (newEnd < newStart) newEnd.setDate(newEnd.getDate() + 1);

  // Check schedules within 24 hours before and after
  const dayBefore = new Date(newStart);
  dayBefore.setDate(dayBefore.getDate() - 1);
  
  const dayAfter = new Date(newStart);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const nearbySchedules = existingSchedules.filter((schedule: any) =>
    schedule.staff_member_id === staffMemberId &&
    new Date(schedule.schedule_date) >= dayBefore &&
    new Date(schedule.schedule_date) <= dayAfter &&
    schedule.id !== newSchedule.id
  );

  for (const schedule of nearbySchedules) {
    const scheduleStart = new Date(`${schedule.schedule_date}T${schedule.shift_start_time}`);
    const scheduleEnd = new Date(`${schedule.schedule_date}T${schedule.shift_end_time}`);
    if (scheduleEnd < scheduleStart) scheduleEnd.setDate(scheduleEnd.getDate() + 1);

    // Check rest time before new schedule
    const restTimeBefore = (newStart.getTime() - scheduleEnd.getTime()) / (1000 * 60 * 60);
    if (restTimeBefore > 0 && restTimeBefore < minRestHours) {
      violations.push(
        `Insufficient rest time before shift (${restTimeBefore.toFixed(1)} hours, minimum ${minRestHours} required)`
      );
    }

    // Check rest time after new schedule
    const restTimeAfter = (scheduleStart.getTime() - newEnd.getTime()) / (1000 * 60 * 60);
    if (restTimeAfter > 0 && restTimeAfter < minRestHours) {
      violations.push(
        `Insufficient rest time after shift (${restTimeAfter.toFixed(1)} hours, minimum ${minRestHours} required)`
      );
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Business rule: Validate staff availability alignment
 */
export function validateAvailabilityAlignment(
  schedule: any,
  availability: any[]
): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];
  const scheduleDate = new Date(schedule.schedule_date);
  const dayOfWeek = scheduleDate.getDay();

  // Find relevant availability records
  const relevantAvailability = availability.filter((avail: any) =>
    new Date(avail.date_range_start) <= scheduleDate &&
    new Date(avail.date_range_end) >= scheduleDate &&
    avail.days_of_week.includes(dayOfWeek)
  );

  if (relevantAvailability.length === 0) {
    violations.push('Staff member has no availability for this day');
    return { isValid: false, violations };
  }

  // Check if schedule time falls within available hours
  const scheduleStart = new Date(`2000-01-01T${schedule.shift_start_time}`);
  const scheduleEnd = new Date(`2000-01-01T${schedule.shift_end_time}`);

  let timeAligned = false;
  for (const avail of relevantAvailability) {
    const availStart = new Date(`2000-01-01T${avail.available_start_time}`);
    const availEnd = new Date(`2000-01-01T${avail.available_end_time}`);
    
    if (scheduleStart >= availStart && scheduleEnd <= availEnd) {
      timeAligned = true;
      break;
    }
  }

  if (!timeAligned) {
    violations.push('Schedule time does not align with staff availability');
  }

  // Check for unavailable dates
  const unavailableDates = relevantAvailability.flatMap(avail => 
    avail.unavailable_dates?.map((date: any) => new Date(date).toDateString()) || []
  );

  if (unavailableDates.includes(scheduleDate.toDateString())) {
    violations.push('Staff member is unavailable on this date');
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Comprehensive business rule validation for schedules
 */
export async function validateScheduleBusinessRules(
  schedule: any,
  existingSchedules: any[],
  availability: any[]
): Promise<{ isValid: boolean; violations: string[] }> {
  const allViolations: string[] = [];

  // 1. Check for conflicts
  const conflictCheck = validateScheduleConflicts(schedule, existingSchedules);
  if (conflictCheck.hasConflicts) {
    allViolations.push(...conflictCheck.conflicts);
  }

  // 2. Check working hours limits
  const hoursCheck = validateWorkingHoursLimits(schedule.staff_member_id, schedule, existingSchedules);
  if (!hoursCheck.isValid) {
    allViolations.push(...hoursCheck.violations);
  }

  // 3. Check rest time between shifts
  const restCheck = validateRestTimeBetweenShifts(schedule.staff_member_id, schedule, existingSchedules);
  if (!restCheck.isValid) {
    allViolations.push(...restCheck.violations);
  }

  // 4. Check availability alignment
  const availabilityCheck = validateAvailabilityAlignment(schedule, availability);
  if (!availabilityCheck.isValid) {
    allViolations.push(...availabilityCheck.violations);
  }

  return {
    isValid: allViolations.length === 0,
    violations: allViolations
  };
}

// ================================================
// EXPORT VALIDATION SCHEMAS AND TYPES
// ================================================

export type StaffMember = z.infer<typeof StaffMemberSchema>;
export type StaffSchedule = z.infer<typeof StaffScheduleSchema>;
export type StaffAvailability = z.infer<typeof StaffAvailabilitySchema>;
export type PhysicianSupportRequirements = z.infer<typeof PhysicianSupportRequirementsSchema>;
export type ProviderScheduleCache = z.infer<typeof ProviderScheduleCacheSchema>;
export type StaffingOptimizationRules = z.infer<typeof StaffingOptimizationRulesSchema>;
export type StaffingAnalytics = z.infer<typeof StaffingAnalyticsSchema>;

export {
  TimeSchema,
  DateSchema,
  UUIDSchema,
  DaysOfWeekSchema,
  EmploymentStatusSchema,
  ScheduleTypeSchema,
  ScheduleStatusSchema,
  RoleTypeSchema,
  SkillLevelSchema
};