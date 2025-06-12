-- Call Center Operations Dashboard - 3CX Integration Tables
-- Additional tables for 3CX VoIP system integration and sync management

-- Agent current status tracking (real-time status from 3CX)
CREATE TABLE agent_current_status (
  agent_email TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  extension TEXT NOT NULL,
  queue_name TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  status TEXT NOT NULL CHECK (status IN ('available', 'busy', 'away', 'offline')),
  current_call_id TEXT,
  last_activity TIMESTAMPTZ NOT NULL,
  status_reason TEXT, -- Manual status change reason
  custom_status_message TEXT,
  break_start_time TIMESTAMPTZ,
  break_type TEXT CHECK (break_type IN ('lunch', 'break', 'training', 'meeting', 'personal')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sync job tracking for 3CX data synchronization
CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('cdr_sync', 'agent_status_sync')),
  start_date DATE,
  end_date DATE,
  location TEXT CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  batch_size INTEGER DEFAULT 1000,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  records_processed INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_message TEXT,
  initiated_by TEXT NOT NULL, -- User email who started the sync
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sync history for tracking long-term sync patterns
CREATE TABLE sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  sync_date DATE NOT NULL,
  records_processed INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_message TEXT,
  sync_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3CX configuration and connection status
CREATE TABLE threecx_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name TEXT NOT NULL UNIQUE,
  api_url TEXT NOT NULL,
  webhook_url TEXT,
  connection_status TEXT NOT NULL CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  last_successful_connection TIMESTAMPTZ,
  last_cdr_sync TIMESTAMPTZ,
  last_status_sync TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  webhook_secret_hash TEXT, -- Hashed webhook secret for security
  location_mapping JSONB, -- Mapping of 3CX queue names to our locations
  extension_mapping JSONB, -- Mapping of extensions to agent emails
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Webhook event log for debugging and monitoring
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source_ip TEXT,
  payload JSONB NOT NULL,
  signature_valid BOOLEAN,
  processing_status TEXT NOT NULL CHECK (processing_status IN ('received', 'processed', 'failed', 'ignored')),
  processing_time_ms INTEGER,
  error_message TEXT,
  call_id TEXT, -- If event is related to a specific call
  agent_email TEXT, -- If event is related to a specific agent
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Real-time call monitoring (active calls)
CREATE TABLE active_calls (
  call_id TEXT PRIMARY KEY,
  agent_email TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  caller_number TEXT NOT NULL,
  called_number TEXT,
  call_direction TEXT NOT NULL CHECK (call_direction IN ('inbound', 'outbound')),
  call_start_time TIMESTAMPTZ NOT NULL,
  call_answer_time TIMESTAMPTZ,
  queue_name TEXT,
  call_status TEXT NOT NULL CHECK (call_status IN ('ringing', 'answered', 'on_hold', 'transferred')),
  hold_count INTEGER DEFAULT 0,
  transfer_count INTEGER DEFAULT 0,
  current_queue_time_seconds INTEGER DEFAULT 0,
  recording_started BOOLEAN DEFAULT false,
  priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('urgent', 'high', 'normal', 'low')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for efficient querying
CREATE INDEX idx_agent_current_status_location ON agent_current_status(location);
CREATE INDEX idx_agent_current_status_status ON agent_current_status(status);
CREATE INDEX idx_agent_current_status_updated_at ON agent_current_status(updated_at);

CREATE INDEX idx_sync_jobs_type_status ON sync_jobs(sync_type, status);
CREATE INDEX idx_sync_jobs_created_at ON sync_jobs(created_at);
CREATE INDEX idx_sync_jobs_initiated_by ON sync_jobs(initiated_by);

CREATE INDEX idx_sync_history_type_date ON sync_history(sync_type, sync_date);
CREATE INDEX idx_sync_history_created_at ON sync_history(created_at);

CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX idx_webhook_events_call_id ON webhook_events(call_id) WHERE call_id IS NOT NULL;
CREATE INDEX idx_webhook_events_agent_email ON webhook_events(agent_email) WHERE agent_email IS NOT NULL;

CREATE INDEX idx_active_calls_agent_email ON active_calls(agent_email);
CREATE INDEX idx_active_calls_location ON active_calls(location);
CREATE INDEX idx_active_calls_status ON active_calls(call_status);
CREATE INDEX idx_active_calls_start_time ON active_calls(call_start_time);

-- Automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_current_status_updated_at
  BEFORE UPDATE ON agent_current_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_jobs_updated_at
  BEFORE UPDATE ON sync_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threecx_config_updated_at
  BEFORE UPDATE ON threecx_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_active_calls_updated_at
  BEFORE UPDATE ON active_calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE agent_current_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE threecx_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_calls ENABLE ROW LEVEL SECURITY;

-- Agent current status RLS
CREATE POLICY agent_current_status_select_policy ON agent_current_status
  FOR SELECT
  USING (
    -- Agents can see their own status
    agent_email = auth.email()
    OR
    -- Supervisors can see agents in their locations
    EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
        AND ls.location_name = agent_current_status.location
        AND ls.is_active = true
    )
    OR
    -- Managers and superadmins can see all
    auth.role() IN ('manager', 'superadmin')
  );

CREATE POLICY agent_current_status_update_policy ON agent_current_status
  FOR UPDATE
  USING (
    -- Agents can update their own status
    agent_email = auth.email()
    OR
    -- Supervisors can update status for agents in their locations
    EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
        AND ls.location_name = agent_current_status.location
        AND ls.is_active = true
    )
    OR
    -- Managers and superadmins can update all
    auth.role() IN ('manager', 'superadmin')
  );

