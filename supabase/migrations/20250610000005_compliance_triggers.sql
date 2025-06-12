-- Compliance Training Automatic Triggers
-- Created: 2025-01-10
-- Purpose: Implement database triggers for automatic status updates and real-time notifications

-- Function to handle training completion status updates
CREATE OR REPLACE FUNCTION trigger_update_training_status()
RETURNS TRIGGER AS $$
DECLARE
  module_passing_score INTEGER;
  employee_record RECORD;
  old_status TEXT;
  new_status TEXT;
BEGIN
  -- Get the passing score for this module
  SELECT passing_score INTO module_passing_score
  FROM training_modules 
  WHERE id = NEW.module_id;

  -- Store old status for comparison
  old_status := OLD.status;
  new_status := NEW.status;

  -- Auto-complete training if completion_date is set and score meets requirements
  IF NEW.completion_date IS NOT NULL AND NEW.score IS NOT NULL AND NEW.score >= module_passing_score THEN
    NEW.status := 'completed';
    new_status := 'completed';
  END IF;

  -- Auto-mark as overdue if past due date and not completed
  IF NEW.due_date < CURRENT_DATE AND NEW.completion_date IS NULL AND NEW.status NOT IN ('completed', 'exempted') THEN
    NEW.status := 'overdue';
    NEW.overdue_days := CURRENT_DATE - NEW.due_date;
    new_status := 'overdue';
  END IF;

  -- Update timestamps
  NEW.updated_at := NOW();

  -- If status changed, trigger real-time notification
  IF old_status IS DISTINCT FROM new_status THEN
    -- Get employee information for notifications
    SELECT full_name, department, email INTO employee_record
    FROM employees 
    WHERE id = NEW.employee_id;

    -- Insert notification trigger record
    INSERT INTO realtime_notification_queue (
      event_type,
      payload,
      target_channels,
      created_at
    ) VALUES (
      'training_status_changed',
      jsonb_build_object(
        'employeeId', NEW.employee_id,
        'employeeName', employee_record.full_name,
        'department', employee_record.department,
        'moduleId', NEW.module_id,
        'oldStatus', old_status,
        'newStatus', new_status,
        'completionDate', NEW.completion_date,
        'score', NEW.score,
        'overdueDays', NEW.overdue_days
      ),
      ARRAY['compliance-updates', employee_record.department, 'employee-' || NEW.employee_id::text],
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle employee updates
CREATE OR REPLACE FUNCTION trigger_employee_change_notification()
RETURNS TRIGGER AS $$
DECLARE
  change_type TEXT;
  payload JSONB;
BEGIN
  -- Determine change type
  IF TG_OP = 'INSERT' THEN
    change_type := 'employee_added';
    payload := jsonb_build_object(
      'employeeId', NEW.id,
      'employeeName', NEW.full_name,
      'department', NEW.department,
      'location', NEW.location,
      'startDate', NEW.start_date,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    change_type := 'employee_updated';
    payload := jsonb_build_object(
      'employeeId', NEW.id,
      'employeeName', NEW.full_name,
      'department', NEW.department,
      'location', NEW.location,
      'status', NEW.status,
      'changes', jsonb_build_object(
        'department', CASE WHEN OLD.department IS DISTINCT FROM NEW.department THEN 
          jsonb_build_object('old', OLD.department, 'new', NEW.department) ELSE NULL END,
        'status', CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN
          jsonb_build_object('old', OLD.status, 'new', NEW.status) ELSE NULL END,
        'location', CASE WHEN OLD.location IS DISTINCT FROM NEW.location THEN
          jsonb_build_object('old', OLD.location, 'new', NEW.location) ELSE NULL END
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    change_type := 'employee_removed';
    payload := jsonb_build_object(
      'employeeId', OLD.id,
      'employeeName', OLD.full_name,
      'department', OLD.department
    );
  END IF;

  -- Queue notification
  INSERT INTO realtime_notification_queue (
    event_type,
    payload,
    target_channels,
    created_at
  ) VALUES (
    change_type,
    payload,
    ARRAY['compliance-updates', COALESCE(NEW.department, OLD.department)],
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to handle sync logging and broadcast sync status
CREATE OR REPLACE FUNCTION trigger_sync_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast sync status updates
  INSERT INTO realtime_notification_queue (
    event_type,
    payload,
    target_channels,
    created_at
  ) VALUES (
    CASE 
      WHEN NEW.status = 'in_progress' THEN 'sync_started'
      WHEN NEW.status = 'completed' THEN 'sync_completed'
      WHEN NEW.status = 'failed' THEN 'sync_failed'
      ELSE 'sync_updated'
    END,
    jsonb_build_object(
      'syncLogId', NEW.id,
      'syncType', NEW.sync_type,
      'status', NEW.status,
      'recordsProcessed', NEW.records_processed,
      'recordsTotal', NEW.records_total,
      'errorMessage', NEW.error_message,
      'startTime', NEW.start_time,
      'endTime', NEW.end_time,
      'progressPercentage', CASE 
        WHEN NEW.records_total > 0 
        THEN ROUND((NEW.records_processed::DECIMAL / NEW.records_total) * 100, 1)
        ELSE 0 
      END
    ),
    ARRAY['sync-updates', 'compliance-updates'],
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically assign new training modules to employees
CREATE OR REPLACE FUNCTION trigger_auto_assign_training()
RETURNS TRIGGER AS $$
DECLARE
  employee_record RECORD;
  dept_requirement RECORD;
BEGIN
  -- Only process active training modules
  IF NEW.is_active = false THEN
    RETURN NEW;
  END IF;

  -- Get department requirements for this module
  FOR dept_requirement IN 
    SELECT department, is_required 
    FROM department_training_requirements 
    WHERE module_id = NEW.id
  LOOP
    -- Assign to all active employees in the department
    FOR employee_record IN
      SELECT id, full_name, department 
      FROM employees 
      WHERE status = 'active' 
      AND department = dept_requirement.department
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