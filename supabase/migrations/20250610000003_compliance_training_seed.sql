-- Compliance Training Seed Data and Deployment Configuration
-- Created: 2025-01-10
-- Purpose: Initial data setup and deployment configuration for compliance training

-- Insert default training modules for 2025
INSERT INTO training_modules (month_key, module_name, due_date, classroom_course_id, description, estimated_duration_minutes, passing_score) VALUES
('2025-01', 'HIPAA Privacy Training', '2025-01-31', 'classroom_course_hipaa_2025_01', 'Annual HIPAA privacy and security training for medical staff covering patient data protection, privacy rules, and security safeguards', 45, 85.00),
('2025-02', 'Fire Safety and Emergency Procedures', '2025-02-28', 'classroom_course_fire_2025_02', 'Comprehensive fire safety training including evacuation procedures, fire extinguisher use, and emergency protocols', 30, 80.00),
('2025-03', 'Infection Control and Prevention', '2025-03-31', 'classroom_course_infection_2025_03', 'Infection control protocols, hand hygiene, PPE usage, and prevention strategies for medical environments', 40, 85.00),
('2025-04', 'Workplace Safety and OSHA Compliance', '2025-04-30', 'classroom_course_osha_2025_04', 'OSHA regulations, workplace safety standards, and hazard identification for healthcare settings', 35, 80.00),
('2025-05', 'Professional Ethics and Patient Care', '2025-05-31', 'classroom_course_ethics_2025_05', 'Medical ethics, patient rights, professional conduct, and ethical decision-making in healthcare', 50, 85.00),
('2025-06', 'Data Security and Cybersecurity', '2025-06-30', 'classroom_course_cyber_2025_06', 'Cybersecurity best practices, data protection, phishing prevention, and secure communication in healthcare', 40, 85.00),
('2025-07', 'Discrimination and Harassment Prevention', '2025-07-31', 'classroom_course_harassment_2025_07', 'Prevention of workplace discrimination and harassment, creating inclusive environments, and reporting procedures', 45, 80.00),
('2025-08', 'Emergency Response and Crisis Management', '2025-08-31', 'classroom_course_emergency_2025_08', 'Emergency response protocols, crisis management, and business continuity in healthcare settings', 35, 80.00),
('2025-09', 'Quality Assurance and Patient Safety', '2025-09-30', 'classroom_course_quality_2025_09', 'Quality assurance processes, patient safety protocols, and continuous improvement in healthcare delivery', 40, 85.00),
('2025-10', 'Regulatory Compliance Updates', '2025-10-31', 'classroom_course_regulatory_2025_10', 'Latest regulatory changes, compliance requirements, and updates to healthcare regulations', 30, 80.00),
('2025-11', 'Communication and Customer Service', '2025-11-30', 'classroom_course_communication_2025_11', 'Effective communication with patients, customer service excellence, and conflict resolution skills', 35, 80.00),
('2025-12', 'Annual Review and Assessment', '2025-12-31', 'classroom_course_annual_2025_12', 'Comprehensive annual review of all compliance topics and assessment of training effectiveness', 60, 85.00);

-- Insert department-specific training requirements
INSERT INTO department_training_requirements (department, module_id, is_required, priority_level, grace_period_days, reminder_days_before) 
SELECT 
  dept.name,
  tm.id,
  CASE 
    WHEN tm.month_key IN ('2025-01', '2025-03', '2025-06') THEN true  -- Critical modules
    WHEN dept.name IN ('Clinical', 'Nursing') AND tm.month_key IN ('2025-05', '2025-09') THEN true  -- Clinical-specific
    WHEN dept.name = 'IT' AND tm.month_key = '2025-06' THEN true  -- IT-specific
    ELSE false
  END as is_required,
  CASE 
    WHEN tm.month_key IN ('2025-01', '2025-03') THEN 'critical'
    WHEN tm.month_key IN ('2025-06', '2025-09') THEN 'high'
    ELSE 'standard'
  END as priority_level,
  CASE 
    WHEN tm.month_key IN ('2025-01', '2025-03') THEN 3  -- Shorter grace for critical
    ELSE 7
  END as grace_period_days,
  14 as reminder_days_before
FROM 
  (VALUES 
    ('Clinical'),
    ('Nursing'), 
    ('Administrative'),
    ('IT'),
    ('Management'),
    ('Billing'),
    ('Reception')
  ) as dept(name)
CROSS JOIN training_modules tm
WHERE tm.is_active = true;

-- Create configuration table for compliance settings
CREATE TABLE compliance_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
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