import { z } from 'zod';
export declare const baseEntitySchema: z.ZodObject<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    updated_at: string;
}, {
    id: string;
    created_at: string;
    updated_at: string;
}>;
export declare const userRoleSchema: z.ZodEnum<["staff", "manager", "superadmin", "pharma_rep", "patient", "vinya_tech"]>;
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    avatar_url: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["staff", "manager", "superadmin", "pharma_rep", "patient", "vinya_tech"]>;
    locations: z.ZodArray<z.ZodString, "many">;
    is_active: z.ZodBoolean;
    last_login: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    role: "staff" | "patient" | "superadmin" | "manager" | "pharma_rep" | "vinya_tech";
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    locations: string[];
    name?: string | undefined;
    metadata?: Record<string, any> | undefined;
    avatar_url?: string | undefined;
    last_login?: string | undefined;
}, {
    id: string;
    role: "staff" | "patient" | "superadmin" | "manager" | "pharma_rep" | "vinya_tech";
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    locations: string[];
    name?: string | undefined;
    metadata?: Record<string, any> | undefined;
    avatar_url?: string | undefined;
    last_login?: string | undefined;
}>;
export declare const createUserSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    avatar_url: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["staff", "manager", "superadmin", "pharma_rep", "patient", "vinya_tech"]>;
    locations: z.ZodArray<z.ZodString, "many">;
    is_active: z.ZodBoolean;
    last_login: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "id" | "created_at" | "updated_at">, "strip", z.ZodTypeAny, {
    role: "staff" | "patient" | "superadmin" | "manager" | "pharma_rep" | "vinya_tech";
    email: string;
    is_active: boolean;
    locations: string[];
    name?: string | undefined;
    metadata?: Record<string, any> | undefined;
    avatar_url?: string | undefined;
    last_login?: string | undefined;
}, {
    role: "staff" | "patient" | "superadmin" | "manager" | "pharma_rep" | "vinya_tech";
    email: string;
    is_active: boolean;
    locations: string[];
    name?: string | undefined;
    metadata?: Record<string, any> | undefined;
    avatar_url?: string | undefined;
    last_login?: string | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    role: z.ZodOptional<z.ZodEnum<["staff", "manager", "superadmin", "pharma_rep", "patient", "vinya_tech"]>>;
    name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    avatar_url: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    last_login: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    role?: "staff" | "patient" | "superadmin" | "manager" | "pharma_rep" | "vinya_tech" | undefined;
    name?: string | undefined;
    email?: string | undefined;
    metadata?: Record<string, any> | undefined;
    is_active?: boolean | undefined;
    locations?: string[] | undefined;
    avatar_url?: string | undefined;
    last_login?: string | undefined;
}, {
    role?: "staff" | "patient" | "superadmin" | "manager" | "pharma_rep" | "vinya_tech" | undefined;
    name?: string | undefined;
    email?: string | undefined;
    metadata?: Record<string, any> | undefined;
    is_active?: boolean | undefined;
    locations?: string[] | undefined;
    avatar_url?: string | undefined;
    last_login?: string | undefined;
}>;
export declare const locationSchema: z.ZodObject<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    name: z.ZodString;
    address: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    zip_code: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    timezone: z.ZodString;
    is_active: z.ZodBoolean;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    state: string;
    city: string;
    address: string;
    zip_code: string;
    timezone: string;
    email?: string | undefined;
    phone?: string | undefined;
    settings?: Record<string, any> | undefined;
}, {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    state: string;
    city: string;
    address: string;
    zip_code: string;
    timezone: string;
    email?: string | undefined;
    phone?: string | undefined;
    settings?: Record<string, any> | undefined;
}>;
export declare const createLocationSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    name: z.ZodString;
    address: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    zip_code: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    timezone: z.ZodString;
    is_active: z.ZodBoolean;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "id" | "created_at" | "updated_at">, "strip", z.ZodTypeAny, {
    name: string;
    is_active: boolean;
    state: string;
    city: string;
    address: string;
    zip_code: string;
    timezone: string;
    email?: string | undefined;
    phone?: string | undefined;
    settings?: Record<string, any> | undefined;
}, {
    name: string;
    is_active: boolean;
    state: string;
    city: string;
    address: string;
    zip_code: string;
    timezone: string;
    email?: string | undefined;
    phone?: string | undefined;
    settings?: Record<string, any> | undefined;
}>;
export declare const updateLocationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    state: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    zip_code: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    is_active?: boolean | undefined;
    settings?: Record<string, any> | undefined;
    state?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
    zip_code?: string | undefined;
    timezone?: string | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    is_active?: boolean | undefined;
    settings?: Record<string, any> | undefined;
    state?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
    zip_code?: string | undefined;
    timezone?: string | undefined;
}>;
export declare const auditLogSchema: z.ZodObject<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    user_id: z.ZodOptional<z.ZodString>;
    action: z.ZodString;
    resource_type: z.ZodString;
    resource_id: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    ip_address: z.ZodOptional<z.ZodString>;
    user_agent: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    action: string;
    created_at: string;
    updated_at: string;
    resource_type: string;
    metadata?: Record<string, any> | undefined;
    user_id?: string | undefined;
    resource_id?: string | undefined;
    ip_address?: string | undefined;
    user_agent?: string | undefined;
}, {
    id: string;
    action: string;
    created_at: string;
    updated_at: string;
    resource_type: string;
    metadata?: Record<string, any> | undefined;
    user_id?: string | undefined;
    resource_id?: string | undefined;
    ip_address?: string | undefined;
    user_agent?: string | undefined;
}>;
export declare const createAuditLogSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    user_id: z.ZodOptional<z.ZodString>;
    action: z.ZodString;
    resource_type: z.ZodString;
    resource_id: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    ip_address: z.ZodOptional<z.ZodString>;
    user_agent: z.ZodOptional<z.ZodString>;
}, "id" | "created_at" | "updated_at">, "strip", z.ZodTypeAny, {
    action: string;
    resource_type: string;
    metadata?: Record<string, any> | undefined;
    user_id?: string | undefined;
    resource_id?: string | undefined;
    ip_address?: string | undefined;
    user_agent?: string | undefined;
}, {
    action: string;
    resource_type: string;
    metadata?: Record<string, any> | undefined;
    user_id?: string | undefined;
    resource_id?: string | undefined;
    ip_address?: string | undefined;
    user_agent?: string | undefined;
}>;
export declare const notificationTypeSchema: z.ZodEnum<["info", "success", "warning", "error", "reminder"]>;
export declare const notificationSchema: z.ZodObject<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    user_id: z.ZodString;
    title: z.ZodString;
    message: z.ZodString;
    type: z.ZodEnum<["info", "success", "warning", "error", "reminder"]>;
    read_at: z.ZodOptional<z.ZodString>;
    action_url: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    title: string;
    id: string;
    type: "error" | "success" | "warning" | "info" | "reminder";
    created_at: string;
    updated_at: string;
    user_id: string;
    metadata?: Record<string, any> | undefined;
    read_at?: string | undefined;
    action_url?: string | undefined;
}, {
    message: string;
    title: string;
    id: string;
    type: "error" | "success" | "warning" | "info" | "reminder";
    created_at: string;
    updated_at: string;
    user_id: string;
    metadata?: Record<string, any> | undefined;
    read_at?: string | undefined;
    action_url?: string | undefined;
}>;
export declare const createNotificationSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    user_id: z.ZodString;
    title: z.ZodString;
    message: z.ZodString;
    type: z.ZodEnum<["info", "success", "warning", "error", "reminder"]>;
    read_at: z.ZodOptional<z.ZodString>;
    action_url: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "id" | "created_at" | "updated_at">, "strip", z.ZodTypeAny, {
    message: string;
    title: string;
    type: "error" | "success" | "warning" | "info" | "reminder";
    user_id: string;
    metadata?: Record<string, any> | undefined;
    read_at?: string | undefined;
    action_url?: string | undefined;
}, {
    message: string;
    title: string;
    type: "error" | "success" | "warning" | "info" | "reminder";
    user_id: string;
    metadata?: Record<string, any> | undefined;
    read_at?: string | undefined;
    action_url?: string | undefined;
}>;
export declare const fileUploadSchema: z.ZodObject<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    user_id: z.ZodString;
    filename: z.ZodString;
    original_name: z.ZodString;
    mime_type: z.ZodString;
    file_size: z.ZodNumber;
    storage_path: z.ZodString;
    public_url: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    is_public: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    filename: string;
    original_name: string;
    mime_type: string;
    file_size: number;
    storage_path: string;
    is_public: boolean;
    metadata?: Record<string, any> | undefined;
    public_url?: string | undefined;
}, {
    id: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    filename: string;
    original_name: string;
    mime_type: string;
    file_size: number;
    storage_path: string;
    is_public: boolean;
    metadata?: Record<string, any> | undefined;
    public_url?: string | undefined;
}>;
export declare const createFileUploadSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    user_id: z.ZodString;
    filename: z.ZodString;
    original_name: z.ZodString;
    mime_type: z.ZodString;
    file_size: z.ZodNumber;
    storage_path: z.ZodString;
    public_url: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    is_public: z.ZodBoolean;
}, "id" | "created_at" | "updated_at">, "strip", z.ZodTypeAny, {
    user_id: string;
    filename: string;
    original_name: string;
    mime_type: string;
    file_size: number;
    storage_path: string;
    is_public: boolean;
    metadata?: Record<string, any> | undefined;
    public_url?: string | undefined;
}, {
    user_id: string;
    filename: string;
    original_name: string;
    mime_type: string;
    file_size: number;
    storage_path: string;
    is_public: boolean;
    metadata?: Record<string, any> | undefined;
    public_url?: string | undefined;
}>;
export declare const inventoryItemSchema: z.ZodObject<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    sku: z.ZodString;
    barcode: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    vendor: z.ZodString;
    unit_price: z.ZodNumber;
    quantity_on_hand: z.ZodNumber;
    reorder_level: z.ZodNumber;
    location_id: z.ZodString;
    is_active: z.ZodBoolean;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    category: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    location_id: string;
    sku: string;
    vendor: string;
    unit_price: number;
    quantity_on_hand: number;
    reorder_level: number;
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    barcode?: string | undefined;
}, {
    id: string;
    name: string;
    category: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    location_id: string;
    sku: string;
    vendor: string;
    unit_price: number;
    quantity_on_hand: number;
    reorder_level: number;
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    barcode?: string | undefined;
}>;
export declare const createInventoryItemSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    sku: z.ZodString;
    barcode: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    vendor: z.ZodString;
    unit_price: z.ZodNumber;
    quantity_on_hand: z.ZodNumber;
    reorder_level: z.ZodNumber;
    location_id: z.ZodString;
    is_active: z.ZodBoolean;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "id" | "created_at" | "updated_at">, "strip", z.ZodTypeAny, {
    name: string;
    category: string;
    is_active: boolean;
    location_id: string;
    sku: string;
    vendor: string;
    unit_price: number;
    quantity_on_hand: number;
    reorder_level: number;
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    barcode?: string | undefined;
}, {
    name: string;
    category: string;
    is_active: boolean;
    location_id: string;
    sku: string;
    vendor: string;
    unit_price: number;
    quantity_on_hand: number;
    reorder_level: number;
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    barcode?: string | undefined;
}>;
export declare const handoutTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    template_type: z.ZodString;
    content: z.ZodString;
    variables: z.ZodArray<z.ZodString, "many">;
    category: z.ZodString;
    is_active: z.ZodBoolean;
    created_by: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    id: string;
    name: string;
    category: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
    template_type: string;
    variables: string[];
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
}, {
    content: string;
    id: string;
    name: string;
    category: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
    template_type: string;
    variables: string[];
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
}>;
export declare const createHandoutTemplateSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    template_type: z.ZodString;
    content: z.ZodString;
    variables: z.ZodArray<z.ZodString, "many">;
    category: z.ZodString;
    is_active: z.ZodBoolean;
    created_by: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "id" | "created_at" | "updated_at">, "strip", z.ZodTypeAny, {
    content: string;
    name: string;
    category: string;
    is_active: boolean;
    created_by: string;
    template_type: string;
    variables: string[];
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
}, {
    content: string;
    name: string;
    category: string;
    is_active: boolean;
    created_by: string;
    template_type: string;
    variables: string[];
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
}>;
export declare const patientSchema: z.ZodObject<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    first_name: z.ZodString;
    last_name: z.ZodString;
    date_of_birth: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    zip_code: z.ZodOptional<z.ZodString>;
    mrn: z.ZodString;
    insurance_info: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    emergency_contact: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    mrn: string;
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    email?: string | undefined;
    metadata?: Record<string, any> | undefined;
    phone?: string | undefined;
    emergency_contact?: Record<string, any> | undefined;
    state?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
    zip_code?: string | undefined;
    insurance_info?: Record<string, any> | undefined;
}, {
    id: string;
    mrn: string;
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    email?: string | undefined;
    metadata?: Record<string, any> | undefined;
    phone?: string | undefined;
    emergency_contact?: Record<string, any> | undefined;
    state?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
    zip_code?: string | undefined;
    insurance_info?: Record<string, any> | undefined;
}>;
export declare const createPatientSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    first_name: z.ZodString;
    last_name: z.ZodString;
    date_of_birth: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    zip_code: z.ZodOptional<z.ZodString>;
    mrn: z.ZodString;
    insurance_info: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    emergency_contact: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "id" | "created_at" | "updated_at">, "strip", z.ZodTypeAny, {
    mrn: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    email?: string | undefined;
    metadata?: Record<string, any> | undefined;
    phone?: string | undefined;
    emergency_contact?: Record<string, any> | undefined;
    state?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
    zip_code?: string | undefined;
    insurance_info?: Record<string, any> | undefined;
}, {
    mrn: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    email?: string | undefined;
    metadata?: Record<string, any> | undefined;
    phone?: string | undefined;
    emergency_contact?: Record<string, any> | undefined;
    state?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
    zip_code?: string | undefined;
    insurance_info?: Record<string, any> | undefined;
}>;
export declare const appointmentStatusSchema: z.ZodEnum<["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]>;
export declare const appointmentSchema: z.ZodObject<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    patient_id: z.ZodString;
    provider_id: z.ZodString;
    location_id: z.ZodString;
    appointment_type: z.ZodString;
    scheduled_at: z.ZodString;
    duration_minutes: z.ZodNumber;
    status: z.ZodEnum<["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]>;
    notes: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "cancelled" | "completed" | "in_progress" | "confirmed" | "scheduled" | "no_show";
    created_at: string;
    updated_at: string;
    location_id: string;
    patient_id: string;
    provider_id: string;
    appointment_type: string;
    scheduled_at: string;
    duration_minutes: number;
    metadata?: Record<string, any> | undefined;
    notes?: string | undefined;
}, {
    id: string;
    status: "cancelled" | "completed" | "in_progress" | "confirmed" | "scheduled" | "no_show";
    created_at: string;
    updated_at: string;
    location_id: string;
    patient_id: string;
    provider_id: string;
    appointment_type: string;
    scheduled_at: string;
    duration_minutes: number;
    metadata?: Record<string, any> | undefined;
    notes?: string | undefined;
}>;
export declare const createAppointmentSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    patient_id: z.ZodString;
    provider_id: z.ZodString;
    location_id: z.ZodString;
    appointment_type: z.ZodString;
    scheduled_at: z.ZodString;
    duration_minutes: z.ZodNumber;
    status: z.ZodEnum<["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]>;
    notes: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "id" | "created_at" | "updated_at">, "strip", z.ZodTypeAny, {
    status: "cancelled" | "completed" | "in_progress" | "confirmed" | "scheduled" | "no_show";
    location_id: string;
    patient_id: string;
    provider_id: string;
    appointment_type: string;
    scheduled_at: string;
    duration_minutes: number;
    metadata?: Record<string, any> | undefined;
    notes?: string | undefined;
}, {
    status: "cancelled" | "completed" | "in_progress" | "confirmed" | "scheduled" | "no_show";
    location_id: string;
    patient_id: string;
    provider_id: string;
    appointment_type: string;
    scheduled_at: string;
    duration_minutes: number;
    metadata?: Record<string, any> | undefined;
    notes?: string | undefined;
}>;
export declare const queryOptionsSchema: z.ZodObject<{
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
    orderBy: z.ZodOptional<z.ZodObject<{
        field: z.ZodString;
        direction: z.ZodEnum<["asc", "desc"]>;
    }, "strip", z.ZodTypeAny, {
        field: string;
        direction: "desc" | "asc";
    }, {
        field: string;
        direction: "desc" | "asc";
    }>>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    offset?: number | undefined;
    orderBy?: {
        field: string;
        direction: "desc" | "asc";
    } | undefined;
    filters?: Record<string, any> | undefined;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
    orderBy?: {
        field: string;
        direction: "desc" | "asc";
    } | undefined;
    filters?: Record<string, any> | undefined;
}>;
export declare const validateOrThrow: <T>(schema: z.ZodSchema<T>, data: unknown) => T;
export declare const validatePartial: (schema: z.ZodObject<any>, data: unknown) => any;
//# sourceMappingURL=validation.d.ts.map