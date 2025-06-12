import { BaseEntity } from '@ganger/db';

// Template Types
export interface HandoutTemplate extends BaseEntity {
  template_name: string;
  category: 'education' | 'treatment' | 'medication' | 'pre_procedure' | 'post_procedure';
  subcategory?: string;
  description?: string;
  template_type: 'static' | 'dynamic' | 'conditional';
  
  // Template content structure
  template_content: TemplateContent;
  fill_in_fields: FormField[];
  conditional_logic: ConditionalRule[];
  validation_rules: ValidationRule[];
  
  // Template metadata
  complexity_level: 1 | 2 | 3; // 1=simple, 2=moderate, 3=complex
  estimated_completion_time: number; // minutes
  provider_specific: boolean;
  location_specific?: string[];
  specialty_tags?: string[];
  
  // Content and delivery options
  digital_delivery_enabled: boolean;
  requires_physician_review: boolean;
  medical_specialty: string;
  language_code: string;
  
  // Versioning and approval workflow
  is_active: boolean;
  version_number: number;
  parent_template_id?: string;
  approval_status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  
  // Template source and migration tracking
  source_file?: string;
  legacy_template_id?: string;
  migration_notes?: string;
  
  // Audit
  created_by: string;
  last_modified_by: string;
}

// Template Content Structure
export interface TemplateContent {
  sections: ContentSection[];
}

export interface ContentSection {
  id: string;
  type: 'static_text' | 'static_list' | 'field_section' | 'conditional_checklist' | 'warning' | 'page_break';
  title?: string;
  content?: string | string[];
  variant?: 'normal' | 'warning' | 'emphasis' | 'heading';
  items?: ConditionalItem[];
  fields?: FormField[];
  minSelected?: number;
  maxSelected?: number;
}

export interface ConditionalItem {
  id: string;
  content: string; // May contain {{variable}} placeholders
  fields?: FormField[]; // Fields that appear when item is selected
  required?: boolean;
  default?: boolean;
}

// Form Field Types
export interface FormField {
  id: string;
  type: 'text' | 'select' | 'checkbox' | 'conditional';
  label: string;
  required: boolean;
  default?: string;
  validation?: FieldValidation;
  options?: SelectOption[];
  dependsOn?: string;
}

export interface FieldValidation {
  pattern?: string; // RegExp pattern as string
  minLength?: number;
  maxLength?: number;
  numeric?: boolean;
  range?: [number, number];
}

export interface SelectOption {
  value: string;
  text: string;
  default?: boolean;
}

// Conditional Logic
export interface ConditionalRule {
  type: 'show_if' | 'hide_if' | 'require_if';
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'is_checked';
  value: any;
  target: string | string[]; // Content blocks or fields to affect
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'numeric' | 'email' | 'phone' | 'custom';
  message: string;
  pattern?: string;
}

// Generated Handouts
export interface GeneratedHandout extends BaseEntity {
  patient_mrn: string;
  patient_name: string;
  patient_email?: string;
  patient_phone?: string;
  template_ids: string[];
  generated_content: any; // Complete handout data
  fill_in_data: Record<string, any>; // Patient-specific data used
  generated_by: string;
  location: string;
  pdf_file_path?: string;
  secure_download_url?: string;
  download_expires_at?: string;
  print_count: number;
  last_printed_at?: string;
  
  // Digital delivery options
  delivery_method: string[]; // Array: 'print', 'email', 'sms'
  email_sent: boolean;
  email_sent_at?: string;
  email_delivery_status?: 'pending' | 'delivered' | 'failed' | 'opened';
  sms_sent: boolean;
  sms_sent_at?: string;
  sms_delivery_status?: 'pending' | 'delivered' | 'failed' | 'clicked';
  download_count: number;
  last_downloaded_at?: string;
  patient_consent_digital: boolean;
}

// Patient Information
export interface Patient {
  mrn: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

// Delivery Options
export interface DeliveryOptions {
  print: boolean;
  email: boolean;
  sms: boolean;
}

// QR Code Mappings
export interface PatientQRCode extends BaseEntity {
  patient_mrn: string;
  qr_code_data: string;
  expires_at: string;
  generated_by: string;
  last_scanned_at?: string;
  scan_count: number;
}

// Delivery Tracking
export interface HandoutDeliveryLog extends BaseEntity {
  generated_handout_id: string;
  delivery_method: 'email' | 'sms';
  delivery_status: 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked';
  delivery_provider?: string;
  provider_message_id?: string;
  delivery_attempted_at: string;
  delivery_confirmed_at?: string;
  failure_reason?: string;
  patient_interaction_at?: string;
}

// Communication Preferences
export interface PatientCommunicationPreferences extends BaseEntity {
  patient_mrn: string;
  prefers_digital_handouts: boolean;
  email_consent: boolean;
  sms_consent: boolean;
  preferred_delivery_method?: 'print' | 'email' | 'sms' | 'both';
  consent_date?: string;
  consent_updated_by?: string;
  last_updated: string;
}

// Analytics
export interface HandoutAnalytics extends BaseEntity {
  analytics_date: string;
  location: string;
  template_id?: string;
  generation_count: number;
  print_count: number;
  email_count: number;
  sms_count: number;
  digital_delivery_rate: number; // Percentage delivered digitally
  unique_patients: number;
  staff_usage_count: number;
  average_generation_time_seconds?: number;
  patient_engagement_rate: number; // Download/open rate
}

// Template Variables
export interface TemplateVariable extends BaseEntity {
  template_id: string;
  variable_name: string;
  variable_type: 'text' | 'select' | 'checkbox' | 'conditional';
  display_label: string;
  is_required: boolean;
  default_value?: string;
  validation_pattern?: string;
  field_options?: SelectOption[];
  depends_on_field?: string;
  display_order: number;
}

// Standard Variables (available to all templates)
export interface StandardVariables {
  // Patient information
  patient_full_name: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_mrn: string;
  patient_dob: string;
  patient_email?: string;
  patient_phone?: string;
  
  // Provider information
  provider_name: string;
  provider_email?: string;
  
  // Practice information
  location_name: string;
  location_address?: string;
  location_phone?: string;
  
  // System information
  current_date: string;
  current_time: string;
  current_datetime: string;
}

// PDF Generation Options
export interface PDFGenerationOptions {
  defaultFormat: 'pdf';
  supportedFormats: string[];
  pageSize: 'letter' | 'a4';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  font: {
    family: string;
    size: number;
  };
}