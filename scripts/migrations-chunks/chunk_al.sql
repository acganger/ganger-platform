CREATE INDEX idx_call_campaigns_type ON call_campaigns(campaign_type, campaign_status);

-- Row Level Security
ALTER TABLE performance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_assurance_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for performance goals
CREATE POLICY "Performance goals visible based on role hierarchy" ON performance_goals
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR agent_email = auth.jwt() ->> 'email' -- Own goals
    OR created_by = auth.jwt() ->> 'email' -- Goals they created
  );

CREATE POLICY "Managers can manage performance goals" ON performance_goals
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    OR created_by = auth.jwt() ->> 'email'
  );

-- RLS Policies for team performance metrics
CREATE POLICY "Supervisors can access team performance data" ON team_performance_metrics
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR (
      auth.jwt() ->> 'role' = 'supervisor' -- Location-based access
      AND location IN (
        SELECT location_name FROM location_staff 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- RLS Policies for QA reviews
CREATE POLICY "QA reviews visible based on role and agent relationship" ON quality_assurance_reviews
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR reviewer_email = auth.jwt() ->> 'email' -- Reviewers can see their reviews
    OR agent_email = auth.jwt() ->> 'email' -- Agents can see their own reviews
  );

CREATE POLICY "Supervisors can manage QA reviews" ON quality_assurance_reviews
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('supervisor', 'manager', 'superadmin')
  );

-- RLS Policies for campaigns
CREATE POLICY "Campaign visibility based on role and assignment" ON call_campaigns
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR created_by = auth.jwt() ->> 'email' -- Created campaigns
    OR managed_by = auth.jwt() ->> 'email' -- Managed campaigns
    OR auth.jwt() ->> 'email' = ANY(assigned_agents) -- Assigned agents
  );

CREATE POLICY "Managers can manage campaigns" ON call_campaigns
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

-- Update triggers
CREATE TRIGGER update_performance_goals_updated_at BEFORE UPDATE ON performance_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_call_campaigns_updated_at BEFORE UPDATE ON call_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quality_assurance_reviews_updated_at BEFORE UPDATE ON quality_assurance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Migration: 20250611000003_create_3cx_integration_tables.sql
-- ==========================================

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


-- Migration: 20250611000004_create_realtime_tables.sql
-- ==========================================

-- Call Center Operations Dashboard - Real-time Processing Tables
-- Tables for real-time events, alerts, and performance monitoring

-- Real-time events log for system monitoring
CREATE TABLE realtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'call_started', 'call_ended', 'agent_status_changed', 
    'metric_updated', 'alert_triggered', 'system_event'
  )),
  event_data JSONB NOT NULL,
  agent_email TEXT,
  location TEXT CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Performance alerts system
