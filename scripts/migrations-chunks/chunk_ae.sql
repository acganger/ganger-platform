        COALESCE(analytics_data.denied_appointments, 0),
        COALESCE(analytics_data.completed_appointments, 0),
        COALESCE(analytics_data.total_participants, 0),
        COALESCE(analytics_data.unique_reps, 0),
        COALESCE(analytics_data.unique_companies, 0),
        analytics_data.avg_lead_time,
        analytics_data.avg_approval_time,
        analytics_data.cancellation_rate,
        analytics_data.attendance_rate,
        analytics_data.approval_rate,
        analytics_data.most_popular_time,
        analytics_data.busiest_day::INTEGER,
        analytics_data.peak_booking_hour::INTEGER,
        COALESCE(analytics_data.total_communication_volume, 0)
    )
    ON CONFLICT (analytics_date, location) 
    DO UPDATE SET
        total_appointments = EXCLUDED.total_appointments,
        confirmed_appointments = EXCLUDED.confirmed_appointments,
        cancelled_appointments = EXCLUDED.cancelled_appointments,
        denied_appointments = EXCLUDED.denied_appointments,
        completed_appointments = EXCLUDED.completed_appointments,
        total_participants = EXCLUDED.total_participants,
        unique_reps = EXCLUDED.unique_reps,
        unique_companies = EXCLUDED.unique_companies,
        average_booking_lead_time_days = EXCLUDED.average_booking_lead_time_days,
        average_approval_time_hours = EXCLUDED.average_approval_time_hours,
        cancellation_rate = EXCLUDED.cancellation_rate,
        attendance_rate = EXCLUDED.attendance_rate,
        approval_rate = EXCLUDED.approval_rate,
        most_popular_time_slot = EXCLUDED.most_popular_time_slot,
        busiest_day_of_week = EXCLUDED.busiest_day_of_week,
        peak_booking_hour = EXCLUDED.peak_booking_hour,
        total_communication_volume = EXCLUDED.total_communication_volume;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUTOMATED UPDATES
-- =====================================================

-- Trigger to update analytics when appointments change
CREATE OR REPLACE FUNCTION trigger_update_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update analytics for the affected date/location
    IF TG_OP = 'DELETE' THEN
        PERFORM update_pharma_analytics(OLD.appointment_date, OLD.location);
        RETURN OLD;
    ELSE
        PERFORM update_pharma_analytics(NEW.appointment_date, NEW.location);
        IF TG_OP = 'UPDATE' AND (OLD.appointment_date != NEW.appointment_date OR OLD.location != NEW.location) THEN
            PERFORM update_pharma_analytics(OLD.appointment_date, OLD.location);
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_update_trigger
    AFTER INSERT OR UPDATE OR DELETE ON pharma_appointments
    FOR EACH ROW EXECUTE FUNCTION trigger_update_analytics();

-- Trigger to update appointment timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pharma_reps_modtime 
    BEFORE UPDATE ON pharma_representatives 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_activities_modtime 
    BEFORE UPDATE ON scheduling_activities 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_appointments_modtime 
    BEFORE UPDATE ON pharma_appointments 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_booking_rules_modtime 
    BEFORE UPDATE ON booking_rules 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample scheduling activities
