// Call Center Operations Dashboard - TypeScript Types
// Comprehensive type definitions for all call center data structures

export interface CallCenterRecord {
  id: string;
  call_id: string;
  
  // Call identification and routing
  location: 'Ann Arbor' | 'Wixom' | 'Plymouth';
  queue_name: string;
  agent_extension: string;
  agent_email: string;
  agent_name: string;
  
  // Call details
  caller_number: string;
  caller_name?: string;
  called_number: string;
  call_direction: 'inbound' | 'outbound';
  call_type?: 'appointment' | 'prescription' | 'billing' | 'general' | 'follow_up';
  
  // Timing metrics
  call_start_time: string;
  call_answer_time?: string;
  call_end_time?: string;
  ring_duration_seconds?: number;
  talk_duration_seconds?: number;
  
  // Call outcome and quality
  call_status: 'completed' | 'missed' | 'abandoned' | 'transferred' | 'voicemail';
  call_outcome?: 'appointment_scheduled' | 'information_provided' | 'transfer_required' | 'callback_scheduled';
  customer_satisfaction_score?: number; // 1-5
  quality_score?: number; // 1-100
  
  // Patient and appointment context
  patient_mrn?: string;
  appointment_scheduled: boolean;
  appointment_date?: string;
  appointment_type?: string;
  provider_requested?: string;
  
  // Performance indicators
  first_call_resolution: boolean;
  escalation_required: boolean;
  complaint_call: boolean;
  follow_up_required: boolean;
  follow_up_date?: string;
  
  // Recording and compliance
  recording_available: boolean;
  recording_url?: string;
  recording_reviewed: boolean;
  compliance_notes?: string;
  
  // Productivity metrics
  after_call_work_seconds: number;
  hold_time_seconds: number;
  transfer_count: number;
  
  // Metadata
  shift_id?: string;
  campaign_id?: string;
  call_priority: 'urgent' | 'high' | 'normal' | 'low';
  
  created_at: string;
  updated_at: string;
}

export interface CallJournal {
  id: string;
  call_record_id: string;
  agent_email: string;
  
  // Call summary and notes
  call_summary: string;
  detailed_notes?: string;
  patient_concern?: string;
  resolution_provided?: string;
  
  // Action items and follow-up
  action_items: string[];
  follow_up_required: boolean;
  follow_up_type?: 'callback' | 'appointment' | 'provider_review' | 'billing';
  follow_up_date?: string;
  follow_up_notes?: string;
  
  // Call categorization
  call_tags: string[];
  department_involved: string[];
  referral_made: boolean;
  referral_type?: string;
  
  // Quality and training
  coaching_notes?: string;
  training_opportunities: string[];
  commendation_worthy: boolean;
  improvement_areas: string[];
  
  // Status tracking
  journal_status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_score?: number; // 1-100
  
  created_at: string;
  updated_at: string;
}

export interface AgentShift {
  id: string;
  agent_email: string;
  agent_name: string;
  location: 'Ann Arbor' | 'Wixom' | 'Plymouth';
  
  // Shift timing
  shift_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  
  // Break and availability tracking
  total_break_time_minutes: number;
  lunch_break_minutes: number;
  training_time_minutes: number;
  meeting_time_minutes: number;
  
  // Performance during shift
  calls_handled: number;
  calls_missed: number;
  total_talk_time_seconds: number;
  total_available_time_seconds: number;
  total_after_call_work_seconds: number;
  
  // Productivity metrics (computed)
  utilization_percentage: number;
  calls_per_hour: number;
  
  // Goals and targets
  call_target?: number;
  appointment_target?: number;
  quality_target?: number;
  
  // Shift notes and status
  shift_notes?: string;
  tardiness_minutes: number;
  early_departure_minutes: number;
  shift_status: 'scheduled' | 'active' | 'completed' | 'absent' | 'partial';
  
  created_at: string;
  updated_at: string;
}