CREATE TABLE performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'queue_length', 'wait_time', 'agent_availability', 'call_volume', 
    'quality_score', 'system_health', 'performance_threshold'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  location TEXT CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  agent_email TEXT,
  metric_name TEXT,
  metric_value DECIMAL,
  threshold_value DECIMAL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  alert_config JSONB, -- Configuration that triggered this alert
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Alert configuration and thresholds
CREATE TABLE alert_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name TEXT NOT NULL UNIQUE,
  metric_type TEXT NOT NULL,
  threshold_value DECIMAL NOT NULL,
  comparison_operator TEXT NOT NULL CHECK (comparison_operator IN ('>', '<', '=', '>=', '<=')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  location TEXT CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  agent_email TEXT,
  is_active BOOLEAN DEFAULT true,
  notification_channels JSONB, -- email, slack, sms, etc.
  cooldown_minutes INTEGER DEFAULT 15, -- Prevent alert spam
  escalation_rules JSONB,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- System metrics cache for fast access
CREATE TABLE metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  metric_data JSONB NOT NULL,
  location TEXT CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Real-time dashboard subscriptions (for WebSocket management)
CREATE TABLE dashboard_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  connection_id TEXT NOT NULL UNIQUE,
  subscribed_events TEXT[] NOT NULL,
  subscribed_locations TEXT[],
  user_role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_heartbeat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Performance thresholds by location and role
CREATE TABLE performance_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  location TEXT CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  role_level TEXT CHECK (role_level IN ('agent', 'supervisor', 'manager', 'global')),
  threshold_type TEXT NOT NULL CHECK (threshold_type IN ('target', 'warning', 'critical')),
  threshold_value DECIMAL NOT NULL,
  unit TEXT, -- percentage, seconds, count, etc.
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- System health monitoring
CREATE TABLE system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name TEXT NOT NULL,
  health_status TEXT NOT NULL CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
  response_time_ms INTEGER,
  error_rate_percentage DECIMAL,
  last_check_at TIMESTAMPTZ NOT NULL,
  health_details JSONB,
  location TEXT CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_realtime_events_type_created ON realtime_events(event_type, created_at);
CREATE INDEX idx_realtime_events_agent_location ON realtime_events(agent_email, location) WHERE agent_email IS NOT NULL;
CREATE INDEX idx_realtime_events_created_at ON realtime_events(created_at);
CREATE INDEX idx_realtime_events_priority ON realtime_events(priority, created_at);

CREATE INDEX idx_performance_alerts_status_severity ON performance_alerts(status, severity);
CREATE INDEX idx_performance_alerts_created_at ON performance_alerts(created_at);
CREATE INDEX idx_performance_alerts_location ON performance_alerts(location) WHERE location IS NOT NULL;
CREATE INDEX idx_performance_alerts_agent ON performance_alerts(agent_email) WHERE agent_email IS NOT NULL;
CREATE INDEX idx_performance_alerts_type ON performance_alerts(alert_type);

CREATE INDEX idx_alert_configurations_active ON alert_configurations(is_active, metric_type);
CREATE INDEX idx_alert_configurations_location ON alert_configurations(location) WHERE location IS NOT NULL;

CREATE INDEX idx_metrics_cache_key ON metrics_cache(cache_key);
CREATE INDEX idx_metrics_cache_expires ON metrics_cache(expires_at);
CREATE INDEX idx_metrics_cache_location ON metrics_cache(location) WHERE location IS NOT NULL;

CREATE INDEX idx_dashboard_subscriptions_user ON dashboard_subscriptions(user_email, is_active);
CREATE INDEX idx_dashboard_subscriptions_connection ON dashboard_subscriptions(connection_id);
CREATE INDEX idx_dashboard_subscriptions_heartbeat ON dashboard_subscriptions(last_heartbeat) WHERE is_active = true;

CREATE INDEX idx_performance_thresholds_metric ON performance_thresholds(metric_name, is_active);
CREATE INDEX idx_performance_thresholds_location ON performance_thresholds(location, role_level) WHERE location IS NOT NULL;

CREATE INDEX idx_system_health_component ON system_health(component_name, last_check_at);
CREATE INDEX idx_system_health_status ON system_health(health_status, last_check_at);

-- Automatic timestamp updates
CREATE TRIGGER update_performance_alerts_updated_at
  BEFORE UPDATE ON performance_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_configurations_updated_at
  BEFORE UPDATE ON alert_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_cache_updated_at
  BEFORE UPDATE ON metrics_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_thresholds_updated_at
  BEFORE UPDATE ON performance_thresholds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE realtime_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Realtime events RLS
CREATE POLICY realtime_events_select_policy ON realtime_events
  FOR SELECT
  USING (
    -- Agents can see events related to them or their location
    agent_email = auth.email()
    OR
    -- Supervisors can see events in their locations
    (auth.role() = 'supervisor' AND EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
        AND ls.location_name = realtime_events.location
        AND ls.is_active = true
    ))
    OR
    -- Managers and superadmins can see all events
    auth.role() IN ('manager', 'superadmin')
  );

-- Performance alerts RLS
CREATE POLICY performance_alerts_select_policy ON performance_alerts
  FOR SELECT
  USING (
    -- Agents can see alerts related to them or their location
    agent_email = auth.email()
    OR
    -- Supervisors can see alerts in their locations
    (auth.role() = 'supervisor' AND EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
        AND ls.location_name = performance_alerts.location
        AND ls.is_active = true
    ))
    OR
    -- Managers and superadmins can see all alerts
    auth.role() IN ('manager', 'superadmin')
  );

