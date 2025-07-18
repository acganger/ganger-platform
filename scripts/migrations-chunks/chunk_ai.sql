VALUES 
  ('Dialysis Syringe 1cc', 'syringes', '1cc syringe with no dead space, without needle', 
   '["1cc capacity", "No dead space", "Luer lock", "Sterile", "Latex-free"]'::jsonb, 
   '1 case (18 boxes)', 'case', 1800, 1, 8, true),
  
  ('Hypodermic Needle 30G x 1/2 inch', 'syringes', '30 gauge hypodermic needle, regular bevel', 
   '["30 gauge", "1/2 inch length", "Regular bevel", "Sterile", "Latex-free"]'::jsonb, 
   '1 box (100 count)', 'box', 100, 1, 20, true),
  
  ('Luer-Lok Syringe 3cc', 'syringes', '3cc syringe with Luer-Lok tip, graduated', 
   '["3cc capacity", "Luer-Lok tip", "1/10cc graduation", "Sterile", "Latex-free"]'::jsonb, 
   '1 box (100 count)', 'box', 100, 1, 10, true);

-- Paper products
INSERT INTO public.standardized_products (name, category, description, specifications, standard_package_size, unit_of_measure, units_per_package, minimum_order_quantity, average_monthly_usage)
VALUES 
  ('Exam Table Paper 18 inch', 'paper_products', 'Smooth white exam table paper, 225 feet per roll', 
   '["18 inch width", "225 feet per roll", "Smooth finish", "White color"]'::jsonb, 
   '1 case (12 rolls)', 'case', 12, 1, 4),
  
  ('Professional Towels 2-ply', 'paper_products', '2-ply tissue/poly professional towels', 
   '["13x18 inch size", "2-ply", "Tissue/poly blend", "White color"]'::jsonb, 
   '1 case (500 count)', 'case', 500, 1, 2);

-- Antiseptics and disinfectants
INSERT INTO public.standardized_products (name, category, description, specifications, standard_package_size, unit_of_measure, units_per_package, minimum_order_quantity, average_monthly_usage)
VALUES 
  ('CaviWipes Disinfectant Wipes', 'antiseptics', 'Surface disinfectant wipes, large canister', 
   '["6x6.75 inch size", "160 wipes per canister", "EPA registered", "Kills TB, HBV, HCV, viruses"]'::jsonb, 
   '1 case (12 canisters)', 'case', 1920, 1, 2),
  
  ('Alcohol Prep Pads Large', 'antiseptics', '70% isopropyl alcohol prep pads, sterile', 
   '["Large size", "70% isopropyl alcohol", "Sterile", "Individually wrapped"]'::jsonb, 
   '1 case (20 boxes)', 'case', 2000, 1, 1);

-- Now create vendor product mappings for Henry Schein (primary vendor)
WITH henry_schein AS (SELECT id FROM vendor_configurations WHERE vendor_name = 'Henry Schein' LIMIT 1),
     amazon AS (SELECT id FROM vendor_configurations WHERE vendor_name = 'Amazon Business' LIMIT 1)
INSERT INTO public.vendor_product_mappings 
  (standardized_product_id, vendor_id, vendor_sku, vendor_product_name, vendor_package_size, last_known_price, is_preferred, is_contract_item, lead_time_days)
