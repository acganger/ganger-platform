  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration values
INSERT INTO compliance_configuration (config_key, config_value, description) VALUES
('sync_schedule', '{"zenefits_interval_hours": 24, "classroom_interval_hours": 6, "retry_attempts": 3}', 'Synchronization schedule configuration'),
('notification_settings', '{"reminder_days": [14, 7, 3, 1], "overdue_escalation_days": [1, 3, 7], "manager_cc": true}', 'Notification and reminder settings'),
('compliance_thresholds', '{"minimum_compliance_rate": 90.0, "critical_compliance_rate": 95.0, "grace_period_max_days": 14}', 'Compliance rate thresholds and grace periods'),
('export_settings', '{"max_records_csv": 10000, "max_records_pdf": 1000, "include_sensitive_data": false}', 'Export functionality configuration'),
('audit_retention', '{"audit_log_retention_days": 2555, "sync_log_retention_days": 365, "performance_log_retention_days": 90}', 'Data retention policies for audit logs'),
('integration_timeouts', '{"zenefits_timeout_seconds": 30, "classroom_timeout_seconds": 60, "max_retry_delay_seconds": 300}', 'External API integration timeout settings');

-- Create notification templates table
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT UNIQUE NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('email', 'sms', 'system')),
  subject TEXT,
  body_template TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert notification templates
INSERT INTO notification_templates (template_name, template_type, subject, body_template, variables) VALUES
('training_reminder_14_days', 'email', 'Training Reminder: {{module_name}} Due in 14 Days', 
 'Hi {{employee_name}},

This is a reminder that your required training "{{module_name}}" is due on {{due_date}}.

Please complete your training by logging into Google Classroom: {{classroom_url}}

If you have any questions, please contact your manager or HR.

Best regards,
Ganger Dermatology Training Team', 
 '["employee_name", "module_name", "due_date", "classroom_url"]'),

('training_overdue', 'email', 'URGENT: Overdue Training - {{module_name}}',
 'Hi {{employee_name}},

Your required training "{{module_name}}" was due on {{due_date}} and is now {{overdue_days}} days overdue.

Please complete this training immediately: {{classroom_url}}

Failure to complete required training may result in disciplinary action.

Please contact HR if you need assistance.

Best regards,
Ganger Dermatology Training Team',
 '["employee_name", "module_name", "due_date", "overdue_days", "classroom_url"]'),

('manager_compliance_alert', 'email', 'Department Compliance Alert - {{department}}',
 'Hi {{manager_name}},

Your department compliance rate has fallen below the required threshold:

Department: {{department}}
Current Compliance Rate: {{compliance_rate}}%
Required Rate: {{required_rate}}%

Employees with overdue training:
{{overdue_list}}

Please follow up with these employees to ensure timely completion.

Dashboard: {{dashboard_url}}

Best regards,
Ganger Dermatology Compliance System',
 '["manager_name", "department", "compliance_rate", "required_rate", "overdue_list", "dashboard_url"]');

-- Create scheduled jobs table for background processing
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT UNIQUE NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('sync', 'notification', 'cleanup', 'report')),
  schedule_cron TEXT NOT NULL,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  job_config JSONB,
  run_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default scheduled jobs
INSERT INTO scheduled_jobs (job_name, job_type, schedule_cron, next_run_at, job_config) VALUES
('daily_zenefits_sync', 'sync', '0 2 * * *', NOW() + INTERVAL '1 day', '{"sync_type": "zenefits", "full_sync": true}'),
('hourly_classroom_sync', 'sync', '0 * * * *', NOW() + INTERVAL '1 hour', '{"sync_type": "classroom", "incremental": true}'),
('daily_reminder_notifications', 'notification', '0 8 * * *', NOW() + INTERVAL '1 day', '{"notification_types": ["reminder", "overdue"]}'),
('weekly_compliance_report', 'report', '0 6 * * 1', NOW() + INTERVAL '7 days', '{"report_type": "compliance_summary", "recipients": ["hr@gangerdermatology.com"]}'),
('monthly_audit_cleanup', 'cleanup', '0 3 1 * *', NOW() + INTERVAL '1 month', '{"cleanup_type": "audit_logs", "retention_days": 2555}');

