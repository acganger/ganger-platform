-- Row Level Security (RLS) Policies for Compliance Training
-- Created: 2025-01-10
-- Purpose: HIPAA-compliant access control for compliance training data

-- Enable RLS on all compliance training tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_training_requirements ENABLE ROW LEVEL SECURITY;

-- Helper function to check user roles
CREATE OR REPLACE FUNCTION auth.user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() ->> 'role') = ANY(required_roles) OR
      (auth.jwt() ->> 'user_role') = ANY(required_roles) OR
      EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role = ANY(required_roles)
        AND ur.is_active = true
      ),
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check department access
CREATE OR REPLACE FUNCTION auth.user_can_access_department(dept TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_department TEXT;
  user_role TEXT;
BEGIN
  -- Get user role and department
  SELECT COALESCE(auth.jwt() ->> 'role', auth.jwt() ->> 'user_role') INTO user_role;
  SELECT COALESCE(auth.jwt() ->> 'department') INTO user_department;
  
  -- Superadmin and HR admin can access all departments
  IF user_role IN ('superadmin', 'hr_admin') THEN
    RETURN true;
  END IF;
  
  -- Managers can access their department
  IF user_role = 'manager' AND user_department = dept THEN
    RETURN true;
  END IF;
  
  -- Users can only access their own department
  IF user_department = dept THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- EMPLOYEES TABLE RLS POLICIES

-- Read access: Manager+ can view employees in their scope
CREATE POLICY "employees_select_policy" ON employees
  FOR SELECT USING (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin']) OR
    (auth.user_has_role(ARRAY['manager']) AND auth.user_can_access_department(department)) OR
    (auth.user_has_role(ARRAY['provider', 'nurse', 'medical_assistant']) AND 
     department = COALESCE(auth.jwt() ->> 'department', ''))
  );

-- Insert access: HR admin and superadmin only
CREATE POLICY "employees_insert_policy" ON employees
  FOR INSERT WITH CHECK (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin'])
  );

-- Update access: HR admin and superadmin for all, managers for their department
CREATE POLICY "employees_update_policy" ON employees
  FOR UPDATE USING (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin']) OR
    (auth.user_has_role(ARRAY['manager']) AND auth.user_can_access_department(department))
  );

-- Delete access: Superadmin only
CREATE POLICY "employees_delete_policy" ON employees
  FOR DELETE USING (
    auth.user_has_role(ARRAY['superadmin'])
  );

-- TRAINING MODULES TABLE RLS POLICIES

-- Read access: All authorized users can view training modules
CREATE POLICY "training_modules_select_policy" ON training_modules
  FOR SELECT USING (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin', 'manager', 'provider', 'nurse', 'medical_assistant'])
  );

-- Insert access: HR admin and superadmin only
CREATE POLICY "training_modules_insert_policy" ON training_modules
  FOR INSERT WITH CHECK (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin'])
  );

-- Update access: HR admin and superadmin only
CREATE POLICY "training_modules_update_policy" ON training_modules
  FOR UPDATE USING (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin'])
  );

-- Delete access: Superadmin only
CREATE POLICY "training_modules_delete_policy" ON training_modules
  FOR DELETE USING (
    auth.user_has_role(ARRAY['superadmin'])
  );

-- TRAINING COMPLETIONS TABLE RLS POLICIES

-- Read access: Users can view completions based on role and department
CREATE POLICY "training_completions_select_policy" ON training_completions
  FOR SELECT USING (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin']) OR
    (auth.user_has_role(ARRAY['manager']) AND 
     EXISTS (
       SELECT 1 FROM employees e 
       WHERE e.id = employee_id 
       AND auth.user_can_access_department(e.department)
     )) OR
    (auth.user_has_role(ARRAY['provider', 'nurse', 'medical_assistant']) AND
     EXISTS (
       SELECT 1 FROM employees e 
       WHERE e.id = employee_id 
       AND e.department = COALESCE(auth.jwt() ->> 'department', '')
     )) OR
    -- Users can view their own completions
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.id = employee_id 
      AND e.email = COALESCE(auth.jwt() ->> 'email', auth.email())
    )
  );

