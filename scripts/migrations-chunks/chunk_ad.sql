    -- Time Slots
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Staffing Requirements
    required_role VARCHAR(100) NOT NULL,
    minimum_staff_count INTEGER NOT NULL DEFAULT 1,
    maximum_staff_count INTEGER,
    required_skills JSONB DEFAULT '[]',
    required_certifications JSONB DEFAULT '[]',
    
    -- Priority and Flexibility
    priority_level INTEGER NOT NULL DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5), -- 1 = highest priority
    flexibility_minutes INTEGER DEFAULT 0, -- How much the time can shift
    
    -- AI Optimization Parameters
    cost_weight DECIMAL(3,2) DEFAULT 0.33, -- Weight for cost optimization
    quality_weight DECIMAL(3,2) DEFAULT 0.33, -- Weight for quality optimization
    coverage_weight DECIMAL(3,2) DEFAULT 0.34, -- Weight for coverage optimization
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- OPTIMIZATION_RUNS TABLE - Track AI optimization attempts
-- =====================================================
CREATE TABLE optimization_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Run Details
    run_type VARCHAR(20) NOT NULL CHECK (run_type IN ('daily', 'weekly', 'monthly', 'manual', 'emergency')),
    schedule_start_date DATE NOT NULL,
    schedule_end_date DATE NOT NULL,
    location_ids UUID[] DEFAULT '{}', -- Locations included in optimization
    
    -- Input Parameters
    optimization_strategy VARCHAR(20) NOT NULL DEFAULT 'balanced' CHECK (optimization_strategy IN ('cost_minimize', 'quality_maximize', 'balanced', 'coverage_priority')),
    constraints JSONB DEFAULT '{}', -- Special constraints for this run
    
    -- Results
    status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    coverage_percentage DECIMAL(5,2), -- Achieved coverage percentage
    total_cost DECIMAL(10,2), -- Estimated total cost
    quality_score DECIMAL(3,2), -- Overall quality score
    
    -- Performance Metrics
    computation_time_seconds INTEGER,
    schedules_created INTEGER DEFAULT 0,
    schedules_modified INTEGER DEFAULT 0,
    conflicts_resolved INTEGER DEFAULT 0,
    
    -- AI Model Information
    algorithm_version VARCHAR(50),
    model_parameters JSONB DEFAULT '{}',
    
    -- Results Detail
    optimization_report JSONB DEFAULT '{}', -- Detailed optimization results
    recommendations JSONB DEFAULT '[]', -- AI recommendations for improvement
    warnings JSONB DEFAULT '[]', -- Potential issues identified
    
    -- Approval Workflow
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EXTERNAL_SYNC_LOG TABLE - Track integration sync status
-- =====================================================
CREATE TABLE external_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Sync Details
    system_name VARCHAR(50) NOT NULL CHECK (system_name IN ('deputy', 'zenefits', 'modmed')),
    sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('staff_import', 'availability_sync', 'schedule_sync', 'appointment_sync')),
    
    -- Sync Status
    status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'partial')),
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- Error Handling
    error_message TEXT,
    error_details JSONB DEFAULT '{}',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Performance
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Data References
    external_ids JSONB DEFAULT '[]', -- IDs from external system
    affected_records JSONB DEFAULT '[]', -- Local record IDs affected
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================

-- Staff members indexes
CREATE INDEX idx_staff_members_user_id ON staff_members(user_id);
CREATE INDEX idx_staff_members_employee_id ON staff_members(employee_id);
CREATE INDEX idx_staff_members_email ON staff_members(email);
CREATE INDEX idx_staff_members_job_title ON staff_members(job_title);
CREATE INDEX idx_staff_members_department ON staff_members(department);
CREATE INDEX idx_staff_members_employee_status ON staff_members(employee_status);
CREATE INDEX idx_staff_members_base_location_id ON staff_members(base_location_id);
CREATE INDEX idx_staff_members_available_locations ON staff_members USING GIN(available_locations);
CREATE INDEX idx_staff_members_skills ON staff_members USING GIN(skills);
CREATE INDEX idx_staff_members_certifications ON staff_members USING GIN(certifications);
CREATE INDEX idx_staff_members_deputy_employee_id ON staff_members(deputy_employee_id);
CREATE INDEX idx_staff_members_zenefits_employee_id ON staff_members(zenefits_employee_id);
CREATE INDEX idx_staff_members_modmed_provider_id ON staff_members(modmed_provider_id);
CREATE INDEX idx_staff_members_performance_score ON staff_members(performance_score);