-- Create employee status tracking view
CREATE OR REPLACE VIEW employee_compliance_status AS
SELECT 
  e.id,
  e.full_name,
  e.email,
  e.department,
  e.location,
  e.start_date,
  COUNT(tc.id) as total_assigned_trainings,
  COUNT(tc.id) FILTER (WHERE tc.status = 'completed') as completed_trainings,
  COUNT(tc.id) FILTER (WHERE tc.status = 'overdue') as overdue_trainings,
  COUNT(tc.id) FILTER (WHERE tc.status = 'in_progress') as in_progress_trainings,
  CASE 
    WHEN COUNT(tc.id) FILTER (WHERE tc.is_required = true) = 0 THEN 100.00
    ELSE (COUNT(tc.id) FILTER (WHERE tc.is_required = true AND tc.status = 'completed')::DECIMAL / 
          COUNT(tc.id) FILTER (WHERE tc.is_required = true)) * 100
  END as compliance_rate,
  CASE 
    WHEN COUNT(tc.id) FILTER (WHERE tc.status = 'overdue') > 0 THEN 'non_compliant'
    WHEN COUNT(tc.id) FILTER (WHERE tc.is_required = true AND tc.status != 'completed') > 0 THEN 'pending'
    ELSE 'compliant'
  END as compliance_status,
  MAX(tc.due_date) FILTER (WHERE tc.status != 'completed') as next_due_date,
  e.last_synced_at
FROM employees e
LEFT JOIN training_completions tc ON e.id = tc.employee_id
WHERE e.status = 'active'
GROUP BY e.id, e.full_name, e.email, e.department, e.location, e.start_date, e.last_synced_at;

-- Create department compliance summary view
CREATE OR REPLACE VIEW department_compliance_dashboard AS
SELECT 
  department,
  COUNT(DISTINCT id) as total_employees,
  AVG(compliance_rate) as avg_compliance_rate,
  COUNT(*) FILTER (WHERE compliance_status = 'compliant') as compliant_employees,
  COUNT(*) FILTER (WHERE compliance_status = 'pending') as pending_employees,
  COUNT(*) FILTER (WHERE compliance_status = 'non_compliant') as non_compliant_employees,
  SUM(overdue_trainings) as total_overdue_trainings,
  MAX(next_due_date) as next_department_deadline
FROM employee_compliance_status
GROUP BY department
ORDER BY avg_compliance_rate ASC;

-- Enable RLS on new tables
ALTER TABLE compliance_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for configuration tables
CREATE POLICY "config_admin_access" ON compliance_configuration
  FOR ALL USING (auth.user_has_role(ARRAY['superadmin', 'hr_admin']));

CREATE POLICY "templates_admin_access" ON notification_templates  
  FOR ALL USING (auth.user_has_role(ARRAY['superadmin', 'hr_admin']));

CREATE POLICY "jobs_admin_access" ON scheduled_jobs
  FOR ALL USING (auth.user_has_role(ARRAY['superadmin', 'hr_admin']));

-- Update triggers for new tables
CREATE TRIGGER trigger_compliance_config_updated_at
  BEFORE UPDATE ON compliance_configuration
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_scheduled_jobs_updated_at
  BEFORE UPDATE ON scheduled_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for compliance dashboard with caching
CREATE OR REPLACE FUNCTION get_cached_compliance_dashboard(
  cache_key TEXT DEFAULT 'dashboard_default',
  cache_ttl_minutes INTEGER DEFAULT 15
)
RETURNS JSONB AS $$
DECLARE
  cached_result JSONB;
  cache_timestamp TIMESTAMPTZ;
  current_data JSONB;
