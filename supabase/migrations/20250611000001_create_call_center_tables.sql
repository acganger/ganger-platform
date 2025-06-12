-- Call Center Operations Dashboard - Database Schema
-- Migration: 20250611000001_create_call_center_tables.sql
-- Description: Create core call center tables for CDR processing and performance tracking

-- Enhanced call records with call center specific data
CREATE TABLE call_center_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT UNIQUE NOT NULL, -- 3CX call identifier
  
  -- Call identification and routing
  location TEXT NOT NULL CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  queue_name TEXT NOT NULL,
  agent_extension TEXT NOT NULL,
  agent_email TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  
  -- Call details
  caller_number TEXT NOT NULL,
  caller_name TEXT,
  called_number TEXT NOT NULL,
  call_direction TEXT NOT NULL, -- 'inbound', 'outbound'
  call_type TEXT, -- 'appointment', 'prescription', 'billing', 'general', 'follow_up'
  
  -- Timing metrics (all in Eastern Time)
  call_start_time TIMESTAMPTZ NOT NULL,
  call_answer_time TIMESTAMPTZ,
  call_end_time TIMESTAMPTZ,
  ring_duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE WHEN call_answer_time IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (call_answer_time - call_start_time))::INTEGER
    ELSE NULL END
  ) STORED,
  talk_duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE WHEN call_end_time IS NOT NULL AND call_answer_time IS NOT NULL
    THEN EXTRACT(EPOCH FROM (call_end_time - call_answer_time))::INTEGER
    ELSE NULL END
  ) STORED,
  
  -- Call outcome and quality
  call_status TEXT NOT NULL, -- 'completed', 'missed', 'abandoned', 'transferred', 'voicemail'
  call_outcome TEXT, -- 'appointment_scheduled', 'information_provided', 'transfer_required', 'callback_scheduled'
  customer_satisfaction_score INTEGER, -- 1-5 rating if collected
  quality_score INTEGER, -- Manager/supervisor rating 1-100
  
  -- Patient and appointment context
  patient_mrn TEXT,
  appointment_scheduled BOOLEAN DEFAULT FALSE,
  appointment_date DATE,
  appointment_type TEXT,
  provider_requested TEXT,
  
  -- Performance indicators
  first_call_resolution BOOLEAN DEFAULT FALSE,
  escalation_required BOOLEAN DEFAULT FALSE,
  complaint_call BOOLEAN DEFAULT FALSE,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  
  -- Recording and compliance
  recording_available BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  recording_reviewed BOOLEAN DEFAULT FALSE,
  compliance_notes TEXT,
  
  -- Productivity metrics
  after_call_work_seconds INTEGER DEFAULT 0, -- Time spent on call-related tasks
  hold_time_seconds INTEGER DEFAULT 0,
  transfer_count INTEGER DEFAULT 0,
  
  -- Call center metadata
  shift_id UUID, -- Reference to agent's shift
  campaign_id TEXT, -- For outbound campaigns
  call_priority TEXT DEFAULT 'normal', -- 'urgent', 'high', 'normal', 'low'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call journaling and detailed call notes