-- Staff availability indexes
CREATE INDEX idx_staff_availability_staff_member_id ON staff_availability(staff_member_id);
CREATE INDEX idx_staff_availability_date ON staff_availability(date);
CREATE INDEX idx_staff_availability_date_time ON staff_availability(date, start_time, end_time);
CREATE INDEX idx_staff_availability_type ON staff_availability(availability_type);
CREATE INDEX idx_staff_availability_deputy_id ON staff_availability(deputy_availability_id);
CREATE INDEX idx_staff_availability_deputy_sync ON staff_availability(deputy_sync_status);

-- Schedule templates indexes
CREATE INDEX idx_schedule_templates_location_id ON schedule_templates(location_id);
CREATE INDEX idx_schedule_templates_template_type ON schedule_templates(template_type);
CREATE INDEX idx_schedule_templates_is_active ON schedule_templates(is_active);
CREATE INDEX idx_schedule_templates_requirements ON schedule_templates USING GIN(staffing_requirements);

-- Staff schedules indexes
CREATE INDEX idx_staff_schedules_staff_member_id ON staff_schedules(staff_member_id);
CREATE INDEX idx_staff_schedules_location_id ON staff_schedules(location_id);
CREATE INDEX idx_staff_schedules_template_id ON staff_schedules(template_id);
CREATE INDEX idx_staff_schedules_date ON staff_schedules(schedule_date);
CREATE INDEX idx_staff_schedules_date_time ON staff_schedules(schedule_date, start_time, end_time);
CREATE INDEX idx_staff_schedules_status ON staff_schedules(status);
CREATE INDEX idx_staff_schedules_assigned_role ON staff_schedules(assigned_role);
CREATE INDEX idx_staff_schedules_deputy_id ON staff_schedules(deputy_schedule_id);
CREATE INDEX idx_staff_schedules_modmed_appointments ON staff_schedules USING GIN(modmed_appointment_ids);
CREATE INDEX idx_staff_schedules_ai_confidence ON staff_schedules(ai_confidence_score);

-- Coverage requirements indexes
CREATE INDEX idx_coverage_requirements_location_id ON coverage_requirements(location_id);
CREATE INDEX idx_coverage_requirements_date_dow ON coverage_requirements(effective_date, day_of_week);
CREATE INDEX idx_coverage_requirements_time ON coverage_requirements(start_time, end_time);
CREATE INDEX idx_coverage_requirements_role ON coverage_requirements(required_role);
CREATE INDEX idx_coverage_requirements_priority ON coverage_requirements(priority_level);
CREATE INDEX idx_coverage_requirements_skills ON coverage_requirements USING GIN(required_skills);

-- Optimization runs indexes
CREATE INDEX idx_optimization_runs_run_type ON optimization_runs(run_type);
CREATE INDEX idx_optimization_runs_dates ON optimization_runs(schedule_start_date, schedule_end_date);
CREATE INDEX idx_optimization_runs_status ON optimization_runs(status);
CREATE INDEX idx_optimization_runs_location_ids ON optimization_runs USING GIN(location_ids);
CREATE INDEX idx_optimization_runs_strategy ON optimization_runs(optimization_strategy);
CREATE INDEX idx_optimization_runs_created_at ON optimization_runs(created_at);
CREATE INDEX idx_optimization_runs_approved ON optimization_runs(approved_by, approved_at);

-- External sync log indexes
CREATE INDEX idx_external_sync_log_system_name ON external_sync_log(system_name);
CREATE INDEX idx_external_sync_log_sync_type ON external_sync_log(sync_type);
CREATE INDEX idx_external_sync_log_status ON external_sync_log(status);
CREATE INDEX idx_external_sync_log_start_time ON external_sync_log(start_time);
CREATE INDEX idx_external_sync_log_external_ids ON external_sync_log USING GIN(external_ids);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================
CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_availability_updated_at BEFORE UPDATE ON staff_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_templates_updated_at BEFORE UPDATE ON schedule_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON staff_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coverage_requirements_updated_at BEFORE UPDATE ON coverage_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_optimization_runs_updated_at BEFORE UPDATE ON optimization_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CUSTOM FUNCTIONS FOR CLINICAL STAFFING
-- =====================================================

