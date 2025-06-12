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