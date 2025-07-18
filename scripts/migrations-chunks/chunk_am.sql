    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dropped')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    meeting_id UUID REFERENCES l10_meetings(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meeting participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES l10_meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(10) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
    cursor_position JSONB,
    UNIQUE(meeting_id, user_id)
);

-- Meeting activity table
CREATE TABLE IF NOT EXISTS meeting_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES l10_meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team notifications table
CREATE TABLE IF NOT EXISTS team_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'general' CHECK (type IN ('meeting_reminder', 'rock_due', 'todo_assigned', 'scorecard_missing', 'issue_created', 'general')),
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GWC Assessments table
CREATE TABLE IF NOT EXISTS gwc_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    period VARCHAR(10) NOT NULL, -- 'Q1 2025'
    get_it INTEGER CHECK (get_it >= 1 AND get_it <= 5),
    want_it INTEGER CHECK (want_it >= 1 AND want_it <= 5),
    capacity INTEGER CHECK (capacity >= 1 AND capacity <= 5),
    overall_score DECIMAL(3,2),
    notes TEXT,
    assessed_by UUID REFERENCES auth.users(id),
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_member_id, period)
);

-- Vision/Traction Organizer table
CREATE TABLE IF NOT EXISTS vision_traction_organizer (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT true,
    core_values TEXT[],
    core_focus JSONB DEFAULT '{}'::jsonb,
    ten_year_target TEXT,
    marketing_strategy JSONB DEFAULT '{}'::jsonb,
    three_year_picture TEXT,
    one_year_plan JSONB DEFAULT '{}'::jsonb,
    quarterly_rocks TEXT[],
    issues_list TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_rocks_team_id ON rocks(team_id);
CREATE INDEX IF NOT EXISTS idx_rocks_owner_id ON rocks(owner_id);
CREATE INDEX IF NOT EXISTS idx_rocks_quarter ON rocks(quarter);
CREATE INDEX IF NOT EXISTS idx_issues_team_id ON issues(team_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_todos_team_id ON todos(team_id);
CREATE INDEX IF NOT EXISTS idx_todos_assigned_to ON todos(assigned_to);
CREATE INDEX IF NOT EXISTS idx_scorecard_entries_metric_id ON scorecard_entries(metric_id);
CREATE INDEX IF NOT EXISTS idx_scorecard_entries_week_ending ON scorecard_entries(week_ending);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_eos_teams_updated_at BEFORE UPDATE ON eos_teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_meetings_updated_at BEFORE UPDATE ON l10_meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rocks_updated_at BEFORE UPDATE ON rocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scorecards_updated_at BEFORE UPDATE ON scorecards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vision_traction_organizer_updated_at BEFORE UPDATE ON vision_traction_organizer FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security policies
ALTER TABLE eos_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rock_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gwc_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_traction_organizer ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access teams they're members of)
CREATE POLICY "Users can view teams they're members of" ON eos_teams FOR SELECT
    USING (id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view team members for their teams" ON team_members FOR SELECT
    USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view rocks for their teams" ON rocks FOR SELECT
    USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view issues for their teams" ON issues FOR SELECT
    USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view todos for their teams" ON todos FOR SELECT
    USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

-- Add similar policies for other tables...
-- (In production, you'd want more granular policies based on roles)


-- Migration: 20250614_eos_l10_seed.sql
-- ==========================================

-- EOS L10 Seed Data
-- Creates initial team and user data for testing

-- Insert demo team
INSERT INTO eos_teams (id, name, description, owner_id, settings) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174000',
    'Leadership Team',
    'Executive leadership team for Ganger Dermatology',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    '{
        "meeting_day": "Monday",
        "meeting_time": "09:00",
        "timezone": "America/New_York", 
        "meeting_duration": 90,
        "scorecard_frequency": "weekly",
        "rock_quarters": ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert team members (assuming we have some users in auth.users)
INSERT INTO team_members (team_id, user_id, role, seat) 
SELECT 
    '123e4567-e89b-12d3-a456-426614174000',
    u.id,
    CASE 
        WHEN u.email = 'anand@gangerdermatology.com' THEN 'leader'
        ELSE 'member'
    END,
    CASE 
        WHEN u.email = 'anand@gangerdermatology.com' THEN 'Chief Technology Officer'
        ELSE 'Team Member'
    END
FROM auth.users u 
WHERE u.email LIKE '%@gangerdermatology.com'
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Insert sample rocks
INSERT INTO rocks (team_id, owner_id, title, description, quarter, status, completion_percentage, priority, due_date) VALUES
(
    '123e4567-e89b-12d3-a456-426614174000',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    'Q1 Patient Experience Initiative',
    'Improve patient satisfaction scores and reduce wait times',
    'Q1 2025',
    'on_track',
    75,
    8,
    '2025-03-31'
),
(
    '123e4567-e89b-12d3-a456-426614174000',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    'New EHR System Implementation',
    'Deploy new electronic health records system across all locations',
    'Q1 2025',
    'off_track',
    45,
    9,
    '2025-03-15'
) ON CONFLICT DO NOTHING;

-- Insert sample scorecard
INSERT INTO scorecards (id, team_id, name, description) VALUES
(
    '223e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Leadership Scorecard',
    'Key metrics for leadership team performance'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample scorecard metrics
INSERT INTO scorecard_metrics (scorecard_id, name, description, goal, measurement_type, frequency, owner_id, sort_order) VALUES
(
    '223e4567-e89b-12d3-a456-426614174000',
    'Patient Satisfaction Score',
    'Weekly average patient satisfaction rating',
    4.5,
    'number',
    'weekly',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    1
),
(
    '223e4567-e89b-12d3-a456-426614174000',
    'Average Wait Time',
    'Average patient wait time in minutes',
    15.0,
    'number',
    'weekly',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    2
),
(
    '223e4567-e89b-12d3-a456-426614174000',
    'Revenue Target Achievement',
    'Percentage of weekly revenue target achieved',
    100.0,
    'percentage',
    'weekly',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    3
) ON CONFLICT DO NOTHING;

-- Insert sample issues
INSERT INTO issues (team_id, title, description, type, priority, status, created_by) VALUES
(
    '123e4567-e89b-12d3-a456-426614174000',
    'EHR Training Delays',
    'Staff training on new EHR system is behind schedule',
    'process',
    'high',
    'identified',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
),
(
    '123e4567-e89b-12d3-a456-426614174000',
    'Appointment Scheduling System Issues',
    'Patients reporting difficulty booking appointments online',
    'obstacle',
    'medium',
    'discussing',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Insert sample todos
INSERT INTO todos (team_id, title, description, assigned_to, created_by, due_date, status, priority) VALUES
(
    '123e4567-e89b-12d3-a456-426614174000',
    'Complete EHR vendor evaluation',
    'Finish technical evaluation of remaining EHR vendors',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    '2025-01-20',
    'in_progress',
    'high'
),
(
    '123e4567-e89b-12d3-a456-426614174000',
    'Update patient communication templates',
    'Revise automated patient communication templates for clarity',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    '2025-01-25',
    'pending',
    'medium'
) ON CONFLICT DO NOTHING;

-- Insert sample meeting
INSERT INTO l10_meetings (id, team_id, title, scheduled_date, start_time, status, facilitator_id) VALUES
(
    '323e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Weekly Leadership L10',
    '2025-01-20',
    '09:00:00',
    'scheduled',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;


-- Migration: 2025_01_11_create_batch_closeout_tables.sql
-- ==========================================

-- Migration: 2025_01_11_create_batch_closeout_tables.sql
-- Batch Closeout & Label Generator Database Schema

-- Batch report uploads and processing
CREATE TABLE batch_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and location info
  staff_email TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  location TEXT NOT NULL, -- Ann Arbor (A2), Plymouth (PY), Wixom (WX)
  
  -- File information
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  file_upload_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Parsed batch information (from filename - unreliable)
  batch_date DATE,
  batch_info TEXT, -- Raw filename batch info (user-generated, inconsistent)
  filename_location_hint TEXT, -- Extracted location hint from filename (unreliable)
  filename_user_hint TEXT, -- Extracted user hint from filename (unreliable)
  
  -- Reliable data extracted from PDF content
  pdf_batch_date DATE, -- Actual batch date from PDF content
  pdf_location TEXT, -- Ann Arbor (A2/AA), Plymouth (PY), Wixom (WX)
  pdf_staff_name TEXT, -- Staff name from PDF content
  pdf_batch_id TEXT, -- ModMed batch ID from PDF
  
  -- Processing status
  processing_status TEXT DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'parsed', 'verified', 'label_generated')),
  pdf_parsing_status TEXT DEFAULT 'pending' CHECK (pdf_parsing_status IN ('pending', 'processing', 'success', 'failed')),
  parsing_error_message TEXT,
  parsed_at TIMESTAMPTZ,
  
  -- Extracted payment amounts from PDF
  extracted_cash DECIMAL(10,2) DEFAULT 0.00,
  extracted_checks DECIMAL(10,2) DEFAULT 0.00,
  extracted_credit_cards DECIMAL(10,2) DEFAULT 0.00,
  extracted_gift_certificates DECIMAL(10,2) DEFAULT 0.00,
  extracted_coupons DECIMAL(10,2) DEFAULT 0.00,
  extracted_other DECIMAL(10,2) DEFAULT 0.00,
  extracted_total DECIMAL(10,2) GENERATED ALWAYS AS (
    extracted_cash + extracted_checks + extracted_credit_cards + 
    extracted_gift_certificates + extracted_coupons + extracted_other
  ) STORED,
  
  -- Staff verified amounts (what's actually in envelope)
  verified_cash DECIMAL(10,2),
  verified_checks DECIMAL(10,2),
  verified_credit_cards DECIMAL(10,2),
  verified_gift_certificates DECIMAL(10,2),
  verified_coupons DECIMAL(10,2),
  verified_other DECIMAL(10,2),
  verified_total DECIMAL(10,2) GENERATED ALWAYS AS (
    COALESCE(verified_cash, 0) + COALESCE(verified_checks, 0) + COALESCE(verified_credit_cards, 0) + 
    COALESCE(verified_gift_certificates, 0) + COALESCE(verified_coupons, 0) + COALESCE(verified_other, 0)
  ) STORED,
  
  -- Verification status and discrepancies
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'discrepancy_noted')),
  has_discrepancies BOOLEAN GENERATED ALWAYS AS (
    (COALESCE(verified_cash, 0) != extracted_cash) OR
    (COALESCE(verified_checks, 0) != extracted_checks) OR
    (COALESCE(verified_credit_cards, 0) != extracted_credit_cards) OR
    (COALESCE(verified_gift_certificates, 0) != extracted_gift_certificates) OR
    (COALESCE(verified_coupons, 0) != extracted_coupons) OR
    (COALESCE(verified_other, 0) != extracted_other)
  ) STORED,
  discrepancy_explanation TEXT,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  
  -- Label generation
  label_generated BOOLEAN DEFAULT FALSE,
  label_file_path TEXT,
  label_printed BOOLEAN DEFAULT FALSE,
  label_generated_at TIMESTAMPTZ,
  label_printed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual discrepancies for detailed tracking
CREATE TABLE batch_discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_report_id UUID NOT NULL REFERENCES batch_reports(id) ON DELETE CASCADE,
  
  -- Discrepancy details
  payment_type TEXT NOT NULL, -- cash, checks, credit_cards, etc.
  extracted_amount DECIMAL(10,2) NOT NULL,
  verified_amount DECIMAL(10,2) NOT NULL,
  variance_amount DECIMAL(10,2) GENERATED ALWAYS AS (verified_amount - extracted_amount) STORED,
  
  -- Explanations and resolution
  staff_explanation TEXT,
  manager_notes TEXT,
  resolution_status TEXT DEFAULT 'noted' CHECK (resolution_status IN ('noted', 'investigated', 'resolved', 'accepted')),
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Label templates for envelope labels
CREATE TABLE envelope_label_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template information
  template_name TEXT NOT NULL,
  template_description TEXT,
  
  -- Label dimensions and layout
  label_width_mm DECIMAL(6,2) NOT NULL DEFAULT 101.6, -- 4 inches
  label_height_mm DECIMAL(6,2) NOT NULL DEFAULT 50.8, -- 2 inches
  
  -- Template configuration
  template_data JSONB NOT NULL, -- Label layout and styling configuration
  font_family TEXT DEFAULT 'Arial',
  font_size INTEGER DEFAULT 10,
  margin_top_mm DECIMAL(4,2) DEFAULT 3.0,
  margin_left_mm DECIMAL(4,2) DEFAULT 3.0,
  margin_right_mm DECIMAL(4,2) DEFAULT 3.0,
  margin_bottom_mm DECIMAL(4,2) DEFAULT 3.0,
  
  -- Features
  include_qr_code BOOLEAN DEFAULT TRUE,
  include_amounts_table BOOLEAN DEFAULT TRUE,
  include_discrepancy_section BOOLEAN DEFAULT TRUE,
  include_verification_signature BOOLEAN DEFAULT FALSE,
  
  -- Template status
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated envelope labels
CREATE TABLE generated_envelope_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_report_id UUID NOT NULL REFERENCES batch_reports(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES envelope_label_templates(id),
  
  -- Label content
  label_data JSONB NOT NULL, -- Complete label content and data
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  
  -- QR code for tracking
  qr_code_data TEXT, -- Batch tracking information
  
  -- Print management
  print_status TEXT DEFAULT 'ready' CHECK (print_status IN ('ready', 'printing', 'printed', 'failed')),
  print_attempts INTEGER DEFAULT 0,
  last_print_attempt TIMESTAMPTZ,
  print_error_message TEXT,
  
  -- Audit
  generated_by TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  printed_at TIMESTAMPTZ
);

-- PDF parsing patterns and rules
CREATE TABLE pdf_parsing_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pattern identification
  pattern_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('amount_extraction', 'date_extraction', 'location_mapping', 'staff_identification')),
  
  -- Pattern definition
  regex_pattern TEXT NOT NULL,
  extraction_rules JSONB NOT NULL,
  validation_rules JSONB,
  
  -- Pattern effectiveness
  success_rate DECIMAL(5,2),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Pattern status
  is_active BOOLEAN DEFAULT TRUE,
  priority_order INTEGER DEFAULT 100,
  
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily batch summary for analytics
CREATE TABLE daily_batch_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Summary period
  summary_date DATE NOT NULL,
  location TEXT NOT NULL,
  
  -- Batch counts
  total_batches INTEGER DEFAULT 0,
  total_with_discrepancies INTEGER DEFAULT 0,
  discrepancy_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_batches > 0 
    THEN (total_with_discrepancies::DECIMAL / total_batches::DECIMAL) * 100 
    ELSE 0 END
  ) STORED,
  
  -- Amount totals
  total_extracted_amount DECIMAL(12,2) DEFAULT 0.00,
  total_verified_amount DECIMAL(12,2) DEFAULT 0.00,
  total_variance_amount DECIMAL(12,2) GENERATED ALWAYS AS (
    total_verified_amount - total_extracted_amount
  ) STORED,
  
  -- Processing stats
  successful_uploads INTEGER DEFAULT 0,
  failed_parsing INTEGER DEFAULT 0,
  labels_generated INTEGER DEFAULT 0,
  labels_printed INTEGER DEFAULT 0,
  
  -- Timing
  average_processing_time_minutes DECIMAL(8,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(summary_date, location)
);

-- System configuration
CREATE TABLE batch_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  last_updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_batch_reports_staff ON batch_reports(staff_email);
CREATE INDEX idx_batch_reports_date ON batch_reports(batch_date);
CREATE INDEX idx_batch_reports_location ON batch_reports(location);
CREATE INDEX idx_batch_reports_status ON batch_reports(processing_status);
CREATE INDEX idx_batch_reports_verification ON batch_reports(verification_status);
CREATE INDEX idx_batch_discrepancies_batch ON batch_discrepancies(batch_report_id);
CREATE INDEX idx_generated_labels_batch ON generated_envelope_labels(batch_report_id);
CREATE INDEX idx_generated_labels_status ON generated_envelope_labels(print_status);
CREATE INDEX idx_daily_summary_date_location ON daily_batch_summary(summary_date, location);
CREATE INDEX idx_pdf_patterns_type ON pdf_parsing_patterns(pattern_type, is_active);

-- Row Level Security
ALTER TABLE batch_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE envelope_label_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_envelope_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_parsing_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_batch_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_system_config ENABLE ROW LEVEL SECURITY;

-- Access policies
CREATE POLICY "Staff can access own batch reports" ON batch_reports
  FOR ALL USING (
    staff_email = auth.jwt() ->> 'email'
    OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Staff can access related discrepancies" ON batch_discrepancies
  FOR ALL USING (
    batch_report_id IN (
      SELECT id FROM batch_reports 
      WHERE staff_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Staff can read label templates" ON envelope_label_templates
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin')
  );

CREATE POLICY "Managers can manage templates" ON envelope_label_templates
  FOR INSERT, UPDATE, DELETE USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Staff can access own labels" ON generated_envelope_labels
  FOR ALL USING (
    batch_report_id IN (
      SELECT id FROM batch_reports 
      WHERE staff_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Managers can view summaries" ON daily_batch_summary
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Managers can manage config" ON batch_system_config
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

-- Insert default parsing patterns
INSERT INTO pdf_parsing_patterns (pattern_name, pattern_type, regex_pattern, extraction_rules, created_by) VALUES
('ModMed Cash Amount', 'amount_extraction', '(?:cash|currency)[:\s]*\$?(\d+\.?\d{0,2})', '{"field": "cash", "multiplier": 1, "validation": "positive_number"}', 'system'),
('ModMed Check Amount', 'amount_extraction', '(?:check|cheque)[:\s]*\$?(\d+\.?\d{0,2})', '{"field": "checks", "multiplier": 1, "validation": "positive_number"}', 'system'),
('ModMed Credit Card', 'amount_extraction', '(?:credit|card|visa|mastercard)[:\s]*\$?(\d+\.?\d{0,2})', '{"field": "credit_cards", "multiplier": 1, "validation": "positive_number"}', 'system'),
('Batch Date Pattern', 'date_extraction', '(\d{1,2}\/\d{1,2}\/\d{4})', '{"format": "MM/DD/YYYY", "field": "batch_date"}', 'system'),
('Location Code AA', 'location_mapping', '(?:ann arbor|AA|A2)', '{"location_code": "A2", "location_name": "Ann Arbor"}', 'system'),
('Location Code PY', 'location_mapping', '(?:plymouth|PY)', '{"location_code": "PY", "location_name": "Plymouth"}', 'system'),
('Location Code WX', 'location_mapping', '(?:wixom|WX)', '{"location_code": "WX", "location_name": "Wixom"}', 'system');

-- Insert default system configurations
INSERT INTO batch_system_config (config_key, config_value, description) VALUES
('auto_parse_uploads', 'true', 'Automatically parse PDF files upon upload'),
('require_verification', 'true', 'Require staff verification of all amounts'),
('enable_discrepancy_alerts', 'true', 'Send alerts for discrepancies above threshold'),
('discrepancy_threshold_dollars', '5.00', 'Dollar threshold for discrepancy alerts'),
('discrepancy_threshold_percentage', '2.0', 'Percentage threshold for discrepancy alerts'),
('enable_qr_codes', 'true', 'Include QR codes on labels for tracking'),
('max_file_size_mb', '10', 'Maximum upload file size in megabytes'),
('supported_file_types', '["pdf"]', 'Supported file types for upload'),
('pdf_parsing_timeout_seconds', '30', 'Maximum time allowed for PDF parsing'),
('label_generation_timeout_seconds', '15', 'Maximum time for label generation');

-- Insert default label template
INSERT INTO envelope_label_templates (
  template_name, 
  template_description, 
  template_data, 
  is_default, 
  created_by
) VALUES (
  'Standard Batch Label',
  'Default template for batch closeout envelope labels',
  '{
    "sections": [
      {
        "type": "header",
        "content": "GANGER DERMATOLOGY BATCH CLOSEOUT",
        "fontSize": 14,
        "bold": true,
        "align": "center"
      },
      {
        "type": "spacer",
        "height": 3
      },
      {
        "type": "info",
        "content": "Date: {{batch_date}} | Location: {{location}} | Staff: {{staff_name}}",
        "fontSize": 10
      },
      {
        "type": "spacer",
        "height": 2
      },
      {
        "type": "amounts_table",
        "title": "VERIFIED AMOUNTS",
        "fontSize": 11
      },
      {
        "type": "spacer",
        "height": 2
      },
      {
        "type": "total",
        "content": "TOTAL: ${{verified_total}}",
        "fontSize": 14,
        "bold": true
      },
      {
        "type": "discrepancies",
        "fontSize": 9
      },
      {
        "type": "qr",
        "size": 25,
        "position": "bottom-right"
      }
    ]
  }',
  true,
  'system'
);


-- Migration: 2025_01_11_create_clinical_staffing_tables.sql
-- ==========================================

-- Clinical Support Staffing Optimization - Database Migration
-- Migration: 2025_01_11_create_clinical_staffing_tables.sql
-- Author: Terminal 2 - Backend Development
-- Description: Create all database tables for clinical staffing optimization system

-- Staff members table
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  employee_id TEXT UNIQUE NOT NULL CHECK (employee_id ~ '^[A-Z]{2,4}\d{4,8}$'),
  first_name TEXT NOT NULL CHECK (LENGTH(first_name) >= 1 AND LENGTH(first_name) <= 50),
  last_name TEXT NOT NULL CHECK (LENGTH(last_name) >= 1 AND LENGTH(last_name) <= 50),
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$'),
  phone TEXT CHECK (phone IS NULL OR phone ~ '^\+?[\d\s\-\(\)]{10,}$'),
  role_type TEXT NOT NULL CHECK (role_type IN ('medical_assistant', 'scribe', 'nurse', 'technician', 'nurse_practitioner', 'physician_assistant')),
  primary_location_id UUID NOT NULL REFERENCES locations(id),
  additional_locations UUID[] DEFAULT '{}',
  skill_level TEXT DEFAULT 'intermediate' CHECK (skill_level IN ('entry', 'intermediate', 'advanced', 'expert')),
  certifications TEXT[] DEFAULT '{}',
  max_hours_per_week INTEGER DEFAULT 40 CHECK (max_hours_per_week > 0 AND max_hours_per_week <= 80),
  preferred_schedule_type TEXT CHECK (preferred_schedule_type IN ('full_time', 'part_time', 'per_diem', 'flexible')),
  hire_date DATE NOT NULL,
  termination_date DATE CHECK (termination_date IS NULL OR termination_date > hire_date),
  employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'on_leave', 'terminated')),
  deputy_user_id TEXT,
  zenefits_employee_id TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  modified_by UUID REFERENCES users(id),
  version INTEGER DEFAULT 1 NOT NULL
);

-- Physician support requirements
CREATE TABLE physician_support_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  appointment_type TEXT,
  required_medical_assistants INTEGER DEFAULT 1,
  required_scribes INTEGER DEFAULT 0,
  required_skill_level TEXT DEFAULT 'intermediate' CHECK (required_skill_level IN ('junior', 'intermediate', 'senior', 'specialist')),
  special_requirements TEXT[] DEFAULT '{}',
  buffer_time_minutes INTEGER DEFAULT 15,
  notes TEXT,
  effective_start_date DATE,
  effective_end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  UNIQUE(provider_id, location_id, appointment_type)
);

-- Staff schedules
CREATE TABLE staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL CHECK (schedule_date >= CURRENT_DATE - INTERVAL '1 year'),
  location_id UUID NOT NULL REFERENCES locations(id),
  shift_start_time TIME NOT NULL,
  shift_end_time TIME NOT NULL,
  break_start_time TIME CHECK (break_start_time IS NULL OR (break_start_time >= shift_start_time AND break_start_time < shift_end_time)),
  break_end_time TIME CHECK (break_end_time IS NULL OR (break_end_time > break_start_time AND break_end_time <= shift_end_time)),
  assigned_providers TEXT[] DEFAULT '{}',
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('regular', 'overtime', 'on_call', 'substitute', 'training')),
  assignment_method TEXT DEFAULT 'manual' CHECK (assignment_method IN ('manual', 'ai_suggested', 'auto_optimized')),
  coverage_priority INTEGER DEFAULT 50 CHECK (coverage_priority BETWEEN 1 AND 100),
  special_assignments TEXT[] DEFAULT '{}',
  notes TEXT CHECK (LENGTH(notes) <= 1000),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  deputy_schedule_id TEXT,
  last_modified_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1 NOT NULL,
  
  UNIQUE(staff_member_id, schedule_date, shift_start_time),
  CHECK (shift_end_time != shift_start_time),
  CHECK (
    -- Normal day shift
    (shift_end_time > shift_start_time) OR 
    -- Overnight shift (must end before noon next day)
    (shift_end_time < shift_start_time AND shift_end_time <= '12:00:00')
  ),
  CHECK (
    -- Maximum 16 hour shift limit
    (shift_end_time > shift_start_time AND 
     EXTRACT(EPOCH FROM (shift_end_time - shift_start_time)) <= 57600) OR
    (shift_end_time < shift_start_time AND 
     EXTRACT(EPOCH FROM (shift_end_time + INTERVAL '24 hours' - shift_start_time)) <= 57600)
  )
);