export interface PerformanceGoals {
  id: string;
  agent_email: string;
  goal_period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  period_start_date: string;
  period_end_date: string;
  
  // Quantitative goals
  calls_per_day_target?: number;
  talk_time_percentage_target?: number;
  first_call_resolution_target?: number;
  customer_satisfaction_target?: number;
  appointment_conversion_target?: number;
  quality_score_target?: number;
  
  // Current performance tracking
  calls_per_day_actual: number;
  talk_time_percentage_actual: number;
  first_call_resolution_actual: number;
  customer_satisfaction_actual: number;
  appointment_conversion_actual: number;
  quality_score_actual: number;
  
  // Goal achievement tracking
  goals_met: number;
  total_goals: number;
  achievement_percentage: number; // computed
  
  // Development and coaching
  development_areas: string[];
  coaching_focus?: string;
  improvement_plan?: string;
  recognition_earned: string[];
  
  // Status and review
  goal_status: 'active' | 'completed' | 'revised' | 'paused';
  created_by: string;
  last_reviewed_at?: string;
  reviewed_by?: string;
  
  created_at: string;
  updated_at: string;
}

export interface TeamPerformanceMetrics {
  id: string;
  reporting_period: string;
  location?: string;
  team_name?: string;
  
  // Team size and coverage
  total_agents: number;
  active_agents: number;
  average_experience_months: number;
  
  // Volume metrics
  total_calls_handled: number;
  total_calls_missed: number;
  total_talk_time_hours: number;
  total_available_hours: number;
  
  // Quality metrics
  average_quality_score: number;
  average_customer_satisfaction: number;
  first_call_resolution_rate: number;
  complaint_rate: number;
  
  // Productivity metrics
  calls_per_agent_per_day: number;
  utilization_rate: number;
  appointment_conversion_rate: number;
  
  // Attendance and reliability
  attendance_rate: number;
  punctuality_rate: number;
  schedule_adherence_rate: number;
  
  // Goal achievement
  agents_meeting_goals: number;
  team_goal_achievement_rate: number;
  
  // Training and development
  training_hours_completed: number;
  certifications_earned: number;
  coaching_sessions_conducted: number;
  
  created_at: string;
}

export interface CallCampaign {
  id: string;
  campaign_name: string;
  campaign_type: 'outbound_appointments' | 'follow_up' | 'satisfaction_survey' | 'retention';
  
  // Campaign timing
  start_date: string;
  end_date: string;
  campaign_status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
  
  // Target and scope
  target_audience: string;
  target_call_count?: number;
  target_conversion_rate?: number;
  assigned_agents: string[];
  priority_level: 'urgent' | 'high' | 'normal' | 'low';
  
  // Campaign performance
  calls_attempted: number;
  calls_completed: number;
  successful_outcomes: number;
  conversion_rate: number;
  
  // Script and materials
  call_script?: string;
  talking_points: string[];
  required_documentation: string[];
  training_materials: string[];
  
  // Campaign notes and management
  campaign_notes?: string;
  created_by: string;
  managed_by?: string;
  
  created_at: string;
  updated_at: string;
}

export interface QualityAssuranceReview {
  id: string;
  call_record_id: string;
  agent_email: string;
  reviewer_email: string;
  reviewer_name: string;
  
  // Review timing
  review_date: string;
  review_type: 'random' | 'targeted' | 'complaint_follow_up' | 'new_agent' | 'coaching';
  
  // Scoring categories (1-5 scale)
  greeting_professionalism?: number;
  active_listening?: number;
  problem_resolution?: number;
  product_knowledge?: number;
  communication_clarity?: number;
  empathy_patience?: number;
  call_control?: number;
  closing_effectiveness?: number;
  
  // Overall scoring (computed)
  total_score: number;
  percentage_score: number;
  
  // Qualitative feedback
  strengths_observed?: string;
  improvement_areas?: string;
  specific_coaching_points?: string;
  recognition_worthy: boolean;
  
