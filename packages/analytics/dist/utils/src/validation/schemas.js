import { z } from 'zod';
/**
 * Email validation schema
 * Validates email addresses using Zod's built-in email validator
 * @example
 * const result = emailSchema.parse('user@gangerdermatology.com'); // Valid
 * const invalid = emailSchema.parse('invalid-email'); // Throws ZodError
 */
export const emailSchema = z.string().email('Invalid email address');
/**
 * Phone number validation schema
 * Validates international phone numbers (E.164 format)
 * Accepts optional '+' prefix followed by 1-15 digits
 * @example
 * phoneSchema.parse('+14155552671'); // Valid
 * phoneSchema.parse('14155552671'); // Valid
 * phoneSchema.parse('415-555-2671'); // Invalid (contains dashes)
 */
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');
/**
 * ZIP code validation schema
 * Validates US ZIP codes in 5-digit or ZIP+4 format
 * @example
 * zipCodeSchema.parse('12345'); // Valid
 * zipCodeSchema.parse('12345-6789'); // Valid
 * zipCodeSchema.parse('1234'); // Invalid
 */
export const zipCodeSchema = z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format');
/**
 * US state code validation schema
 * Validates 2-character state abbreviations
 * @example
 * stateSchema.parse('MI'); // Valid
 * stateSchema.parse('Michigan'); // Invalid
 */
export const stateSchema = z.string().length(2, 'State must be 2 characters');
/**
 * Medical Record Number (MRN) validation schema
 * Ensures MRN is a non-empty string
 * @example
 * mrnSchema.parse('MRN123456'); // Valid
 * mrnSchema.parse(''); // Invalid
 */
export const mrnSchema = z.string().min(1, 'MRN is required');
/**
 * Date validation schema
 * Validates dates in ISO 8601 format (YYYY-MM-DD)
 * @example
 * dateSchema.parse('2025-07-12'); // Valid
 * dateSchema.parse('07/12/2025'); // Invalid
 */
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');
/**
 * Time validation schema
 * Validates time in 24-hour format (HH:MM or HH:MM:SS)
 * @example
 * timeSchema.parse('14:30'); // Valid
 * timeSchema.parse('14:30:45'); // Valid
 * timeSchema.parse('2:30 PM'); // Invalid
 */
export const timeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be in HH:MM or HH:MM:SS format');
/**
 * DateTime validation schema
 * Validates ISO 8601 datetime strings with timezone
 * @example
 * datetimeSchema.parse('2025-07-12T14:30:00Z'); // Valid
 * datetimeSchema.parse('2025-07-12T14:30:00-04:00'); // Valid
 */
export const datetimeSchema = z.string().datetime('Invalid datetime format');
/**
 * URL validation schema
 * Validates fully qualified URLs
 * @example
 * urlSchema.parse('https://gangerdermatology.com'); // Valid
 * urlSchema.parse('gangerdermatology.com'); // Invalid (no protocol)
 */
export const urlSchema = z.string().url('Invalid URL format');
/**
 * UUID validation schema
 * Validates UUID v4 format
 * @example
 * uuidSchema.parse('550e8400-e29b-41d4-a716-446655440000'); // Valid
 * uuidSchema.parse('not-a-uuid'); // Invalid
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');
/**
 * Password validation schema
 * Enforces strong password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * @example
 * passwordSchema.parse('SecureP@ss123'); // Valid
 * passwordSchema.parse('password'); // Invalid (no uppercase, number, or special char)
 */
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[^\w\s]/, 'Password must contain at least one special character');
/**
 * Currency validation schema
 * Validates monetary amounts with up to 2 decimal places
 * @example
 * currencySchema.parse(99.99); // Valid
 * currencySchema.parse(100); // Valid
 * currencySchema.parse(-10); // Invalid (negative)
 * currencySchema.parse(99.999); // Invalid (too many decimals)
 */
export const currencySchema = z
    .number()
    .nonnegative('Amount must be non-negative')
    .multipleOf(0.01, 'Amount must be a valid currency value');
/**
 * File type validation schema
 * Validates allowed MIME types for file uploads
 * Supported types: JPEG, PNG, GIF, PDF, TXT, CSV, XLSX, XLS
 * @example
 * fileTypeSchema.parse('image/jpeg'); // Valid
 * fileTypeSchema.parse('application/pdf'); // Valid
 * fileTypeSchema.parse('video/mp4'); // Invalid
 */
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
/**
 * File size validation schema
 * Validates file size in bytes (max 10MB)
 * @example
 * fileSizeSchema.parse(1024); // Valid (1KB)
 * fileSizeSchema.parse(5 * 1024 * 1024); // Valid (5MB)
 * fileSizeSchema.parse(11 * 1024 * 1024); // Invalid (>10MB)
 */
