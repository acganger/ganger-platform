-- Call Center Operations Dashboard - Performance Analytics Tables
-- Migration: 20250611000002_create_performance_analytics_tables.sql
-- Description: Create performance goals, analytics, QA, and campaign management tables

-- Performance goals and KPI tracking
CREATE TABLE performance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_email TEXT NOT NULL,
  goal_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Quantitative goals
  calls_per_day_target INTEGER,
  talk_time_percentage_target DECIMAL(5,2),
  first_call_resolution_target DECIMAL(5,2),
  customer_satisfaction_target DECIMAL(5,2),
  appointment_conversion_target DECIMAL(5,2),
  quality_score_target DECIMAL(5,2),
  
  -- Current performance tracking
  calls_per_day_actual DECIMAL(6,2) DEFAULT 0,
  talk_time_percentage_actual DECIMAL(5,2) DEFAULT 0,
  first_call_resolution_actual DECIMAL(5,2) DEFAULT 0,
  customer_satisfaction_actual DECIMAL(5,2) DEFAULT 0,
  appointment_conversion_actual DECIMAL(5,2) DEFAULT 0,
  quality_score_actual DECIMAL(5,2) DEFAULT 0,
  
  -- Goal achievement tracking
  goals_met INTEGER DEFAULT 0,
  total_goals INTEGER DEFAULT 6,
  achievement_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    (goals_met::DECIMAL / total_goals) * 100
  ) STORED,
  
  -- Development and coaching
  development_areas TEXT[],
  coaching_focus TEXT,
  improvement_plan TEXT,
  recognition_earned TEXT[],
  
  -- Status and review
  goal_status TEXT DEFAULT 'active', -- 'active', 'completed', 'revised', 'paused'
  created_by TEXT NOT NULL, -- Manager who set goals
  last_reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team performance analytics and reporting
CREATE TABLE team_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporting_period DATE NOT NULL,
  location TEXT,
  team_name TEXT,
  
  -- Team size and coverage
  total_agents INTEGER NOT NULL,
  active_agents INTEGER NOT NULL,
  average_experience_months DECIMAL(6,2),
  
  -- Volume metrics
  total_calls_handled INTEGER DEFAULT 0,
  total_calls_missed INTEGER DEFAULT 0,
  total_talk_time_hours DECIMAL(8,2) DEFAULT 0,
  total_available_hours DECIMAL(8,2) DEFAULT 0,
  
  -- Quality metrics
  average_quality_score DECIMAL(5,2) DEFAULT 0,
  average_customer_satisfaction DECIMAL(5,2) DEFAULT 0,
  first_call_resolution_rate DECIMAL(5,2) DEFAULT 0,
  complaint_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Productivity metrics
  calls_per_agent_per_day DECIMAL(6,2) DEFAULT 0,
  utilization_rate DECIMAL(5,2) DEFAULT 0,
  appointment_conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Attendance and reliability
  attendance_rate DECIMAL(5,2) DEFAULT 100.00,
  punctuality_rate DECIMAL(5,2) DEFAULT 100.00,
  schedule_adherence_rate DECIMAL(5,2) DEFAULT 100.00,
  
  -- Goal achievement
  agents_meeting_goals INTEGER DEFAULT 0,
  team_goal_achievement_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Training and development
  training_hours_completed DECIMAL(8,2) DEFAULT 0,
  certifications_earned INTEGER DEFAULT 0,
  coaching_sessions_conducted INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call center campaigns and initiatives
CREATE TABLE call_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- 'outbound_appointments', 'follow_up', 'satisfaction_survey', 'retention'
  
  -- Campaign timing
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  campaign_status TEXT DEFAULT 'planned', -- 'planned', 'active', 'paused', 'completed', 'cancelled'
  
  -- Target and scope
  target_audience TEXT NOT NULL,
  target_call_count INTEGER,
  target_conversion_rate DECIMAL(5,2),
  assigned_agents TEXT[], -- Array of agent emails
  priority_level TEXT DEFAULT 'normal',
  
  -- Campaign performance
  calls_attempted INTEGER DEFAULT 0,
  calls_completed INTEGER DEFAULT 0,
  successful_outcomes INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Script and materials
  call_script TEXT,
  talking_points TEXT[],
  required_documentation TEXT[],
  training_materials TEXT[],
  
  -- Campaign notes and management
  campaign_notes TEXT,
  created_by TEXT NOT NULL,
  managed_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality assurance and call monitoring