-- Function to calculate staff utilization percentage
CREATE OR REPLACE FUNCTION calculate_staff_utilization(
    p_staff_member_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_available_hours DECIMAL(8,2) := 0;
    total_scheduled_hours DECIMAL(8,2) := 0;
    utilization_percentage DECIMAL(5,2) := 0;
BEGIN
    -- Calculate total available hours
    SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
    ), 0) INTO total_available_hours
    FROM staff_availability
    WHERE staff_member_id = p_staff_member_id
    AND date BETWEEN p_start_date AND p_end_date
    AND availability_type IN ('available', 'preferred');
    
    -- Calculate total scheduled hours
    SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
    ), 0) INTO total_scheduled_hours
    FROM staff_schedules
    WHERE staff_member_id = p_staff_member_id
    AND schedule_date BETWEEN p_start_date AND p_end_date
    AND status NOT IN ('cancelled', 'no_show');
    
    -- Calculate utilization percentage
    IF total_available_hours > 0 THEN
        utilization_percentage := (total_scheduled_hours / total_available_hours) * 100;
    END IF;
    
    RETURN ROUND(utilization_percentage, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to check schedule conflicts
CREATE OR REPLACE FUNCTION check_schedule_conflicts(
    p_staff_member_id UUID,
    p_schedule_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_schedule_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO conflict_count
    FROM staff_schedules
    WHERE staff_member_id = p_staff_member_id
    AND schedule_date = p_schedule_date
    AND (p_exclude_schedule_id IS NULL OR id != p_exclude_schedule_id)
    AND status NOT IN ('cancelled', 'no_show')
    AND (
        (start_time BETWEEN p_start_time AND p_end_time) OR
        (end_time BETWEEN p_start_time AND p_end_time) OR
        (start_time <= p_start_time AND end_time >= p_end_time)
    );
    
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get optimal staff assignments using basic algorithm
CREATE OR REPLACE FUNCTION get_optimal_staff_assignment(
    p_location_id UUID,
    p_schedule_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_required_role VARCHAR(100),
    p_required_skills JSONB DEFAULT '[]'
) RETURNS TABLE (
    staff_member_id UUID,
    confidence_score DECIMAL(3,2),
    assignment_factors JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH eligible_staff AS (
        SELECT 
            sm.id,
            sm.performance_score,
            sm.patient_satisfaction_score,
            sm.reliability_score,
            sa.availability_type,
            CASE 
                WHEN sm.job_title = p_required_role THEN 1.0
                ELSE 0.5
            END as role_match_score,
            CASE 
                WHEN sm.skills ?& (SELECT array_agg(value::text) FROM jsonb_array_elements_text(p_required_skills)) THEN 1.0
                ELSE 0.3
            END as skills_match_score
        FROM staff_members sm
        LEFT JOIN staff_availability sa ON (
            sa.staff_member_id = sm.id 
            AND sa.date = p_schedule_date
            AND sa.start_time <= p_start_time
            AND sa.end_time >= p_end_time
            AND sa.availability_type IN ('available', 'preferred')
        )
        WHERE sm.employee_status = 'active'
        AND (sm.base_location_id = p_location_id OR p_location_id = ANY(sm.available_locations))
        AND NOT check_schedule_conflicts(sm.id, p_schedule_date, p_start_time, p_end_time)
    ),
    scored_staff AS (
        SELECT 
            id as staff_member_id,
            ROUND((
                (performance_score / 10.0 * 0.3) +
                (patient_satisfaction_score / 10.0 * 0.3) +
                (reliability_score / 10.0 * 0.2) +
                (role_match_score * 0.1) +
                (skills_match_score * 0.1)
            ), 2) as confidence_score,
            jsonb_build_object(
                'performance_score', performance_score,
                'patient_satisfaction', patient_satisfaction_score,
                'reliability', reliability_score,
                'role_match', role_match_score,
                'skills_match', skills_match_score,
                'availability_type', COALESCE(availability_type, 'conditional')
            ) as assignment_factors
        FROM eligible_staff
        WHERE availability_type IS NOT NULL OR availability_type IS NULL -- Include conditional availability
    )
    SELECT 
        ss.staff_member_id,
        ss.confidence_score,
        ss.assignment_factors
    FROM scored_staff ss
    ORDER BY ss.confidence_score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_sync_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (more granular policies can be added later)
CREATE POLICY "Staff members can view their own data" ON staff_members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all staff data" ON staff_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'superadmin')
        )
    );

-- Similar policies for other tables
CREATE POLICY "Staff can view their own availability" ON staff_availability
    FOR SELECT USING (
        staff_member_id IN (
            SELECT id FROM staff_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can update their own availability" ON staff_availability
    FOR ALL USING (
        staff_member_id IN (
            SELECT id FROM staff_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can manage all schedules" ON staff_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'superadmin')
        )
    );

CREATE POLICY "Staff can view their own schedules" ON staff_schedules
    FOR SELECT USING (
        staff_member_id IN (
            SELECT id FROM staff_members WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- INITIAL SEED DATA
-- =====================================================

-- Insert sample job titles and departments
INSERT INTO staff_members (
    employee_id, first_name, last_name, email, job_title, department,
    employment_type, hire_date, certifications, skills, metadata
) VALUES 
-- Sample data will be added via separate seed script
-- This is just the schema definition
('EMP001', 'Sample', 'Employee', 'sample@gangerdermatology.com', 'Medical Assistant', 'Clinical',
 'full_time', '2025-01-01', 
 '[]'::jsonb,
 '[{"skill": "patient_care", "proficiency": 9}, {"skill": "scheduling", "proficiency": 8}]'::jsonb,
 '{"notes": "Sample employee for testing"}'::jsonb)
ON CONFLICT (employee_id) DO NOTHING;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE staff_members IS 'Enhanced employee management with AI optimization data and external system integration';
COMMENT ON TABLE staff_availability IS 'Real-time staff availability tracking with Deputy integration';
COMMENT ON TABLE schedule_templates IS 'Predefined schedule patterns for consistent staffing';
COMMENT ON TABLE staff_schedules IS 'Actual scheduled shifts with AI optimization and performance tracking';
COMMENT ON TABLE coverage_requirements IS 'Location-specific staffing requirements for optimization';
COMMENT ON TABLE optimization_runs IS 'AI optimization attempts with detailed results and metrics';
COMMENT ON TABLE external_sync_log IS 'Integration sync status and error tracking';

COMMENT ON FUNCTION calculate_staff_utilization IS 'Calculate staff utilization percentage over a date range';
COMMENT ON FUNCTION check_schedule_conflicts IS 'Check for scheduling conflicts for a staff member';
COMMENT ON FUNCTION get_optimal_staff_assignment IS 'AI-powered optimal staff assignment recommendations';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================


-- Migration: 009_create_pharmaceutical_scheduling_tables.sql
-- ==========================================

-- =====================================================
-- Pharmaceutical Representative Scheduling System
-- Database Schema for TimeTrade Replacement
-- Migration: 009_create_pharmaceutical_scheduling_tables.sql
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PHARMACEUTICAL REPRESENTATIVES
-- =====================================================

CREATE TABLE pharma_representatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT,
    company_name TEXT NOT NULL,
    territory TEXT,
    title TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    account_created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID, -- References users(id) - will be added when auth system is connected
    notes TEXT, -- Internal staff notes about rep
    preferred_locations TEXT[], -- Array of preferred clinic locations
    specialties TEXT[], -- Therapeutic areas of focus
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for pharmaceutical representatives
CREATE INDEX idx_pharma_reps_email ON pharma_representatives(email);
CREATE INDEX idx_pharma_reps_company ON pharma_representatives(company_name);
CREATE INDEX idx_pharma_reps_active ON pharma_representatives(is_active);
CREATE INDEX idx_pharma_reps_territory ON pharma_representatives(territory);

-- =====================================================
-- SCHEDULING ACTIVITIES (TimeTrade Activity Equivalent)
-- =====================================================

CREATE TABLE scheduling_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_name TEXT NOT NULL, -- "Pharma Lunch Ann Arbor", etc.
    location TEXT NOT NULL, -- Ann Arbor, Plymouth, Wixom
    location_address TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    block_off_minutes INTEGER DEFAULT 0, -- Buffer time after appointment
    appointment_type TEXT NOT NULL DEFAULT 'in_person', -- in_person, virtual
    max_participants INTEGER DEFAULT 10,
    requires_approval BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    available_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- Monday=1, Sunday=7
    available_times JSONB, -- Available time slots per day
    booking_window_weeks INTEGER DEFAULT 20, -- How far in advance booking allowed
    cancellation_hours INTEGER DEFAULT 24, -- Minimum notice for cancellation
    description TEXT,
    special_instructions TEXT,
    created_by UUID, -- References users(id)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_duration CHECK (duration_minutes > 0),
    CONSTRAINT valid_participants CHECK (max_participants > 0),
    CONSTRAINT valid_booking_window CHECK (booking_window_weeks >= 1),
    CONSTRAINT valid_cancellation_hours CHECK (cancellation_hours >= 0),
    CONSTRAINT valid_appointment_type CHECK (appointment_type IN ('in_person', 'virtual')),
    CONSTRAINT valid_available_days CHECK (
        array_length(available_days, 1) > 0 AND
        available_days <@ ARRAY[1,2,3,4,5,6,7]
    )
);

-- Indexes for scheduling activities
CREATE INDEX idx_activities_location ON scheduling_activities(location);
CREATE INDEX idx_activities_active ON scheduling_activities(is_active);
CREATE INDEX idx_activities_type ON scheduling_activities(appointment_type);
CREATE INDEX idx_activities_approval ON scheduling_activities(requires_approval);

-- =====================================================
-- PHARMACEUTICAL APPOINTMENTS (Core Booking System)
-- =====================================================

CREATE TABLE pharma_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES scheduling_activities(id),
    rep_id UUID NOT NULL REFERENCES pharma_representatives(id),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    location TEXT NOT NULL,
    location_address TEXT NOT NULL,
    participant_count INTEGER DEFAULT 0,
    approval_status TEXT DEFAULT 'pending', -- pending, approved, denied
    approved_by UUID, -- References users(id)
    approved_at TIMESTAMPTZ,
    denial_reason TEXT,
    special_requests TEXT,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    cancelled_by TEXT, -- Email of who cancelled
    cancellation_reason TEXT,
    completed_at TIMESTAMPTZ,
    google_calendar_event_id TEXT, -- For calendar integration
    booking_source TEXT DEFAULT 'web', -- web, phone, email, mobile_app
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_appointment_status CHECK (
        status IN ('pending', 'confirmed', 'cancelled', 'completed')
    ),
    CONSTRAINT valid_approval_status CHECK (
        approval_status IN ('pending', 'approved', 'denied')
    ),
    CONSTRAINT valid_appointment_times CHECK (end_time > start_time),
    CONSTRAINT valid_appointment_date CHECK (appointment_date >= CURRENT_DATE),
    CONSTRAINT valid_participant_count CHECK (participant_count >= 0),
    
    -- Prevent double booking: same rep, overlapping times
    EXCLUDE USING gist (
        rep_id WITH =,
        daterange(appointment_date, appointment_date, '[]') WITH &&,
        timerange(start_time, end_time, '[]') WITH &&
    ) WHERE (status NOT IN ('cancelled', 'denied'))
);

-- Indexes for pharmaceutical appointments
CREATE INDEX idx_appointments_rep ON pharma_appointments(rep_id);
CREATE INDEX idx_appointments_activity ON pharma_appointments(activity_id);
CREATE INDEX idx_appointments_date ON pharma_appointments(appointment_date);
CREATE INDEX idx_appointments_status ON pharma_appointments(status);
CREATE INDEX idx_appointments_approval ON pharma_appointments(approval_status);
CREATE INDEX idx_appointments_location ON pharma_appointments(location);
CREATE INDEX idx_appointments_datetime ON pharma_appointments(appointment_date, start_time);
CREATE INDEX idx_appointments_pending_approval ON pharma_appointments(approval_status, created_at) 
    WHERE approval_status = 'pending';

-- =====================================================
-- APPOINTMENT PARTICIPANTS (Staff Participation)
-- =====================================================

CREATE TABLE appointment_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES pharma_appointments(id) ON DELETE CASCADE,
    staff_email TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    participation_status TEXT DEFAULT 'invited', -- invited, confirmed, declined, attended
    rsvp_at TIMESTAMPTZ,
    attendance_confirmed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_participation_status CHECK (
        participation_status IN ('invited', 'confirmed', 'declined', 'attended')
    ),
    
    -- Prevent duplicate participants
    UNIQUE(appointment_id, staff_email)
);

-- Indexes for appointment participants
CREATE INDEX idx_participants_appointment ON appointment_participants(appointment_id);
CREATE INDEX idx_participants_staff ON appointment_participants(staff_email);
CREATE INDEX idx_participants_status ON appointment_participants(participation_status);

-- =====================================================
-- AVAILABILITY OVERRIDES (Blackout Dates & Special Hours)
-- =====================================================

CREATE TABLE availability_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES scheduling_activities(id),
    override_date DATE NOT NULL,
    override_type TEXT NOT NULL, -- 'blackout', 'special_hours', 'closed'
    custom_times JSONB, -- Custom available times if override_type = 'special_hours'
    reason TEXT,
    created_by UUID, -- References users(id)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_override_type CHECK (
        override_type IN ('blackout', 'special_hours', 'closed')
    ),
    CONSTRAINT valid_override_date CHECK (override_date >= CURRENT_DATE),
    
    -- Prevent duplicate overrides for same activity/date
    UNIQUE(activity_id, override_date)
);

-- Indexes for availability overrides
CREATE INDEX idx_overrides_activity ON availability_overrides(activity_id);
CREATE INDEX idx_overrides_date ON availability_overrides(override_date);
CREATE INDEX idx_overrides_type ON availability_overrides(override_type);

-- =====================================================
-- PHARMACEUTICAL COMMUNICATIONS (Compliance Tracking)
-- =====================================================

CREATE TABLE pharma_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES pharma_appointments(id),
    rep_id UUID NOT NULL REFERENCES pharma_representatives(id),
    communication_type TEXT NOT NULL, -- 'booking_request', 'confirmation', 'reminder', 'cancellation', 'follow_up'
    method TEXT NOT NULL, -- 'email', 'sms', 'phone', 'in_person'
    content TEXT, -- Message content for compliance tracking
    sent_to TEXT[], -- Array of recipients
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivery_status TEXT DEFAULT 'sent', -- sent, delivered, failed, bounced
    delivery_details JSONB, -- Additional delivery metadata
    created_by TEXT, -- System or user email
    compliance_audit_id UUID, -- Link to compliance audit records
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_communication_type CHECK (
        communication_type IN ('booking_request', 'confirmation', 'reminder', 'cancellation', 'follow_up', 'approval_notification')
    ),
    CONSTRAINT valid_method CHECK (
        method IN ('email', 'sms', 'phone', 'in_person', 'web_portal')
    ),
    CONSTRAINT valid_delivery_status CHECK (
        delivery_status IN ('sent', 'delivered', 'failed', 'bounced', 'read')
    )
);

