-- Compliance Training Database Schema Migration
-- Created: 2025-01-10
-- Purpose: Complete compliance training management system with external API integration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Employees table with Zenefits integration
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zenefits_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  department TEXT,
  job_title TEXT,
  start_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  manager_email TEXT,
  location TEXT CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  
  -- Integration metadata
  zenefits_data JSONB,
  classroom_user_id TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  sync_errors JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training modules with Google Classroom integration
CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key TEXT UNIQUE NOT NULL,              -- '2025-01', '2025-02', etc.
  module_name TEXT NOT NULL,
  due_date DATE NOT NULL,
  
  -- Google Classroom integration
  classroom_course_id TEXT NOT NULL,
  classroom_coursework_id TEXT,
  classroom_url TEXT,
  classroom_data JSONB,
  
  -- Module configuration
  description TEXT,
  estimated_duration_minutes INTEGER DEFAULT 30,
  passing_score DECIMAL(5,2) DEFAULT 80.00,
  max_attempts INTEGER DEFAULT 3,
  is_required_for_new_hires BOOLEAN DEFAULT TRUE,
  grace_period_days INTEGER DEFAULT 7,
  
  -- Status and lifecycle
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training completions with detailed tracking
CREATE TABLE training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  
  -- Completion tracking
  completion_date TIMESTAMPTZ,
  score DECIMAL(5,2),
  attempts_count INTEGER DEFAULT 0,
  time_spent_minutes INTEGER,
  
  -- Status management
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (
    status IN ('not_started', 'in_progress', 'completed', 'overdue', 'exempted')
  ),
  due_date DATE NOT NULL,
  overdue_days INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN status = 'overdue' AND due_date < CURRENT_DATE 
      THEN CURRENT_DATE - due_date 
      ELSE 0 
    END
  ) STORED,
  
  -- Google Classroom integration
  classroom_submission_id TEXT,
  classroom_submission_data JSONB,
  classroom_grade DECIMAL(5,2),
  
  -- Business logic
  is_required BOOLEAN DEFAULT TRUE,
  exemption_reason TEXT,
  exempted_by UUID,
  exempted_at TIMESTAMPTZ,
  
  -- Sync metadata
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  sync_errors JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, module_id, due_date)
);

-- Comprehensive sync logging
CREATE TABLE compliance_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('employees', 'training_modules', 'completions', 'full')),
  sync_source TEXT NOT NULL CHECK (sync_source IN ('zenefits', 'classroom', 'manual', 'scheduled')),
  
  -- Sync execution
  triggered_by UUID,
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'partial')),
  
  -- Results tracking
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Detailed logging
  sync_details JSONB,
  errors JSONB,
  warnings JSONB,
  
  -- Performance metrics
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN completed_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER
      ELSE NULL 
    END
  ) STORED
);

-- Department-based compliance requirements
CREATE TABLE department_training_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  
  -- Requirement configuration
  is_required BOOLEAN DEFAULT TRUE,
  priority_level TEXT DEFAULT 'standard' CHECK (priority_level IN ('critical', 'high', 'standard', 'optional')),
  grace_period_days INTEGER DEFAULT 7,
  reminder_days_before INTEGER DEFAULT 7,
  
  -- Effectiveness tracking
  completion_rate_target DECIMAL(5,2) DEFAULT 95.00,
  average_completion_days INTEGER,
  
  effective_start_date DATE DEFAULT CURRENT_DATE,
  effective_end_date DATE,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(department, module_id)
);

-- Performance optimization indexes
CREATE INDEX idx_employees_status ON employees(status, last_synced_at);
CREATE INDEX idx_employees_department ON employees(department, location);
CREATE INDEX idx_employees_zenefits ON employees(zenefits_id) WHERE zenefits_id IS NOT NULL;
CREATE INDEX idx_employees_email ON employees(email);

CREATE INDEX idx_training_modules_active ON training_modules(is_active, due_date);
CREATE INDEX idx_training_modules_classroom ON training_modules(classroom_course_id);
CREATE INDEX idx_training_modules_month ON training_modules(month_key);

CREATE INDEX idx_completions_employee_status ON training_completions(employee_id, status);
CREATE INDEX idx_completions_module_status ON training_completions(module_id, status);
CREATE INDEX idx_completions_due_date ON training_completions(due_date, status);
CREATE INDEX idx_completions_overdue ON training_completions(status, overdue_days) WHERE status = 'overdue';
CREATE INDEX idx_completions_completion_date ON training_completions(completion_date) WHERE completion_date IS NOT NULL;

CREATE INDEX idx_sync_logs_type_status ON compliance_sync_logs(sync_type, status, started_at);
CREATE INDEX idx_sync_logs_source ON compliance_sync_logs(sync_source, started_at);

CREATE INDEX idx_dept_requirements_dept ON department_training_requirements(department, is_required);

-- Database functions for compliance calculations
CREATE OR REPLACE FUNCTION calculate_compliance_rate(dept TEXT DEFAULT NULL, loc TEXT DEFAULT NULL)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_required INTEGER;
  total_completed INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE tc.is_required = true),
    COUNT(*) FILTER (WHERE tc.is_required = true AND tc.status = 'completed')
  INTO total_required, total_completed
  FROM training_completions tc
  JOIN employees e ON tc.employee_id = e.id
  WHERE 
    e.status = 'active'
    AND (dept IS NULL OR e.department = dept)
    AND (loc IS NULL OR e.location = loc);
  
  IF total_required = 0 THEN
    RETURN 100.00;
  END IF;
  
  RETURN (total_completed::DECIMAL / total_required) * 100;