BEGIN
  -- Check if we have cached data
  SELECT config_value, updated_at INTO cached_result, cache_timestamp
  FROM compliance_configuration 
  WHERE config_key = 'cache_' || cache_key;
  
  -- Return cached data if still valid
  IF cached_result IS NOT NULL AND 
     cache_timestamp > (NOW() - INTERVAL '1 minute' * cache_ttl_minutes) THEN
    RETURN cached_result;
  END IF;
  
  -- Generate fresh data
  SELECT jsonb_build_object(
    'overall_stats', (
      SELECT jsonb_build_object(
        'total_employees', COUNT(DISTINCT e.id),
        'total_trainings', COUNT(tc.id),
        'completed_trainings', COUNT(tc.id) FILTER (WHERE tc.status = 'completed'),
        'overdue_trainings', COUNT(tc.id) FILTER (WHERE tc.status = 'overdue'),
        'overall_compliance_rate', calculate_compliance_rate()
      )
      FROM employees e
      LEFT JOIN training_completions tc ON e.id = tc.employee_id
      WHERE e.status = 'active'
    ),
    'department_summary', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'department', department,
          'total_employees', total_employees,
          'avg_compliance_rate', avg_compliance_rate,
          'compliant_employees', compliant_employees,
          'non_compliant_employees', non_compliant_employees,
          'total_overdue_trainings', total_overdue_trainings
        )
      )
      FROM department_compliance_dashboard
    ),
    'generated_at', NOW()
  ) INTO current_data;
  
  -- Cache the result
  INSERT INTO compliance_configuration (config_key, config_value, description)
  VALUES ('cache_' || cache_key, current_data, 'Cached dashboard data')
  ON CONFLICT (config_key) 
  DO UPDATE SET config_value = current_data, updated_at = NOW();
  
  RETURN current_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE compliance_configuration IS 'System configuration for compliance training management';
COMMENT ON TABLE notification_templates IS 'Email and notification templates for compliance communications';
COMMENT ON TABLE scheduled_jobs IS 'Background job scheduling and execution tracking';
COMMENT ON VIEW employee_compliance_status IS 'Comprehensive employee compliance status view';
COMMENT ON VIEW department_compliance_dashboard IS 'Department-level compliance metrics and summary';


-- Migration: 20250610000004_compliance_advanced_functions.sql
-- ==========================================

-- Advanced Compliance Training Database Functions
-- Created: 2025-01-10
-- Purpose: Additional database functions for compliance calculations, reporting, and automation

-- Function to calculate individual employee compliance score with weighted metrics
CREATE OR REPLACE FUNCTION calculate_employee_compliance_score(emp_id UUID)
RETURNS JSONB AS $$
DECLARE
  employee_record RECORD;
  training_stats RECORD;
  compliance_score DECIMAL(5,2);
  score_breakdown JSONB;
