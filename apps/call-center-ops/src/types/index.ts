// Call Center Operations Dashboard Types

export interface CallRecord {
  id: string;
  call_id: string;
  caller_phone: string;
  caller_name?: string;
  patient_id?: string;
  call_direction: 'inbound' | 'outbound';
  call_status: 'active' | 'completed' | 'transferred' | 'abandoned';
  location: 'Ann Arbor' | 'Wixom' | 'Plymouth';
  call_start_time: string;
  call_answer_time?: string;
  call_end_time?: string;
  ring_duration_seconds?: number;
  talk_duration_seconds?: number;
  call_outcome?: string;
  customer_satisfaction_score?: number;
  quality_score?: number;
  patient_mrn?: string;
  appointment_scheduled: boolean;
  appointment_date?: string;
  appointment_type?: string;
  provider_requested?: string;
  first_call_resolution: boolean;
  escalation_required: boolean;
  complaint_call: boolean;
  follow_up_required: boolean;
  follow_up_date?: string;
  recording_available: boolean;
  recording_url?: string;
  recording_reviewed: boolean;
  compliance_notes?: string;
  after_call_work_seconds: number;
  hold_time_seconds: number;
  transfer_count: number;
  shift_id?: string;
  campaign_id?: string;
  call_priority: 'urgent' | 'high' | 'normal' | 'low';
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  call_record_id: string;
  agent_email: string;
  agent_name?: string;
  call_summary: string;
  detailed_notes?: string;
  patient_concern?: string;
  resolution_provided?: string;
  action_items: string[];
  follow_up_required: boolean;
  follow_up_type?: 'callback' | 'appointment' | 'provider_review' | 'billing';
  follow_up_date?: string;
  follow_up_notes?: string;
  call_tags: string[];
  department_involved: string[];
  referral_made: boolean;
  referral_type?: string;
  coaching_notes?: string;
  training_opportunities: string[];
  commendation_worthy: boolean;
  improvement_areas: string[];
  journal_status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_score?: number;
  created_at: string;
  updated_at: string;
}

export interface AgentStatus {
  agent_email: string;
  agent_name: string;
  location: string;
  status: 'available' | 'on_call' | 'break' | 'training' | 'offline';
  calls_today: number;
  avg_call_time: number;
  quality_score: number;
  last_activity: string;
  shift_start?: string;
  shift_end?: string;
}

export interface PerformanceMetrics {
  calls_today: number;
  calls_change: number;
  calls_trend: 'up' | 'down' | 'neutral';
  avg_call_time: number;
  time_change: number;
  time_trend: 'up' | 'down' | 'neutral';
  quality_score: number;
  quality_change: number;
  quality_trend: 'up' | 'down' | 'neutral';
  appointments_today: number;
  appointments_change: number;
  appointments_trend: 'up' | 'down' | 'neutral';
  daily_calls: number[];
}