INSERT INTO scheduling_activities (
    activity_name, location, location_address, duration_minutes, 
    available_days, available_times, description
) VALUES 
    (
        'Pharmaceutical Lunch - Ann Arbor',
        'Ann Arbor',
        '4140 East Morgan Road, Ann Arbor, MI 48108',
        60,
        '{1,2,3,4,5}',
        '{"monday": [{"start": "11:30", "end": "14:00"}], "tuesday": [{"start": "11:30", "end": "14:00"}], "wednesday": [{"start": "11:30", "end": "14:00"}], "thursday": [{"start": "11:30", "end": "14:00"}], "friday": [{"start": "11:30", "end": "14:00"}]}'::jsonb,
        'Pharmaceutical representative lunch meeting for Ann Arbor clinic'
    ),
    (
        'Pharmaceutical Lunch - Plymouth',
        'Plymouth',
        '9500 S. Main Street, Plymouth, MI 48170',
        60,
        '{1,2,3,4,5}',
        '{"monday": [{"start": "11:30", "end": "14:00"}], "tuesday": [{"start": "11:30", "end": "14:00"}], "wednesday": [{"start": "11:30", "end": "14:00"}], "thursday": [{"start": "11:30", "end": "14:00"}], "friday": [{"start": "11:30", "end": "14:00"}]}'::jsonb,
        'Pharmaceutical representative lunch meeting for Plymouth clinic'
    ),
    (
        'Pharmaceutical Lunch - Wixom',
        'Wixom',
        '29531 Beck Road, Wixom, MI 48393',
        60,
        '{1,2,3,4,5}',
        '{"monday": [{"start": "11:30", "end": "14:00"}], "tuesday": [{"start": "11:30", "end": "14:00"}], "wednesday": [{"start": "11:30", "end": "14:00"}], "thursday": [{"start": "11:30", "end": "14:00"}], "friday": [{"start": "11:30", "end": "14:00"}]}'::jsonb,
        'Pharmaceutical representative lunch meeting for Wixom clinic'
    );

-- Insert sample booking rules
INSERT INTO booking_rules (
    rule_name, rule_type, rule_conditions, rule_actions, priority
) VALUES 
    (
        'Minimum Lead Time',
        'lead_time_requirement',
        '{"minimum_hours": 24}'::jsonb,
        '{"block_booking": true, "message": "Bookings must be made at least 24 hours in advance"}'::jsonb,
        1
    ),
    (
        'Maximum Daily Bookings',
        'capacity_limit',
        '{"max_per_day": 3}'::jsonb,
        '{"block_booking": true, "message": "Maximum 3 pharmaceutical meetings per day"}'::jsonb,
        2
    ),
    (
        'Holiday Blackout',
        'blackout_period',
        '{"blackout_dates": ["2024-12-25", "2024-01-01", "2024-07-04", "2024-11-28"]}'::jsonb,
        '{"block_booking": true, "message": "Bookings not available on holidays"}'::jsonb,
        3
    );

COMMENT ON TABLE pharma_representatives IS 'Pharmaceutical representative accounts and contact information';
COMMENT ON TABLE scheduling_activities IS 'Available booking activities (equivalent to TimeTrade activities)';
COMMENT ON TABLE pharma_appointments IS 'Core appointment booking records with approval workflow';
COMMENT ON TABLE appointment_participants IS 'Staff participation tracking for appointments';
COMMENT ON TABLE availability_overrides IS 'Blackout dates and special availability hours';
COMMENT ON TABLE pharma_communications IS 'Complete communication audit trail for compliance';
COMMENT ON TABLE pharma_analytics IS 'Daily analytics and reporting metrics';
COMMENT ON TABLE approval_workflows IS 'Multi-stage approval process tracking';
COMMENT ON TABLE booking_rules IS 'Business rules and constraints for booking system';

-- =====================================================
-- COMPLIANCE AUDIT TRAIL TABLES
-- =====================================================

-- Audit log entries for HIPAA compliance and pharmaceutical interaction tracking
CREATE TABLE pharma_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- User performing the action
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL, -- login, booking_request, approval, etc.
    resource_type TEXT NOT NULL, -- appointment, user, config, etc.
    resource_id TEXT, -- ID of the affected resource
    details JSONB NOT NULL DEFAULT '{}', -- Action-specific details
    metadata JSONB NOT NULL DEFAULT '{}', -- IP, user agent, session, etc.
    hipaa_category TEXT NOT NULL DEFAULT 'not_applicable', -- administrative, physical, technical
    compliance_risk TEXT NOT NULL DEFAULT 'low', -- low, medium, high, critical
    data_accessed JSONB, -- What data was accessed/modified
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX idx_pharma_audit_user_id ON pharma_audit_logs(user_id);
CREATE INDEX idx_pharma_audit_user_email ON pharma_audit_logs(user_email);
CREATE INDEX idx_pharma_audit_action ON pharma_audit_logs(action);
CREATE INDEX idx_pharma_audit_resource_type ON pharma_audit_logs(resource_type);
CREATE INDEX idx_pharma_audit_resource_id ON pharma_audit_logs(resource_id);
CREATE INDEX idx_pharma_audit_hipaa_category ON pharma_audit_logs(hipaa_category);
CREATE INDEX idx_pharma_audit_compliance_risk ON pharma_audit_logs(compliance_risk);
CREATE INDEX idx_pharma_audit_created_at ON pharma_audit_logs(created_at);
CREATE INDEX idx_pharma_audit_details_gin ON pharma_audit_logs USING gin(details);
CREATE INDEX idx_pharma_audit_metadata_gin ON pharma_audit_logs USING gin(metadata);