BEGIN
  -- Get employee information
  SELECT * INTO employee_record
  FROM employees 
  WHERE id = emp_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Employee not found');
  END IF;
  
  -- Calculate training statistics
  SELECT 
    COUNT(*) as total_trainings,
    COUNT(*) FILTER (WHERE is_required = true) as required_trainings,
    COUNT(*) FILTER (WHERE is_required = true AND status = 'completed') as completed_required,
    COUNT(*) FILTER (WHERE status = 'overdue') as overdue_trainings,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_trainings,
    AVG(score) FILTER (WHERE score IS NOT NULL AND status = 'completed') as avg_score,
    SUM(overdue_days) FILTER (WHERE status = 'overdue') as total_overdue_days,
    AVG(time_spent_minutes) FILTER (WHERE time_spent_minutes IS NOT NULL) as avg_time_spent
  INTO training_stats
  FROM training_completions
  WHERE employee_id = emp_id;
  
  -- Calculate weighted compliance score
  -- Base score: completion rate (70% weight)
  -- Timeliness: overdue penalty (20% weight)  
  -- Quality: average score (10% weight)
  
  DECLARE
    completion_rate DECIMAL(5,2) := CASE 
      WHEN training_stats.required_trainings = 0 THEN 100.00
      ELSE (training_stats.completed_required::DECIMAL / training_stats.required_trainings) * 100
    END;
    
    timeliness_score DECIMAL(5,2) := CASE
      WHEN training_stats.overdue_trainings = 0 THEN 100.00
      WHEN training_stats.total_overdue_days IS NULL THEN 100.00
      ELSE GREATEST(0, 100 - (training_stats.total_overdue_days * 2)) -- 2 points per overdue day
    END;
    
    quality_score DECIMAL(5,2) := COALESCE(training_stats.avg_score, 85.00); -- Default to 85 if no scores
    
  BEGIN
    compliance_score := (completion_rate * 0.7) + (timeliness_score * 0.2) + (quality_score * 0.1);
    
    score_breakdown := jsonb_build_object(
      'completion_rate', completion_rate,
      'completion_weight', 70,
      'timeliness_score', timeliness_score,
      'timeliness_weight', 20,
      'quality_score', quality_score,
      'quality_weight', 10,
      'final_score', compliance_score
    );
  END;
  
  RETURN jsonb_build_object(
    'employee_id', emp_id,
    'employee_name', employee_record.full_name,
    'department', employee_record.department,
    'compliance_score', compliance_score,
    'score_breakdown', score_breakdown,
    'training_stats', jsonb_build_object(
      'total_trainings', training_stats.total_trainings,
      'required_trainings', training_stats.required_trainings,
      'completed_required', training_stats.completed_required,
      'overdue_trainings', training_stats.overdue_trainings,
      'in_progress_trainings', training_stats.in_progress_trainings,
      'avg_score', training_stats.avg_score,
      'total_overdue_days', training_stats.total_overdue_days,
      'avg_time_spent', training_stats.avg_time_spent
    ),
    'compliance_level', CASE
      WHEN compliance_score >= 95 THEN 'excellent'
      WHEN compliance_score >= 90 THEN 'good'
      WHEN compliance_score >= 80 THEN 'satisfactory'
      WHEN compliance_score >= 70 THEN 'needs_improvement'
      ELSE 'unsatisfactory'
    END,
    'calculated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get department compliance trends over time
CREATE OR REPLACE FUNCTION get_department_compliance_trends(
  dept TEXT DEFAULT NULL,
  days_back INTEGER DEFAULT 90
)
RETURNS TABLE (
  date DATE,
  department TEXT,
  compliance_rate DECIMAL(5,2),
  total_employees INTEGER,
  compliant_employees INTEGER,
  overdue_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '1 day' * days_back,
      CURRENT_DATE,
      INTERVAL '1 day'
    )::DATE as trend_date
  ),
  daily_compliance AS (
    SELECT 
      ds.trend_date,
      e.department,
      COUNT(DISTINCT e.id) as total_employees,
      COUNT(DISTINCT e.id) FILTER (
        WHERE NOT EXISTS (
          SELECT 1 FROM training_completions tc 
          WHERE tc.employee_id = e.id 
          AND tc.is_required = true 
          AND tc.status IN ('overdue', 'not_started')
          AND tc.due_date <= ds.trend_date
        )
      ) as compliant_employees,
      COUNT(DISTINCT tc_overdue.employee_id) as overdue_count
    FROM date_series ds
    CROSS JOIN employees e
    LEFT JOIN training_completions tc_overdue ON e.id = tc_overdue.employee_id 
      AND tc_overdue.status = 'overdue' 
      AND tc_overdue.due_date <= ds.trend_date
    WHERE 
      e.status = 'active'
      AND e.start_date <= ds.trend_date
      AND (dept IS NULL OR e.department = dept)
    GROUP BY ds.trend_date, e.department
  )
  SELECT 
    dc.trend_date as date,
    dc.department,
    CASE 
      WHEN dc.total_employees = 0 THEN 100.00
      ELSE (dc.compliant_employees::DECIMAL / dc.total_employees) * 100
    END as compliance_rate,
    dc.total_employees,
    dc.compliant_employees,
    dc.overdue_count
  FROM daily_compliance dc
  WHERE dc.total_employees > 0
  ORDER BY dc.trend_date, dc.department;
END;
$$ LANGUAGE plpgsql;

-- Function to identify employees at risk of non-compliance
CREATE OR REPLACE FUNCTION identify_at_risk_employees(
  risk_threshold_days INTEGER DEFAULT 14,
  dept TEXT DEFAULT NULL
)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  department TEXT,
  risk_level TEXT,
  upcoming_deadlines INTEGER,
  overdue_trainings INTEGER,
  days_to_next_deadline INTEGER,
  risk_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH employee_risk_data AS (
    SELECT 
      e.id as employee_id,
      e.full_name as employee_name,
      e.department,
      COUNT(tc.id) FILTER (
        WHERE tc.status NOT IN ('completed', 'exempted')
        AND tc.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day' * risk_threshold_days
      ) as upcoming_deadlines,
      COUNT(tc.id) FILTER (WHERE tc.status = 'overdue') as overdue_trainings,
      MIN(tc.due_date) FILTER (
        WHERE tc.status NOT IN ('completed', 'exempted')
        AND tc.due_date >= CURRENT_DATE
      ) - CURRENT_DATE as days_to_next_deadline,
      -- Risk score calculation (higher = more risk)
      (COUNT(tc.id) FILTER (WHERE tc.status = 'overdue') * 10) +
      (COUNT(tc.id) FILTER (
        WHERE tc.status NOT IN ('completed', 'exempted')
        AND tc.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      ) * 5) +
      (COUNT(tc.id) FILTER (
        WHERE tc.status NOT IN ('completed', 'exempted')
        AND tc.due_date BETWEEN CURRENT_DATE + INTERVAL '7 days' AND CURRENT_DATE + INTERVAL '14 days'
      ) * 2) as risk_score
    FROM employees e
    LEFT JOIN training_completions tc ON e.id = tc.employee_id
    WHERE 
      e.status = 'active'
      AND (dept IS NULL OR e.department = dept)
    GROUP BY e.id, e.full_name, e.department
  )
  SELECT 
    erd.employee_id,
    erd.employee_name,
    erd.department,
    CASE 
      WHEN erd.risk_score >= 20 THEN 'critical'
      WHEN erd.risk_score >= 10 THEN 'high'
      WHEN erd.risk_score >= 5 THEN 'medium'
      WHEN erd.risk_score > 0 THEN 'low'
      ELSE 'minimal'
    END as risk_level,
    erd.upcoming_deadlines,
    erd.overdue_trainings,
    erd.days_to_next_deadline,
    erd.risk_score
  FROM employee_risk_data erd
  WHERE erd.risk_score > 0
  ORDER BY erd.risk_score DESC, erd.days_to_next_deadline ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to generate automated compliance recommendations