-- Provider schedules cache
CREATE TABLE provider_schedules_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  appointment_type TEXT,
  patient_count INTEGER DEFAULT 0,
  estimated_support_need DECIMAL(3,1),
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  modmed_appointment_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, schedule_date, start_time, location_id)
);

-- Staff availability
CREATE TABLE staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id),
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  days_of_week INTEGER[] NOT NULL,
  available_start_time TIME NOT NULL,
  available_end_time TIME NOT NULL,
  location_preferences UUID[] DEFAULT '{}',
  unavailable_dates DATE[] DEFAULT '{}',
  preferred_providers TEXT[] DEFAULT '{}',
  max_consecutive_days INTEGER DEFAULT 5,
  min_hours_between_shifts INTEGER DEFAULT 12,
  overtime_willing BOOLEAN DEFAULT FALSE,
  cross_location_willing BOOLEAN DEFAULT FALSE,
  notes TEXT,
  deputy_availability_id TEXT,
  last_updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staffing optimization rules
CREATE TABLE staffing_optimization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('ratio_requirement', 'skill_matching', 'location_preference', 'workload_balance')),
  location_id UUID REFERENCES locations(id),
  provider_id TEXT,
  rule_parameters JSONB NOT NULL,
  priority_weight INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  enforcement_level TEXT DEFAULT 'warning' CHECK (enforcement_level IN ('strict', 'warning', 'suggestion')),
  created_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staffing analytics