-- Compliance reports table
CREATE TABLE pharma_compliance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id TEXT UNIQUE NOT NULL,
    generated_by TEXT NOT NULL,
    time_range_start TIMESTAMPTZ NOT NULL,
    time_range_end TIMESTAMPTZ NOT NULL,
    summary JSONB NOT NULL DEFAULT '{}',
    categories JSONB NOT NULL DEFAULT '{}',
    risk_distribution JSONB NOT NULL DEFAULT '{}',
    flagged_activities_count INTEGER DEFAULT 0,
    recommendations TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for compliance reports
CREATE INDEX idx_compliance_reports_generated_by ON pharma_compliance_reports(generated_by);
CREATE INDEX idx_compliance_reports_time_range ON pharma_compliance_reports(time_range_start, time_range_end);
CREATE INDEX idx_compliance_reports_created_at ON pharma_compliance_reports(created_at);

-- Enable RLS for audit tables
ALTER TABLE pharma_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharma_compliance_reports ENABLE ROW LEVEL SECURITY;

-- Only admin staff can access audit logs
CREATE POLICY "Admin staff only - audit logs" ON pharma_audit_logs
    FOR ALL USING (
        auth.email() LIKE '%@gangerdermatology.com'
        AND auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    );

CREATE POLICY "Admin staff only - compliance reports" ON pharma_compliance_reports
    FOR ALL USING (
        auth.email() LIKE '%@gangerdermatology.com'
        AND auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    );

-- Comments for audit tables
COMMENT ON TABLE pharma_audit_logs IS 'HIPAA-compliant audit trail for all pharmaceutical scheduling activities';
COMMENT ON TABLE pharma_compliance_reports IS 'Generated compliance reports for regulatory auditing';

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;


-- Migration: 010_create_lunch_availability_config.sql
-- ==========================================

-- ==========================================
-- LUNCH AVAILABILITY CONFIGURATION SYSTEM
-- Google Calendar Integration for 3-Office Lunch Scheduling
-- ==========================================

-- Lunch availability configuration table
CREATE TABLE IF NOT EXISTS lunch_availability_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_name TEXT NOT NULL, -- 'Ann Arbor', 'Wixom', 'Plymouth'
  google_calendar_id TEXT NOT NULL,
  
  -- Weekly availability settings
  available_days INTEGER[] NOT NULL, -- [1,2,3,4,5] for Mon-Fri
  start_time TIME NOT NULL, -- e.g., '12:00:00'
  end_time TIME NOT NULL, -- e.g., '12:45:00'
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  
  -- Booking window settings
  booking_window_weeks INTEGER NOT NULL DEFAULT 12, -- How far in advance
  min_advance_hours INTEGER DEFAULT 24, -- Minimum booking notice
  
  -- Location details
  location_address TEXT NOT NULL,
  special_instructions TEXT,
  max_attendees INTEGER DEFAULT 15,
  
  -- Status and tracking
  is_active BOOLEAN DEFAULT TRUE,
  last_updated_by UUID, -- References users table when available
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(location_name)
);

-- Enable RLS for security
ALTER TABLE lunch_availability_config ENABLE ROW LEVEL SECURITY;

-- Policies for lunch_availability_config
CREATE POLICY "Public read access for active lunch configs" ON lunch_availability_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin write access for lunch configs" ON lunch_availability_config
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'admin@gangerdermatology.com',
      'manager@gangerdermatology.com',
      'anand@gangerdermatology.com'
    )
  );