-- Insert access: Manager+ can create completions for their scope
CREATE POLICY "training_completions_insert_policy" ON training_completions
  FOR INSERT WITH CHECK (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin']) OR
    (auth.user_has_role(ARRAY['manager']) AND 
     EXISTS (
       SELECT 1 FROM employees e 
       WHERE e.id = employee_id 
       AND auth.user_can_access_department(e.department)
     )) OR
    (auth.user_has_role(ARRAY['provider', 'nurse', 'medical_assistant']) AND
     EXISTS (
       SELECT 1 FROM employees e 
       WHERE e.id = employee_id 
       AND e.department = COALESCE(auth.jwt() ->> 'department', '')
     ))
  );

-- Update access: Manager+ can update completions in their scope
CREATE POLICY "training_completions_update_policy" ON training_completions
  FOR UPDATE USING (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin']) OR
    (auth.user_has_role(ARRAY['manager']) AND 
     EXISTS (
       SELECT 1 FROM employees e 
       WHERE e.id = employee_id 
       AND auth.user_can_access_department(e.department)
     )) OR
    (auth.user_has_role(ARRAY['provider', 'nurse', 'medical_assistant']) AND
     EXISTS (
       SELECT 1 FROM employees e 
       WHERE e.id = employee_id 
       AND e.department = COALESCE(auth.jwt() ->> 'department', '')
     ))
  );

-- Delete access: Superadmin and HR admin only
CREATE POLICY "training_completions_delete_policy" ON training_completions
  FOR DELETE USING (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin'])
  );

-- COMPLIANCE SYNC LOGS TABLE RLS POLICIES

-- Read access: Manager+ can view sync logs
CREATE POLICY "sync_logs_select_policy" ON compliance_sync_logs
  FOR SELECT USING (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin', 'manager'])
  );

-- Insert access: Manager+ can create sync logs
CREATE POLICY "sync_logs_insert_policy" ON compliance_sync_logs
  FOR INSERT WITH CHECK (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin', 'manager'])
  );

-- Update access: Manager+ can update sync logs
CREATE POLICY "sync_logs_update_policy" ON compliance_sync_logs
  FOR UPDATE USING (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin', 'manager'])
  );

-- Delete access: Superadmin only
CREATE POLICY "sync_logs_delete_policy" ON compliance_sync_logs
  FOR DELETE USING (
    auth.user_has_role(ARRAY['superadmin'])
  );

-- DEPARTMENT TRAINING REQUIREMENTS TABLE RLS POLICIES

-- Read access: All authorized users can view department requirements
CREATE POLICY "dept_requirements_select_policy" ON department_training_requirements
  FOR SELECT USING (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin', 'manager', 'provider', 'nurse', 'medical_assistant'])
  );

-- Insert access: HR admin and superadmin only
CREATE POLICY "dept_requirements_insert_policy" ON department_training_requirements
  FOR INSERT WITH CHECK (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin'])
  );

-- Update access: HR admin and superadmin only
CREATE POLICY "dept_requirements_update_policy" ON department_training_requirements
  FOR UPDATE USING (
    auth.user_has_role(ARRAY['superadmin', 'hr_admin'])
  );

-- Delete access: Superadmin only
CREATE POLICY "dept_requirements_delete_policy" ON department_training_requirements
  FOR DELETE USING (
    auth.user_has_role(ARRAY['superadmin'])
  );

-- SECURE VIEW WITH RLS APPLIED
CREATE OR REPLACE VIEW secure_compliance_matrix AS
SELECT 
  cm.*,
  -- Additional security context
  auth.jwt() ->> 'role' as viewer_role,
  auth.jwt() ->> 'department' as viewer_department,
  CASE 
    WHEN auth.user_has_role(ARRAY['superadmin', 'hr_admin']) THEN 'full_access'
    WHEN auth.user_has_role(ARRAY['manager']) THEN 'department_access'
    ELSE 'limited_access'
  END as access_level
FROM compliance_matrix_view cm
WHERE 
  -- Apply same RLS logic as base tables
  auth.user_has_role(ARRAY['superadmin', 'hr_admin']) OR
  (auth.user_has_role(ARRAY['manager']) AND auth.user_can_access_department(cm.department)) OR
  (auth.user_has_role(ARRAY['provider', 'nurse', 'medical_assistant']) AND 
   cm.department = COALESCE(auth.jwt() ->> 'department', ''));

-- AUDIT LOGGING FOR COMPLIANCE ACCESS
CREATE TABLE compliance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies - only superadmin can read audit logs
CREATE POLICY "audit_log_select_policy" ON compliance_audit_log
  FOR SELECT USING (
    auth.user_has_role(ARRAY['superadmin'])
  );