CREATE TABLE staffing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analytics_date DATE NOT NULL,
  location_id UUID REFERENCES locations(id),
  total_provider_hours DECIMAL(6,2),
  total_support_hours DECIMAL(6,2),
  optimal_support_hours DECIMAL(6,2),
  coverage_percentage DECIMAL(5,2),
  understaffed_periods INTEGER DEFAULT 0,
  overstaffed_periods INTEGER DEFAULT 0,
  cross_location_assignments INTEGER DEFAULT 0,
  overtime_hours DECIMAL(6,2) DEFAULT 0,
  staff_utilization_rate DECIMAL(5,2),
  patient_satisfaction_impact DECIMAL(3,2),
  cost_efficiency_score DECIMAL(5,2),
  optimization_suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(analytics_date, location_id)
);

-- Enterprise-grade performance indexes
-- High-performance composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_staff_members_user_active ON staff_members(user_id, employment_status) WHERE employment_status = 'active';
CREATE INDEX CONCURRENTLY idx_staff_members_location_role ON staff_members(primary_location_id, role_type, employment_status);
CREATE INDEX CONCURRENTLY idx_staff_members_email_unique ON staff_members(LOWER(email)) WHERE employment_status != 'terminated';

-- Covering indexes for staff schedules (include frequently accessed columns)
CREATE INDEX CONCURRENTLY idx_staff_schedules_date_location_status ON staff_schedules(schedule_date, location_id, status) 
  INCLUDE (staff_member_id, shift_start_time, shift_end_time, assigned_providers) 
  WHERE status != 'cancelled';