END;
$$ LANGUAGE plpgsql;

-- Function to get department compliance summary
CREATE OR REPLACE FUNCTION get_department_compliance_summary()
RETURNS TABLE (
  department TEXT,
  total_employees BIGINT,
  total_required_trainings BIGINT,
  completed_trainings BIGINT,
  overdue_trainings BIGINT,
  compliance_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.department,
    COUNT(DISTINCT e.id) as total_employees,
    COUNT(tc.id) FILTER (WHERE tc.is_required = true) as total_required_trainings,
    COUNT(tc.id) FILTER (WHERE tc.is_required = true AND tc.status = 'completed') as completed_trainings,
    COUNT(tc.id) FILTER (WHERE tc.status = 'overdue') as overdue_trainings,
    CASE 
      WHEN COUNT(tc.id) FILTER (WHERE tc.is_required = true) = 0 THEN 100.00
      ELSE (COUNT(tc.id) FILTER (WHERE tc.is_required = true AND tc.status = 'completed')::DECIMAL / 
            COUNT(tc.id) FILTER (WHERE tc.is_required = true)) * 100
    END as compliance_rate
  FROM employees e
  LEFT JOIN training_completions tc ON e.id = tc.employee_id
  WHERE e.status = 'active' AND e.department IS NOT NULL
  GROUP BY e.department
  ORDER BY compliance_rate ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get employee compliance details
CREATE OR REPLACE FUNCTION get_employee_compliance_details(emp_id UUID)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  department TEXT,
  total_trainings BIGINT,
  completed_trainings BIGINT,
  overdue_trainings BIGINT,
  in_progress_trainings BIGINT,
  compliance_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as employee_id,
    e.full_name as employee_name,
    e.department,
    COUNT(tc.id) as total_trainings,
    COUNT(tc.id) FILTER (WHERE tc.status = 'completed') as completed_trainings,
    COUNT(tc.id) FILTER (WHERE tc.status = 'overdue') as overdue_trainings,
    COUNT(tc.id) FILTER (WHERE tc.status = 'in_progress') as in_progress_trainings,
    CASE 
      WHEN COUNT(tc.id) FILTER (WHERE tc.is_required = true) = 0 THEN 100.00
      ELSE (COUNT(tc.id) FILTER (WHERE tc.is_required = true AND tc.status = 'completed')::DECIMAL / 
            COUNT(tc.id) FILTER (WHERE tc.is_required = true)) * 100
    END as compliance_rate
  FROM employees e
  LEFT JOIN training_completions tc ON e.id = tc.employee_id
  WHERE e.id = emp_id
  GROUP BY e.id, e.full_name, e.department;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for automatic status updates
CREATE OR REPLACE FUNCTION update_training_completion_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status based on completion and due dates
  IF NEW.completion_date IS NOT NULL AND NEW.score >= 80.00 THEN
    NEW.status = 'completed';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.completion_date IS NULL THEN
    NEW.status = 'overdue';
  ELSIF NEW.completion_date IS NULL AND NEW.due_date >= CURRENT_DATE THEN
    NEW.status = COALESCE(NEW.status, 'not_started');
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic status updates
CREATE TRIGGER trigger_update_completion_status
  BEFORE INSERT OR UPDATE ON training_completions
  FOR EACH ROW EXECUTE FUNCTION update_training_completion_status();

-- Trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER trigger_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_training_modules_updated_at
  BEFORE UPDATE ON training_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_dept_requirements_updated_at
  BEFORE UPDATE ON department_training_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO training_modules (month_key, module_name, due_date, classroom_course_id, description) VALUES
('2025-01', 'HIPAA Privacy Training', '2025-01-31', 'classroom_course_123', 'Annual HIPAA privacy and security training for medical staff'),
('2025-02', 'Fire Safety Training', '2025-02-28', 'classroom_course_124', 'Fire safety procedures and emergency evacuation training'),
('2025-03', 'Infection Control', '2025-03-31', 'classroom_course_125', 'Infection control and prevention protocols training');

-- Create view for compliance matrix
CREATE OR REPLACE VIEW compliance_matrix_view AS
SELECT 
  e.id as employee_id,
  e.full_name as employee_name,
  e.department,
  e.location,
  tm.id as module_id,
  tm.module_name,
  tm.month_key,
  tm.due_date,
  COALESCE(tc.status, 'not_assigned') as status,
  tc.completion_date,
  tc.score,
  tc.overdue_days,
  CASE 
    WHEN tc.status = 'completed' THEN 'success'
    WHEN tc.status = 'overdue' THEN 'danger'
    WHEN tc.status = 'in_progress' THEN 'warning'
    WHEN tc.due_date < CURRENT_DATE THEN 'danger'
    ELSE 'secondary'
  END as status_color
FROM employees e
CROSS JOIN training_modules tm
LEFT JOIN training_completions tc ON e.id = tc.employee_id AND tm.id = tc.module_id
WHERE e.status = 'active' AND tm.is_active = true
ORDER BY e.department, e.full_name, tm.due_date;

COMMENT ON TABLE employees IS 'Employee data synchronized from Zenefits with training tracking';
COMMENT ON TABLE training_modules IS 'Training modules integrated with Google Classroom courses';
COMMENT ON TABLE training_completions IS 'Individual employee training completion tracking';
COMMENT ON TABLE compliance_sync_logs IS 'Audit log for all external system synchronization operations';
COMMENT ON TABLE department_training_requirements IS 'Department-specific training requirements and policies';