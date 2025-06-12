// lib/validation-schemas.ts
import { z } from 'zod';

// Common validation patterns
export const emailSchema = z.string().email('Invalid email address');
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const urlSchema = z.string().url('Invalid URL format').optional();
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone number format').optional();

// User-related schemas
export const userRoleSchema = z.enum(['staff', 'manager', 'admin']);
export const locationSchema = z.enum(['Northfield', 'Woodbury', 'Burnsville', 'Multiple']);
export const departmentSchema = z.string().min(1, 'Department is required').max(50, 'Department name too long');

export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required').max(100, 'Name too long'),
  relationship: z.string().min(1, 'Relationship is required').max(50, 'Relationship too long'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone number format'),
  email: emailSchema.optional()
});

export const createUserSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  personal_email: emailSchema,
  department: departmentSchema,
  role: userRoleSchema,
  manager_id: uuidSchema.optional(),
  location: locationSchema,
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  phone_number: phoneSchema,
  emergency_contact: emergencyContactSchema.optional()
});

export const updateUserSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Full name too long').optional(),
  department: departmentSchema.optional(),
  role: userRoleSchema.optional(),
  location: locationSchema.optional(),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  phone_number: phoneSchema,
  manager_id: uuidSchema.nullable().optional(),
  is_active: z.boolean().optional(),
  emergency_contact: emergencyContactSchema.optional()
});

// Ticket-related schemas
export const ticketStatusSchema = z.enum(['pending', 'open', 'in_progress', 'completed', 'cancelled']);
export const ticketPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);

export const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description too long'),
  form_type: z.string().min(1, 'Form type is required').max(50, 'Form type too long'),
  form_data: z.record(z.any()),
  priority: ticketPrioritySchema.default('normal'),
  assigned_to: emailSchema.optional(),
  due_date: z.string().datetime('Invalid date format').optional(),
  location: locationSchema.optional(),
  metadata: z.record(z.any()).optional()
});

export const updateTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().min(1, 'Description is required').max(5000, 'Description too long').optional(),
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  assigned_to: emailSchema.nullable().optional(),
  due_date: z.string().datetime('Invalid date format').nullable().optional(),
  location: locationSchema.optional(),
  metadata: z.record(z.any()).optional()
});

export const ticketQuerySchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  assigned_to: z.string().optional(),
  submitter_id: z.string().optional(),
  form_type: z.string().optional(),
  location: z.string().optional(),
  search: z.string().max(200, 'Search term too long').optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'title', 'priority', 'status', 'due_date']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 0, 'Offset must be non-negative').default('0'),
  created_after: z.string().datetime('Invalid date format').optional(),
  created_before: z.string().datetime('Invalid date format').optional(),
  due_after: z.string().datetime('Invalid date format').optional(),
  due_before: z.string().datetime('Invalid date format').optional()
});

// Comment-related schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000, 'Comment too long'),
  is_internal: z.boolean().default(false),
  mentioned_users: z.array(emailSchema).max(10, 'Too many mentions').optional()
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000, 'Comment too long')
});

// Notification-related schemas
export const notificationTypeSchema = z.enum([
  'ticket_assigned',
  'ticket_comment', 
  'ticket_status_change',
  'mention',
  'team_announcement',
  'system',
  'reminder'
]);

export const notificationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
export const entityTypeSchema = z.enum(['ticket', 'comment', 'user', 'form']);

export const createNotificationSchema = z.object({
  user_id: uuidSchema,
  type: notificationTypeSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  priority: notificationPrioritySchema.default('normal'),
  related_entity_type: entityTypeSchema.optional(),
  related_entity_id: uuidSchema.optional(),
  action_url: z.string().max(500, 'URL too long').optional(),
  metadata: z.record(z.any()).optional()
});

export const updateNotificationSchema = z.object({
  read: z.boolean().optional()
});

export const bulkNotificationSchema = z.object({
  operation: z.enum(['mark_read', 'mark_unread', 'delete']),
  notification_ids: z.array(uuidSchema).max(100, 'Too many notification IDs').optional(),
  filters: z.object({
    type: z.string().optional(),
    priority: z.string().optional(),
    older_than: z.string().datetime('Invalid date format').optional(),
    read: z.boolean().optional()
  }).optional()
}).refine(
  data => data.notification_ids || data.filters,
  { message: 'Either notification_ids or filters must be provided' }
).refine(
  data => !(data.notification_ids && data.filters),
  { message: 'Cannot use both notification_ids and filters' }
);

// Form-related schemas
export const formCategorySchema = z.enum(['general', 'hr', 'it', 'facilities', 'training', 'other']);