-- Insert default configurations for the 3 locations
INSERT INTO lunch_availability_config 
(location_name, google_calendar_id, available_days, start_time, end_time, duration_minutes, booking_window_weeks, location_address)
VALUES 
(
  'Ann Arbor', 
  'gangerdermatology.com_b4jajesjfje9qfko0gn3kp9jtk@group.calendar.google.com', 
  '{1,2,3,4,5}', 
  '12:00:00', 
  '12:45:00', 
  45, 
  12, 
  '1979 Huron Pkwy, Ann Arbor, MI 48105'
),
(
  'Wixom', 
  'gangerdermatology.com_fsdmtevbhp32gmletbpb000q20@group.calendar.google.com', 
  '{1,2,3,4,5}', 
  '12:00:00', 
  '12:45:00', 
  45, 
  12, 
  '29877 Telegraph Rd, Southfield, MI 48034'
),
(
  'Plymouth', 
  'gangerdermatology.com_3cc4gomltg8f4kh9mc2o10gi6o@group.calendar.google.com', 
  '{1,2,3,4,5}', 
  '12:00:00', 
  '12:45:00', 
  45, 
  12, 
  '990 W Ann Arbor Trail, Plymouth, MI 48170'
);

-- Create indexes for performance
CREATE INDEX idx_lunch_config_location ON lunch_availability_config(location_name) WHERE is_active = true;
CREATE INDEX idx_lunch_config_active ON lunch_availability_config(is_active);

