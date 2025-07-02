// lib/validation-schemas.ts
import { z } from 'zod';

// Validation helper functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown) {
  try {
    const result = schema.parse(data);
    return { success: true as const, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(err.message);
      });
      return { success: false as const, errors };
    }
    return { success: false as const, errors: { general: ['Validation failed'] } };
  }
}

export function validateQuery<T>(schema: z.ZodSchema<T>, query: Partial<{ [key: string]: string | string[] }>) {
  try {
    // Convert query parameters to proper types
    const processedQuery: Record<string, any> = {};
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return;
      
      if (Array.isArray(value)) {
        processedQuery[key] = value[0]; // Take first value for simplicity
      } else {
        // Try to convert string values to appropriate types
        if (value === 'true') processedQuery[key] = true;
        else if (value === 'false') processedQuery[key] = false;
        else if (!isNaN(Number(value)) && value !== '') processedQuery[key] = Number(value);
        else processedQuery[key] = value;
      }
    });
    
    const result = schema.parse(processedQuery);
    return { success: true as const, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(err.message);
      });
      return { success: false as const, errors };
    }
    return { success: false as const, errors: { general: ['Query validation failed'] } };
  }
}

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
  employee_id: z.string().min(1, 'Employee ID is required').max(20, 'Employee ID too long'),
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  full_name: z.string().min(1, 'Full name is required').max(100, 'Full name too long'),
  email: emailSchema,
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

export const userQuerySchema = z.object({
  department: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  is_active: z.boolean().optional(),
  search: z.string().max(200, 'Search term too long').optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'full_name', 'email', 'hire_date']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0),
  hired_after: z.string().optional(),
  hired_before: z.string().optional()
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
  completed_at: z.string().datetime('Invalid date format').nullable().optional(),
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
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
  due_after: z.string().optional(),
  due_before: z.string().optional()
});

// Comment-related schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000, 'Comment too long'),
  ticket_id: uuidSchema,
  is_internal: z.boolean().default(false),
  mentioned_users: z.array(emailSchema).max(10, 'Too many mentions').optional()
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000, 'Comment too long'),
  is_internal: z.boolean().optional()
});

export const commentQuerySchema = z.object({
  ticket_id: uuidSchema.optional(),
  is_internal: z.boolean().optional(),
  author_id: uuidSchema.optional(),
  search: z.string().max(200, 'Search term too long').optional(),
  sort_by: z.enum(['created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0),
  created_after: z.string().optional(),
  created_before: z.string().optional()
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
  metadata: z.record(z.any()).optional(),
  category: z.string().optional(),
  expires_at: z.string().datetime('Invalid date format').optional()
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

export const notificationQuerySchema = z.object({
  type: notificationTypeSchema.optional(),
  priority: notificationPrioritySchema.optional(),
  read: z.boolean().optional(),
  user_id: uuidSchema.optional(),
  search: z.string().max(200, 'Search term too long').optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'priority']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
  category: z.string().optional(),
  related_entity_type: entityTypeSchema.optional(),
  related_entity_id: uuidSchema.optional(),
  include_unread_count: z.boolean().optional()
});

// Form-related schemas
export const formCategorySchema = z.enum([
  'general',
  'hr', 
  'it_support',
  'maintenance',
  'supplies',
  'time_off'
]);

export const createFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  display_name: z.string().min(1, 'Display name is required').max(200, 'Display name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: formCategorySchema,
  is_active: z.boolean().default(true),
  fields: z.record(z.any()),
  notification_emails: z.array(emailSchema).max(10, 'Too many notification emails').optional(),
  approval_required: z.boolean().default(false),
  auto_assign_to: emailSchema.optional(),
  metadata: z.record(z.any()).optional()
});

export const updateFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  display_name: z.string().min(1, 'Display name is required').max(200, 'Display name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  category: formCategorySchema.optional(),
  is_active: z.boolean().optional(),
  fields: z.record(z.any()).optional(),
  notification_emails: z.array(emailSchema).max(10, 'Too many notification emails').optional(),
  approval_required: z.boolean().optional(),
  auto_assign_to: emailSchema.nullable().optional(),
  metadata: z.record(z.any()).optional()
});

export const formQuerySchema = z.object({
  category: formCategorySchema.optional(),
  is_active: z.boolean().optional(),
  search: z.string().max(200, 'Search term too long').optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'display_name']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
  created_by: z.string().optional(),
  include_inactive: z.boolean().optional()
});

// Attachment-related schemas
export const createAttachmentSchema = z.object({
  ticket_id: uuidSchema,
  original_filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  file_size: z.number().min(1, 'File size must be positive'),
  mime_type: z.string().min(1, 'MIME type is required').max(100, 'MIME type too long'),
  is_internal: z.boolean().default(false),
  description: z.string().max(500, 'Description too long').optional()
});