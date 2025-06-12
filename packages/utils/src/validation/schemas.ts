import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');

export const phoneSchema = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  'Invalid phone number format'
);

export const zipCodeSchema = z.string().regex(
  /^\d{5}(-\d{4})?$/,
  'Invalid ZIP code format'
);

export const stateSchema = z.string().length(2, 'State must be 2 characters');

export const mrnSchema = z.string().min(1, 'MRN is required');

export const dateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
);

export const timeSchema = z.string().regex(
  /^\d{2}:\d{2}(:\d{2})?$/,
  'Time must be in HH:MM or HH:MM:SS format'
);

export const datetimeSchema = z.string().datetime('Invalid datetime format');

export const urlSchema = z.string().url('Invalid URL format');

export const uuidSchema = z.string().uuid('Invalid UUID format');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^\w\s]/, 'Password must contain at least one special character');

// Currency validation
export const currencySchema = z
  .number()
  .nonnegative('Amount must be non-negative')
  .multipleOf(0.01, 'Amount must be a valid currency value');

// File validation
export const fileTypeSchema = z.enum([
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

export const fileSizeSchema = z
  .number()
  .positive('File size must be positive')
  .max(10 * 1024 * 1024, 'File size must be less than 10MB');

// Medication validation
export const dosageSchema = z.string().regex(
  /^\d+(\.\d+)?\s*(mg|g|ml|L|units?|tabs?|capsules?|drops?|sprays?)$/i,
  'Invalid dosage format (e.g., "10 mg", "2 tabs")'
);

export const frequencySchema = z.string().regex(
  /^(once|twice|\d+\s*times?)\s*(daily|per day|a day|weekly|per week|monthly|per month|as needed|PRN)$/i,
  'Invalid frequency format (e.g., "twice daily", "3 times per day")'
);

// Location validation
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Search validation
export const searchQuerySchema = z
  .string()
  .min(2, 'Search query must be at least 2 characters')
  .max(100, 'Search query must be less than 100 characters');

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Inventory validation
export const skuSchema = z.string().regex(
  /^[A-Z0-9\-_]{3,20}$/,
  'SKU must be 3-20 characters, alphanumeric with hyphens and underscores only'
);

export const barcodeSchema = z.string().regex(
  /^\d{8,14}$/,
  'Barcode must be 8-14 digits'
);

export const quantitySchema = z
  .number()
  .int()
  .nonnegative('Quantity must be non-negative');

// Template validation
export const templateVariableSchema = z.string().regex(
  /^{{[a-zA-Z][a-zA-Z0-9_]*}}$/,
  'Template variable must be in format {{variableName}}'
);

// Insurance validation
export const insuranceIdSchema = z.string().regex(
  /^[A-Z0-9]{6,15}$/,
  'Insurance ID must be 6-15 alphanumeric characters'
);

// Appointment validation
export const appointmentDurationSchema = z
  .number()
  .int()
  .positive()
  .min(15, 'Appointment must be at least 15 minutes')
  .max(480, 'Appointment cannot exceed 8 hours');

// Custom validation helpers
export const createOptionalSchema = <T extends z.ZodTypeAny>(schema: T) => {
  return schema.optional().or(z.literal('').transform(() => undefined));
};

export const createRequiredSchema = <T extends z.ZodTypeAny>(schema: T, message: string) => {
  return schema.refine(val => val !== undefined && val !== null && val !== '', {
    message,
  });
};

// Conditional validation
export const createConditionalSchema = <T extends z.ZodTypeAny>(
  condition: (data: any) => boolean,
  schema: T,
  fallback: z.ZodTypeAny = z.any()
) => {
  return z.any().superRefine((data, ctx) => {
    if (condition(data)) {
      const result = schema.safeParse(data);
      if (!result.success) {
        result.error.errors.forEach(error => {
          ctx.addIssue(error);
        });
      }
    } else {
      const result = fallback.safeParse(data);
      if (!result.success) {
        result.error.errors.forEach(error => {
          ctx.addIssue(error);
        });
      }
    }
  });
};

// Business-specific validation
export const businessHoursSchema = z.object({
  start: timeSchema,
  end: timeSchema,
  timezone: z.string(),
}).refine(
  data => {
    const start = new Date(`1970-01-01T${data.start}`);
    const end = new Date(`1970-01-01T${data.end}`);
    return start < end;
  },
  {
    message: 'Start time must be before end time',
  }
);