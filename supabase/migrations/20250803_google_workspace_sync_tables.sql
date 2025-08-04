-- Create tables for Google Workspace sync and cleanup operations

-- Generic sync/cleanup logs table for various operations
CREATE TABLE IF NOT EXISTS sync_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('google_workspace_terminated', 'google_workspace_active', 'google_workspace_sync')),
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
  
  -- Execution details
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_by UUID NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Options and results
  options JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  error TEXT,
  
  -- Indexes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alias for cleanup_logs to maintain compatibility
CREATE TABLE IF NOT EXISTS cleanup_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
  
  -- Execution details
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_by UUID NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Options and results
  options JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  error TEXT,
  
  -- Indexes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Google Workspace metadata to employees table if not exists
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS google_workspace_id TEXT,
ADD COLUMN IF NOT EXISTS google_org_unit_path TEXT,
ADD COLUMN IF NOT EXISTS google_last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_sync_status TEXT CHECK (google_sync_status IN ('synced', 'pending', 'error'));

-- Add terminated_date column if not exists
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS terminated_date DATE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_type_status ON sync_logs(type, status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_by ON sync_logs(started_by);
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_type_status ON cleanup_logs(type, status);
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_started_by ON cleanup_logs(started_by);
CREATE INDEX IF NOT EXISTS idx_employees_google_sync ON employees(google_sync_status, google_last_sync_at);
CREATE INDEX IF NOT EXISTS idx_employees_terminated ON employees(status, terminated_date) WHERE status = 'terminated';

-- Enable RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleanup_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for sync_logs
CREATE POLICY "Users can view their own sync logs" ON sync_logs
  FOR SELECT USING (auth.uid() = started_by);

CREATE POLICY "Admins can view all sync logs" ON sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.id = auth.uid() 
      AND employees.job_title IN ('HR Manager', 'HR Director', 'System Administrator')
    )
  );

CREATE POLICY "Service role can manage sync logs" ON sync_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Create policies for cleanup_logs
CREATE POLICY "Users can view their own cleanup logs" ON cleanup_logs
  FOR SELECT USING (auth.uid() = started_by);

CREATE POLICY "Admins can view all cleanup logs" ON cleanup_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.id = auth.uid() 
      AND employees.job_title IN ('HR Manager', 'HR Director', 'System Administrator')
    )
  );

CREATE POLICY "Service role can manage cleanup logs" ON cleanup_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sync_logs_updated_at BEFORE UPDATE ON sync_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleanup_logs_updated_at BEFORE UPDATE ON cleanup_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();