CREATE POLICY performance_alerts_update_policy ON performance_alerts
  FOR UPDATE
  USING (
    -- Users can acknowledge alerts they can see
    -- Same logic as select policy
    agent_email = auth.email()
    OR
    (auth.role() = 'supervisor' AND EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
        AND ls.location_name = performance_alerts.location
        AND ls.is_active = true
    ))
    OR
    auth.role() IN ('manager', 'superadmin')
  );

-- Alert configurations RLS (supervisor and above)
CREATE POLICY alert_configurations_policy ON alert_configurations
  FOR ALL
  USING (auth.role() IN ('supervisor', 'manager', 'superadmin'));

-- Metrics cache RLS
CREATE POLICY metrics_cache_select_policy ON metrics_cache
  FOR SELECT
  USING (
    -- Location-based access
    location IS NULL 
    OR 
    (auth.role() = 'supervisor' AND EXISTS (
      SELECT 1 FROM location_staff ls
      WHERE ls.user_id = auth.uid()
        AND ls.location_name = metrics_cache.location
        AND ls.is_active = true
    ))
    OR
    auth.role() IN ('manager', 'superadmin')
  );

-- Dashboard subscriptions RLS
CREATE POLICY dashboard_subscriptions_policy ON dashboard_subscriptions
  FOR ALL
  USING (user_email = auth.email() OR auth.role() IN ('manager', 'superadmin'));

-- Performance thresholds RLS (supervisor and above can read, manager and above can modify)
CREATE POLICY performance_thresholds_select_policy ON performance_thresholds
  FOR SELECT
  USING (auth.role() IN ('supervisor', 'manager', 'superadmin'));

CREATE POLICY performance_thresholds_modify_policy ON performance_thresholds
  FOR ALL
  USING (auth.role() IN ('manager', 'superadmin'));

-- System health RLS (all authenticated users can read)
CREATE POLICY system_health_select_policy ON system_health
  FOR SELECT
  USING (auth.role() IS NOT NULL);

-- Insert default alert configurations
INSERT INTO alert_configurations (
  config_name, metric_type, threshold_value, comparison_operator, severity, 
  location, is_active, notification_channels, created_by
) VALUES 
  ('Queue Length Warning', 'queue_length', 5, '>', 'warning', NULL, true, '["dashboard", "email"]'::jsonb, 'system'),
  ('Queue Length Critical', 'queue_length', 10, '>', 'critical', NULL, true, '["dashboard", "email", "sms"]'::jsonb, 'system'),
  ('Wait Time Warning', 'average_wait_time', 120, '>', 'warning', NULL, true, '["dashboard"]'::jsonb, 'system'),
  ('Wait Time Critical', 'average_wait_time', 300, '>', 'critical', NULL, true, '["dashboard", "email"]'::jsonb, 'system'),
  ('No Available Agents', 'available_agents', 1, '<', 'critical', NULL, true, '["dashboard", "email", "sms"]'::jsonb, 'system'),
  ('Low Agent Availability', 'available_agents', 2, '<', 'warning', NULL, true, '["dashboard"]'::jsonb, 'system'),
  ('High Call Volume', 'call_volume_hourly', 50, '>', 'warning', NULL, true, '["dashboard"]'::jsonb, 'system'),
  ('Low Quality Score', 'average_quality_score', 70, '<', 'warning', NULL, true, '["dashboard", "email"]'::jsonb, 'system'),
  ('Very Low Quality Score', 'average_quality_score', 60, '<', 'critical', NULL, true, '["dashboard", "email"]'::jsonb, 'system'),
  ('Poor Customer Satisfaction', 'customer_satisfaction', 3.0, '<', 'warning', NULL, true, '["dashboard", "email"]'::jsonb, 'system')
ON CONFLICT (config_name) DO NOTHING;

