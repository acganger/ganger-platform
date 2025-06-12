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

-- Physician support requirements access policies
CREATE POLICY "All staff can view support requirements" ON physician_support_requirements
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage support requirements" ON physician_support_requirements
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

-- Optimization rules access policies
CREATE POLICY "All staff can view optimization rules" ON staffing_optimization_rules
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage optimization rules" ON staffing_optimization_rules
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

-- Analytics access policies
CREATE POLICY "Managers can view analytics" ON staffing_analytics
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'analytics'));

CREATE POLICY "System can manage analytics" ON staffing_analytics
  FOR ALL USING (auth.jwt() ->> 'role' IN ('system', 'superadmin'));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_physician_support_requirements_updated_at BEFORE UPDATE ON physician_support_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON staff_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_availability_updated_at BEFORE UPDATE ON staff_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staffing_optimization_rules_updated_at BEFORE UPDATE ON staffing_optimization_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE staff_members IS 'Clinical support staff members including medical assistants, scribes, nurses, and technicians';
COMMENT ON TABLE physician_support_requirements IS 'Requirements for support staff per provider and appointment type';
COMMENT ON TABLE staff_schedules IS 'Daily schedules for support staff assignments';
COMMENT ON TABLE provider_schedules_cache IS 'Cached provider schedules from ModMed FHIR API';
COMMENT ON TABLE staff_availability IS 'Staff availability preferences and constraints';
COMMENT ON TABLE staffing_optimization_rules IS 'Rules and parameters for AI-powered staffing optimization';
COMMENT ON TABLE staffing_analytics IS 'Daily analytics and metrics for staffing efficiency';

COMMENT ON COLUMN staff_members.role_type IS 'Type of clinical support role: medical_assistant, scribe, nurse, technician';
COMMENT ON COLUMN staff_members.skill_level IS 'Skill level classification for matching requirements';
COMMENT ON COLUMN staff_schedules.assignment_method IS 'How the schedule was created: manual, ai_suggested, auto_optimized';
COMMENT ON COLUMN staff_schedules.coverage_priority IS 'Priority level for coverage (1-100, higher = more important)';
COMMENT ON COLUMN provider_schedules_cache.estimated_support_need IS 'AI-calculated support hours needed';
COMMENT ON COLUMN staffing_optimization_rules.enforcement_level IS 'How strictly to enforce: strict, warning, suggestion';