CREATE INDEX CONCURRENTLY idx_staff_schedules_member_date_desc ON staff_schedules(staff_member_id, schedule_date DESC, status) 
  WHERE schedule_date >= CURRENT_DATE - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY idx_staff_schedules_future_confirmed ON staff_schedules(schedule_date, location_id) 
  WHERE status IN ('scheduled', 'confirmed') AND schedule_date >= CURRENT_DATE;

-- Optimized provider schedule indexes
CREATE INDEX CONCURRENTLY idx_provider_schedules_sync_status ON provider_schedules_cache(last_synced_at, schedule_date) 
  WHERE last_synced_at < (NOW() - INTERVAL '1 hour');

CREATE INDEX CONCURRENTLY idx_provider_schedules_location_date ON provider_schedules_cache(location_id, schedule_date, provider_id);

-- Advanced availability indexes
CREATE INDEX CONCURRENTLY idx_staff_availability_active_range ON staff_availability(staff_member_id, date_range_start, date_range_end) 
  WHERE date_range_end >= CURRENT_DATE;

CREATE INDEX CONCURRENTLY idx_staff_availability_days_location ON staff_availability USING GIN(days_of_week, location_preferences) 
  WHERE date_range_end >= CURRENT_DATE;

-- Analytics optimization indexes
CREATE INDEX CONCURRENTLY idx_staffing_analytics_location_date_desc ON staffing_analytics(location_id, analytics_date DESC);
CREATE INDEX CONCURRENTLY idx_staffing_analytics_recent ON staffing_analytics(analytics_date DESC, location_id) 
  WHERE analytics_date >= CURRENT_DATE - INTERVAL '90 days';
