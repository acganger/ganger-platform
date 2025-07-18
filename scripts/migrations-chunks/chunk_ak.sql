    LOOP
      -- Insert training completion record if it doesn't exist
      INSERT INTO training_completions (
        employee_id,
        module_id,
        status,
        is_required,
        due_date,
        created_at,
        updated_at
      ) VALUES (
        employee_record.id,
        NEW.id,
        'not_started',
        dept_requirement.is_required,
        NEW.default_due_date,
        NOW(),
        NOW()
      ) ON CONFLICT (employee_id, module_id) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Broadcast new training assignment
  INSERT INTO realtime_notification_queue (
    event_type,
    payload,
    target_channels,
    created_at
  ) VALUES (
    'training_module_added',
    jsonb_build_object(
      'moduleId', NEW.id,
      'moduleName', NEW.module_name,
      'monthKey', NEW.month_key,
      'defaultDueDate', NEW.default_due_date,
      'estimatedDuration', NEW.estimated_duration_minutes,
      'isActive', NEW.is_active
    ),
    ARRAY['compliance-updates'],
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle daily compliance checks and overdue alerts
CREATE OR REPLACE FUNCTION trigger_daily_compliance_check()
RETURNS VOID AS $$
DECLARE
  overdue_record RECORD;
  overdue_employees JSONB := '[]'::JSONB;
  dept_overdue_counts JSONB := '{}'::JSONB;
BEGIN
  -- Update overdue statuses first
  PERFORM auto_update_completion_statuses();

  -- Collect overdue training data
  FOR overdue_record IN
    SELECT 
      tc.employee_id,
      e.full_name as employee_name,
      e.department,
      tc.module_id,
      tm.module_name,
      tc.overdue_days
    FROM training_completions tc
    JOIN employees e ON tc.employee_id = e.id
    JOIN training_modules tm ON tc.module_id = tm.id
    WHERE tc.status = 'overdue' 
    AND tc.is_required = true
    AND e.status = 'active'
    ORDER BY tc.overdue_days DESC
  LOOP
    -- Add to overdue employees array
    overdue_employees := overdue_employees || jsonb_build_object(
      'employeeId', overdue_record.employee_id,
      'employeeName', overdue_record.employee_name,
      'department', overdue_record.department,
      'moduleId', overdue_record.module_id,
      'moduleName', overdue_record.module_name,
      'overdueDays', overdue_record.overdue_days
    );

    -- Update department counts
    dept_overdue_counts := jsonb_set(
      dept_overdue_counts,
      ARRAY[overdue_record.department],
      to_jsonb(COALESCE((dept_overdue_counts->>overdue_record.department)::INTEGER, 0) + 1)
    );
  END LOOP;

  -- Broadcast overdue alerts if any exist
  IF jsonb_array_length(overdue_employees) > 0 THEN
    INSERT INTO realtime_notification_queue (
      event_type,
      payload,
      target_channels,
      created_at
    ) VALUES (
      'daily_overdue_alert',
      jsonb_build_object(
        'totalOverdue', jsonb_array_length(overdue_employees),
        'departmentCounts', dept_overdue_counts,
        'overdueEmployees', overdue_employees,
        'alertDate', CURRENT_DATE,
        'alertLevel', CASE 
          WHEN jsonb_array_length(overdue_employees) > 20 THEN 'critical'
          WHEN jsonb_array_length(overdue_employees) > 10 THEN 'high'
          WHEN jsonb_array_length(overdue_employees) > 5 THEN 'medium'
          ELSE 'low'
        END
      ),
      ARRAY['compliance-alerts', 'compliance-updates'],
      NOW()
    );
  END IF;

  -- Refresh materialized view for performance
  PERFORM refresh_compliance_cache();

  -- Log daily check completion
  INSERT INTO compliance_audit_log (
    action,
    table_name,
    new_values
  ) VALUES (
    'daily_compliance_check',
    'system',
    jsonb_build_object(
      'checkDate', CURRENT_DATE,
      'overdueCount', jsonb_array_length(overdue_employees),
      'departmentCounts', dept_overdue_counts
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create realtime notification queue table
CREATE TABLE IF NOT EXISTS realtime_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  target_channels TEXT[] NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);

-- Create index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_realtime_queue_unprocessed 
  ON realtime_notification_queue(created_at) 
  WHERE processed = false;

-- Function to process realtime notification queue
CREATE OR REPLACE FUNCTION process_realtime_notifications()
RETURNS INTEGER AS $$
DECLARE
  notification_record RECORD;
  processed_count INTEGER := 0;
  max_retries INTEGER := 3;
BEGIN
  -- Process unprocessed notifications
  FOR notification_record IN
    SELECT * FROM realtime_notification_queue
    WHERE processed = false 
    AND retry_count < max_retries
    ORDER BY created_at ASC
    LIMIT 100
  LOOP
    BEGIN
      -- Here we would normally call the realtime service
      -- For now, we'll mark as processed
      -- In production, this would integrate with ComplianceRealtimeService
      
      UPDATE realtime_notification_queue
      SET 
        processed = true,
        processed_at = NOW()
      WHERE id = notification_record.id;
      
      processed_count := processed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error and increment retry count
      UPDATE realtime_notification_queue
      SET 
        retry_count = retry_count + 1,
        last_error = SQLERRM
      WHERE id = notification_record.id;
    END;
  END LOOP;
  
  -- Clean up old processed notifications (older than 7 days)
  DELETE FROM realtime_notification_queue
  WHERE processed = true 
  AND processed_at < NOW() - INTERVAL '7 days';
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Create triggers

-- Trigger for training completion status updates
DROP TRIGGER IF EXISTS training_status_update_trigger ON training_completions;
CREATE TRIGGER training_status_update_trigger
  BEFORE UPDATE ON training_completions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_training_status();

-- Trigger for employee changes
DROP TRIGGER IF EXISTS employee_change_notification_trigger ON employees;
CREATE TRIGGER employee_change_notification_trigger
  AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION trigger_employee_change_notification();

-- Trigger for sync status updates
DROP TRIGGER IF EXISTS sync_status_notification_trigger ON sync_logs;
CREATE TRIGGER sync_status_notification_trigger
  AFTER UPDATE ON sync_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_status_notification();

-- Trigger for new training module assignments
DROP TRIGGER IF EXISTS auto_assign_training_trigger ON training_modules;
CREATE TRIGGER auto_assign_training_trigger
  AFTER INSERT OR UPDATE ON training_modules
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_assign_training();

-- Function to create realtime triggers for external consumption
CREATE OR REPLACE FUNCTION create_compliance_realtime_triggers()
RETURNS VOID AS $$
BEGIN
  -- Enable realtime for key tables
  ALTER PUBLICATION supabase_realtime ADD TABLE employees;
  ALTER PUBLICATION supabase_realtime ADD TABLE training_completions;
  ALTER PUBLICATION supabase_realtime ADD TABLE training_modules;
  ALTER PUBLICATION supabase_realtime ADD TABLE sync_logs;
  ALTER PUBLICATION supabase_realtime ADD TABLE realtime_notification_queue;
  
  -- Note: In production Supabase, you would use:
  -- ALTER PUBLICATION supabase_realtime ADD TABLE table_name;
  -- But for local development, we'll create a notification system
  
  RAISE NOTICE 'Compliance realtime triggers created successfully';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job function (to be called by external scheduler)
CREATE OR REPLACE FUNCTION run_daily_compliance_maintenance()
RETURNS VOID AS $$
BEGIN
  -- Run daily compliance check
  PERFORM trigger_daily_compliance_check();
  
  -- Process any pending realtime notifications
  PERFORM process_realtime_notifications();
  
  -- Log maintenance completion
  INSERT INTO compliance_audit_log (
    action,
    table_name,
    new_values
  ) VALUES (
    'daily_maintenance_completed',
    'system',
    jsonb_build_object(
      'maintenanceDate', CURRENT_DATE,
      'timestamp', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to manually trigger overdue checks (for testing)
CREATE OR REPLACE FUNCTION manual_overdue_check()
RETURNS TABLE (
  updated_count INTEGER,
  overdue_count INTEGER,
  notifications_queued INTEGER
) AS $$
DECLARE
  result_updated INTEGER;
  result_overdue INTEGER;
  initial_queue_count INTEGER;
  final_queue_count INTEGER;
BEGIN
  -- Get initial queue count
  SELECT COUNT(*) INTO initial_queue_count 
  FROM realtime_notification_queue WHERE processed = false;
  
  -- Run status updates
  SELECT auto_update_completion_statuses() INTO result_updated;
  
  -- Count current overdue
  SELECT COUNT(*) INTO result_overdue
  FROM training_completions 
  WHERE status = 'overdue' AND is_required = true;
  
  -- Run compliance check
  PERFORM trigger_daily_compliance_check();
  
  -- Get final queue count
  SELECT COUNT(*) INTO final_queue_count 
  FROM realtime_notification_queue WHERE processed = false;
  
  RETURN QUERY SELECT 
    result_updated,
    result_overdue,
    final_queue_count - initial_queue_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON FUNCTION trigger_update_training_status IS 'Automatically updates training completion status and triggers real-time notifications';
COMMENT ON FUNCTION trigger_employee_change_notification IS 'Broadcasts employee changes to real-time subscribers';
COMMENT ON FUNCTION trigger_sync_status_notification IS 'Broadcasts synchronization status updates';
COMMENT ON FUNCTION trigger_auto_assign_training IS 'Automatically assigns new training modules to eligible employees';
COMMENT ON FUNCTION trigger_daily_compliance_check IS 'Performs daily compliance checks and sends overdue alerts';
COMMENT ON FUNCTION process_realtime_notifications IS 'Processes queued real-time notifications with retry logic';
COMMENT ON FUNCTION run_daily_compliance_maintenance IS 'Runs all daily maintenance tasks for compliance system';
COMMENT ON TABLE realtime_notification_queue IS 'Queue for real-time notifications with retry and error handling';


-- Migration: 20250610000006_background_job_schedules.sql
-- ==========================================

-- Background Job Schedules Table
-- Created: 2025-01-10
-- Purpose: Store background job configuration and execution history

-- Create background job schedules table
CREATE TABLE IF NOT EXISTS background_job_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT UNIQUE NOT NULL,
  job_name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient job lookups
CREATE INDEX IF NOT EXISTS idx_background_jobs_enabled 
  ON background_job_schedules(enabled, next_run) 
  WHERE enabled = true;

-- Create index for job status queries
CREATE INDEX IF NOT EXISTS idx_background_jobs_job_id 
  ON background_job_schedules(job_id);

-- Insert default job configurations
INSERT INTO background_job_schedules (
  job_id,
  job_name,
  cron_expression,
  enabled,
  created_at,
  updated_at
) VALUES 
  ('daily-zenefits-sync', 'Daily Zenefits Employee Sync', '0 6 * * *', true, NOW(), NOW()),
  ('daily-classroom-sync', 'Daily Google Classroom Sync', '0 7 * * *', true, NOW(), NOW()),
  ('hourly-status-check', 'Hourly Compliance Status Check', '0 * * * *', true, NOW(), NOW()),
  ('weekly-compliance-report', 'Weekly Compliance Summary Report', '0 8 * * 1', true, NOW(), NOW()),
  ('daily-maintenance', 'Daily System Maintenance', '0 2 * * *', true, NOW(), NOW())
ON CONFLICT (job_id) DO NOTHING;

-- Function to update job schedule
CREATE OR REPLACE FUNCTION update_job_schedule(
  p_job_id TEXT,
  p_enabled BOOLEAN DEFAULT NULL,
  p_cron_expression TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE background_job_schedules
  SET 
    enabled = COALESCE(p_enabled, enabled),
    cron_expression = COALESCE(p_cron_expression, cron_expression),
    updated_at = NOW()
  WHERE job_id = p_job_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to record job execution
CREATE OR REPLACE FUNCTION record_job_execution(
  p_job_id TEXT,
  p_success BOOLEAN,
  p_duration INTEGER,
  p_records_processed INTEGER DEFAULT 0,
  p_errors TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_metrics JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  current_error_count INTEGER;
BEGIN
  -- Get current error count
  SELECT error_count INTO current_error_count
  FROM background_job_schedules
  WHERE job_id = p_job_id;
  
  -- Update job schedule with execution results
  UPDATE background_job_schedules
  SET 
    last_run = NOW(),
    run_count = run_count + 1,
    error_count = CASE 
      WHEN p_success THEN current_error_count 
      ELSE current_error_count + 1 
    END,
    last_result = jsonb_build_object(
      'success', p_success,
      'duration', p_duration,
      'recordsProcessed', p_records_processed,
      'errors', to_jsonb(p_errors),
      'metrics', p_metrics,
      'executedAt', NOW()
    ),
    updated_at = NOW()
  WHERE job_id = p_job_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get job execution history
CREATE OR REPLACE FUNCTION get_job_execution_history(
  p_job_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  job_id TEXT,
  job_name TEXT,
  execution_time TIMESTAMPTZ,
  success BOOLEAN,
  duration INTEGER,
  records_processed INTEGER,
  error_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bjs.job_id,
    bjs.job_name,
    bjs.last_run as execution_time,
    (bjs.last_result->>'success')::BOOLEAN as success,
    (bjs.last_result->>'duration')::INTEGER as duration,
    (bjs.last_result->>'recordsProcessed')::INTEGER as records_processed,
    bjs.error_count
  FROM background_job_schedules bjs
  WHERE (p_job_id IS NULL OR bjs.job_id = p_job_id)
  AND bjs.last_run IS NOT NULL
  ORDER BY bjs.last_run DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get job health status
CREATE OR REPLACE FUNCTION get_job_health_status()
RETURNS TABLE (
  job_id TEXT,
  job_name TEXT,
  enabled BOOLEAN,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  run_count INTEGER,
  error_count INTEGER,
  success_rate DECIMAL(5,2),
  health_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bjs.job_id,
    bjs.job_name,
    bjs.enabled,
    bjs.last_run,
    bjs.next_run,
    bjs.run_count,
    bjs.error_count,
    CASE 
      WHEN bjs.run_count = 0 THEN 100.00
      ELSE ROUND(((bjs.run_count - bjs.error_count)::DECIMAL / bjs.run_count) * 100, 2)
    END as success_rate,
    CASE 
      WHEN NOT bjs.enabled THEN 'disabled'
      WHEN bjs.last_run IS NULL THEN 'pending'
      WHEN bjs.last_run < NOW() - INTERVAL '2 days' THEN 'stale'
      WHEN bjs.error_count > (bjs.run_count * 0.1) THEN 'unhealthy'
      WHEN bjs.error_count > 0 THEN 'warning'
      ELSE 'healthy'
    END as health_status
  FROM background_job_schedules bjs
  ORDER BY bjs.job_name;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for background job schedules
ALTER TABLE background_job_schedules ENABLE ROW LEVEL SECURITY;

-- Allow superadmin and hr_admin to manage job schedules
CREATE POLICY "background_jobs_admin_policy" ON background_job_schedules
  FOR ALL USING (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin'])
  );

-- Allow managers to view job schedules
CREATE POLICY "background_jobs_read_policy" ON background_job_schedules
  FOR SELECT USING (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin', 'manager'])
  );

-- Comments for documentation
COMMENT ON TABLE background_job_schedules IS 'Configuration and execution history for background compliance jobs';
COMMENT ON FUNCTION update_job_schedule IS 'Update job schedule configuration';
COMMENT ON FUNCTION record_job_execution IS 'Record the results of a job execution';
COMMENT ON FUNCTION get_job_execution_history IS 'Get execution history for background jobs';
COMMENT ON FUNCTION get_job_health_status IS 'Get health status summary for all background jobs';


-- Migration: 20250611000001_create_call_center_tables.sql
-- ==========================================

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


-- Migration: 20250611000002_create_performance_analytics_tables.sql
-- ==========================================

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
