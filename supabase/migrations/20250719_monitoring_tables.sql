-- Create error logs table for tracking application errors
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_stack TEXT,
  error_url TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for querying
  INDEX idx_error_logs_app_name (app_name),
  INDEX idx_error_logs_created_at (created_at),
  INDEX idx_error_logs_user_id (user_id)
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name VARCHAR(100) NOT NULL,
  metric_name VARCHAR(200) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit VARCHAR(50) NOT NULL,
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for querying
  INDEX idx_performance_app_name (app_name),
  INDEX idx_performance_metric_name (metric_name),
  INDEX idx_performance_created_at (created_at)
);

-- Create monitoring alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type VARCHAR(100) NOT NULL,
  app_name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_alerts_app_name (app_name),
  INDEX idx_alerts_type (alert_type),
  INDEX idx_alerts_acknowledged (acknowledged),
  INDEX idx_alerts_created_at (created_at)
);

-- Create custom events table for tracking user actions
CREATE TABLE IF NOT EXISTS custom_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name VARCHAR(100) NOT NULL,
  event_name VARCHAR(200) NOT NULL,
  properties JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_events_app_name (app_name),
  INDEX idx_events_name (event_name),
  INDEX idx_events_user_id (user_id),
  INDEX idx_events_created_at (created_at)
);

-- Create function to clean old monitoring data (keep 30 days)
CREATE OR REPLACE FUNCTION clean_old_monitoring_data()
RETURNS void AS $$
BEGIN
  -- Delete old error logs
  DELETE FROM error_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete old performance metrics
  DELETE FROM performance_metrics 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete old acknowledged alerts
  DELETE FROM monitoring_alerts 
  WHERE acknowledged = TRUE 
    AND created_at < NOW() - INTERVAL '7 days';
  
  -- Delete old custom events
  DELETE FROM custom_events 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to clean old data (requires pg_cron extension)
-- This would be set up in Supabase dashboard or via API
-- SELECT cron.schedule('clean-monitoring-data', '0 2 * * *', 'SELECT clean_old_monitoring_data();');

-- Create view for error summary
CREATE OR REPLACE VIEW error_summary AS
SELECT 
  app_name,
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_id) as affected_users,
  ARRAY_AGG(DISTINCT LEFT(error_message, 100)) as sample_errors
FROM error_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY app_name, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Create view for performance summary
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
  app_name,
  metric_name,
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as sample_count,
  AVG(metric_value) as avg_value,
  MIN(metric_value) as min_value,
  MAX(metric_value) as max_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) as median_value,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95_value
FROM performance_metrics
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY app_name, metric_name, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Grant permissions
GRANT SELECT, INSERT ON error_logs TO authenticated;
GRANT SELECT, INSERT ON performance_metrics TO authenticated;
GRANT SELECT, INSERT ON monitoring_alerts TO authenticated;
GRANT SELECT, INSERT ON custom_events TO authenticated;
GRANT SELECT ON error_summary TO authenticated;
GRANT SELECT ON performance_summary TO authenticated;