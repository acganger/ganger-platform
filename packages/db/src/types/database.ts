// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      locations: {
        Row: Location;
        Insert: Omit<Location, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at'>>;
      };
      app_configurations: {
        Row: AppConfiguration;
        Insert: Omit<AppConfiguration, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AppConfiguration, 'id' | 'created_at' | 'updated_at'>>;
      };
      app_permissions: {
        Row: AppPermission;
        Insert: Omit<AppPermission, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AppPermission, 'id' | 'created_at' | 'updated_at'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: Partial<Omit<AuditLog, 'id' | 'created_at'>>;
      };
      api_metrics: {
        Row: ApiMetric;
        Insert: Omit<ApiMetric, 'id' | 'created_at'>;
        Update: Partial<Omit<ApiMetric, 'id' | 'created_at'>>;
      };
      staff_members: {
        Row: StaffMember;
        Insert: Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>>;
      };
      staff_availability: {
        Row: StaffAvailability;
        Insert: Omit<StaffAvailability, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<StaffAvailability, 'id' | 'created_at' | 'updated_at'>>;
      };
      staff_schedules: {
        Row: StaffSchedule;
        Insert: Omit<StaffSchedule, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<StaffSchedule, 'id' | 'created_at' | 'updated_at'>>;
      };
      schedule_templates: {
        Row: ScheduleTemplate;
        Insert: Omit<ScheduleTemplate, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ScheduleTemplate, 'id' | 'created_at' | 'updated_at'>>;
      };
      coverage_requirements: {
        Row: CoverageRequirement;
        Insert: Omit<CoverageRequirement, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CoverageRequirement, 'id' | 'created_at' | 'updated_at'>>;
      };
      optimization_runs: {
        Row: OptimizationRun;
        Insert: Omit<OptimizationRun, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OptimizationRun, 'id' | 'created_at' | 'updated_at'>>;
      };
      // Add other tables as needed
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: UserRole;
    };
  };
}

// Shared database types for all applications
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Profile extends BaseEntity {
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  department?: string;
  position?: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
}

export type UserRole = 'staff' | 'admin' | 'guest';

export interface Location extends BaseEntity {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  email?: string;
  timezone: string;
  is_active: boolean;
  settings?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AppConfiguration extends BaseEntity {
  name: string;
  description?: string;
  config?: Record<string, any>;
  is_active: boolean;
}

export interface ApiMetric {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time: number;
  user_id?: string;
  metadata?: Record<string, any>;
  request_count?: number;
  created_at: string;
}

// The actual permissions are stored in app_permissions table
export interface AppPermission extends BaseEntity {
  user_id?: string;
  app_id: string;
  role_name?: string;
  permission_level: 'read' | 'write' | 'admin';
  config_section?: string;
  specific_keys?: string[];
  location_restricted: boolean;
  allowed_locations?: string[];
  is_active: boolean;
  expires_at?: string;
  granted_by?: string;
}

// UserSession table doesn't exist in actual database
// Apps should use Supabase auth session handling instead

export interface FileUpload extends BaseEntity {
  user_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  public_url?: string;
  metadata?: Record<string, any>;
  is_public: boolean;
}

export interface Notification extends BaseEntity {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'reminder';

// Application-specific types that extend base entities
export interface InventoryItem extends BaseEntity {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: string;
  vendor: string;
  unit_price: number;
  quantity_on_hand: number;
  reorder_level: number;
  location_id: string;
  is_active: boolean;
  metadata?: Record<string, any>;
}

export interface HandoutTemplate extends BaseEntity {
  name: string;
  description?: string;
  template_type: string;
  content: string;
  variables: string[];
  category: string;
  is_active: boolean;
  created_by: string;
  metadata?: Record<string, any>;
}

export interface Patient extends BaseEntity {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  mrn: string;
  insurance_info?: Record<string, any>;
  emergency_contact?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface Appointment extends BaseEntity {
  patient_id: string;
  provider_id: string;
  location_id: string;
  appointment_type: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes?: string;
  metadata?: Record<string, any>;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

// Database utility types
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  filters?: Record<string, any>;
}

export interface QueryResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
}

// Clinical Staffing Types
export interface StaffMember extends BaseEntity {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employee_id: string;
  employee_status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  role: 'nurse' | 'medical_assistant' | 'provider' | 'administrator' | 'technician';
  job_title: string;
  base_location_id: string;
  available_locations: string[];
  hire_date: string;
  skills: Array<{ skill: string; proficiency_level: number; certified?: boolean }>;
  certifications: Array<{ name: string; issued_date: string; expiry_date?: string; issuer: string }>;
  performance_score?: number;
  patient_satisfaction_score?: number;
  reliability_score?: number;
  productivity_metrics?: Record<string, any>;
  hourly_rate?: number;
  overtime_rate?: number;
  max_hours_per_week?: number;
  preferred_schedule_type?: 'full_time' | 'part_time' | 'per_diem' | 'contract';
  emergency_contact?: Record<string, any>;
  notes?: string;
  is_active: boolean;
}

export interface StaffAvailability extends BaseEntity {
  staff_member_id: string;
  availability_type: 'regular' | 'request_off' | 'available_extra' | 'blackout';
  day_of_week?: number; // 0-6 for regular availability
  start_time?: string; // HH:MM format
  end_time?: string; // HH:MM format
  specific_date?: string; // For date-specific availability
  date_range_start?: string;
  date_range_end?: string;
  location_id?: string;
  priority: number; // 1-5, higher = more important
  notes?: string;
  is_recurring: boolean;
}

export interface StaffSchedule extends BaseEntity {
  staff_member_id: string;
  location_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  break_duration_minutes?: number;
  position: string;
  assignment_type: 'scheduled' | 'on_call' | 'overtime' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  actual_start_time?: string;
  actual_end_time?: string;
  cost_center?: string;
  billable_hours?: number;
  overtime_hours?: number;
  notes?: string;
  created_by: string;
  last_modified_by?: string;
}

export interface ScheduleTemplate extends BaseEntity {
  name: string;
  description?: string;
  location_id: string;
  template_type: 'weekly' | 'bi_weekly' | 'monthly' | 'seasonal';
  effective_start_date: string;
  effective_end_date?: string;
  schedule_pattern: Array<{
    day_of_week: number;
    shifts: Array<{
      position: string;
      start_time: string;
      end_time: string;
      required_staff_count: number;
      required_skills?: string[];
      min_experience_months?: number;
    }>;
  }>;
  priority: number;
  is_active: boolean;
  created_by: string;
}

export interface CoverageRequirement extends BaseEntity {
  location_id: string;
  position: string;
  date: string;
  start_time: string;
  end_time: string;
  required_staff_count: number;
  current_staff_count: number;
  required_skills?: string[];
  min_experience_months?: number;
  max_overtime_hours?: number;
  cost_center?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'needs_coverage' | 'partially_covered' | 'fully_covered' | 'overstaffed';
  notes?: string;
}

export interface OptimizationRun extends BaseEntity {
  location_id?: string;
  optimization_type: 'schedule_generation' | 'gap_filling' | 'cost_optimization' | 'satisfaction_optimization';
  start_date: string;
  end_date: string;
  parameters: Record<string, any>;
  status: 'started' | 'in_progress' | 'completed' | 'failed' | 'partial';
  progress_percentage: number;
  total_records: number;
  records_processed: number;
  records_created: number;
  errors_encountered: number;
  cost_savings?: number;
  satisfaction_improvement?: number;
  coverage_improvement?: number;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  triggered_by: string;
  error_details?: string;
  optimization_summary?: Record<string, any>;
  affected_records?: string[];
}