-- Indexes for pharmaceutical communications
CREATE INDEX idx_comms_appointment ON pharma_communications(appointment_id);
CREATE INDEX idx_comms_rep ON pharma_communications(rep_id);
CREATE INDEX idx_comms_type ON pharma_communications(communication_type);
CREATE INDEX idx_comms_method ON pharma_communications(method);
CREATE INDEX idx_comms_sent_at ON pharma_communications(sent_at);
CREATE INDEX idx_comms_compliance ON pharma_communications(compliance_audit_id);

-- =====================================================
-- PHARMACEUTICAL ANALYTICS (Reporting & Insights)
-- =====================================================

CREATE TABLE pharma_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analytics_date DATE NOT NULL,
    location TEXT NOT NULL,
    total_appointments INTEGER DEFAULT 0,
    confirmed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    denied_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    unique_reps INTEGER DEFAULT 0,
    unique_companies INTEGER DEFAULT 0,
    average_booking_lead_time_days DECIMAL(4,1),
    average_approval_time_hours DECIMAL(6,2),
    cancellation_rate DECIMAL(5,2),
    attendance_rate DECIMAL(5,2),
    approval_rate DECIMAL(5,2),
    most_popular_time_slot TIME,
    busiest_day_of_week INTEGER,
    peak_booking_hour INTEGER,
    total_communication_volume INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate analytics for same date/location
    UNIQUE(analytics_date, location)
);

