// Core Authorization Types
export interface Authorization {
  id: string;
  patient_id: string;
  medication_id: string;
  insurance_provider_id: string;
  status: AuthorizationStatus;
  priority: AuthorizationPriority;
  created_at: string;
  updated_at: string;
  created_by: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  approval_date?: string;
  denial_reason?: string;
  ai_confidence_score?: number;
  estimated_processing_time?: number;
}

export type AuthorizationStatus = 
  | 'draft'
  | 'submitted'
  | 'processing'
  | 'pending_info'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'cancelled';

export type AuthorizationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Patient Information (from ModMed integration)
export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  insurance_id: string;
  insurance_group: string;
  phone: string;
  email?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  medical_history?: MedicalCondition[];
  allergies?: string[];
  current_medications?: string[];
}

export interface MedicalCondition {
  condition: string;
  diagnosis_date: string;
  icd_code: string;
  severity: 'mild' | 'moderate' | 'severe';
}

// Medication Information
export interface Medication {
  id: string;
  name: string;
  brand_name?: string;
  generic_name: string;
  ndc_number: string;
  strength: string;
  dosage_form: string;
  manufacturer: string;
  therapeutic_class: string;
  requires_authorization: boolean;
  common_indications: string[];
  contraindications?: string[];
  typical_authorization_requirements: string[];
}

// Insurance Provider Information
export interface InsuranceProvider {
  id: string;
  name: string;
  type: 'commercial' | 'medicare' | 'medicaid' | 'other';
  authorization_portal_url?: string;
  phone: string;
  fax?: string;
  email?: string;
  typical_processing_time: number; // in hours
  requirements: InsuranceRequirement[];
  success_rate: number; // percentage
}

export interface InsuranceRequirement {
  field_name: string;
  display_label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  required: boolean;
  options?: string[]; // for select fields
  validation_rules?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    file_types?: string[];
  };
  help_text?: string;
}

// AI Recommendations
export interface AIRecommendation {
  id: string;
  authorization_id: string;
  recommendation_type: 'form_completion' | 'documentation' | 'alternative_medication' | 'approval_likelihood';
  confidence_score: number; // 0-1
  suggestion: string;
  reasoning: string;
  supporting_data?: any;
  created_at: string;
  applied: boolean;
}

// Processing Status and Communication
export interface ProcessingStatus {
  authorization_id: string;
  current_step: string;
  steps_completed: string[];
  steps_remaining: string[];
  estimated_completion: string;
  last_activity: string;
  messages: CommunicationMessage[];
}

export interface CommunicationMessage {
  id: string;
  authorization_id: string;
  direction: 'inbound' | 'outbound';
  type: 'phone' | 'fax' | 'email' | 'portal' | 'system';
  sender: string;
  recipient: string;
  subject?: string;
  message: string;
  timestamp: string;
  attachments?: string[];
  read: boolean;
}

// Analytics and Reporting
export interface AuthorizationAnalytics {
  total_authorizations: number;
  success_rate: number;
  average_processing_time: number;
  pending_authorizations: number;
  urgent_authorizations: number;
  monthly_trends: {
    month: string;
    submitted: number;
    approved: number;
    denied: number;
    average_time: number;
  }[];
  insurance_performance: {
    provider_name: string;
    success_rate: number;
    average_time: number;
    total_requests: number;
  }[];
  cost_savings: {
    estimated_staff_time_saved: number; // hours
    cost_per_hour: number;
    total_savings: number;
  };
}

// Form Building and Validation
export interface DynamicFormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox';
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  options?: { value: string; label: string }[];
  placeholder?: string;
  help_text?: string;
  ai_suggested_value?: string;
  ai_confidence?: number;
}

export interface AuthorizationForm {
  id: string;
  insurance_provider_id: string;
  medication_id: string;
  fields: DynamicFormField[];
  metadata: {
    estimated_completion_time: number; // minutes
    difficulty_level: 'easy' | 'medium' | 'hard';
    success_rate: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Filter and Search Types
export interface AuthorizationFilters {
  status?: AuthorizationStatus[];
  priority?: AuthorizationPriority[];
  date_range?: {
    start: string;
    end: string;
  };
  insurance_provider?: string[];
  created_by?: string[];
  search_query?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  authorization_id?: string;
  action_required: boolean;
  created_at: string;
  read: boolean;
  expires_at?: string;
}

// Real-time Subscription Types
export interface RealtimeUpdate {
  type: 'authorization_status_changed' | 'new_message' | 'ai_recommendation' | 'system_notification';
  data: any;
  timestamp: string;
}