-- Function to get active lunch configurations
CREATE OR REPLACE FUNCTION get_active_lunch_locations()
RETURNS TABLE (
  location_name TEXT,
  location_address TEXT,
  duration_minutes INTEGER,
  booking_window_weeks INTEGER,
  available_days INTEGER[],
  start_time TIME,
  end_time TIME
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lac.location_name,
    lac.location_address,
    lac.duration_minutes,
    lac.booking_window_weeks,
    lac.available_days,
    lac.start_time,
    lac.end_time
  FROM lunch_availability_config lac
  WHERE lac.is_active = true
  ORDER BY lac.location_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lunch configuration by location
CREATE OR REPLACE FUNCTION get_lunch_config_by_location(p_location_name TEXT)
RETURNS TABLE (
  id UUID,
  location_name TEXT,
  google_calendar_id TEXT,
  available_days INTEGER[],
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  booking_window_weeks INTEGER,
  min_advance_hours INTEGER,
  location_address TEXT,
  special_instructions TEXT,
  max_attendees INTEGER,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lac.id,
    lac.location_name,
    lac.google_calendar_id,
    lac.available_days,
    lac.start_time,
    lac.end_time,
    lac.duration_minutes,
    lac.booking_window_weeks,
    lac.min_advance_hours,
    lac.location_address,
    lac.special_instructions,
    lac.max_attendees,
    lac.is_active
  FROM lunch_availability_config lac
  WHERE lac.location_name = p_location_name
    AND lac.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update lunch configuration
CREATE OR REPLACE FUNCTION update_lunch_config(
  p_location_name TEXT,
  p_available_days INTEGER[] DEFAULT NULL,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_booking_window_weeks INTEGER DEFAULT NULL,
  p_min_advance_hours INTEGER DEFAULT NULL,
  p_location_address TEXT DEFAULT NULL,
  p_special_instructions TEXT DEFAULT NULL,
  p_max_attendees INTEGER DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_updated_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE lunch_availability_config
  SET 
    available_days = COALESCE(p_available_days, available_days),
    start_time = COALESCE(p_start_time, start_time),
    end_time = COALESCE(p_end_time, end_time),
    duration_minutes = COALESCE(p_duration_minutes, duration_minutes),
    booking_window_weeks = COALESCE(p_booking_window_weeks, booking_window_weeks),
    min_advance_hours = COALESCE(p_min_advance_hours, min_advance_hours),
    location_address = COALESCE(p_location_address, location_address),
    special_instructions = COALESCE(p_special_instructions, special_instructions),
    max_attendees = COALESCE(p_max_attendees, max_attendees),
    is_active = COALESCE(p_is_active, is_active),
    last_updated_by = COALESCE(p_updated_by, last_updated_by),
    updated_at = NOW()
  WHERE location_name = p_location_name;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate lunch booking time slot
CREATE OR REPLACE FUNCTION validate_lunch_time_slot(
  p_location_name TEXT,
  p_appointment_date DATE,
  p_start_time TIME
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT,
  day_of_week INTEGER,
  is_available_day BOOLEAN,
  within_time_window BOOLEAN,
  meets_advance_notice BOOLEAN
) AS $$
DECLARE
  config_record RECORD;
  slot_day_of_week INTEGER;
  appointment_datetime TIMESTAMPTZ;
  hours_until_appointment NUMERIC;
BEGIN
  -- Get configuration
  SELECT * INTO config_record
  FROM lunch_availability_config
  WHERE location_name = p_location_name AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Location not found or inactive'::TEXT, 0, false, false, false;
    RETURN;
  END IF;
  
  -- Calculate day of week (1=Monday, 7=Sunday)
  slot_day_of_week := EXTRACT(ISODOW FROM p_appointment_date);
  
  -- Check if day is available
  IF NOT (slot_day_of_week = ANY(config_record.available_days)) THEN
    RETURN QUERY SELECT false, 'Location not available on this day'::TEXT, slot_day_of_week, false, false, false;
    RETURN;
  END IF;
  
  -- Check if time is within available window
  IF p_start_time < config_record.start_time OR p_start_time > config_record.end_time THEN
    RETURN QUERY SELECT false, 'Time outside available hours'::TEXT, slot_day_of_week, true, false, false;
    RETURN;
  END IF;
  
  -- Check advance notice requirement
  appointment_datetime := (p_appointment_date + p_start_time)::TIMESTAMPTZ;
  hours_until_appointment := EXTRACT(EPOCH FROM (appointment_datetime - NOW())) / 3600;
  
  IF hours_until_appointment < config_record.min_advance_hours THEN
    RETURN QUERY SELECT false, 'Insufficient advance notice'::TEXT, slot_day_of_week, true, true, false;
    RETURN;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT true, ''::TEXT, slot_day_of_week, true, true, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_lunch_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lunch_config_updated_at_trigger
  BEFORE UPDATE ON lunch_availability_config
  FOR EACH ROW
  EXECUTE FUNCTION update_lunch_config_updated_at();

-- Grant permissions for authenticated users to read public functions
GRANT EXECUTE ON FUNCTION get_active_lunch_locations() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_lunch_config_by_location(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_lunch_time_slot(TEXT, DATE, TIME) TO authenticated, anon;

-- Grant admin functions only to authenticated users
GRANT EXECUTE ON FUNCTION update_lunch_config(TEXT, INTEGER[], TIME, TIME, INTEGER, INTEGER, INTEGER, TEXT, TEXT, INTEGER, BOOLEAN, UUID) TO authenticated;

-- Create comment for documentation
COMMENT ON TABLE lunch_availability_config IS 'Configuration table for pharmaceutical rep lunch scheduling across 3 office locations with Google Calendar integration';
COMMENT ON FUNCTION get_active_lunch_locations() IS 'Returns all active lunch locations with basic configuration for public booking interface';
COMMENT ON FUNCTION get_lunch_config_by_location(TEXT) IS 'Returns complete configuration for a specific location including Google Calendar ID';
COMMENT ON FUNCTION validate_lunch_time_slot(TEXT, DATE, TIME) IS 'Validates if a requested time slot is valid according to location configuration and business rules';
COMMENT ON FUNCTION update_lunch_config(TEXT, INTEGER[], TIME, TIME, INTEGER, INTEGER, INTEGER, TEXT, TEXT, INTEGER, BOOLEAN, UUID) IS 'Admin function to update lunch availability configuration for a location';


-- Migration: 011_create_medication_authorization_tables.sql
-- ==========================================

-- ================================================
-- MEDICATION AUTHORIZATION SYSTEM
-- Migration: 011_create_medication_authorization_tables.sql
-- Description: Comprehensive database schema for AI-powered medication authorization
-- Date: 2025-01-08
-- ================================================

-- Create custom enum types for medication authorization
CREATE TYPE authorization_status_enum AS ENUM (
    'draft',
    'submitted', 
    'under_review',
    'approved',
    'denied',
    'expired',
    'cancelled',
    'appealed'
);

CREATE TYPE priority_enum AS ENUM (
    'routine',
    'urgent', 
    'emergent',
    'stat'
);

CREATE TYPE ai_recommendation_enum AS ENUM (
    'approve',
    'deny',
    'request_more_info',
    'suggest_alternative',
    'escalate_manual_review'
);

CREATE TYPE step_status_enum AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'skipped',
    'failed'
);

CREATE TYPE comm_type_enum AS ENUM (
    'email',
    'fax',
    'phone',
    'portal',
    'api_call'
);

CREATE TYPE comm_direction_enum AS ENUM (
    'inbound',
    'outbound'
);

-- ================================================
-- CORE AUTHORIZATION TABLES
-- ================================================

-- Medication authorization requests
CREATE TABLE medication_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    medication_id UUID NOT NULL,
    insurance_provider_id UUID NOT NULL,
    
    -- Authorization details
    status authorization_status_enum NOT NULL DEFAULT 'draft',
    priority_level priority_enum NOT NULL DEFAULT 'routine',
    diagnosis_codes TEXT[] NOT NULL DEFAULT '{}',
    quantity_requested INTEGER NOT NULL,
    days_supply INTEGER NOT NULL,
    refills_requested INTEGER DEFAULT 0,
    
    -- AI processing data
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    ai_recommendation ai_recommendation_enum,
    ai_reasoning TEXT,
    estimated_approval_probability DECIMAL(3,2) CHECK (estimated_approval_probability >= 0 AND estimated_approval_probability <= 1),
    
    -- Cost and financial data
    estimated_cost DECIMAL(10,2),
    patient_responsibility DECIMAL(10,2),
    insurance_coverage_percentage DECIMAL(5,2),
    
    -- Important dates
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    denied_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Medical necessity documentation
    clinical_notes TEXT,
    previous_therapies_tried TEXT[],
    contraindications TEXT[],
    supporting_documentation JSONB DEFAULT '{}',
    
    -- External reference numbers
    insurance_reference_number VARCHAR(100),
    pharmacy_reference_number VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT valid_quantity CHECK (quantity_requested > 0),
    CONSTRAINT valid_days_supply CHECK (days_supply > 0),
    CONSTRAINT valid_refills CHECK (refills_requested >= 0),
    CONSTRAINT logical_dates CHECK (
        (approved_at IS NULL OR submitted_at IS NOT NULL) AND
        (denied_at IS NULL OR submitted_at IS NOT NULL) AND
        (approved_at IS NULL OR denied_at IS NULL)
    )
);

-- Patient information cache from ModMed
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modmed_patient_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Basic demographics
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    
    -- Contact information
    phone VARCHAR(20),
    email VARCHAR(255),
    address JSONB DEFAULT '{}',
    
    -- Insurance information
    insurance_member_id VARCHAR(100),
    insurance_group_number VARCHAR(100),
    insurance_plan_name VARCHAR(200),
    
    -- Medical information
    active_medications JSONB DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    diagnosis_history JSONB DEFAULT '{}',
    medical_conditions TEXT[] DEFAULT '{}',
    
    -- Sync tracking
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    sync_status VARCHAR(50) DEFAULT 'synced',
    sync_errors JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_birth_date CHECK (date_of_birth <= CURRENT_DATE),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL)
);