-- Indexes for pharmaceutical analytics
CREATE INDEX idx_analytics_date ON pharma_analytics(analytics_date);
CREATE INDEX idx_analytics_location ON pharma_analytics(location);
CREATE INDEX idx_analytics_date_location ON pharma_analytics(analytics_date, location);

-- =====================================================
-- APPROVAL WORKFLOWS (Multi-stage Approval Process)
-- =====================================================

CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES pharma_appointments(id),
    workflow_stage INTEGER NOT NULL DEFAULT 1,
    approver_email TEXT NOT NULL,
    approver_name TEXT,
    required_approval BOOLEAN DEFAULT TRUE,
    approval_status TEXT DEFAULT 'pending', -- pending, approved, denied, skipped
    approved_at TIMESTAMPTZ,
    denial_reason TEXT,
    escalated_at TIMESTAMPTZ,
    escalation_reason TEXT,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMPTZ,
    approval_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_workflow_stage CHECK (workflow_stage >= 1),
    CONSTRAINT valid_approval_status_workflow CHECK (
        approval_status IN ('pending', 'approved', 'denied', 'skipped')
    ),
    
    -- Prevent duplicate workflow stages per appointment
    UNIQUE(appointment_id, workflow_stage)
);

-- Indexes for approval workflows
CREATE INDEX idx_workflows_appointment ON approval_workflows(appointment_id);
CREATE INDEX idx_workflows_approver ON approval_workflows(approver_email);
CREATE INDEX idx_workflows_status ON approval_workflows(approval_status);
CREATE INDEX idx_workflows_stage ON approval_workflows(workflow_stage);
CREATE INDEX idx_workflows_pending ON approval_workflows(approval_status, created_at) 
    WHERE approval_status = 'pending';

