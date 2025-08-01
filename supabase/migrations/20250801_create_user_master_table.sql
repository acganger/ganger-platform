-- User Master Table Migration
-- Consolidates user data from Google, TriNet/Zenefits, Deputy, and EMA/ModMed

-- Create the master user table
CREATE TABLE IF NOT EXISTS user_master (
  -- Primary identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE, -- TriNet employee ID as primary identifier
  
  -- Name fields (from all platforms)
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  preferred_name VARCHAR(100), -- From Deputy (e.g., "Bella" for Isabella)
  
  -- Contact information
  work_email VARCHAR(255) UNIQUE,
  personal_email VARCHAR(255),
  work_phone VARCHAR(50),
  mobile_phone VARCHAR(50),
  
  -- Platform-specific IDs
  google_email VARCHAR(255) UNIQUE, -- Google Workspace primary email
  google_user_id VARCHAR(100),
  google_org_unit VARCHAR(255), -- e.g., "/Managers", "/Providers"
  trinet_employee_id VARCHAR(50), -- Same as employee_id
  deputy_id INTEGER,
  deputy_employee_id VARCHAR(50), -- Deputy's internal ID
  ema_username VARCHAR(100),
  ema_provider_id VARCHAR(50),
  zenefits_id VARCHAR(50),
  
  -- Employment information
  department VARCHAR(100),
  position VARCHAR(200), -- Job title
  role VARCHAR(50), -- System role: admin, manager, staff, provider
  employee_type VARCHAR(50), -- Full-time, Part-time, Contractor
  employment_status VARCHAR(50) DEFAULT 'active', -- active, terminated, on_leave
  hire_date DATE,
  termination_date DATE,
  is_active BOOLEAN DEFAULT true,
  is_contractor BOOLEAN DEFAULT false,
  
  -- Location information
  primary_location VARCHAR(100),
  
  -- Provider-specific fields (from EMA)
  provider_type VARCHAR(50), -- Doctor, Nurse Practitioner, PA, etc.
  
  -- Work details (from Deputy)
  deputy_company_code VARCHAR(50), -- e.g., "AA GDerm"
  
  -- Data quality and sync tracking
  data_source VARCHAR(50) DEFAULT 'manual', -- trinet, import, manual
  data_quality_notes TEXT,
  needs_review BOOLEAN DEFAULT false,
  
  -- Sync timestamps
  last_google_sync TIMESTAMPTZ,
  last_trinet_sync TIMESTAMPTZ,
  last_deputy_sync TIMESTAMPTZ,
  last_ema_sync TIMESTAMPTZ,
  
  -- Raw data storage (for reference and debugging)
  google_raw_data JSONB,
  trinet_raw_data JSONB,
  deputy_raw_data JSONB,
  ema_raw_data JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_user_master_employee_id ON user_master(employee_id);
CREATE INDEX idx_user_master_work_email ON user_master(work_email);
CREATE INDEX idx_user_master_google_email ON user_master(google_email);
CREATE INDEX idx_user_master_last_name ON user_master(last_name);
CREATE INDEX idx_user_master_department ON user_master(department);
CREATE INDEX idx_user_master_is_active ON user_master(is_active);
CREATE INDEX idx_user_master_employment_status ON user_master(employment_status);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_user_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_master_updated_at
  BEFORE UPDATE ON user_master
  FOR EACH ROW
  EXECUTE FUNCTION update_user_master_updated_at();

-- Create view for active employees only
CREATE OR REPLACE VIEW active_employees AS
SELECT * FROM user_master
WHERE is_active = true
  AND employment_status = 'active'
  AND (termination_date IS NULL OR termination_date > CURRENT_DATE);

-- Create view for providers
CREATE OR REPLACE VIEW providers AS
SELECT * FROM user_master
WHERE provider_type IS NOT NULL
  AND role = 'provider';

-- Create RLS policies
ALTER TABLE user_master ENABLE ROW LEVEL SECURITY;

-- Policy for viewing (all authenticated users can view)
CREATE POLICY "Authenticated users can view user_master"
  ON user_master FOR SELECT
  TO authenticated
  USING (true);

-- Policy for HR/Admin to manage
CREATE POLICY "HR and Admins can manage user_master"
  ON user_master FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_master
      WHERE (work_email = auth.jwt() ->> 'email' OR google_email = auth.jwt() ->> 'email')
        AND role IN ('admin', 'hr', 'manager')
    )
  );

-- Add comments for documentation
COMMENT ON TABLE user_master IS 'Master user table consolidating data from Google Workspace, TriNet/Zenefits, Deputy, and EMA/ModMed';
COMMENT ON COLUMN user_master.employee_id IS 'Primary employee ID from TriNet - source of truth';
COMMENT ON COLUMN user_master.google_org_unit IS 'Google Workspace organizational unit path (e.g., /Managers, /Providers)';
COMMENT ON COLUMN user_master.preferred_name IS 'Name they go by (e.g., Bella instead of Isabella)';
COMMENT ON COLUMN user_master.deputy_company_code IS 'Deputy company identifier (e.g., AA GDerm)';
COMMENT ON COLUMN user_master.data_quality_notes IS 'Notes about data discrepancies or issues to resolve';