-- Insert default performance thresholds
INSERT INTO performance_thresholds (
  metric_name, location, role_level, threshold_type, threshold_value, unit, description, created_by
) VALUES 
  ('answer_rate', NULL, 'global', 'target', 85.0, 'percentage', 'Target answer rate for all locations', 'system'),
  ('answer_rate', NULL, 'global', 'warning', 80.0, 'percentage', 'Warning threshold for answer rate', 'system'),
  ('answer_rate', NULL, 'global', 'critical', 75.0, 'percentage', 'Critical threshold for answer rate', 'system'),
  
  ('first_call_resolution', NULL, 'global', 'target', 70.0, 'percentage', 'Target first call resolution rate', 'system'),
  ('first_call_resolution', NULL, 'global', 'warning', 65.0, 'percentage', 'Warning threshold for FCR', 'system'),
  ('first_call_resolution', NULL, 'global', 'critical', 60.0, 'percentage', 'Critical threshold for FCR', 'system'),
  
  ('customer_satisfaction', NULL, 'global', 'target', 4.0, 'score', 'Target customer satisfaction score', 'system'),
  ('customer_satisfaction', NULL, 'global', 'warning', 3.5, 'score', 'Warning threshold for satisfaction', 'system'),
  ('customer_satisfaction', NULL, 'global', 'critical', 3.0, 'score', 'Critical threshold for satisfaction', 'system'),
  
  ('average_talk_time', NULL, 'global', 'target', 240, 'seconds', 'Target average talk time', 'system'),
  ('average_talk_time', NULL, 'global', 'warning', 300, 'seconds', 'Warning threshold for talk time', 'system'),
  ('average_talk_time', NULL, 'global', 'critical', 360, 'seconds', 'Critical threshold for talk time', 'system'),
  
  ('utilization_rate', NULL, 'global', 'target', 75.0, 'percentage', 'Target agent utilization rate', 'system'),
  ('utilization_rate', NULL, 'global', 'warning', 90.0, 'percentage', 'Warning threshold for utilization', 'system'),
  ('utilization_rate', NULL, 'global', 'critical', 95.0, 'percentage', 'Critical threshold for utilization', 'system')
ON CONFLICT DO NOTHING;

-- Insert initial system health components
INSERT INTO system_health (
  component_name, health_status, response_time_ms, error_rate_percentage, 
  last_check_at, health_details
) VALUES 
  ('3CX Integration', 'healthy', 150, 0.0, CURRENT_TIMESTAMP, '{"last_sync": "success", "webhook_status": "active"}'::jsonb),
  ('Database', 'healthy', 25, 0.0, CURRENT_TIMESTAMP, '{"connection_pool": "optimal", "query_performance": "good"}'::jsonb),
  ('Real-time Processing', 'healthy', 50, 0.0, CURRENT_TIMESTAMP, '{"event_queue_size": 0, "processing_lag": "minimal"}'::jsonb),
  ('Performance Analytics', 'healthy', 200, 0.0, CURRENT_TIMESTAMP, '{"calculation_time": "normal", "cache_hit_rate": 85}'::jsonb)
ON CONFLICT DO NOTHING;

-- Functions for real-time processing

-- Function to clean up old realtime events
CREATE OR REPLACE FUNCTION cleanup_old_realtime_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete events older than 7 days, keeping critical events for 30 days
  DELETE FROM realtime_events 
  WHERE 
    (priority != 'critical' AND created_at < CURRENT_TIMESTAMP - INTERVAL '7 days')
    OR
    (priority = 'critical' AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to expire old metrics cache
CREATE OR REPLACE FUNCTION cleanup_expired_metrics_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM metrics_cache WHERE expires_at < CURRENT_TIMESTAMP;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update dashboard subscription heartbeat
CREATE OR REPLACE FUNCTION update_subscription_heartbeat(connection_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE dashboard_subscriptions 
  SET last_heartbeat = CURRENT_TIMESTAMP
  WHERE connection_id = connection_id_param AND is_active = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Views for common real-time queries

-- Active alerts view
CREATE VIEW active_alerts AS
SELECT 
  pa.*,
  pt.threshold_type,
  pt.unit,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - pa.created_at))/60 as age_minutes
FROM performance_alerts pa
LEFT JOIN performance_thresholds pt ON pa.metric_name = pt.metric_name 
  AND pt.threshold_type = 'warning' 
  AND pt.is_active = true
WHERE pa.status = 'active'
ORDER BY 
  CASE pa.severity 
    WHEN 'critical' THEN 1 
    WHEN 'warning' THEN 2 
    ELSE 3 
  END,
  pa.created_at DESC;

