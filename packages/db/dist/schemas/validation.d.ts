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
    locations: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
    email: string;
    role: "staff" | "manager" | "superadmin" | "pharma_rep" | "patient" | "vinya_tech";
    name?: string | undefined;
    avatar_url?: string | undefined;
    last_login?: string | undefined;
    metadata?: Record<string, any> | undefined;
}, {
    id: string;
    locations: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
    email: string;
    role: "staff" | "manager" | "superadmin" | "pharma_rep" | "patient" | "vinya_tech";
    name?: string | undefined;
    avatar_url?: string | undefined;
    last_login?: string | undefined;
    metadata?: Record<string, any> | undefined;
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
    locations: string[];
    is_active: boolean;
    email: string;
    role: "staff" | "manager" | "superadmin" | "pharma_rep" | "patient" | "vinya_tech";
    name?: string | undefined;
    avatar_url?: string | undefined;
    last_login?: string | undefined;
    metadata?: Record<string, any> | undefined;
}, {
    locations: string[];
    is_active: boolean;
    email: string;
    role: "staff" | "manager" | "superadmin" | "pharma_rep" | "patient" | "vinya_tech";
    name?: string | undefined;
    avatar_url?: string | undefined;
    last_login?: string | undefined;
    metadata?: Record<string, any> | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    email: z.ZodOptional<z.ZodString>;
    avatar_url: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    role: z.ZodOptional<z.ZodEnum<["staff", "manager", "superadmin", "pharma_rep", "patient", "vinya_tech"]>>;
    last_login: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "strip", z.ZodTypeAny, {
    locations?: string[] | undefined;
    name?: string | undefined;
    is_active?: boolean | undefined;
    email?: string | undefined;
    avatar_url?: string | undefined;
    role?: "staff" | "manager" | "superadmin" | "pharma_rep" | "patient" | "vinya_tech" | undefined;
    last_login?: string | undefined;
    metadata?: Record<string, any> | undefined;
}, {
    locations?: string[] | undefined;
    name?: string | undefined;
    is_active?: boolean | undefined;
    email?: string | undefined;
    avatar_url?: string | undefined;
    role?: "staff" | "manager" | "superadmin" | "pharma_rep" | "patient" | "vinya_tech" | undefined;
    last_login?: string | undefined;
    metadata?: Record<string, any> | undefined;
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
    address: string;
    city: string;
    state: string;
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
    address: string;
    city: string;
    state: string;
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
    address: string;
    city: string;
    state: string;
    zip_code: string;
    timezone: string;
    email?: string | undefined;
    phone?: string | undefined;
    settings?: Record<string, any> | undefined;
}, {
    name: string;
    is_active: boolean;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    timezone: string;
    email?: string | undefined;
    phone?: string | undefined;
    settings?: Record<string, any> | undefined;
}>;
export declare const updateLocationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    zip_code: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    timezone: z.ZodOptional<z.ZodString>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    is_active?: boolean | undefined;
    email?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    zip_code?: string | undefined;
    phone?: string | undefined;
    timezone?: string | undefined;
    settings?: Record<string, any> | undefined;
}, {
    name?: string | undefined;
    is_active?: boolean | undefined;
    email?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    zip_code?: string | undefined;
    phone?: string | undefined;
    timezone?: string | undefined;
    settings?: Record<string, any> | undefined;
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
    created_at: string;
    updated_at: string;
    action: string;
    resource_type: string;
    user_id?: string | undefined;
    metadata?: Record<string, any> | undefined;
    resource_id?: string | undefined;
    ip_address?: string | undefined;
    user_agent?: string | undefined;
}, {
    id: string;
    created_at: string;
    updated_at: string;
    action: string;
    resource_type: string;
    user_id?: string | undefined;
    metadata?: Record<string, any> | undefined;
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
    user_id?: string | undefined;
    metadata?: Record<string, any> | undefined;
    resource_id?: string | undefined;
    ip_address?: string | undefined;
    user_agent?: string | undefined;
}, {
    action: string;
    resource_type: string;
    user_id?: string | undefined;
    metadata?: Record<string, any> | undefined;
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
    id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    title: string;
    message: string;
    type: "error" | "info" | "success" | "warning" | "reminder";
    metadata?: Record<string, any> | undefined;
    read_at?: string | undefined;
    action_url?: string | undefined;
}, {
    id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    title: string;
    message: string;
    type: "error" | "info" | "success" | "warning" | "reminder";
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
    user_id: string;
    title: string;
    message: string;
    type: "error" | "info" | "success" | "warning" | "reminder";
    metadata?: Record<string, any> | undefined;
    read_at?: string | undefined;
    action_url?: string | undefined;
}, {
    user_id: string;
    title: string;
    message: string;
    type: "error" | "info" | "success" | "warning" | "reminder";
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
    user_id: string;
    created_at: string;
    updated_at: string;
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
    user_id: string;
    created_at: string;
    updated_at: string;
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
    location_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    category: string;
    unit_price: number;
    vendor: string;
    sku: string;
    quantity_on_hand: number;
    reorder_level: number;
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    barcode?: string | undefined;
}, {
    id: string;
    name: string;
    location_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    category: string;
    unit_price: number;
    vendor: string;
    sku: string;
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
    location_id: string;
    is_active: boolean;
    category: string;
    unit_price: number;
    vendor: string;
    sku: string;
    quantity_on_hand: number;
    reorder_level: number;
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
    barcode?: string | undefined;
}, {
    name: string;
    location_id: string;
    is_active: boolean;
    category: string;
    unit_price: number;
    vendor: string;
    sku: string;
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
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
    template_type: string;
    category: string;
    content: string;
    variables: string[];
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
}, {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
    template_type: string;
    category: string;
    content: string;
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
    name: string;
    is_active: boolean;
    created_by: string;
    template_type: string;
    category: string;
    content: string;
    variables: string[];
    metadata?: Record<string, any> | undefined;
    description?: string | undefined;
}, {
    name: string;
    is_active: boolean;
    created_by: string;
    template_type: string;
    category: string;
    content: string;
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
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    mrn: string;
    email?: string | undefined;
    metadata?: Record<string, any> | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    zip_code?: string | undefined;
    phone?: string | undefined;
    emergency_contact?: Record<string, any> | undefined;
    insurance_info?: Record<string, any> | undefined;
}, {
    id: string;
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    mrn: string;
    email?: string | undefined;
    metadata?: Record<string, any> | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    zip_code?: string | undefined;
    phone?: string | undefined;
    emergency_contact?: Record<string, any> | undefined;
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
    first_name: string;
    last_name: string;
    date_of_birth: string;
    mrn: string;
    email?: string | undefined;
    metadata?: Record<string, any> | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    zip_code?: string | undefined;
    phone?: string | undefined;
    emergency_contact?: Record<string, any> | undefined;
    insurance_info?: Record<string, any> | undefined;
}, {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    mrn: string;
    email?: string | undefined;
    metadata?: Record<string, any> | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    zip_code?: string | undefined;
    phone?: string | undefined;
    emergency_contact?: Record<string, any> | undefined;
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
    location_id: string;
    patient_id: string;
    created_at: string;
    updated_at: string;
    status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
    provider_id: string;
    appointment_type: string;
    scheduled_at: string;
    duration_minutes: number;
    metadata?: Record<string, any> | undefined;
    notes?: string | undefined;
}, {
    id: string;
    location_id: string;
    patient_id: string;
    created_at: string;
    updated_at: string;
    status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
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
    location_id: string;
    patient_id: string;
    status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
    provider_id: string;
    appointment_type: string;
    scheduled_at: string;
    duration_minutes: number;
    metadata?: Record<string, any> | undefined;
    notes?: string | undefined;
}, {
    location_id: string;
    patient_id: string;
    status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
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
        direction: "asc" | "desc";
    }, {
        field: string;
        direction: "asc" | "desc";
    }>>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    filters?: Record<string, any> | undefined;
    orderBy?: {
        field: string;
        direction: "asc" | "desc";
    } | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}, {
    filters?: Record<string, any> | undefined;
    orderBy?: {
        field: string;
        direction: "asc" | "desc";
    } | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const validateOrThrow: <T>(schema: z.ZodSchema<T>, data: unknown) => T;
export declare const validatePartial: (schema: z.ZodObject<any>, data: unknown) => any;