CREATE INDEX idx_provider_schedules_date ON provider_schedules_cache(schedule_date);
CREATE INDEX idx_provider_schedules_provider ON provider_schedules_cache(provider_id, schedule_date);
CREATE INDEX idx_provider_schedules_location ON provider_schedules_cache(location_id, schedule_date);
CREATE INDEX idx_staff_availability_member ON staff_availability(staff_member_id);
CREATE INDEX idx_staff_availability_dates ON staff_availability(date_range_start, date_range_end);
CREATE INDEX idx_staff_availability_days ON staff_availability USING GIN(days_of_week);
CREATE INDEX idx_staffing_analytics_date ON staffing_analytics(analytics_date);
CREATE INDEX idx_staffing_analytics_location ON staffing_analytics(location_id, analytics_date);
CREATE INDEX idx_optimization_rules_active ON staffing_optimization_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_optimization_rules_location ON staffing_optimization_rules(location_id);

-- Row Level Security policies
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE physician_support_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_schedules_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_optimization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_analytics ENABLE ROW LEVEL SECURITY;

-- Staff members access policies
CREATE POLICY "Staff can view own profile" ON staff_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler', 'hr')
  );

CREATE POLICY "Managers can manage staff profiles" ON staff_members
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'hr'));

CREATE POLICY "HR can manage all staff data" ON staff_members
  FOR ALL USING (auth.jwt() ->> 'role' IN ('hr', 'superadmin'));