-- Medication database with authorization requirements
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Drug identification
    ndc_number VARCHAR(20) UNIQUE NOT NULL,
    brand_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200) NOT NULL,
    strength VARCHAR(100) NOT NULL,
    dosage_form VARCHAR(100) NOT NULL,
    route_of_administration VARCHAR(100),
    manufacturer VARCHAR(200),
    
    -- Classification
    therapeutic_class VARCHAR(200),
    pharmacologic_class VARCHAR(200),
    controlled_substance_schedule VARCHAR(10),
    
    -- Authorization requirements
    requires_prior_auth BOOLEAN DEFAULT false,
    step_therapy_required BOOLEAN DEFAULT false,
    quantity_limits JSONB DEFAULT '{}',
    age_restrictions JSONB DEFAULT '{}',
    diagnosis_requirements TEXT[] DEFAULT '{}',
    
    -- Clinical information
    contraindications TEXT[] DEFAULT '{}',
    drug_interactions TEXT[] DEFAULT '{}',
    pregnancy_category VARCHAR(10),
    black_box_warning BOOLEAN DEFAULT false,
    
    -- Cost information
    average_wholesale_price DECIMAL(10,2),
    typical_copay_tier INTEGER,
    
    -- Status and metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_ndc CHECK (LENGTH(ndc_number) >= 10),
    CONSTRAINT valid_copay_tier CHECK (typical_copay_tier BETWEEN 1 AND 5)
);