CREATE OR REPLACE FUNCTION generate_compliance_recommendations(
  target_dept TEXT DEFAULT NULL
)
RETURNS TABLE (
  recommendation_type TEXT,
  priority TEXT,
  department TEXT,
  affected_employees INTEGER,
  description TEXT,
  suggested_action TEXT,
  expected_impact TEXT
) AS $$
BEGIN
  RETURN QUERY
  
  -- Recommendation 1: Address overdue trainings
  SELECT 
    'overdue_training'::TEXT as recommendation_type,
    CASE 
      WHEN COUNT(*) >= 10 THEN 'critical'
      WHEN COUNT(*) >= 5 THEN 'high'
      ELSE 'medium'
    END as priority,
    e.department,
    COUNT(DISTINCT e.id)::INTEGER as affected_employees,
    'Employees with overdue required training modules'::TEXT as description,
    CONCAT('Schedule immediate completion for ', COUNT(*), ' overdue training assignments') as suggested_action,
    CONCAT('Could improve department compliance rate by up to ', 
           ROUND((COUNT(*)::DECIMAL / NULLIF(dept_totals.total_employees, 0)) * 100, 1), '%') as expected_impact
  FROM employees e
  JOIN training_completions tc ON e.id = tc.employee_id
  JOIN LATERAL (
    SELECT COUNT(DISTINCT id) as total_employees 
    FROM employees 
    WHERE department = e.department AND status = 'active'
  ) dept_totals ON true
  WHERE 
    e.status = 'active'
    AND tc.status = 'overdue'
    AND tc.is_required = true
    AND (target_dept IS NULL OR e.department = target_dept)
  GROUP BY e.department, dept_totals.total_employees
  HAVING COUNT(*) > 0

  UNION ALL

  -- Recommendation 2: Proactive reminders for upcoming deadlines
  SELECT 
    'upcoming_deadlines'::TEXT as recommendation_type,
    'medium'::TEXT as priority,
    e.department,
    COUNT(DISTINCT e.id)::INTEGER as affected_employees,
    'Employees with training due within 7 days'::TEXT as description,
    CONCAT('Send reminder notifications to ', COUNT(DISTINCT e.id), ' employees') as suggested_action,
    'Prevent future overdue situations and maintain compliance rates'::TEXT as expected_impact
  FROM employees e
  JOIN training_completions tc ON e.id = tc.employee_id
  WHERE 
    e.status = 'active'
    AND tc.status IN ('not_started', 'in_progress')
    AND tc.is_required = true
    AND tc.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND (target_dept IS NULL OR e.department = target_dept)
  GROUP BY e.department
  HAVING COUNT(DISTINCT e.id) >= 3

  UNION ALL

  -- Recommendation 3: Training module effectiveness review
  SELECT 
    'low_performance_modules'::TEXT as recommendation_type,
    'low'::TEXT as priority,
    NULL::TEXT as department,
    COUNT(DISTINCT tc.employee_id)::INTEGER as affected_employees,
    CONCAT('Training module "', tm.module_name, '" has low average scores') as description,
    CONCAT('Review and update training content for module: ', tm.module_name) as suggested_action,
    'Improve training effectiveness and employee understanding'::TEXT as expected_impact
  FROM training_modules tm
  JOIN training_completions tc ON tm.id = tc.module_id
  WHERE 
    tc.status = 'completed'
    AND tc.score IS NOT NULL
    AND tm.is_active = true
  GROUP BY tm.id, tm.module_name
  HAVING AVG(tc.score) < 75 AND COUNT(*) >= 10

  ORDER BY 
    CASE priority 
      WHEN 'critical' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      ELSE 4 
    END,
    affected_employees DESC;
    
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update training completion statuses based on business rules
CREATE OR REPLACE FUNCTION auto_update_completion_statuses()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update overdue status for past due trainings
  UPDATE training_completions
  SET 
    status = 'overdue',
    updated_at = NOW()
  WHERE 
    status IN ('not_started', 'in_progress')
    AND due_date < CURRENT_DATE
    AND completion_date IS NULL;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Update completed status for trainings with passing scores
  UPDATE training_completions
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE 
    status IN ('in_progress')
    AND completion_date IS NOT NULL
    AND score IS NOT NULL
    AND score >= (
      SELECT passing_score 
      FROM training_modules 
      WHERE id = training_completions.module_id
    );
    
  GET DIAGNOSTICS updated_count = updated_count + ROW_COUNT;
  
  -- Log the update operation
  INSERT INTO compliance_audit_log (
    action,
    table_name,
    new_values
  ) VALUES (
    'auto_status_update',
    'training_completions',
    jsonb_build_object(
      'updated_count', updated_count,
      'updated_at', NOW()
    )
  );
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate training effectiveness metrics
CREATE OR REPLACE FUNCTION calculate_training_effectiveness()
RETURNS TABLE (
  module_id UUID,
  module_name TEXT,
  total_completions INTEGER,
  avg_score DECIMAL(5,2),
  avg_completion_time_days DECIMAL(5,2),
  pass_rate DECIMAL(5,2),
  retake_rate DECIMAL(5,2),
  effectiveness_score DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.id as module_id,
    tm.module_name,
    COUNT(tc.id)::INTEGER as total_completions,
    AVG(tc.score) as avg_score,
    AVG(EXTRACT(epoch FROM (tc.completion_date - tc.created_at)) / 86400) as avg_completion_time_days,
    (COUNT(tc.id) FILTER (WHERE tc.score >= tm.passing_score)::DECIMAL / NULLIF(COUNT(tc.id), 0)) * 100 as pass_rate,
    (COUNT(tc.id) FILTER (WHERE tc.attempts_count > 1)::DECIMAL / NULLIF(COUNT(tc.id), 0)) * 100 as retake_rate,
    -- Effectiveness score: weighted combination of pass rate, avg score, and completion time
    (
      (COALESCE((COUNT(tc.id) FILTER (WHERE tc.score >= tm.passing_score)::DECIMAL / NULLIF(COUNT(tc.id), 0)) * 100, 0) * 0.4) +
      (COALESCE(AVG(tc.score), 0) * 0.4) +
      (GREATEST(0, 100 - COALESCE(AVG(EXTRACT(epoch FROM (tc.completion_date - tc.created_at)) / 86400), 0) * 2) * 0.2)
    ) as effectiveness_score
  FROM training_modules tm
  LEFT JOIN training_completions tc ON tm.id = tc.module_id 
    AND tc.status = 'completed'
    AND tc.completion_date >= CURRENT_DATE - INTERVAL '12 months'
  WHERE tm.is_active = true
  GROUP BY tm.id, tm.module_name, tm.passing_score
  ORDER BY effectiveness_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function for real-time compliance dashboard data
CREATE OR REPLACE FUNCTION get_realtime_compliance_snapshot()
RETURNS JSONB AS $$
DECLARE
  snapshot JSONB;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', NOW(),
    'overall_stats', (
      SELECT jsonb_build_object(
        'total_employees', COUNT(DISTINCT e.id),
        'total_active_trainings', COUNT(tc.id),
        'completed_trainings', COUNT(tc.id) FILTER (WHERE tc.status = 'completed'),
        'overdue_trainings', COUNT(tc.id) FILTER (WHERE tc.status = 'overdue'),
        'in_progress_trainings', COUNT(tc.id) FILTER (WHERE tc.status = 'in_progress'),
        'overall_compliance_rate', calculate_compliance_rate()
      )
      FROM employees e
      LEFT JOIN training_completions tc ON e.id = tc.employee_id
      WHERE e.status = 'active'
    ),
    'department_breakdown', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'department', department,
          'total_employees', total_employees,
          'avg_compliance_rate', avg_compliance_rate,
          'compliant_employees', compliant_employees,
          'non_compliant_employees', non_compliant_employees
        )
      )
      FROM department_compliance_dashboard
    ),
    'urgent_actions', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type', 'overdue_training',
          'employee_name', e.full_name,
          'department', e.department,
          'module_name', tm.module_name,
          'overdue_days', tc.overdue_days,
          'priority', CASE 
            WHEN tc.overdue_days > 14 THEN 'critical'
            WHEN tc.overdue_days > 7 THEN 'high'
            ELSE 'medium'
          END
        )
      )
      FROM training_completions tc
      JOIN employees e ON tc.employee_id = e.id
      JOIN training_modules tm ON tc.module_id = tm.id
      WHERE tc.status = 'overdue' AND tc.is_required = true
      ORDER BY tc.overdue_days DESC
      LIMIT 10
    ),
    'recent_activity', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'action', action,
          'timestamp', created_at,
          'details', new_values
        )
      )
      FROM compliance_audit_log
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 20
    )
  ) INTO snapshot;
  
  RETURN snapshot;