CREATE TABLE call_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_record_id UUID REFERENCES call_center_records(id) ON DELETE CASCADE,
  agent_email TEXT NOT NULL,
  
  -- Call summary and notes
  call_summary TEXT NOT NULL, -- Brief summary of call purpose
  detailed_notes TEXT, -- Detailed interaction notes
  patient_concern TEXT, -- Primary patient concern/request
  resolution_provided TEXT, -- How the concern was addressed
  
  -- Action items and follow-up
  action_items TEXT[], -- Array of action items created
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_type TEXT, -- 'callback', 'appointment', 'provider_review', 'billing'
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  -- Call categorization
  call_tags TEXT[], -- Searchable tags for reporting
  department_involved TEXT[], -- Departments that were consulted
  referral_made BOOLEAN DEFAULT FALSE,
  referral_type TEXT,
  
  -- Quality and training
  coaching_notes TEXT, -- Supervisor coaching notes
  training_opportunities TEXT[], -- Identified training needs
  commendation_worthy BOOLEAN DEFAULT FALSE,
  improvement_areas TEXT[],
  
  -- Status tracking
  journal_status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'reviewed', 'approved'
  submitted_at TIMESTAMPTZ,
  reviewed_by TEXT, -- Supervisor who reviewed
  reviewed_at TIMESTAMPTZ,
  review_score INTEGER, -- Supervisor rating 1-100
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent shifts and scheduling
CREATE TABLE agent_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_email TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  location TEXT NOT NULL,
  
  -- Shift timing
  shift_date DATE NOT NULL,
  scheduled_start_time TIME NOT NULL,
  scheduled_end_time TIME NOT NULL,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  
  -- Break and availability tracking
  total_break_time_minutes INTEGER DEFAULT 0,
  lunch_break_minutes INTEGER DEFAULT 0,
  training_time_minutes INTEGER DEFAULT 0,
  meeting_time_minutes INTEGER DEFAULT 0,
  
  -- Performance during shift
  calls_handled INTEGER DEFAULT 0,
  calls_missed INTEGER DEFAULT 0,
  total_talk_time_seconds INTEGER DEFAULT 0,
  total_available_time_seconds INTEGER DEFAULT 0,
  total_after_call_work_seconds INTEGER DEFAULT 0,
  
  -- Productivity metrics
  utilization_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_available_time_seconds > 0 
    THEN ((total_talk_time_seconds + total_after_call_work_seconds)::DECIMAL / total_available_time_seconds) * 100
    ELSE 0 END
  ) STORED,
  
  calls_per_hour DECIMAL(6,2) GENERATED ALWAYS AS (
    CASE WHEN total_available_time_seconds > 0 
    THEN (calls_handled::DECIMAL / (total_available_time_seconds / 3600))
    ELSE 0 END
  ) STORED,
  
  -- Goals and targets
  call_target INTEGER,
  appointment_target INTEGER,
  quality_target DECIMAL(5,2),
  
  -- Shift notes and status
  shift_notes TEXT,
  tardiness_minutes INTEGER DEFAULT 0,
  early_departure_minutes INTEGER DEFAULT 0,
  shift_status TEXT DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'absent', 'partial'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_email, shift_date)
);

-- Performance optimization indexes
CREATE INDEX idx_call_center_records_agent ON call_center_records(agent_email, call_start_time);
CREATE INDEX idx_call_center_records_outcome ON call_center_records(call_outcome, appointment_scheduled);
CREATE INDEX idx_call_center_records_time ON call_center_records(call_start_time);
CREATE INDEX idx_call_center_records_location ON call_center_records(location, call_start_time);
CREATE INDEX idx_call_journals_agent ON call_journals(agent_email, created_at);
CREATE INDEX idx_call_journals_follow_up ON call_journals(follow_up_required, follow_up_date);
CREATE INDEX idx_agent_shifts_date ON agent_shifts(agent_email, shift_date);
CREATE INDEX idx_agent_shifts_location ON agent_shifts(location, shift_date);

-- Row Level Security
ALTER TABLE call_center_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_shifts ENABLE ROW LEVEL SECURITY;

-- Comprehensive access policies aligned with established patterns
CREATE POLICY "Users can view call records based on role and location" ON call_center_records
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR (
      auth.jwt() ->> 'role' = 'supervisor' -- Location-based team access
      AND location IN (
        SELECT location_name FROM location_staff 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
    OR (
      auth.jwt() ->> 'role' IN ('staff', 'call_center_agent') -- Own records only
      AND agent_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Agents can manage own call journals" ON call_journals
  FOR ALL USING (
    agent_email = auth.jwt() ->> 'email'
    OR auth.jwt() ->> 'role' IN ('supervisor', 'manager', 'superadmin')
  );

CREATE POLICY "Users can view shifts based on role and location" ON agent_shifts
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR (
      auth.jwt() ->> 'role' = 'supervisor' -- Location-based team access
      AND location IN (
        SELECT location_name FROM location_staff 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
    OR (
      auth.jwt() ->> 'role' IN ('staff', 'call_center_agent') -- Own records only
      AND agent_email = auth.jwt() ->> 'email'
    )
  );

-- Create manager/supervisor update policies
CREATE POLICY "Managers can manage call records" ON call_center_records
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Managers can manage agent shifts" ON agent_shifts
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    OR (
      auth.jwt() ->> 'role' = 'supervisor'
      AND location IN (
        SELECT location_name FROM location_staff 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_call_center_records_updated_at BEFORE UPDATE ON call_center_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_call_journals_updated_at BEFORE UPDATE ON call_journals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_shifts_updated_at BEFORE UPDATE ON agent_shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();