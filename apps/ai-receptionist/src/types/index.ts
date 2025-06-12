// AI Receptionist Demo Types
// Following the PRD specifications and existing platform patterns

export interface CallRecord {
  id: string;
  call_id: string;
  caller_phone: string;
  caller_name?: string;
  patient_id?: string;
  call_direction: 'inbound' | 'outbound';
  call_status: 'active' | 'completed' | 'transferred' | 'abandoned';
  location: 'Ann Arbor' | 'Wixom' | 'Plymouth';
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  ai_handled: boolean;
  ai_confidence_score?: number;
  resolution_type?: 'resolved' | 'transferred' | 'callback_scheduled';
  patient_satisfaction_score?: number;
  quality_score?: number;
  transfer_reason?: string;
  transferred_to?: string;
  escalation_required: boolean;
  recording_url?: string;
  transcript_url?: string;
  cost_per_call?: number;
  revenue_attributed?: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationTurn {
  id: string;
  call_id: string;
  turn_number: number;
  speaker: 'ai' | 'patient' | 'staff';
  intent_detected?: string;
  confidence_score?: number;
  user_input?: string;
  ai_response?: string;
  context_data?: Record<string, any>;
  processing_time_ms?: number;
  sentiment_score?: number;
  emotion_detected?: string;
  escalation_triggered: boolean;
  verification_required?: boolean;
  verification_challenge_id?: string;
  verification_status?: 'pending' | 'verified' | 'failed';
  sms_sent?: boolean;
  sms_type?: 'verification' | 'appointment' | 'other';
  created_at: string;
}

export interface PatientCallContext {
  id: string;
  call_id: string;
  patient_id?: string;
  identification_method?: 'phone_lookup' | 'voice_verification' | 'manual';
  patient_data: Record<string, any>;
  relationship_type?: 'self' | 'parent' | 'spouse' | 'caregiver';
  authorization_verified: boolean;
  hipaa_compliant: boolean;
  access_level: 'basic' | 'full' | 'restricted';
  last_synced_at: string;
  created_at: string;
}

export interface SchedulingRequest {
  id: string;
  call_id: string;
  patient_id: string;
  request_type: 'new_appointment' | 'reschedule' | 'cancel';
  appointment_type?: string;
  preferred_provider?: string;
  preferred_location?: 'Ann Arbor' | 'Wixom' | 'Plymouth';
  preferred_dates?: string[];
  preferred_times?: string[];
  urgency_level: 'urgent' | 'routine' | 'flexible';
  special_requirements?: string;
  original_appointment_id?: string;
  ai_suggested_options?: Record<string, any>;
  final_appointment_id?: string;
  booking_status: 'pending' | 'booked' | 'waitlisted' | 'failed';
  booking_method?: 'ai_direct' | 'ai_assisted' | 'transferred';
  constraints_applied?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface AIEngineResponse {
  success: boolean;
  response_text: string;
  intent_detected: string;
  confidence_score: number;
  sentiment_score: number;
  emotion_detected: string;
  escalation_required: boolean;
  escalation_reason?: string;
  suggested_actions?: string[];
  processing_time_ms: number;
  context_updates?: Record<string, any>;
}

export interface CallDashboardMetrics {
  active_calls: number;
  total_calls_today: number;
  ai_resolution_rate: number;
  average_call_duration: number;
  patient_satisfaction: number;
  calls_by_location: Record<string, number>;
  calls_by_status: Record<string, number>;
  recent_performance: {
    success_rate: number;
    avg_confidence: number;
    escalations: number;
  };
}

// Zenefits employee data
export interface ZenefitsEmployee {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  email: string;
  phone: string;
  mobile_phone?: string;
  work_phone?: string;
  title: string;
  department: string;
  manager?: {
    first_name: string;
    last_name: string;
  };
  employment_status: 'active' | 'inactive' | 'terminated';
  start_date: string;
  location?: string;
}

export interface MockAIConfig {
  intent_recognition_delay: number;
  response_generation_delay: number;
  base_confidence_score: number;
  escalation_triggers: string[];
  supported_intents: string[];
  conversation_templates: Record<string, string[]>;
}

// Real-time event types for demo
export interface CallEvent {
  type: 'call_started' | 'call_ended' | 'transfer_initiated' | 'ai_response_generated' | 'escalation_triggered';
  call_id: string;
  timestamp: string;
  data: Record<string, any>;
}

// Demo scenario types
export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  patient_name: string;
  caller_phone: string;
  scenario_type: 'appointment' | 'billing' | 'clinical' | 'emergency' | 'multilingual' | 'employee_recognition';
  conversation_script: Array<{
    turn: number;
    speaker: 'patient' | 'ai';
    text: string;
    intent?: string;
    confidence?: number;
    should_escalate?: boolean;
  }>;
  expected_outcome: string;
  location: 'Ann Arbor' | 'Wixom' | 'Plymouth';
}

// Analytics types
export interface CallAnalytics {
  period: string;
  total_calls: number;
  ai_handled_calls: number;
  transferred_calls: number;
  average_duration: number;
  resolution_rate: number;
  satisfaction_scores: number[];
  intents_detected: Record<string, number>;
  escalation_reasons: Record<string, number>;
  performance_trends: Array<{
    date: string;
    calls: number;
    ai_success_rate: number;
    avg_confidence: number;
  }>;
}

// Error types
export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface CallTransferRequest {
  call_id: string;
  transfer_to: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  context_summary: string;
  patient_consent_verified: boolean;
}

// Live monitoring types
export interface LiveCallUpdate {
  call_id: string;
  status: string;
  current_turn: number;
  ai_confidence: number;
  intent: string;
  sentiment: number;
  duration: number;
  last_activity: string;
}

export interface SystemHealth {
  ai_engine: boolean;
  communication_hub: boolean;
  database: boolean;
  real_time_sync: boolean;
  last_check: string;
  issues: string[];
}