export const fileSizeSchema = z
    .number()
    .positive('File size must be positive')
    .max(10 * 1024 * 1024, 'File size must be less than 10MB');
/**
 * Medication dosage validation schema
 * Validates dosage strings with amount and unit
 * Supported units: mg, g, ml, L, units, tabs, capsules, drops, sprays
 * @example
 * dosageSchema.parse('10 mg'); // Valid
 * dosageSchema.parse('2.5 ml'); // Valid
 * dosageSchema.parse('1 tab'); // Valid
 * dosageSchema.parse('10mg'); // Invalid (no space)
 */
export const dosageSchema = z.string().regex(/^\d+(\.\d+)?\s*(mg|g|ml|L|units?|tabs?|capsules?|drops?|sprays?)$/i, 'Invalid dosage format (e.g., "10 mg", "2 tabs")');
/**
 * Medication frequency validation schema
 * Validates medication frequency instructions
 * @example
 * frequencySchema.parse('twice daily'); // Valid
 * frequencySchema.parse('3 times per day'); // Valid
 * frequencySchema.parse('once weekly'); // Valid
 * frequencySchema.parse('as needed'); // Valid
 * frequencySchema.parse('every day'); // Invalid
 */
export const frequencySchema = z.string().regex(/^(once|twice|\d+\s*times?)\s*(daily|per day|a day|weekly|per week|monthly|per month|as needed|PRN)$/i, 'Invalid frequency format (e.g., "twice daily", "3 times per day")');
/**
 * Geographic coordinates validation schema
 * Validates latitude (-90 to 90) and longitude (-180 to 180)
 * @example
 * coordinatesSchema.parse({ latitude: 42.8864, longitude: -85.5228 }); // Valid (Grand Rapids, MI)
 * coordinatesSchema.parse({ latitude: 91, longitude: 0 }); // Invalid (latitude out of range)
 */
export const coordinatesSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});
/**
 * Search query validation schema
 * Validates search input strings (2-100 characters)
 * @example
 * searchQuerySchema.parse('dermatology'); // Valid
 * searchQuerySchema.parse('a'); // Invalid (too short)
 */
export const searchQuerySchema = z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be less than 100 characters');
/**
 * Pagination parameters validation schema
 * Validates pagination, sorting, and limit parameters
 * @example
 * paginationSchema.parse({ page: 1, limit: 20 }); // Valid
 * paginationSchema.parse({ page: 2, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }); // Valid
 * paginationSchema.parse({ page: 0 }); // Invalid (page must be positive)
 */
export const paginationSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
/**
 * Stock Keeping Unit (SKU) validation schema
 * Validates inventory SKU format (3-20 chars, uppercase alphanumeric with - and _)
 * @example
 * skuSchema.parse('DERM-001'); // Valid
 * skuSchema.parse('SUPPLY_2023_A'); // Valid
 * skuSchema.parse('ab'); // Invalid (too short)
 */
export const skuSchema = z.string().regex(/^[A-Z0-9\-_]{3,20}$/, 'SKU must be 3-20 characters, alphanumeric with hyphens and underscores only');
/**
 * Barcode validation schema
 * Validates barcode format (8-14 digits)
 * Supports UPC-A (12), EAN-13 (13), and other common formats
 * @example
 * barcodeSchema.parse('123456789012'); // Valid (UPC-A)
 * barcodeSchema.parse('1234567890123'); // Valid (EAN-13)
 * barcodeSchema.parse('1234567'); // Invalid (too short)
 */
export const barcodeSchema = z.string().regex(/^\d{8,14}$/, 'Barcode must be 8-14 digits');
/**
 * Inventory quantity validation schema
 * Validates whole number quantities (0 or positive)
 * @example
 * quantitySchema.parse(100); // Valid
 * quantitySchema.parse(0); // Valid
 * quantitySchema.parse(-5); // Invalid
 * quantitySchema.parse(10.5); // Invalid (not integer)
 */
export const quantitySchema = z
    .number()
    .int()
    .nonnegative('Quantity must be non-negative');
