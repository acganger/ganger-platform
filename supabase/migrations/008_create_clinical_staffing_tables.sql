-- =====================================================
-- Ganger Platform Database Schema - Clinical Staffing Optimization
-- Migration: 008_create_clinical_staffing_tables.sql
-- Created: January 7, 2025
-- Purpose: AI-powered clinical staffing optimization system
-- =====================================================

-- =====================================================
-- STAFF MEMBERS TABLE - Enhanced employee management
-- =====================================================
CREATE TABLE staff_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    
    -- Employment Details
    job_title VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'per_diem')),
    employee_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (employee_status IN ('active', 'inactive', 'on_leave', 'terminated')),
    hire_date DATE NOT NULL,
    termination_date DATE,
    
    -- Staffing Configuration
    base_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    available_locations UUID[] DEFAULT '{}', -- Array of location IDs
    work_schedule_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (work_schedule_type IN ('standard', 'flexible', 'on_call', 'rotating')),
    
    -- Skills and Certifications
    certifications JSONB DEFAULT '[]', -- Array of certification objects
    skills JSONB DEFAULT '[]', -- Array of skill objects with proficiency levels
    specializations JSONB DEFAULT '[]', -- Medical specializations
    
    -- Scheduling Constraints
    min_hours_per_week INTEGER DEFAULT 0,
    max_hours_per_week INTEGER DEFAULT 40,
    preferred_shift_start TIME,
    preferred_shift_end TIME,
    overtime_eligible BOOLEAN DEFAULT false,
    
    -- External System Integration
    deputy_employee_id VARCHAR(50),
    zenefits_employee_id VARCHAR(50),
    modmed_provider_id VARCHAR(50),
    
    -- AI Optimization Data
    performance_score DECIMAL(3,2) DEFAULT 5.00, -- 1-10 scale
    patient_satisfaction_score DECIMAL(3,2) DEFAULT 5.00, -- 1-10 scale
    reliability_score DECIMAL(3,2) DEFAULT 5.00, -- 1-10 scale for attendance/punctuality
    productivity_metrics JSONB DEFAULT '{}',
    
    -- Metadata and Audit
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAFF AVAILABILITY TABLE - Real-time availability tracking
-- =====================================================
CREATE TABLE staff_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
    
    -- Availability Period
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Availability Type
    availability_type VARCHAR(20) NOT NULL CHECK (availability_type IN ('available', 'unavailable', 'preferred', 'conditional')),
    reason VARCHAR(100), -- vacation, sick, training, etc.
    
    -- Recurring Patterns
    recurring_pattern VARCHAR(20) CHECK (recurring_pattern IN ('none', 'daily', 'weekly', 'monthly')),
    recurring_end_date DATE,
    
    -- Deputy Integration
    deputy_availability_id VARCHAR(50),
    deputy_sync_status VARCHAR(20) DEFAULT 'pending' CHECK (deputy_sync_status IN ('pending', 'synced', 'error')),
    deputy_last_sync TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint to prevent overlapping availability for same staff member
    CONSTRAINT no_overlapping_availability EXCLUDE USING gist (
        staff_member_id WITH =,
        daterange(date, date, '[]') WITH &&,
        timerange(start_time, end_time) WITH &&
    ) WHERE (availability_type IN ('available', 'preferred'))
);

-- =====================================================
-- SCHEDULE_TEMPLATES TABLE - Predefined schedule patterns
-- =====================================================
CREATE TABLE schedule_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    
    -- Template Configuration
    template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('daily', 'weekly', 'monthly')),
    is_active BOOLEAN DEFAULT true,
    
    -- Staffing Requirements
    staffing_requirements JSONB NOT NULL, -- JSON structure defining roles, skills, quantities
    /*
    Example structure:
    {
      "time_slots": [
        {
          "start_time": "08:00",
          "end_time": "16:00",
          "roles": [
            {"title": "Physician", "count": 2, "required_skills": ["dermatology"]},
            {"title": "Medical Assistant", "count": 3, "required_skills": ["patient_care"]},
            {"title": "Front Desk", "count": 2, "required_skills": ["scheduling"]}
          ]
        }
      ]
    }
    */
    
    -- AI Optimization Parameters
    optimization_priority VARCHAR(20) DEFAULT 'balanced' CHECK (optimization_priority IN ('cost', 'quality', 'balanced')),
    minimum_coverage_percentage DECIMAL(5,2) DEFAULT 95.00, -- Required coverage level
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAFF_SCHEDULES TABLE - Actual scheduled shifts
-- =====================================================
CREATE TABLE staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES schedule_templates(id) ON DELETE SET NULL,
    
    -- Schedule Details
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INTEGER DEFAULT 0,
    
    -- Schedule Status
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    assignment_type VARCHAR(20) NOT NULL DEFAULT 'regular' CHECK (assignment_type IN ('regular', 'overtime', 'on_call', 'emergency')),
    
    -- Role and Responsibilities
    assigned_role VARCHAR(100) NOT NULL,
    responsibilities JSONB DEFAULT '[]', -- Array of specific duties
    required_skills JSONB DEFAULT '[]', -- Skills needed for this shift
    
    -- AI Optimization Data
    ai_confidence_score DECIMAL(3,2), -- Confidence in AI assignment (0-1)
    optimization_factors JSONB DEFAULT '{}', -- Factors that influenced AI decision
    alternative_assignments JSONB DEFAULT '[]', -- Other viable staff options
    
    -- External System Integration
    deputy_schedule_id VARCHAR(50),
    modmed_appointment_ids JSONB DEFAULT '[]', -- Associated appointment IDs
    
    -- Performance Tracking
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    actual_hours_worked DECIMAL(4,2),
    performance_notes TEXT,
    patient_feedback_score DECIMAL(3,2),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent double-booking same staff member
    CONSTRAINT no_double_booking EXCLUDE USING gist (
        staff_member_id WITH =,
        daterange(schedule_date, schedule_date, '[]') WITH &&,
        timerange(start_time, end_time) WITH &&
    ) WHERE (status NOT IN ('cancelled', 'no_show'))
);

-- =====================================================
-- COVERAGE_REQUIREMENTS TABLE - Location-specific staffing needs
-- =====================================================
CREATE TABLE coverage_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    
    -- Time Period
    effective_date DATE NOT NULL,
    end_date DATE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    
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