CREATE TABLE quality_assurance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_record_id UUID REFERENCES call_center_records(id) ON DELETE CASCADE,
  agent_email TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  
  -- Review timing
  review_date DATE NOT NULL,
  review_type TEXT NOT NULL, -- 'random', 'targeted', 'complaint_follow_up', 'new_agent', 'coaching'
  
  -- Scoring categories (1-5 scale)
  greeting_professionalism INTEGER CHECK (greeting_professionalism BETWEEN 1 AND 5),
  active_listening INTEGER CHECK (active_listening BETWEEN 1 AND 5),
  problem_resolution INTEGER CHECK (problem_resolution BETWEEN 1 AND 5),
  product_knowledge INTEGER CHECK (product_knowledge BETWEEN 1 AND 5),
  communication_clarity INTEGER CHECK (communication_clarity BETWEEN 1 AND 5),
  empathy_patience INTEGER CHECK (empathy_patience BETWEEN 1 AND 5),
  call_control INTEGER CHECK (call_control BETWEEN 1 AND 5),
  closing_effectiveness INTEGER CHECK (closing_effectiveness BETWEEN 1 AND 5),
  
  -- Overall scoring
  total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(greeting_professionalism, 0) + COALESCE(active_listening, 0) + 
    COALESCE(problem_resolution, 0) + COALESCE(product_knowledge, 0) + 
    COALESCE(communication_clarity, 0) + COALESCE(empathy_patience, 0) + 
    COALESCE(call_control, 0) + COALESCE(closing_effectiveness, 0)
  ) STORED,
  
  percentage_score DECIMAL(5,2) GENERATED ALWAYS AS (
    (total_score::DECIMAL / 40) * 100
  ) STORED,
  
  -- Qualitative feedback
  strengths_observed TEXT,
  improvement_areas TEXT,
  specific_coaching_points TEXT,
  recognition_worthy BOOLEAN DEFAULT FALSE,
  
  -- Action items
  action_items_required TEXT[],
  follow_up_review_needed BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  additional_training_recommended TEXT[],
  
  -- Review status
  review_status TEXT DEFAULT 'draft', -- 'draft', 'completed', 'discussed_with_agent'
  agent_discussion_date DATE,
  agent_acknowledgment BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance optimization indexes
CREATE INDEX idx_performance_goals_period ON performance_goals(agent_email, period_start_date, period_end_date);
CREATE INDEX idx_performance_goals_status ON performance_goals(goal_status, period_end_date);
CREATE INDEX idx_qa_reviews_agent ON quality_assurance_reviews(agent_email, review_date);
CREATE INDEX idx_qa_reviews_reviewer ON quality_assurance_reviews(reviewer_email, review_date);
CREATE INDEX idx_team_metrics_period ON team_performance_metrics(reporting_period, location);
CREATE INDEX idx_team_metrics_location ON team_performance_metrics(location, reporting_period);
CREATE INDEX idx_call_campaigns_status ON call_campaigns(campaign_status, start_date);
CREATE INDEX idx_call_campaigns_type ON call_campaigns(campaign_type, campaign_status);

-- Row Level Security
ALTER TABLE performance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_assurance_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for performance goals
CREATE POLICY "Performance goals visible based on role hierarchy" ON performance_goals
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR agent_email = auth.jwt() ->> 'email' -- Own goals
    OR created_by = auth.jwt() ->> 'email' -- Goals they created
  );

CREATE POLICY "Managers can manage performance goals" ON performance_goals
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    OR created_by = auth.jwt() ->> 'email'
  );

-- RLS Policies for team performance metrics
CREATE POLICY "Supervisors can access team performance data" ON team_performance_metrics
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR (
      auth.jwt() ->> 'role' = 'supervisor' -- Location-based access
      AND location IN (
        SELECT location_name FROM location_staff 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- RLS Policies for QA reviews
CREATE POLICY "QA reviews visible based on role and agent relationship" ON quality_assurance_reviews
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR reviewer_email = auth.jwt() ->> 'email' -- Reviewers can see their reviews
    OR agent_email = auth.jwt() ->> 'email' -- Agents can see their own reviews
  );

CREATE POLICY "Supervisors can manage QA reviews" ON quality_assurance_reviews
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('supervisor', 'manager', 'superadmin')
  );

-- RLS Policies for campaigns
CREATE POLICY "Campaign visibility based on role and assignment" ON call_campaigns
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR created_by = auth.jwt() ->> 'email' -- Created campaigns
    OR managed_by = auth.jwt() ->> 'email' -- Managed campaigns
    OR auth.jwt() ->> 'email' = ANY(assigned_agents) -- Assigned agents
  );

CREATE POLICY "Managers can manage campaigns" ON call_campaigns
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

-- Update triggers
CREATE TRIGGER update_performance_goals_updated_at BEFORE UPDATE ON performance_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_call_campaigns_updated_at BEFORE UPDATE ON call_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quality_assurance_reviews_updated_at BEFORE UPDATE ON quality_assurance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();