-- Sync jobs RLS
CREATE POLICY sync_jobs_select_policy ON sync_jobs
  FOR SELECT
  USING (
    -- Users can see their own sync jobs
    initiated_by = auth.email()
    OR
    -- Supervisors and above can see all sync jobs
    auth.role() IN ('supervisor', 'manager', 'superadmin')
  );

CREATE POLICY sync_jobs_insert_policy ON sync_jobs
  FOR INSERT
  WITH CHECK (
    -- Only supervisors and above can create sync jobs
    auth.role() IN ('supervisor', 'manager', 'superadmin')
  );

-- Sync history RLS
CREATE POLICY sync_history_select_policy ON sync_history
  FOR SELECT
  USING (
    -- Supervisors and above can view sync history
    auth.role() IN ('supervisor', 'manager', 'superadmin')
  );

-- 3CX config RLS (admin only)
CREATE POLICY threecx_config_admin_only ON threecx_config
  FOR ALL
  USING (auth.role() = 'superadmin');

-- Webhook events RLS (admin and managers)
CREATE POLICY webhook_events_select_policy ON webhook_events
  FOR SELECT
  USING (auth.role() IN ('manager', 'superadmin'));

-- Active calls RLS
CREATE POLICY active_calls_select_policy ON active_calls
  FOR SELECT
  USING (
    -- Agents can see their own active calls
    agent_email = auth.email()
    OR
    -- Supervisors can see calls in their locations
    EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
        AND ls.location_name = active_calls.location
        AND ls.is_active = true
    )
    OR
    -- Managers and superadmins can see all active calls
    auth.role() IN ('manager', 'superadmin')
  );

-- Insert default 3CX configuration
INSERT INTO threecx_config (
  config_name,
  api_url,
  webhook_url,
  connection_status,
  location_mapping,
  extension_mapping
) VALUES (
  'primary_3cx',
  'https://ganger.3cx.us:5001/api',
  'https://api.gangerdermatology.com/call-center-ops/api/3cx/webhook',
  'disconnected',
  '{
    "aa": "Ann Arbor",
    "ann_arbor": "Ann Arbor",
    "annarbor": "Ann Arbor",
    "wixom": "Wixom", 
    "wx": "Wixom",
    "plymouth": "Plymouth",
    "ply": "Plymouth",
    "plym": "Plymouth"
  }'::jsonb,
  '{
    "101": "sarah.johnson@gangerdermatology.com",
    "102": "mike.chen@gangerdermatology.com", 
    "103": "lisa.rodriguez@gangerdermatology.com",
    "201": "david.park@gangerdermatology.com",
    "202": "emily.davis@gangerdermatology.com"
  }'::jsonb
);

-- Insert sample agent status data for development
INSERT INTO agent_current_status (
  agent_email,
  agent_name,
  extension,
  queue_name,
  location,
  status,
  last_activity
) VALUES 
  ('sarah.johnson@gangerdermatology.com', 'Sarah Johnson', '101', 'Ann Arbor', 'Ann Arbor', 'available', CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
  ('mike.chen@gangerdermatology.com', 'Mike Chen', '102', 'Wixom', 'Wixom', 'busy', CURRENT_TIMESTAMP - INTERVAL '2 minutes'),
  ('lisa.rodriguez@gangerdermatology.com', 'Lisa Rodriguez', '103', 'Plymouth', 'Plymouth', 'available', CURRENT_TIMESTAMP - INTERVAL '1 minute'),
  ('david.park@gangerdermatology.com', 'David Park', '201', 'Ann Arbor', 'Ann Arbor', 'away', CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
  ('emily.davis@gangerdermatology.com', 'Emily Davis', '202', 'Wixom', 'Wixom', 'available', CURRENT_TIMESTAMP - INTERVAL '3 minutes')
ON CONFLICT (agent_email) DO NOTHING;

-- Create view for agent status with metrics
CREATE VIEW agent_status_with_metrics AS
SELECT 
  acs.*,
  -- Calculate time in current status
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - acs.updated_at))/60 as status_duration_minutes,
  -- Calculate break duration if on break
  CASE 
    WHEN acs.break_start_time IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - acs.break_start_time))/60
    ELSE NULL 
  END as break_duration_minutes,
  -- Get today's call metrics
  COALESCE(daily_stats.calls_today, 0) as calls_today,
  COALESCE(daily_stats.calls_answered_today, 0) as calls_answered_today,
  COALESCE(daily_stats.avg_talk_time_today, 0) as avg_talk_time_today,
  -- Get current shift info
  shift.shift_status,
  shift.utilization_percentage,
  shift.calls_per_hour
FROM agent_current_status acs
LEFT JOIN (
  SELECT 
    agent_email,
    COUNT(*) as calls_today,
    COUNT(*) FILTER (WHERE call_status = 'completed') as calls_answered_today,
    ROUND(AVG(talk_duration_seconds), 0) as avg_talk_time_today
  FROM call_center_records 
  WHERE DATE(call_start_time) = CURRENT_DATE
  GROUP BY agent_email
) daily_stats ON acs.agent_email = daily_stats.agent_email
LEFT JOIN agent_shifts shift ON acs.agent_email = shift.agent_email 
  AND shift.shift_date = CURRENT_DATE;

-- Comments for documentation
COMMENT ON TABLE agent_current_status IS 'Real-time agent status from 3CX VoIP system';
COMMENT ON TABLE sync_jobs IS 'Tracking for 3CX data synchronization jobs';
COMMENT ON TABLE sync_history IS 'Historical record of sync operations';
COMMENT ON TABLE threecx_config IS '3CX system configuration and connection settings';
COMMENT ON TABLE webhook_events IS 'Log of incoming webhook events from 3CX';
COMMENT ON TABLE active_calls IS 'Currently active calls being handled by agents';

COMMENT ON VIEW agent_status_with_metrics IS 'Agent status with calculated performance metrics and durations';