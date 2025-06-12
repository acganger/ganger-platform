// Check-in Kiosk Type Definitions

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone_number?: string;
  email?: string;
  insurance_id?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  medical_record_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: 'consultation' | 'procedure' | 'follow_up' | 'emergency';
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  copay_amount?: number;
  insurance_copay?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  specialty?: string;
  office_number?: string;
}

export interface CheckInSession {
  patient: Patient;
  appointment: Appointment;
  provider: Provider;
  copay_required: boolean;
  copay_amount: number;
  insurance_verified: boolean;
  payment_completed: boolean;
  forms_completed: boolean;
  check_in_completed: boolean;
  session_start: Date;
}

export interface CheckInStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  component: 'patient_lookup' | 'appointment_confirmation' | 'insurance_verification' | 'forms' | 'payment' | 'completion';
}

export interface InsuranceInfo {
  primary_insurance: string;
  insurance_id: string;
  group_number?: string;
  copay_amount: number;
  deductible_remaining?: number;
  prior_authorization_required?: boolean;
  verification_status: 'verified' | 'pending' | 'failed' | 'not_required';
}

export interface FormStatus {
  form_id: string;
  form_name: string;
  required: boolean;
  completed: boolean;
  last_updated?: Date;
}

export interface KioskConfig {
  location_name: string;
  location_id: string;
  require_insurance_verification: boolean;
  require_copay_payment: boolean;
  enable_form_completion: boolean;
  enable_photo_id_scan: boolean;
  session_timeout_minutes: number;
  payment_processing_enabled: boolean;
}