SELECT 
  sp.id,
  hs.id,
  CASE sp.name
    WHEN 'Criterion Nitrile Exam Gloves - Medium' THEN 'C-N100-M'
    WHEN 'Criterion Nitrile Exam Gloves - Large' THEN 'C-N100-L'
    WHEN 'Criterion Nitrile Exam Gloves - Small' THEN 'C-N100-S'
    WHEN 'Criterion Nitrile Exam Gloves - X-Large' THEN 'C-N100-XL'
    WHEN 'Gauze Sponges 4x4 inch' THEN 'HS-GZ-4X4-NS'
    WHEN 'Gauze Sponges 2x2 inch' THEN 'HS-GZ-2X2-NS'
    WHEN 'Dialysis Syringe 1cc' THEN 'INJ-DS-1CC'
    WHEN 'Hypodermic Needle 30G x 1/2 inch' THEN 'ND-30G-05'
    WHEN 'Exam Table Paper 18 inch' THEN 'HSI-ETP-18'
    WHEN 'CaviWipes Disinfectant Wipes' THEN 'CAVI-LG-160'
    ELSE 'SKU-' || LEFT(MD5(sp.name), 8)
  END,
  sp.name || ' - Henry Schein Brand',
  sp.standard_package_size,
  CASE sp.name
    WHEN 'Criterion Nitrile Exam Gloves - Medium' THEN 54.01
    WHEN 'Criterion Nitrile Exam Gloves - Large' THEN 54.24
    WHEN 'Criterion Nitrile Exam Gloves - Small' THEN 53.73
    WHEN 'Criterion Nitrile Exam Gloves - X-Large' THEN 44.57
    WHEN 'Gauze Sponges 4x4 inch' THEN 53.17
    WHEN 'Gauze Sponges 2x2 inch' THEN 30.92
    WHEN 'Dialysis Syringe 1cc' THEN 82.80
    WHEN 'Hypodermic Needle 30G x 1/2 inch' THEN 7.05
    WHEN 'Exam Table Paper 18 inch' THEN 36.55
    WHEN 'CaviWipes Disinfectant Wipes' THEN 77.88
    ELSE ROUND((RANDOM() * 50 + 20)::numeric, 2)
  END,
  true,  -- is_preferred
  true,  -- is_contract_item
  3      -- lead_time_days
FROM standardized_products sp, henry_schein hs
WHERE sp.is_active = true;

-- Add Amazon Business mappings (usually slightly cheaper)
INSERT INTO public.vendor_product_mappings 
  (standardized_product_id, vendor_id, vendor_sku, vendor_product_name, vendor_package_size, last_known_price, is_preferred, is_contract_item, lead_time_days)
SELECT 
  sp.id,
  amz.id,
  'B0' || LEFT(MD5(sp.name), 8),
  sp.name || ' - Amazon Basics',
  sp.standard_package_size,
  ROUND((hsp.last_known_price * 0.92)::numeric, 2), -- Amazon typically 8% cheaper
  false, -- not preferred
  false, -- not contract item
  2      -- faster delivery
FROM standardized_products sp
JOIN vendor_product_mappings hsp ON hsp.standardized_product_id = sp.id
JOIN vendor_configurations hs ON hs.id = hsp.vendor_id AND hs.vendor_name = 'Henry Schein'
CROSS JOIN (SELECT id FROM vendor_configurations WHERE vendor_name = 'Amazon Business' LIMIT 1) amz
WHERE sp.is_active = true;

-- Create a sample consolidated order template for clinical staff
INSERT INTO public.consolidated_orders (order_number, requester_email, requester_name, department, status, notes)
VALUES 
  ('CO-TEMPLATE-001', 'nurse@gangerdermatology.com', 'Sample Nurse', 'Clinical', 'draft', 
   'This is a template order showing commonly requested items');

-- Add template items
WITH template_order AS (SELECT id FROM consolidated_orders WHERE order_number = 'CO-TEMPLATE-001' LIMIT 1)
INSERT INTO public.consolidated_order_items (consolidated_order_id, standardized_product_id, requested_quantity, justification)
SELECT 
  t.id,
  sp.id,
  CASE 
    WHEN sp.name LIKE '%Gloves%' THEN 5
    WHEN sp.name LIKE '%Gauze%' THEN 3
    WHEN sp.name LIKE '%Syringe%' THEN 2
    ELSE 1
  END,
  'Standard monthly replenishment'
FROM standardized_products sp
CROSS JOIN template_order t
WHERE sp.is_critical = true
LIMIT 10;

-- Insert sample procurement analytics
INSERT INTO public.procurement_analytics 
  (period_start, period_end, total_spend, total_savings, savings_percentage, total_orders, average_order_value, contract_compliance_rate, vendor_diversity_score)
VALUES 
  ('2024-01-01', '2024-12-31', 134982.00, 6750.00, 5.0, 156, 865.27, 60.0, 32.0),
  ('2024-12-01', '2024-12-31', 11248.50, 843.64, 7.5, 13, 865.27, 65.0, 35.0);

-- Update sequences and order numbers
SELECT setval(pg_get_serial_sequence('purchase_requests', 'id'), 1000);
SELECT setval(pg_get_serial_sequence('consolidated_orders', 'id'), 1000);


-- Migration: 20250610000001_compliance_training_schema.sql
-- ==========================================

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


-- Migration: 20250610000002_compliance_training_rls.sql
-- ==========================================

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


-- Migration: 20250610000003_compliance_training_seed.sql
-- ==========================================

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