export const createFormSchema = z.object({
  form_type: z.string()
    .min(1, 'Form type is required')
    .max(50, 'Form type too long')
    .regex(/^[a-z][a-z0-9_]*$/, 'Form type must be lowercase alphanumeric with underscores, starting with a letter'),
  display_name: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  category: formCategorySchema.default('general'),
  form_schema: z.object({}).passthrough(), // JSON Schema validation
  ui_schema: z.object({}).passthrough().optional(),
  workflow_config: z.object({
    statuses: z.array(z.string()).min(1, 'At least one status required'),
    transitions: z.record(z.array(z.string()))
  }).optional(),
  notification_config: z.object({}).passthrough().optional(),
  requires_manager_approval: z.boolean().default(false),
  requires_admin_approval: z.boolean().default(false),
  auto_assign_to: emailSchema.optional(),
  sla_hours: z.number().min(1, 'SLA must be at least 1 hour').max(8760, 'SLA cannot exceed 1 year').optional()
});

export const updateFormSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(100, 'Display name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  category: formCategorySchema.optional(),
  form_schema: z.object({}).passthrough().optional(),
  ui_schema: z.object({}).passthrough().optional(),
  workflow_config: z.object({
    statuses: z.array(z.string()).min(1, 'At least one status required'),
    transitions: z.record(z.array(z.string()))
  }).optional(),
  notification_config: z.object({}).passthrough().optional(),
  is_active: z.boolean().optional(),
  requires_manager_approval: z.boolean().optional(),
  requires_admin_approval: z.boolean().optional(),
  auto_assign_to: emailSchema.nullable().optional(),
  sla_hours: z.number().min(1, 'SLA must be at least 1 hour').max(8760, 'SLA cannot exceed 1 year').nullable().optional()
});

// File attachment schemas
export const fileUploadSchema = z.object({
  file_name: z.string().min(1, 'File name is required').max(255, 'File name too long'),
  file_size: z.number().min(1, 'File must have content').max(50 * 1024 * 1024, 'File too large (max 50MB)'),
  file_type: z.string().min(1, 'File type is required').max(100, 'File type too long'),
  description: z.string().max(500, 'Description too long').optional()
});

// Authentication schemas
export const googleOAuthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional()
});

// Analytics schemas
export const analyticsEventSchema = z.object({
  event_type: z.string().min(1, 'Event type is required').max(50, 'Event type too long'),
  user_id: uuidSchema,
  metadata: z.record(z.any()).optional()
});

// Pagination schemas
export const paginationSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 0, 'Offset must be non-negative').default('0')
});

// Search schemas
export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200, 'Search query too long'),
  type: z.enum(['tickets', 'users', 'comments']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 50, 'Limit must be between 1 and 50').default('20')
});

// Validation helper functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      
      error.errors.forEach(err => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      
      return { success: false, errors };
    }
    
    return { 
      success: false, 
      errors: { _general: ['Validation failed'] }
    };
  }
}

export function validateQuery<T>(schema: z.ZodSchema<T>, query: Record<string, string | string[]>): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  // Convert query parameters to single values (take first if array)
  const normalizedQuery: Record<string, string> = {};
  Object.entries(query).forEach(([key, value]) => {
    normalizedQuery[key] = Array.isArray(value) ? value[0] : value;
  });
  
  return validateRequest(schema, normalizedQuery);
}

// Middleware function for API validation
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (validatedData: T, req: any, res: any) => Promise<void>
) {
  return async (req: any, res: any) => {
    const validation = validateRequest(schema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: validation.errors,
          timestamp: new Date().toISOString(),
          request_id: Math.random().toString(36).substring(7)
        }
      });
    }
    
    return handler(validation.data, req, res);
  };
}

// Query validation middleware
export function withQueryValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (validatedQuery: T, req: any, res: any) => Promise<void>
) {
  return async (req: any, res: any) => {
    const validation = validateQuery(schema, req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'QUERY_VALIDATION_ERROR',
          message: 'Query parameter validation failed',
          details: validation.errors,
          timestamp: new Date().toISOString(),
          request_id: Math.random().toString(36).substring(7)
        }
      });
    }
    
    return handler(validation.data, req, res);
  };
}

// File validation
export function validateFile(file: { name: string; size: number; type: string }): { valid: true } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  
  // File size validation (50MB max)
  if (file.size > 50 * 1024 * 1024) {
    errors.push('File size cannot exceed 50MB');
  }
  
  // File type validation
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-zip-compressed'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  // File name validation
  if (file.name.length > 255) {
    errors.push('File name too long');
  }
  
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar'];
  const hasExtension = dangerousExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  if (hasExtension) {
    errors.push('File type not allowed for security reasons');
  }
  
  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

// Date validation helpers
export function validateDateRange(startDate: string, endDate: string): boolean {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  } catch {
    return false;
  }
}

export function validateFutureDate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date > new Date();
  } catch {
    return false;
  }
}