import { z } from 'zod';

// Staff Availability Form Schema
export const staffAvailabilitySchema = z.object({
  available_start_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  available_end_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  location_preferences: z
    .array(z.string())
    .min(0, 'Location preferences must be an array'),
  unavailable_dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'))
    .min(0, 'Unavailable dates must be an array'),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
}).refine(data => {
  const start = new Date(`1970-01-01T${data.available_start_time}`);
  const end = new Date(`1970-01-01T${data.available_end_time}`);
  return start < end;
}, {
  message: 'End time must be after start time',
  path: ['available_end_time']
});

// Staff Schedule Schema
export const staffScheduleSchema = z.object({
  staff_member_id: z.string().min(1, 'Staff member ID is required'),
  provider_id: z.string().min(1, 'Provider ID is required'),
  location_id: z.string().min(1, 'Location ID is required'),
  schedule_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']),
  notes: z.string().optional()
});

// API Response Schema
export const apiResponseSchema = <T>(dataSchema: z.ZodSchema<T>) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }).optional(),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      hasMore: z.boolean()
    }).optional()
  }).optional()
});

// Form Validation Helper
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export function validateForm<T>(
  data: unknown, 
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { 
      success: false, 
      errors: { general: 'Validation failed' } 
    };
  }
}

export type StaffAvailabilityForm = z.infer<typeof staffAvailabilitySchema>;
export type StaffScheduleForm = z.infer<typeof staffScheduleSchema>;