-- Insurance provider requirements and policies
CREATE TABLE insurance_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Provider identification
    name VARCHAR(200) NOT NULL,
    plan_type VARCHAR(100) NOT NULL,
    plan_code VARCHAR(50),
    
    -- Formulary information
    formulary_tier INTEGER,
    formulary_restrictions JSONB DEFAULT '{}',
    preferred_alternatives JSONB DEFAULT '{}',
    
    -- Prior authorization requirements
    prior_auth_requirements JSONB NOT NULL DEFAULT '{}',
    step_therapy_protocols JSONB DEFAULT '{}',
    quantity_limit_policies JSONB DEFAULT '{}',
    
    -- API integration
    submission_endpoint VARCHAR(500),
    api_credentials_encrypted TEXT,
    supports_electronic_submission BOOLEAN DEFAULT false,
    
    -- Performance metrics
    processing_time_hours INTEGER DEFAULT 72,
    success_rate DECIMAL(5,2),
    average_approval_time_hours DECIMAL(8,2),
    
    -- Contact information
    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(255),
    portal_url VARCHAR(500),
    
    -- Status and metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_success_rate CHECK (success_rate BETWEEN 0 AND 100),
    CONSTRAINT valid_processing_time CHECK (processing_time_hours > 0)
);

-- ================================================
-- AI PROCESSING AND WORKFLOW TABLES
-- ================================================

-- AI processing and recommendations
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authorization_id UUID REFERENCES medication_authorizations(id) ON DELETE CASCADE,
    
    -- Recommendation details
    recommendation_type ai_recommendation_enum NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    reasoning TEXT NOT NULL,
    
    -- Suggestions and alternatives
    suggested_alternatives JSONB DEFAULT '{}',
    required_documentation TEXT[] DEFAULT '{}',
    missing_information TEXT[] DEFAULT '{}',
    
    -- Probability assessments
    estimated_approval_probability DECIMAL(3,2) CHECK (estimated_approval_probability >= 0 AND estimated_approval_probability <= 1),
    risk_factors JSONB DEFAULT '{}',
    
    -- Processing metrics
    processing_time_ms INTEGER,
    model_version VARCHAR(50),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_ai_recommendations_auth_id ON ai_recommendations(authorization_id),
    INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type),
    INDEX idx_ai_recommendations_confidence ON ai_recommendations(confidence_score DESC)
);

-- Authorization workflow and status tracking
CREATE TABLE authorization_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authorization_id UUID REFERENCES medication_authorizations(id) ON DELETE CASCADE,
    
    -- Step information
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    status step_status_enum NOT NULL DEFAULT 'pending',
    
    -- Assignment and timing
    assigned_to UUID,
    assigned_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Step details
    description TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '{}',
    
    -- AI assistance
    ai_assisted BOOLEAN DEFAULT false,
    ai_suggestions JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT logical_workflow_dates CHECK (
        (started_at IS NULL OR assigned_at IS NOT NULL) AND
        (completed_at IS NULL OR started_at IS NOT NULL)
    ),
    
    -- Indexes
    INDEX idx_workflow_steps_auth_id ON authorization_workflow_steps(authorization_id),
    INDEX idx_workflow_steps_status ON authorization_workflow_steps(status),
    INDEX idx_workflow_steps_assigned ON authorization_workflow_steps(assigned_to)
);