-- =====================================================
-- BOOKING RULES & CONSTRAINTS
-- =====================================================

CREATE TABLE booking_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- 'time_restriction', 'capacity_limit', 'approval_requirement', 'blackout_period'
    location TEXT, -- Null = applies to all locations
    activity_id UUID REFERENCES scheduling_activities(id), -- Null = applies to all activities
    rule_conditions JSONB NOT NULL, -- JSON conditions for rule evaluation
    rule_actions JSONB NOT NULL, -- Actions to take when rule is triggered
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1, -- Higher number = higher priority
    created_by UUID, -- References users(id)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_rule_type CHECK (
        rule_type IN ('time_restriction', 'capacity_limit', 'approval_requirement', 'blackout_period', 'lead_time_requirement')
    ),
    CONSTRAINT valid_priority CHECK (priority >= 1)
);

-- Indexes for booking rules
CREATE INDEX idx_rules_type ON booking_rules(rule_type);
CREATE INDEX idx_rules_location ON booking_rules(location);
CREATE INDEX idx_rules_activity ON booking_rules(activity_id);
CREATE INDEX idx_rules_active ON booking_rules(is_active);
CREATE INDEX idx_rules_priority ON booking_rules(priority DESC);

-- =====================================================
-- RLS (Row Level Security) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE pharma_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharma_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharma_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharma_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rules ENABLE ROW LEVEL SECURITY;

