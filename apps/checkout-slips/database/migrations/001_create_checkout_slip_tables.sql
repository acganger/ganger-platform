-- Create checkout slip templates table
CREATE TABLE IF NOT EXISTS checkout_slip_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_type TEXT NOT NULL CHECK (slip_type IN ('medical', 'cosmetic', 'self_pay')),
  version INTEGER NOT NULL DEFAULT 1,
  template_data JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create print job tracking table
CREATE TABLE IF NOT EXISTS checkout_slip_print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  patient_mrn TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  slip_type TEXT NOT NULL CHECK (slip_type IN ('medical', 'cosmetic', 'self_pay')),
  slip_content JSONB NOT NULL,
  printer_id UUID REFERENCES checkout_slip_printers(id) NOT NULL,
  location TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'completed', 'failed')),
  error_message TEXT,
  zpl_code TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  printed_by TEXT NOT NULL, -- Store email/identifier since auth may vary
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create printer configuration table
CREATE TABLE IF NOT EXISTS checkout_slip_printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  ip_address INET NOT NULL,
  model TEXT NOT NULL DEFAULT 'ZD621',
  status TEXT DEFAULT 'unknown' CHECK (status IN ('online', 'offline', 'error', 'unknown')),
  last_seen TIMESTAMPTZ,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit logs table for HIPAA compliance
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    staff_id uuid,
    user_email text,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    patient_mrn text,
    details jsonb DEFAULT '{}',
    ip_address text,
    user_agent text,
    timestamp timestamptz DEFAULT now(),
    application text DEFAULT 'checkout-slips',
    created_at timestamptz DEFAULT now()
);

-- Create staff_users table for authorization
CREATE TABLE IF NOT EXISTS staff_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text UNIQUE NOT NULL,
    name text,
    role text DEFAULT 'staff',
    permissions text[] DEFAULT '{}',
    active boolean DEFAULT true,
    location text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE checkout_slip_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_slip_print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_slip_printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkout_slip_templates_type_active ON checkout_slip_templates(slip_type, active);
CREATE INDEX IF NOT EXISTS idx_checkout_slip_print_jobs_patient_mrn ON checkout_slip_print_jobs(patient_mrn);
CREATE INDEX IF NOT EXISTS idx_checkout_slip_print_jobs_provider_name ON checkout_slip_print_jobs(provider_name);
CREATE INDEX IF NOT EXISTS idx_checkout_slip_print_jobs_printer ON checkout_slip_print_jobs(printer_id);
CREATE INDEX IF NOT EXISTS idx_checkout_slip_print_jobs_status ON checkout_slip_print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_checkout_slip_print_jobs_created ON checkout_slip_print_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkout_slip_printers_location ON checkout_slip_printers(location);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_staff_id ON audit_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient_mrn ON audit_logs(patient_mrn);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_application ON audit_logs(application);

-- Create indexes for staff_users
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_active ON staff_users(active);
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users(role);

-- RLS Policies for templates
CREATE POLICY "Staff can view all templates" ON checkout_slip_templates
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('staff', 'manager', 'provider', 'nurse', 'medical_assistant', 'superadmin')
    )
  );

CREATE POLICY "Managers can insert templates" ON checkout_slip_templates
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('manager', 'superadmin')
    )
  );

CREATE POLICY "Managers can update templates" ON checkout_slip_templates
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('manager', 'superadmin')
    )
  );

-- RLS Policies for print jobs
CREATE POLICY "Staff can view print jobs" ON checkout_slip_print_jobs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('staff', 'manager', 'provider', 'nurse', 'medical_assistant', 'superadmin')
    )
  );

CREATE POLICY "Staff can insert print jobs" ON checkout_slip_print_jobs
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('staff', 'manager', 'provider', 'nurse', 'medical_assistant', 'superadmin')
    )
    AND printed_by = auth.uid()
  );

CREATE POLICY "Staff can update own print jobs" ON checkout_slip_print_jobs
  FOR UPDATE USING (
    printed_by = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('manager', 'superadmin')
    )
  );

-- RLS Policies for printers
CREATE POLICY "Staff can view printers" ON checkout_slip_printers
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('staff', 'manager', 'provider', 'nurse', 'medical_assistant', 'superadmin')
    )
  );

CREATE POLICY "Managers can manage printers" ON checkout_slip_printers
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('manager', 'superadmin')
    )
  );

-- RLS Policies for audit logs
CREATE POLICY "Staff can view audit logs" ON audit_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('manager', 'superadmin')
    )
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for staff_users
CREATE POLICY "Staff can view staff users" ON staff_users
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('staff', 'manager', 'provider', 'nurse', 'medical_assistant', 'superadmin')
    )
  );

CREATE POLICY "Managers can manage staff users" ON staff_users
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('manager', 'superadmin')
    )
  );

-- Insert default slip templates
INSERT INTO checkout_slip_templates (slip_type, template_data, created_by) VALUES
(
  'medical',
  '{
    "name": "Standard Medical Checkout Slip",
    "sections": [
      "patient_info",
      "visit_info", 
      "follow_up",
      "procedures",
      "cosmetic_interest",
      "instructions"
    ],
    "layout": "standard"
  }',
  (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
),
(
  'cosmetic',
  '{
    "name": "Cosmetic Treatment Checkout Slip",
    "sections": [
      "patient_info",
      "treatments",
      "products",
      "return_plan",
      "charges"
    ],
    "layout": "cosmetic"
  }',
  (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
),
(
  'self_pay',
  '{
    "name": "Self-Pay Pricing Addendum",
    "sections": [
      "procedures",
      "pricing",
      "disclaimer"
    ],
    "layout": "addendum"
  }',
  (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
);

-- Insert default printer configurations
INSERT INTO checkout_slip_printers (name, location, ip_address, model, configuration) VALUES
('Front Desk Zebra ZD621', 'Front Desk', '192.168.1.100', 'ZD621', '{"port": 9100, "timeout": 5000}'),
('Checkout Zebra ZD621', 'Checkout Station', '192.168.1.101', 'ZD621', '{"port": 9100, "timeout": 5000}'),
('MA Room Zebra ZD421', 'MA Room 1', '192.168.1.102', 'ZD421', '{"port": 9100, "timeout": 5000}');

-- Insert initial staff users
INSERT INTO staff_users (email, name, role, permissions, location) VALUES
('anand@gangerdermatology.com', 'Dr. Anand Ganger', 'admin', '{checkout-slips, all}', 'ann-arbor'),
('sarah@gangerdermatology.com', 'Sarah Johnson', 'staff', '{checkout-slips}', 'ann-arbor'),
('maria@gangerdermatology.com', 'Maria Rodriguez', 'staff', '{checkout-slips}', 'ann-arbor'),
('jennifer@gangerdermatology.com', 'Dr. Jennifer Smith', 'provider', '{checkout-slips}', 'ann-arbor');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_checkout_slip_templates_updated_at 
  BEFORE UPDATE ON checkout_slip_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkout_slip_print_jobs_updated_at 
  BEFORE UPDATE ON checkout_slip_print_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkout_slip_printers_updated_at 
  BEFORE UPDATE ON checkout_slip_printers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();