-- Communication log with insurance providers
CREATE TABLE authorization_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authorization_id UUID REFERENCES medication_authorizations(id) ON DELETE CASCADE,
    
    -- Communication details
    communication_type comm_type_enum NOT NULL,
    direction comm_direction_enum NOT NULL,
    subject VARCHAR(200),
    content TEXT,
    
    -- Attachments and files
    attachments JSONB DEFAULT '{}',
    file_references TEXT[] DEFAULT '{}',
    
    -- External references
    insurance_reference_number VARCHAR(100),
    confirmation_number VARCHAR(100),
    
    -- Response tracking
    response_required BOOLEAN DEFAULT false,
    response_due_date TIMESTAMPTZ,
    response_received_at TIMESTAMPTZ,
    
    -- Contact information
    contact_name VARCHAR(200),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    -- Indexes
    INDEX idx_auth_comm_auth_id ON authorization_communications(authorization_id),
    INDEX idx_auth_comm_type ON authorization_communications(communication_type),
    INDEX idx_auth_comm_direction ON authorization_communications(direction)
);

-- ================================================
-- ANALYTICS AND AUDIT TABLES  
-- ================================================

-- Authorization analytics and performance tracking
CREATE TABLE authorization_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time period
    date DATE NOT NULL,
    hour_of_day INTEGER CHECK (hour_of_day BETWEEN 0 AND 23),
    
    -- Segmentation
    provider_id UUID,
    insurance_provider_id UUID,
    medication_category VARCHAR(100),
    
    -- Volume metrics
    total_requests INTEGER DEFAULT 0,
    submitted_requests INTEGER DEFAULT 0,
    approved_requests INTEGER DEFAULT 0,
    denied_requests INTEGER DEFAULT 0,
    pending_requests INTEGER DEFAULT 0,
    cancelled_requests INTEGER DEFAULT 0,
    
    -- Timing metrics
    avg_processing_time_hours DECIMAL(8,2),
    median_processing_time_hours DECIMAL(8,2),
    max_processing_time_hours DECIMAL(8,2),
    
    -- AI performance metrics
    ai_recommendations_count INTEGER DEFAULT 0,
    ai_accuracy_rate DECIMAL(5,2),
    ai_recommendations_followed INTEGER DEFAULT 0,
    avg_ai_confidence_score DECIMAL(3,2),
    
    -- Financial metrics
    total_estimated_cost DECIMAL(12,2),
    cost_savings_estimate DECIMAL(12,2),
    administrative_time_saved_hours DECIMAL(8,2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_analytics_counts CHECK (
        total_requests >= 0 AND
        submitted_requests >= 0 AND
        approved_requests >= 0 AND
        denied_requests >= 0 AND
        pending_requests >= 0 AND
        cancelled_requests >= 0
    ),
    
    -- Unique constraints
    UNIQUE(date, hour_of_day, provider_id, insurance_provider_id, medication_category),
    
    -- Indexes
    INDEX idx_analytics_date ON authorization_analytics(date),
    INDEX idx_analytics_provider ON authorization_analytics(provider_id),
    INDEX idx_analytics_insurance ON authorization_analytics(insurance_provider_id)
);

-- Comprehensive audit trail for HIPAA compliance
CREATE TABLE authorization_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authorization_id UUID REFERENCES medication_authorizations(id) ON DELETE CASCADE,
    
    -- User and session information
    user_id UUID,
    user_email VARCHAR(255),
    session_id VARCHAR(100),
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    
    -- Change tracking
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    changed_fields TEXT[] DEFAULT '{}',
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    request_path VARCHAR(500),
    request_method VARCHAR(10),
    
    -- HIPAA compliance
    access_reason VARCHAR(200),
    compliance_note TEXT,
    phi_accessed BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for audit queries
    INDEX idx_audit_logs_auth_id ON authorization_audit_logs(authorization_id),
    INDEX idx_audit_logs_user_id ON authorization_audit_logs(user_id),