-- Pharmaceutical representatives can view/edit their own records
CREATE POLICY "Reps can view own records" ON pharma_representatives
    FOR SELECT USING (email = auth.email());

CREATE POLICY "Reps can update own records" ON pharma_representatives
    FOR UPDATE USING (email = auth.email());

-- Staff can view all pharmaceutical data (for admin purposes)
CREATE POLICY "Staff can view all pharma data" ON pharma_representatives
    FOR ALL USING (
        auth.email() LIKE '%@gangerdermatology.com'
    );

-- Pharmaceutical representatives can view/manage their own appointments
CREATE POLICY "Reps can view own appointments" ON pharma_appointments
    FOR SELECT USING (
        rep_id IN (
            SELECT id FROM pharma_representatives 
            WHERE email = auth.email()
        )
    );

CREATE POLICY "Reps can create appointments" ON pharma_appointments
    FOR INSERT WITH CHECK (
        rep_id IN (
            SELECT id FROM pharma_representatives 
            WHERE email = auth.email()
        )
    );

-- Staff can view all appointments
CREATE POLICY "Staff can manage all appointments" ON pharma_appointments
    FOR ALL USING (
        auth.email() LIKE '%@gangerdermatology.com'
    );

-- =====================================================
-- POSTGRESQL FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function to calculate available time slots for an activity
CREATE OR REPLACE FUNCTION calculate_available_slots(
    p_activity_id UUID,
    p_date DATE,
    p_include_conflicts BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    slot_start TIME,
    slot_end TIME,
    is_available BOOLEAN,
    conflict_reason TEXT
) AS $$
DECLARE
    activity_record scheduling_activities%ROWTYPE;
    override_record availability_overrides%ROWTYPE;
    available_times_json JSONB;
    day_of_week INTEGER;