END;
$$ LANGUAGE plpgsql;

-- Create indices for performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_completions_status_due_date 
  ON training_completions(status, due_date) 
  WHERE status IN ('not_started', 'in_progress', 'overdue');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_completions_employee_required 
  ON training_completions(employee_id, is_required) 
  WHERE is_required = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_completions_completion_score 
  ON training_completions(completion_date, score) 
  WHERE completion_date IS NOT NULL AND score IS NOT NULL;

-- Create materialized view for performance-critical compliance reporting
CREATE MATERIALIZED VIEW IF NOT EXISTS compliance_reporting_cache AS
SELECT 
  e.id as employee_id,
  e.full_name as employee_name,
  e.department,
  e.location,
  COUNT(tc.id) as total_trainings,
  COUNT(tc.id) FILTER (WHERE tc.is_required = true) as required_trainings,
  COUNT(tc.id) FILTER (WHERE tc.is_required = true AND tc.status = 'completed') as completed_required,
  COUNT(tc.id) FILTER (WHERE tc.status = 'overdue') as overdue_trainings,
  CASE 
    WHEN COUNT(tc.id) FILTER (WHERE tc.is_required = true) = 0 THEN 100.00
    ELSE (COUNT(tc.id) FILTER (WHERE tc.is_required = true AND tc.status = 'completed')::DECIMAL / 
          COUNT(tc.id) FILTER (WHERE tc.is_required = true)) * 100
  END as compliance_rate,
  AVG(tc.score) FILTER (WHERE tc.score IS NOT NULL AND tc.status = 'completed') as avg_score,
  MAX(tc.updated_at) as last_training_update
