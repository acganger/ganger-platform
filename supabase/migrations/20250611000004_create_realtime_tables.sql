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