-- Current system health view
CREATE VIEW current_system_health AS
SELECT 
  component_name,
  health_status,
  response_time_ms,
  error_rate_percentage,
  last_check_at,
  health_details,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_check_at))/60 as minutes_since_check,
  CASE 
    WHEN last_check_at < CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN 'stale'
    ELSE 'current'
  END as check_status
FROM system_health sh1
WHERE last_check_at = (
  SELECT MAX(last_check_at) 
  FROM system_health sh2 
  WHERE sh2.component_name = sh1.component_name
)
ORDER BY component_name;

-- Comments for documentation
COMMENT ON TABLE realtime_events IS 'Log of real-time events for system monitoring and debugging';
COMMENT ON TABLE performance_alerts IS 'Active and historical performance alerts with acknowledgment tracking';
COMMENT ON TABLE alert_configurations IS 'Configuration for automatic alert generation and thresholds';
COMMENT ON TABLE metrics_cache IS 'Cached metrics for fast dashboard loading';
COMMENT ON TABLE dashboard_subscriptions IS 'WebSocket connection tracking for real-time updates';
COMMENT ON TABLE performance_thresholds IS 'Performance targets and thresholds by location and role';
COMMENT ON TABLE system_health IS 'System component health monitoring';

COMMENT ON VIEW active_alerts IS 'Currently active alerts with age and threshold information';
COMMENT ON VIEW current_system_health IS 'Latest health status for all system components';


-- Migration: 20250614_eos_l10_schema.sql
-- ==========================================

-- EOS L10 Database Schema
-- Based on types from apps/eos-l10/src/types/eos.ts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE IF NOT EXISTS eos_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{
        "meeting_day": "Monday",
        "meeting_time": "09:00",
        "timezone": "America/New_York",
        "meeting_duration": 90,
        "scorecard_frequency": "weekly",
        "rock_quarters": ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]
    }'::jsonb
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'member', 'viewer')),
    seat VARCHAR(255), -- The person's role/seat in the company
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    UNIQUE(team_id, user_id)
);

-- L10 Meetings table
CREATE TABLE IF NOT EXISTS l10_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    facilitator_id UUID REFERENCES auth.users(id),
    agenda JSONB DEFAULT '{
        "segue": {"duration": 5, "completed": false},
        "scorecard": {"duration": 5, "completed": false},
        "rock_review": {"duration": 5, "completed": false},
        "customer_employee_headlines": {"duration": 5, "completed": false},
        "todo_review": {"duration": 5, "completed": false},
        "ids": {"duration": 60, "completed": false},
        "conclude": {"duration": 5, "completed": false}
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rocks (Quarterly Goals) table
CREATE TABLE IF NOT EXISTS rocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quarter VARCHAR(10) NOT NULL, -- 'Q1 2025'
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'on_track', 'off_track', 'complete')),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rock milestones table
CREATE TABLE IF NOT EXISTS rock_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rock_id UUID REFERENCES rocks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scorecards table
CREATE TABLE IF NOT EXISTS scorecards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scorecard metrics table
CREATE TABLE IF NOT EXISTS scorecard_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scorecard_id UUID REFERENCES scorecards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goal DECIMAL(10,2) NOT NULL,
    measurement_type VARCHAR(20) DEFAULT 'number' CHECK (measurement_type IN ('number', 'percentage', 'currency', 'boolean')),
    frequency VARCHAR(20) DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    owner_id UUID REFERENCES auth.users(id),
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scorecard entries table
CREATE TABLE IF NOT EXISTS scorecard_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_id UUID REFERENCES scorecard_metrics(id) ON DELETE CASCADE,
    value DECIMAL(10,2) NOT NULL,
    week_ending DATE NOT NULL,
    notes TEXT,
    status VARCHAR(10) DEFAULT 'yellow' CHECK (status IN ('green', 'yellow', 'red')),
    entered_by UUID REFERENCES auth.users(id),
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metric_id, week_ending)
);

-- Issues table (IDS - Identify, Discuss, Solve)
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'other' CHECK (type IN ('obstacle', 'opportunity', 'process', 'people', 'other')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'identified' CHECK (status IN ('identified', 'discussing', 'solved', 'dropped')),
    owner_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    solved_at TIMESTAMP WITH TIME ZONE,
    solution TEXT,
    meeting_id UUID REFERENCES l10_meetings(id)
);

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
