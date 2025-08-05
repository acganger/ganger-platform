import { z } from 'zod';
// Base schemas
export const baseEntitySchema = z.object({
    id: z.string().uuid(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
// User schemas
export const userRoleSchema = z.enum(['staff', 'manager', 'superadmin', 'pharma_rep', 'patient', 'vinya_tech']);
export const userSchema = baseEntitySchema.extend({
    email: z.string().email(),
    name: z.string().optional(),
    avatar_url: z.string().url().optional(),
    role: userRoleSchema,
    locations: z.array(z.string().uuid()),
    is_active: z.boolean(),
    last_login: z.string().datetime().optional(),
    metadata: z.record(z.any()).optional(),
});
export const createUserSchema = userSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
export const updateUserSchema = createUserSchema.partial();
// Location schemas
export const locationSchema = baseEntitySchema.extend({
    name: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zip_code: z.string().regex(/^\d{5}(-\d{4})?$/),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    email: z.string().email().optional(),
    timezone: z.string(),
    is_active: z.boolean(),
    settings: z.record(z.any()).optional(),
});
export const createLocationSchema = locationSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
export const updateLocationSchema = createLocationSchema.partial();
// Audit log schemas
export const auditLogSchema = baseEntitySchema.extend({
    user_id: z.string().uuid().optional(),
    action: z.string().min(1),
    resource_type: z.string().min(1),
    resource_id: z.string().uuid().optional(),
    metadata: z.record(z.any()).optional(),
    ip_address: z.string().ip().optional(),
    user_agent: z.string().optional(),
});
export const createAuditLogSchema = auditLogSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// Notification schemas
export const notificationTypeSchema = z.enum(['info', 'success', 'warning', 'error', 'reminder']);
export const notificationSchema = baseEntitySchema.extend({
    user_id: z.string().uuid(),
    title: z.string().min(1),
    message: z.string().min(1),
    type: notificationTypeSchema,
    read_at: z.string().datetime().optional(),
    action_url: z.string().url().optional(),
    metadata: z.record(z.any()).optional(),
});
export const createNotificationSchema = notificationSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// File upload schemas
export const fileUploadSchema = baseEntitySchema.extend({
    user_id: z.string().uuid(),
    filename: z.string().min(1),
    original_name: z.string().min(1),
    mime_type: z.string(),
    file_size: z.number().positive(),
    storage_path: z.string().min(1),
    public_url: z.string().url().optional(),
    metadata: z.record(z.any()).optional(),
    is_public: z.boolean(),
});
export const createFileUploadSchema = fileUploadSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// Inventory schemas
export const inventoryItemSchema = baseEntitySchema.extend({
    name: z.string().min(1),
    description: z.string().optional(),
    sku: z.string().min(1),
    barcode: z.string().optional(),
    category: z.string().min(1),
    vendor: z.string().min(1),
    unit_price: z.number().nonnegative(),
    quantity_on_hand: z.number().nonnegative(),
    reorder_level: z.number().nonnegative(),
    location_id: z.string().uuid(),
    is_active: z.boolean(),
    metadata: z.record(z.any()).optional(),
});
export const createInventoryItemSchema = inventoryItemSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// Handout template schemas
export const handoutTemplateSchema = baseEntitySchema.extend({
    name: z.string().min(1),
    description: z.string().optional(),
    template_type: z.string().min(1),
    content: z.string().min(1),
    variables: z.array(z.string()),
    category: z.string().min(1),
    is_active: z.boolean(),
    created_by: z.string().uuid(),
    metadata: z.record(z.any()).optional(),
});
export const createHandoutTemplateSchema = handoutTemplateSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// Patient schemas
export const patientSchema = baseEntitySchema.extend({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    date_of_birth: z.string().date(),
    email: z.string().email().optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().length(2).optional(),
    zip_code: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
    mrn: z.string().min(1),
    insurance_info: z.record(z.any()).optional(),
    emergency_contact: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional(),
});
export const createPatientSchema = patientSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// Appointment schemas
export const appointmentStatusSchema = z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']);
export const appointmentSchema = baseEntitySchema.extend({
    patient_id: z.string().uuid(),
    provider_id: z.string().uuid(),
    location_id: z.string().uuid(),
    appointment_type: z.string().min(1),
    scheduled_at: z.string().datetime(),
    duration_minutes: z.number().positive(),
    status: appointmentStatusSchema,
    notes: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});
export const createAppointmentSchema = appointmentSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// Query options schema
export const queryOptionsSchema = z.object({
    limit: z.number().positive().optional(),
    offset: z.number().nonnegative().optional(),
    orderBy: z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc']),
    }).optional(),
    filters: z.record(z.any()).optional(),
});
// Validation helpers
export const validateOrThrow = (schema, data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new Error(`Validation failed: ${result.error.message}`);
    }
    return result.data;
};
export const validatePartial = (schema, data) => {
    const result = schema.partial().safeParse(data);
    return result.success ? result.data : null;
};