-- Function to log compliance actions for HIPAA compliance
CREATE OR REPLACE FUNCTION log_compliance_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO compliance_audit_log (
    user_id,
    user_email,
    user_role,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address
  ) VALUES (
    auth.uid(),
    COALESCE(auth.jwt() ->> 'email', auth.email()),
    COALESCE(auth.jwt() ->> 'role', auth.jwt() ->> 'user_role'),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging triggers to sensitive tables
CREATE TRIGGER audit_employees_trigger
  AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW EXECUTE FUNCTION log_compliance_access();

CREATE TRIGGER audit_training_completions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON training_completions
  FOR EACH ROW EXECUTE FUNCTION log_compliance_access();

-- Security function to validate department access
CREATE OR REPLACE FUNCTION validate_department_access(target_department TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Log access attempt
  INSERT INTO compliance_audit_log (
    user_id,
    user_email,
    user_role,
    action,
    table_name,
    old_values
  ) VALUES (
    auth.uid(),
    COALESCE(auth.jwt() ->> 'email', auth.email()),
    COALESCE(auth.jwt() ->> 'role', auth.jwt() ->> 'user_role'),
    'ACCESS_ATTEMPT',
    'department_validation',
    jsonb_build_object('target_department', target_department)
  );
  
  RETURN auth.user_can_access_department(target_department);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure function for compliance dashboard data
CREATE OR REPLACE FUNCTION get_secure_compliance_dashboard(
  dept_filter TEXT DEFAULT NULL,
  loc_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  employee_count BIGINT,
  total_trainings BIGINT,
  completed_trainings BIGINT,
  overdue_trainings BIGINT,
  compliance_rate DECIMAL(5,2),
  department_summaries JSONB,
  access_level TEXT
) SECURITY DEFINER AS $$
DECLARE
  user_role TEXT;
  user_dept TEXT;
  access_level TEXT;
BEGIN
  -- Get user context
  user_role := COALESCE(auth.jwt() ->> 'role', auth.jwt() ->> 'user_role');
  user_dept := COALESCE(auth.jwt() ->> 'department');
  
  -- Determine access level
  IF user_role IN ('superadmin', 'hr_admin') THEN
    access_level := 'full_access';
  ELSIF user_role = 'manager' THEN
    access_level := 'department_access';
    -- Restrict department filter to user's department
    dept_filter := COALESCE(dept_filter, user_dept);
    IF dept_filter != user_dept THEN
      RAISE EXCEPTION 'Access denied: Cannot access data for department %', dept_filter;
    END IF;
  ELSE
    access_level := 'limited_access';
    dept_filter := user_dept;
  END IF;
  
  -- Log dashboard access
  INSERT INTO compliance_audit_log (
    user_id,
    user_email,
    user_role,
    action,
    table_name,
    new_values
  ) VALUES (
    auth.uid(),
    COALESCE(auth.jwt() ->> 'email', auth.email()),
    user_role,
    'DASHBOARD_ACCESS',
    'compliance_dashboard',
    jsonb_build_object(
      'dept_filter', dept_filter,
      'loc_filter', loc_filter,
      'access_level', access_level
    )
  );
  
  -- Return filtered data based on access level
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT e.id)::BIGINT as employee_count,
    COUNT(tc.id)::BIGINT as total_trainings,
    COUNT(tc.id) FILTER (WHERE tc.status = 'completed')::BIGINT as completed_trainings,
    COUNT(tc.id) FILTER (WHERE tc.status = 'overdue')::BIGINT as overdue_trainings,
    CASE 
      WHEN COUNT(tc.id) FILTER (WHERE tc.is_required = true) = 0 THEN 100.00
      ELSE (COUNT(tc.id) FILTER (WHERE tc.is_required = true AND tc.status = 'completed')::DECIMAL / 
            COUNT(tc.id) FILTER (WHERE tc.is_required = true)) * 100
    END as compliance_rate,
    (SELECT jsonb_agg(ds) FROM get_department_compliance_summary() ds) as department_summaries,
    access_level
  FROM employees e
  LEFT JOIN training_completions tc ON e.id = tc.employee_id
  WHERE 
    e.status = 'active'
    AND (dept_filter IS NULL OR e.department = dept_filter)
    AND (loc_filter IS NULL OR e.location = loc_filter);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_secure_compliance_dashboard IS 'HIPAA-compliant function for fetching compliance dashboard data with role-based access control and audit logging';
COMMENT ON TABLE compliance_audit_log IS 'HIPAA compliance audit trail for all access to sensitive training data';