export interface GoalProgress {
  title: string;
  current: number;
  target: number;
  progress: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface TeamMetrics {
  total_calls_today: number;
  calls_change: number;
  calls_trend: 'up' | 'down' | 'neutral';
  avg_quality_score: number;
  quality_change: number;
  quality_trend: 'up' | 'down' | 'neutral';
  agent_change: number;
  agent_trend: 'up' | 'down' | 'neutral';
  reviews_change: number;
  reviews_trend: 'up' | 'down' | 'neutral';
  daily_calls: number[];
  daily_quality: number[];
}

export interface ExecutiveMetrics {
  total_calls: number;
  calls_change: number;
  calls_trend: 'up' | 'down' | 'neutral';
  revenue_attributed: number;
  revenue_change: number;
  revenue_trend: 'up' | 'down' | 'neutral';
  avg_quality_score: number;
  quality_change: number;
  quality_trend: 'up' | 'down' | 'neutral';
  cost_per_call: number;
  cost_change: number;
  cost_trend: 'up' | 'down' | 'neutral';
  customer_satisfaction: number;
  satisfaction_change: number;
  satisfaction_trend: 'up' | 'down' | 'neutral';
  trend_labels: string[];
  call_volume_trend: number[];
  quality_trend_data: number[];
}

export interface LocationMetrics {
  location_name: string;
  total_calls: number;
  avg_quality_score: number;
  appointments_scheduled: number;
  revenue_attributed: number;
  utilization_rate: number;
  avg_wait_time: number;
  agent_count: number;
}

export interface CampaignPerformance {
  campaign_name: string;
  campaign_type: string;
  calls_attempted: number;
  calls_completed: number;
  conversion_rate: number;
  revenue_generated: number;
  cost_per_acquisition: number;
  roi: number;
  status: 'active' | 'paused' | 'completed';
}

export interface QualityReview {
  id: string;
  call_record_id: string;
  agent_email: string;
  reviewer_email: string;
  reviewer_name: string;
  review_date: string;
  review_type: 'random' | 'targeted' | 'complaint_follow_up' | 'new_agent' | 'coaching';
  greeting_professionalism: number;
  active_listening: number;
  problem_resolution: number;
  product_knowledge: number;
  communication_clarity: number;
  empathy_patience: number;
  call_control: number;
  closing_effectiveness: number;
  total_score: number;
  percentage_score: number;
  strengths_observed?: string;
  improvement_areas?: string;
  specific_coaching_points?: string;
  recognition_worthy: boolean;
  action_items_required: string[];
  follow_up_review_needed: boolean;
  follow_up_date?: string;
  additional_training_recommended: string[];
  review_status: 'draft' | 'completed' | 'discussed_with_agent';
  agent_discussion_date?: string;
  agent_acknowledgment: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentShift {
  id: string;
  agent_email: string;
  agent_name: string;
  location: string;
  shift_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  total_break_time_minutes: number;
  lunch_break_minutes: number;
  training_time_minutes: number;
  meeting_time_minutes: number;
  calls_handled: number;
  calls_missed: number;
  total_talk_time_seconds: number;
  total_available_time_seconds: number;
  total_after_call_work_seconds: number;
  utilization_percentage: number;
  calls_per_hour: number;
  call_target?: number;
  appointment_target?: number;
  quality_target?: number;
  shift_notes?: string;
  tardiness_minutes: number;
  early_departure_minutes: number;
  shift_status: 'scheduled' | 'active' | 'completed' | 'absent' | 'partial';
  created_at: string;
  updated_at: string;
}

export interface PerformanceGoal {
  id: string;
  agent_email: string;
  goal_period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  period_start_date: string;
  period_end_date: string;
  calls_per_day_target?: number;
  talk_time_percentage_target?: number;
  first_call_resolution_target?: number;
  customer_satisfaction_target?: number;
  appointment_conversion_target?: number;
  quality_score_target?: number;
  calls_per_day_actual: number;
  talk_time_percentage_actual: number;
  first_call_resolution_actual: number;
  customer_satisfaction_actual: number;
  appointment_conversion_actual: number;
  quality_score_actual: number;
  goals_met: number;
  total_goals: number;
  achievement_percentage: number;
  development_areas: string[];
  coaching_focus?: string;
  improvement_plan?: string;
  recognition_earned: string[];
  goal_status: 'active' | 'completed' | 'revised' | 'paused';
  created_by: string;
  last_reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CallCampaign {
  id: string;
  campaign_name: string;
  campaign_type: 'outbound_appointments' | 'follow_up' | 'satisfaction_survey' | 'retention';
  start_date: string;
  end_date: string;
  campaign_status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
  target_audience: string;
  target_call_count?: number;
  target_conversion_rate?: number;
  assigned_agents: string[];
  priority_level: 'urgent' | 'high' | 'normal' | 'low';
  calls_attempted: number;
  calls_completed: number;
  successful_outcomes: number;
  conversion_rate: number;
  call_script?: string;
  talking_points: string[];
  required_documentation: string[];
  training_materials: string[];
  campaign_notes?: string;
  created_by: string;
  managed_by?: string;
  created_at: string;
  updated_at: string;
}

// Form validation schemas
export interface CallJournalFormData {
  call_id: string;
  call_summary: string;
  detailed_notes?: string;
  patient_concern: string;
  resolution_provided: string;
  action_items: string[];
  follow_up_required: boolean;
  follow_up_type?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
  call_tags: string[];
  department_involved: string[];
  referral_made: boolean;
  referral_type?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard filter types
export interface DashboardFilters {
  location?: string;
  period?: string;
  agent?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Chart data types
export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  tension?: number;
  yAxisID?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// Real-time update types
export interface RealtimeCallUpdate {
  type: 'call_start' | 'call_end' | 'call_transfer' | 'quality_update' | 'agent_status';
  data: any;
  timestamp: string;
}

// Performance scoring types
export interface PerformanceScore {
  category: string;
  score: number;
  maxScore: number;
  weight: number;
  trend: 'up' | 'down' | 'neutral';
}

// Notification types
export interface CallCenterNotification {
  id: string;
  type: 'call_quality' | 'goal_achievement' | 'system_alert' | 'coaching_reminder';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
  expires_at?: string;
}

// User type - define locally for now since @ganger/types may not exist
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}