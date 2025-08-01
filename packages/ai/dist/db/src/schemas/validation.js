"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePartial = exports.validateOrThrow = exports.queryOptionsSchema = exports.createAppointmentSchema = exports.appointmentSchema = exports.appointmentStatusSchema = exports.createPatientSchema = exports.patientSchema = exports.createHandoutTemplateSchema = exports.handoutTemplateSchema = exports.createInventoryItemSchema = exports.inventoryItemSchema = exports.createFileUploadSchema = exports.fileUploadSchema = exports.createNotificationSchema = exports.notificationSchema = exports.notificationTypeSchema = exports.createAuditLogSchema = exports.auditLogSchema = exports.updateLocationSchema = exports.createLocationSchema = exports.locationSchema = exports.updateUserSchema = exports.createUserSchema = exports.userSchema = exports.userRoleSchema = exports.baseEntitySchema = void 0;
const zod_1 = require("zod");
// Base schemas
exports.baseEntitySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    created_at: zod_1.z.string().datetime(),
    updated_at: zod_1.z.string().datetime(),
});
// User schemas
exports.userRoleSchema = zod_1.z.enum(['staff', 'manager', 'superadmin', 'pharma_rep', 'patient', 'vinya_tech']);
exports.userSchema = exports.baseEntitySchema.extend({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().optional(),
    avatar_url: zod_1.z.string().url().optional(),
    role: exports.userRoleSchema,
    locations: zod_1.z.array(zod_1.z.string().uuid()),
    is_active: zod_1.z.boolean(),
    last_login: zod_1.z.string().datetime().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.createUserSchema = exports.userSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
exports.updateUserSchema = exports.createUserSchema.partial();
// Location schemas
exports.locationSchema = exports.baseEntitySchema.extend({
    name: zod_1.z.string().min(1),
    address: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    state: zod_1.z.string().length(2),
    zip_code: zod_1.z.string().regex(/^\d{5}(-\d{4})?$/),
    phone: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    email: zod_1.z.string().email().optional(),
    timezone: zod_1.z.string(),
    is_active: zod_1.z.boolean(),
    settings: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.createLocationSchema = exports.locationSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
exports.updateLocationSchema = exports.createLocationSchema.partial();
// Audit log schemas
exports.auditLogSchema = exports.baseEntitySchema.extend({
    user_id: zod_1.z.string().uuid().optional(),
    action: zod_1.z.string().min(1),
    resource_type: zod_1.z.string().min(1),
    resource_id: zod_1.z.string().uuid().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    ip_address: zod_1.z.string().ip().optional(),
    user_agent: zod_1.z.string().optional(),
});
exports.createAuditLogSchema = exports.auditLogSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// Notification schemas
exports.notificationTypeSchema = zod_1.z.enum(['info', 'success', 'warning', 'error', 'reminder']);
exports.notificationSchema = exports.baseEntitySchema.extend({
    user_id: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1),
    message: zod_1.z.string().min(1),
    type: exports.notificationTypeSchema,
    read_at: zod_1.z.string().datetime().optional(),
    action_url: zod_1.z.string().url().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.createNotificationSchema = exports.notificationSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// File upload schemas
exports.fileUploadSchema = exports.baseEntitySchema.extend({
    user_id: zod_1.z.string().uuid(),
    filename: zod_1.z.string().min(1),
    original_name: zod_1.z.string().min(1),
    mime_type: zod_1.z.string(),
    file_size: zod_1.z.number().positive(),
    storage_path: zod_1.z.string().min(1),
    public_url: zod_1.z.string().url().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    is_public: zod_1.z.boolean(),
});
exports.createFileUploadSchema = exports.fileUploadSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// Inventory schemas
exports.inventoryItemSchema = exports.baseEntitySchema.extend({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    sku: zod_1.z.string().min(1),
    barcode: zod_1.z.string().optional(),
    category: zod_1.z.string().min(1),
    vendor: zod_1.z.string().min(1),
    unit_price: zod_1.z.number().nonnegative(),
    quantity_on_hand: zod_1.z.number().nonnegative(),
    reorder_level: zod_1.z.number().nonnegative(),
    location_id: zod_1.z.string().uuid(),
    is_active: zod_1.z.boolean(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.createInventoryItemSchema = exports.inventoryItemSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// Handout template schemas
exports.handoutTemplateSchema = exports.baseEntitySchema.extend({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    template_type: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
    variables: zod_1.z.array(zod_1.z.string()),
    category: zod_1.z.string().min(1),
    is_active: zod_1.z.boolean(),
    created_by: zod_1.z.string().uuid(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.createHandoutTemplateSchema = exports.handoutTemplateSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// Patient schemas
exports.patientSchema = exports.baseEntitySchema.extend({
    first_name: zod_1.z.string().min(1),
    last_name: zod_1.z.string().min(1),
    date_of_birth: zod_1.z.string().date(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().length(2).optional(),
    zip_code: zod_1.z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
    mrn: zod_1.z.string().min(1),
    insurance_info: zod_1.z.record(zod_1.z.any()).optional(),
    emergency_contact: zod_1.z.record(zod_1.z.any()).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.createPatientSchema = exports.patientSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// Appointment schemas
exports.appointmentStatusSchema = zod_1.z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']);
exports.appointmentSchema = exports.baseEntitySchema.extend({
    patient_id: zod_1.z.string().uuid(),
    provider_id: zod_1.z.string().uuid(),
    location_id: zod_1.z.string().uuid(),
    appointment_type: zod_1.z.string().min(1),
    scheduled_at: zod_1.z.string().datetime(),
    duration_minutes: zod_1.z.number().positive(),
    status: exports.appointmentStatusSchema,
    notes: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.createAppointmentSchema = exports.appointmentSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});
// Query options schema
exports.queryOptionsSchema = zod_1.z.object({
    limit: zod_1.z.number().positive().optional(),
    offset: zod_1.z.number().nonnegative().optional(),
    orderBy: zod_1.z.object({
        field: zod_1.z.string(),
        direction: zod_1.z.enum(['asc', 'desc']),
    }).optional(),
    filters: zod_1.z.record(zod_1.z.any()).optional(),
});
// Validation helpers
const validateOrThrow = (schema, data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new Error(`Validation failed: ${result.error.message}`);
    }
    return result.data;
};
exports.validateOrThrow = validateOrThrow;
const validatePartial = (schema, data) => {
    const result = schema.partial().safeParse(data);
    return result.success ? result.data : null;
};
exports.validatePartial = validatePartial;
