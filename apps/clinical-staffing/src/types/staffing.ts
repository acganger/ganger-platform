// Clinical Staffing Types
// Following @ganger/types pattern with application-specific extensions

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'medical_assistant' | 'nurse' | 'technician' | 'administrative';
  certifications: string[];
  availability_start_time: string;
  availability_end_time: string;
  location_preferences: string[];
  skills: string[];
  hourly_rate?: number;
  max_hours_per_week?: number;
  unavailable_dates: string[];
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  name: string;
  title: string;
  specialty: string;
  location_id: string;
  start_time: string;
  end_time: string;
  days_of_week: number[]; // 0 = Sunday, 1 = Monday, etc.
  requires_staff_count: number;
  preferred_staff_roles: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffSchedule {
  id: string;
  staff_member_id: string;
  provider_id: string;
  location_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  role: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Populated relationships
  staff_member?: StaffMember;
  provider?: Provider;
  location?: Location;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffingOptimizationRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'coverage' | 'cost' | 'preference' | 'compliance';
  priority: number;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OptimizationSuggestion {
  id: string;
  type: 'staff_assignment' | 'schedule_change' | 'coverage_gap' | 'cost_optimization';
  title: string;
  description: string;
  impact_score: number;
  cost_savings?: number;
  affected_staff: string[];
  affected_providers: string[];
  suggested_changes: Record<string, any>;
  confidence_level: number;
  created_at: string;
}

export interface StaffingAnalytics {
  date_range: {
    start_date: string;
    end_date: string;
  };
  coverage_metrics: {
    total_coverage_rate: number;
    location_coverage_rates: Record<string, number>;
    provider_coverage_rates: Record<string, number>;
    uncovered_hours: number;
  };
  staff_metrics: {
    total_staff_hours: number;
    average_utilization_rate: number;
    staff_utilization_by_member: Record<string, number>;
    cross_location_assignments: number;
  };
  cost_metrics: {
    total_staffing_cost: number;
    cost_per_hour: number;
    overtime_cost: number;
    cost_by_location: Record<string, number>;
  };
  optimization_metrics: {
    optimization_score: number;
    suggestions_applied: number;
    cost_savings_achieved: number;
    coverage_improvements: number;
  };
}

export interface DragDropItem {
  id: string;
  type: 'staff' | 'provider';
  data: StaffMember | Provider;
}

export interface ScheduleViewMode {
  mode: 'day' | 'week' | 'month';
  date: Date;
}

export interface StaffAvailabilityForm {
  available_start_time: string;
  available_end_time: string;
  location_preferences: string[];
  unavailable_dates: string[];
  notes: string;
}

export interface ScheduleBuilderProps {
  providers: Provider[];
  staffMembers: StaffMember[];
  schedules: StaffSchedule[];
  selectedDate: Date;
  viewMode: 'day' | 'week';
  onScheduleUpdate: (schedules: StaffSchedule[]) => Promise<void>;
  isLoading?: boolean;
}

export interface StaffAssignmentGridProps {
  staffMembers: StaffMember[];
  schedules: StaffSchedule[];
  selectedDate: Date;
  viewMode: 'day' | 'week';
  onStaffDragStart?: (staff: StaffMember) => void;
  onStaffDragEnd?: () => void;
}

export interface ProviderScheduleGridProps {
  providers: Provider[];
  schedules: StaffSchedule[];
  selectedDate: Date;
  viewMode: 'day' | 'week';
  onStaffDrop?: (staffId: string, providerId: string, timeSlot: string) => Promise<void>;
  onStaffAssignment?: (staff: StaffMember, providerId: string, date: Date) => Promise<void>;
}

export interface CoverageMetrics {
  coverage_rate: number;
  optimal_assignments: number;
  cross_location_count: number;
  uncovered_slots: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
}

// Real-time subscription types
export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old: any;
  table: string;
  schema: string;
}

export interface StaffingSubscription {
  schedules: StaffSchedule[];
  isConnected: boolean;
  connectionError?: string;
  lastUpdate?: string;
}

// Form validation schemas (for use with zod)
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
}

// Performance monitoring types
export interface PerformanceMetrics {
  componentRenderTime: number;
  apiResponseTime: number;
  bundleSize: number;
  memoryUsage: number;
  timestamp: string;
}

export default {};