BEGIN
    -- Get activity details
    SELECT * INTO activity_record 
    FROM scheduling_activities 
    WHERE id = p_activity_id AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get day of week (1=Monday, 7=Sunday)
    day_of_week := EXTRACT(DOW FROM p_date);
    IF day_of_week = 0 THEN day_of_week := 7; END IF; -- Convert Sunday from 0 to 7
    
    -- Check if activity is available on this day
    IF NOT (day_of_week = ANY(activity_record.available_days)) THEN
        RETURN;
    END IF;
    
    -- Check for availability overrides
    SELECT * INTO override_record 
    FROM availability_overrides 
    WHERE activity_id = p_activity_id AND override_date = p_date;
    
    IF FOUND AND override_record.override_type IN ('blackout', 'closed') THEN
        RETURN; -- No slots available
    END IF;
    
    -- Use override times if special hours, otherwise use regular times
    IF FOUND AND override_record.override_type = 'special_hours' THEN
        available_times_json := override_record.custom_times;
    ELSE
        available_times_json := activity_record.available_times;
    END IF;
    
    -- Generate time slots (simplified - would need more complex logic for real implementation)
    -- This is a placeholder for slot generation logic
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to check for appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflicts(
    p_rep_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS TABLE (
    conflict_exists BOOLEAN,
    conflicting_appointments JSONB
) AS $$
DECLARE
    conflict_count INTEGER;
    conflicts JSONB;
BEGIN
    -- Check for overlapping appointments for the same rep
    SELECT COUNT(*), 
           COALESCE(jsonb_agg(
               jsonb_build_object(
                   'id', id,
                   'appointment_date', appointment_date,
                   'start_time', start_time,
                   'end_time', end_time,
                   'location', location
               )
           ), '[]'::jsonb)
    INTO conflict_count, conflicts
    FROM pharma_appointments
    WHERE rep_id = p_rep_id
      AND appointment_date = p_date
      AND status NOT IN ('cancelled', 'denied')
      AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
      AND timerange(start_time, end_time, '[]') && timerange(p_start_time, p_end_time, '[]');
    
    conflict_exists := conflict_count > 0;
    conflicting_appointments := conflicts;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to update appointment analytics
CREATE OR REPLACE FUNCTION update_pharma_analytics(p_date DATE, p_location TEXT)
RETURNS VOID AS $$
DECLARE
    analytics_data RECORD;
BEGIN
    -- Calculate analytics for the given date and location
    WITH appointment_stats AS (
        SELECT 
            COUNT(*) as total_appointments,
            COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_appointments,
            COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_appointments,
            COUNT(*) FILTER (WHERE approval_status = 'denied') as denied_appointments,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments,
            COALESCE(SUM(participant_count), 0) as total_participants,
            COUNT(DISTINCT rep_id) as unique_reps,
            COUNT(DISTINCT (SELECT company_name FROM pharma_representatives WHERE id = rep_id)) as unique_companies,
            AVG(EXTRACT(DAYS FROM created_at::date - appointment_date)) as avg_lead_time,
            AVG(EXTRACT(HOURS FROM approved_at - created_at)) FILTER (WHERE approved_at IS NOT NULL) as avg_approval_time,
            COUNT(*) FILTER (WHERE status = 'cancelled')::decimal / NULLIF(COUNT(*), 0) * 100 as cancellation_rate,
            COUNT(*) FILTER (WHERE status = 'completed')::decimal / NULLIF(COUNT(*) FILTER (WHERE status = 'confirmed'), 0) * 100 as attendance_rate,
            COUNT(*) FILTER (WHERE approval_status = 'approved')::decimal / NULLIF(COUNT(*), 0) * 100 as approval_rate
        FROM pharma_appointments
        WHERE appointment_date = p_date 
          AND location = p_location
    ),
    time_stats AS (
        SELECT 
            start_time as most_popular_time,
            EXTRACT(DOW FROM appointment_date) as busiest_day,
            EXTRACT(HOUR FROM created_at) as peak_booking_hour
        FROM pharma_appointments
        WHERE appointment_date = p_date 
          AND location = p_location
          AND status = 'confirmed'
        GROUP BY start_time, EXTRACT(DOW FROM appointment_date), EXTRACT(HOUR FROM created_at)
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ),
    comm_stats AS (
        SELECT COUNT(*) as total_communication_volume
        FROM pharma_communications pc
        JOIN pharma_appointments pa ON pc.appointment_id = pa.id
        WHERE pa.appointment_date = p_date 
          AND pa.location = p_location
    )
    SELECT * INTO analytics_data
    FROM appointment_stats, time_stats, comm_stats;
    
    -- Insert or update analytics record
    INSERT INTO pharma_analytics (
        analytics_date, location, total_appointments, confirmed_appointments,
        cancelled_appointments, denied_appointments, completed_appointments,
        total_participants, unique_reps, unique_companies,
        average_booking_lead_time_days, average_approval_time_hours,
        cancellation_rate, attendance_rate, approval_rate,
        most_popular_time_slot, busiest_day_of_week, peak_booking_hour,
        total_communication_volume
    ) VALUES (
        p_date, p_location, 
        COALESCE(analytics_data.total_appointments, 0),
        COALESCE(analytics_data.confirmed_appointments, 0),
        COALESCE(analytics_data.cancelled_appointments, 0),