-- Staff schedules access policies
CREATE POLICY "Staff can view own schedules" ON staff_schedules
  FOR SELECT USING (
    staff_member_id IN (
      SELECT id FROM staff_members WHERE user_id = auth.uid()
    ) OR auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler')
  );

CREATE POLICY "Managers can manage all staffing schedules" ON staff_schedules
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler'));

-- Staff availability access policies
CREATE POLICY "Staff can view own availability" ON staff_availability
  FOR SELECT USING (
    staff_member_id IN (
      SELECT id FROM staff_members WHERE user_id = auth.uid()
    ) OR auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler')
  );

CREATE POLICY "Staff can update own availability" ON staff_availability
  FOR UPDATE USING (
    staff_member_id IN (
      SELECT id FROM staff_members WHERE user_id = auth.uid()
    ) OR auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler')
  );

CREATE POLICY "Staff can insert own availability" ON staff_availability
  FOR INSERT WITH CHECK (
    staff_member_id IN (
      SELECT id FROM staff_members WHERE user_id = auth.uid()
    ) OR auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler')
  );

-- Provider schedules cache access policies
CREATE POLICY "All authenticated users can view provider schedules" ON provider_schedules_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only system can manage provider schedules cache" ON provider_schedules_cache
  FOR ALL USING (auth.jwt() ->> 'role' IN ('system', 'superadmin'));