/**
 * Template variable validation schema
 * Validates Handlebars-style template variables
 * @example
 * templateVariableSchema.parse('{{patientName}}'); // Valid
 * templateVariableSchema.parse('{{appointment_date}}'); // Valid
 * templateVariableSchema.parse('{patientName}'); // Invalid (single braces)
 * templateVariableSchema.parse('{{123name}}'); // Invalid (starts with number)
 */
export const templateVariableSchema = z.string().regex(/^{{[a-zA-Z][a-zA-Z0-9_]*}}$/, 'Template variable must be in format {{variableName}}');
/**
 * Insurance ID validation schema
 * Validates insurance member/policy ID format
 * @example
 * insuranceIdSchema.parse('ABC123456'); // Valid
 * insuranceIdSchema.parse('XYZ987654321'); // Valid
 * insuranceIdSchema.parse('ABC-123'); // Invalid (contains dash)
 */
export const insuranceIdSchema = z.string().regex(/^[A-Z0-9]{6,15}$/, 'Insurance ID must be 6-15 alphanumeric characters');
/**
 * Appointment duration validation schema
 * Validates appointment duration in minutes (15 min to 8 hours)
 * @example
 * appointmentDurationSchema.parse(30); // Valid (30 minutes)
 * appointmentDurationSchema.parse(60); // Valid (1 hour)
 * appointmentDurationSchema.parse(10); // Invalid (too short)
 * appointmentDurationSchema.parse(500); // Invalid (too long)
 */
export const appointmentDurationSchema = z
    .number()
    .int()
    .positive()
    .min(15, 'Appointment must be at least 15 minutes')
    .max(480, 'Appointment cannot exceed 8 hours');
/**
 * Creates an optional schema that treats empty strings as undefined
 * Useful for form fields where empty strings should be considered "no value"
 * @param schema - The base Zod schema to make optional
 * @returns A schema that accepts the original type, undefined, or empty string
 * @example
 * const optionalEmail = createOptionalSchema(emailSchema);
 * optionalEmail.parse('user@example.com'); // Valid email
 * optionalEmail.parse(''); // Transforms to undefined
 * optionalEmail.parse(undefined); // Valid undefined
 */
export const createOptionalSchema = (schema) => {
    return schema.optional().or(z.literal('').transform(() => undefined));
};
/**
 * Creates a required schema that rejects undefined, null, and empty strings
 * More strict than Zod's built-in required validation
 * @param schema - The base Zod schema to make required
 * @param message - Custom error message for validation failure
 * @returns A schema that requires a non-empty value
 * @example
 * const requiredName = createRequiredSchema(z.string(), 'Name is required');
 * requiredName.parse('John'); // Valid
 * requiredName.parse(''); // Invalid with custom message
 */
export const createRequiredSchema = (schema, message) => {
    return schema.refine(val => val !== undefined && val !== null && val !== '', {
        message,
    });
};
/**
 * Creates a conditional validation schema
 * Applies different validation rules based on a condition function
 * @param condition - Function that determines which schema to use
 * @param schema - Schema to use when condition is true
 * @param fallback - Schema to use when condition is false (defaults to z.any())
 * @returns A schema that validates conditionally
 * @example
 * const conditionalAge = createConditionalSchema(
 *   (data) => data.isAdult,
 *   z.number().min(18),
 *   z.number().max(17)
 * );
 */
export const createConditionalSchema = (condition, schema, fallback = z.any()) => {
    return z.any().superRefine((data, ctx) => {
        if (condition(data)) {
            const result = schema.safeParse(data);
            if (!result.success) {
                result.error.errors.forEach(error => {
                    ctx.addIssue(error);
                });
            }
        }
        else {
            const result = fallback.safeParse(data);
            if (!result.success) {
                result.error.errors.forEach(error => {
                    ctx.addIssue(error);
                });
            }
        }
    });
};
/**
 * Business hours validation schema
 * Validates business operating hours with timezone
 * Ensures start time is before end time
 * @example
 * businessHoursSchema.parse({
 *   start: '08:00',
 *   end: '17:00',
 *   timezone: 'America/New_York'
 * }); // Valid
 * businessHoursSchema.parse({
 *   start: '17:00',
 *   end: '08:00',
 *   timezone: 'America/New_York'
 * }); // Invalid (start after end)
 */
export const businessHoursSchema = z.object({
    start: timeSchema,
    end: timeSchema,
    timezone: z.string(),
}).refine(data => {
    const start = new Date(`1970-01-01T${data.start}`);
    const end = new Date(`1970-01-01T${data.end}`);
    return start < end;
}, {
    message: 'Start time must be before end time',
});
