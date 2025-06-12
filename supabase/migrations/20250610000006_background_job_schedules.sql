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