FROM employees e
LEFT JOIN training_completions tc ON e.id = tc.employee_id
WHERE e.status = 'active'
GROUP BY e.id, e.full_name, e.department, e.location;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_reporting_cache_employee 
  ON compliance_reporting_cache(employee_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_compliance_cache()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY compliance_reporting_cache;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_employee_compliance_score IS 'Calculate weighted compliance score for individual employee with detailed breakdown';
COMMENT ON FUNCTION get_department_compliance_trends IS 'Get historical compliance trends by department over specified time period';
COMMENT ON FUNCTION identify_at_risk_employees IS 'Identify employees at risk of non-compliance based on upcoming deadlines and current status';
COMMENT ON FUNCTION generate_compliance_recommendations IS 'Generate automated recommendations for improving compliance based on current data';
COMMENT ON FUNCTION auto_update_completion_statuses IS 'Automatically update training completion statuses based on business rules';
COMMENT ON FUNCTION calculate_training_effectiveness IS 'Calculate effectiveness metrics for training modules';
COMMENT ON FUNCTION get_realtime_compliance_snapshot IS 'Get real-time compliance data snapshot for dashboard';
COMMENT ON MATERIALIZED VIEW compliance_reporting_cache IS 'Performance-optimized cache for compliance reporting queries';


-- Migration: 20250610000005_compliance_triggers.sql
-- ==========================================

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