  // Action items
  action_items_required: string[];
  follow_up_review_needed: boolean;
  follow_up_date?: string;
  additional_training_recommended: string[];
  
  // Review status
  review_status: 'draft' | 'completed' | 'discussed_with_agent';
  agent_discussion_date?: string;
  agent_acknowledgment: boolean;
  
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface CallCenterApiResponse<T = any> {
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
      pages: number;
    };
    performance?: {
      queryTime: number;
      totalTime: number;
    };
  };
}

// Performance Analytics Types
export interface AgentPerformanceMetrics {
  agent_email: string;
  agent_name: string;
  location: string;
  period_start: string;
  period_end: string;
  
  // Call volume metrics
  total_calls: number;
  calls_answered: number;
  calls_missed: number;
  answer_rate: number;
  
  // Quality metrics
  average_talk_time: number;
  average_hold_time: number;
  first_call_resolution_rate: number;
  customer_satisfaction_average: number;
  quality_score_average: number;
  
  // Productivity metrics
  utilization_rate: number;
  calls_per_hour: number;
  appointment_conversion_rate: number;
  
  // Goals and achievement
  goals_met: number;
  total_goals: number;
  goal_achievement_rate: number;
  
  // Coaching and development
  qa_reviews_count: number;
  coaching_sessions: number;
  training_hours: number;
  improvement_areas: string[];
}

export interface PerformanceTrend {
  period: string;
  value: number;
  target?: number;
  variance?: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CallVolumeMetrics {
  location: string;
  period: string;
  total_calls: number;
  answered_calls: number;
  missed_calls: number;
  abandoned_calls: number;
  average_wait_time: number;
  peak_hour_volume: number;
  peak_hour: string;
}

// Dashboard Widget Types
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'progress';
  title: string;
  description?: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config: Record<string, any>;
  data?: any;
  refreshInterval?: number; // seconds
  lastUpdated?: string;
}

export interface CallCenterFilters {
  startDate?: string;
  endDate?: string;
  location?: string[];
  agent?: string[];
  callType?: string[];
  callStatus?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 3CX Integration Types
export interface ThreeCXCallRecord {
  CallId: string;
  CallType: string;
  StartTime: string;
  EndTime?: string;
  AnswerTime?: string;
  CallerNumber: string;
  CalledNumber: string;
  AgentExtension: string;
  AgentName: string;
  Duration: number;
  TalkDuration: number;
  HoldDuration: number;
  QueueName: string;
  Recording?: string;
  CallResult: string;
}

export interface ThreeCXAgentStatus {
  Extension: string;
  Name: string;
  Email: string;
  Status: 'Available' | 'Busy' | 'Away' | 'Offline';
  Queue: string;
  Location: string;
  CurrentCall?: string;
  LastActivity: string;
}

// Validation Schemas (Zod types would be defined separately)
export interface CallJournalInput {
  call_record_id: string;
  call_summary: string;
  detailed_notes?: string;
  patient_concern?: string;
  resolution_provided?: string;
  action_items: string[];
  follow_up_required: boolean;
  follow_up_type?: string;
  follow_up_date?: string;
  call_tags: string[];
  department_involved: string[];
}

export interface PerformanceGoalInput {
  agent_email: string;
  goal_period: string;
  period_start_date: string;
  period_end_date: string;
  calls_per_day_target?: number;
  talk_time_percentage_target?: number;
  first_call_resolution_target?: number;
  customer_satisfaction_target?: number;
  appointment_conversion_target?: number;
  quality_score_target?: number;
}

export interface QAReviewInput {
  call_record_id: string;
  agent_email: string;
  review_type: string;
  greeting_professionalism?: number;
  active_listening?: number;
  problem_resolution?: number;
  product_knowledge?: number;
  communication_clarity?: number;
  empathy_patience?: number;
  call_control?: number;
  closing_effectiveness?: number;
  strengths_observed?: string;
  improvement_areas?: string;
  specific_coaching_points?: string;
  action_items_required: string[];
}