// Communication Types - Universal across all Ganger Platform applications

export interface PatientContact {
  id: string;
  patient_id: string;
  phone_number: string;
  email?: string;
  preferred_method: 'sms' | 'email' | 'both';
  sms_consent: boolean;
  email_consent: boolean;
  consent_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'appointment_reminder' | 'handout_delivery' | 'medication_update' | 
        'training_notification' | 'staff_alert' | 'emergency' | 'general';
  channel: 'sms' | 'email';
  subject?: string; // For email templates
  content: string;
  variables: string[]; // Available template variables
  hipaa_compliant: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CommunicationLog {
  id: string;
  patient_id?: string;
  staff_id?: string;
  template_id: string;
  channel: 'sms' | 'email';
  recipient: string;
  content: string; // Encrypted content
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  external_id?: string; // Twilio message SID, email provider ID
  error_message?: string;
  sent_at?: Date;
  delivered_at?: Date;
  created_at: Date;
}

export interface ConsentRecord {
  id: string;
  patient_id: string;
  consent_type: 'sms' | 'email' | 'both';
  consented: boolean;
  consent_date: Date;
  consent_method: 'verbal' | 'written' | 'digital' | 'kiosk';
  ip_address?: string;
  user_agent?: string;
  staff_id?: string; // Who obtained consent
  notes?: string;
  created_at: Date;
}

export interface CommunicationRequest {
  patient_id?: string;
  staff_id?: string;
  template_name: string;
  channel: 'sms' | 'email';
  recipient?: string; // Override default patient contact
  variables: Record<string, string>; // Template variable values
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduled_for?: Date; // For delayed sending
  require_consent?: boolean; // Default true
}

export interface CommunicationConfig {
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_api_key: string;
  twilio_api_secret: string;
  twilio_phone_number: string;
  twilio_messaging_service_sid?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  from_email?: string;
  encryption_key: string;
  audit_retention_days: number;
}

export interface SMSDeliveryResult {
  success: boolean;
  message_id?: string;
  error?: string;
  status: 'sent' | 'failed' | 'queued' | 'delivered';
  cost?: number;
  delivery_status?: 'queued' | 'sent' | 'delivered' | 'failed';
  timestamp: Date;
}

export interface EmailDeliveryResult {
  success: boolean;
  message_id?: string;
  error?: string;
  status: 'sent' | 'failed';
}

// Application-specific message types
export interface HandoutDeliveryMessage {
  patient_id: string;
  handout_title: string;
  handout_url: string;
  qr_code_url?: string;
  provider_name: string;
  clinic_name: string;
}

export interface AppointmentReminderMessage {
  patient_id: string;
  appointment_date: Date;
  appointment_time: string;
  provider_name: string;
  clinic_name: string;
  clinic_phone: string;
  appointment_type: string;
}

export interface MedicationUpdateMessage {
  patient_id: string;
  medication_name: string;
  authorization_status: 'approved' | 'denied' | 'pending' | 'requires_info';
  next_steps?: string;
  provider_name: string;
  clinic_phone: string;
}

export interface TrainingNotificationMessage {
  staff_id: string;
  training_title: string;
  due_date: Date;
  completion_url: string;
  manager_name?: string;
}

export interface StaffAlertMessage {
  staff_ids: string[];
  alert_type: 'schedule_change' | 'emergency' | 'system_update' | 'training_due';
  message: string;
  action_required: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}