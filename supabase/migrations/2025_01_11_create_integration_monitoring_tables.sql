-- Migration: 2025_01_11_create_integration_monitoring_tables.sql
-- Third-Party Integration Status Dashboard - Database Schema
-- Creates 9 tables for comprehensive integration monitoring and alerting

-- Core integrations registry
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Integration identification
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  service_type VARCHAR(50) NOT NULL, -- 'api', 'database', 'messaging', 'storage', 'auth', 'payment'
  category VARCHAR(50) DEFAULT 'external', -- 'external', 'internal', 'infrastructure'
  
  -- Connection details
  base_url TEXT,
  health_check_endpoint TEXT,
  auth_type VARCHAR(50) NOT NULL, -- 'none', 'api_key', 'oauth', 'basic', 'bearer'
  auth_config JSONB, -- Encrypted authentication configuration
  
  -- Monitoring configuration
  is_active BOOLEAN DEFAULT TRUE,
  is_critical BOOLEAN DEFAULT FALSE, -- Critical integrations require immediate attention
  monitoring_enabled BOOLEAN DEFAULT TRUE,
  health_check_interval_minutes INTEGER DEFAULT 5,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Status tracking
  current_health_status VARCHAR(20) DEFAULT 'unknown' CHECK (current_health_status IN ('healthy', 'warning', 'critical', 'unknown')),
  last_health_check TIMESTAMPTZ,
  last_successful_check TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,
  
  -- Metadata
  icon_url TEXT,
  documentation_url TEXT,
  responsible_team VARCHAR(100),
  environment VARCHAR(20) DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  version VARCHAR(50),
  
  -- Configuration
  custom_headers JSONB,
  expected_response_codes INTEGER[] DEFAULT ARRAY[200],
  health_check_method VARCHAR(10) DEFAULT 'GET' CHECK (health_check_method IN ('GET', 'POST', 'HEAD')),
  health_check_body TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health check results history
CREATE TABLE integration_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Check details
  check_timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER,
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  
  -- Check result
  is_successful BOOLEAN NOT NULL,
  health_status VARCHAR(20) NOT NULL CHECK (health_status IN ('healthy', 'warning', 'critical', 'unknown')),
  
  -- Additional metadata
  check_type VARCHAR(50) DEFAULT 'automated', -- 'automated', 'manual', 'on_demand'
  triggered_by UUID REFERENCES auth.users(id),
  dns_resolution_time_ms INTEGER,
  tcp_connection_time_ms INTEGER,
  ssl_handshake_time_ms INTEGER,
  
  -- Derived metrics
  availability_score DECIMAL(5,4), -- 0.0000 to 1.0000
  performance_score DECIMAL(5,4), -- Based on response time vs baseline
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service metrics aggregation
CREATE TABLE integration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Time window
  metric_date DATE NOT NULL,
  metric_hour INTEGER CHECK (metric_hour BETWEEN 0 AND 23),
  time_window_minutes INTEGER DEFAULT 60, -- Aggregation window size
  
  -- Availability metrics
  total_checks INTEGER DEFAULT 0,
  successful_checks INTEGER DEFAULT 0,
  failed_checks INTEGER DEFAULT 0,
  uptime_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_checks > 0 
    THEN (successful_checks::DECIMAL / total_checks::DECIMAL) * 100 
    ELSE NULL END
  ) STORED,
  
  -- Performance metrics
  avg_response_time_ms DECIMAL(8,2),
  min_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  p50_response_time_ms INTEGER,
  p95_response_time_ms INTEGER,
  p99_response_time_ms INTEGER,
  
  -- Error analysis
  error_count INTEGER DEFAULT 0,
  error_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_checks > 0 
    THEN (error_count::DECIMAL / total_checks::DECIMAL) * 100 
    ELSE NULL END
  ) STORED,
  
  -- Status distribution
  status_2xx_count INTEGER DEFAULT 0,
  status_3xx_count INTEGER DEFAULT 0,
  status_4xx_count INTEGER DEFAULT 0,
  status_5xx_count INTEGER DEFAULT 0,
  timeout_count INTEGER DEFAULT 0,
  
  -- Aggregated scores
  availability_score DECIMAL(5,4),
  performance_score DECIMAL(5,4),
  reliability_score DECIMAL(5,4),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(integration_id, metric_date, metric_hour)
);

-- Alert rules and configuration
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Rule identification
  rule_name VARCHAR(255) NOT NULL,
  rule_description TEXT,
  alert_type VARCHAR(50) NOT NULL, -- 'availability', 'performance', 'error_rate', 'custom'
  
  -- Trigger conditions
  condition_metric VARCHAR(100) NOT NULL, -- 'uptime_percentage', 'response_time', 'error_rate', etc.
  condition_operator VARCHAR(10) NOT NULL CHECK (condition_operator IN ('>', '<', '>=', '<=', '==', '!=')),
  condition_threshold DECIMAL(10,4) NOT NULL,
  condition_duration_minutes INTEGER DEFAULT 5, -- How long condition must persist
  
  -- Alert severity and handling
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'urgent')),
  auto_resolve BOOLEAN DEFAULT TRUE,
  cooldown_minutes INTEGER DEFAULT 15, -- Minimum time between alerts
  
  -- Notification configuration
  notification_channels TEXT[] DEFAULT ARRAY['email'], -- 'email', 'slack', 'sms', 'webhook'
  notification_recipients TEXT[],
  escalation_enabled BOOLEAN DEFAULT FALSE,
  escalation_after_minutes INTEGER DEFAULT 30,
  escalation_recipients TEXT[],
  
  -- Rule status
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  
  -- Business hours configuration
  business_hours_only BOOLEAN DEFAULT FALSE,
  business_hours_start TIME DEFAULT '08:00',
  business_hours_end TIME DEFAULT '18:00',
  business_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Monday, 7=Sunday
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active alerts and incidents
CREATE TABLE alert_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID NOT NULL REFERENCES alert_rules(id),
  integration_id UUID NOT NULL REFERENCES integrations(id),
  
  -- Incident details
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Alert information
  alert_message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  trigger_value DECIMAL(10,4), -- The actual value that triggered the alert
  threshold_value DECIMAL(10,4), -- The configured threshold
  
  -- Incident status
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'suppressed')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_note TEXT,
  
  -- Impact assessment
  affected_services TEXT[],
  business_impact VARCHAR(20) CHECK (business_impact IN ('none', 'low', 'medium', 'high', 'critical')),
  estimated_affected_users INTEGER,
  
  -- Escalation tracking
  escalation_level INTEGER DEFAULT 0,
  escalated_at TIMESTAMPTZ,
  escalated_to TEXT[],
  
  -- Notification tracking
  notifications_sent JSONB, -- Track which notifications were sent when
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration dependencies mapping
CREATE TABLE integration_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  depends_on_integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Dependency details
  dependency_type VARCHAR(50) NOT NULL, -- 'hard', 'soft', 'optional'
  description TEXT,
  
  -- Impact configuration
  failure_propagates BOOLEAN DEFAULT TRUE,
  propagation_delay_minutes INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(integration_id, depends_on_integration_id),
  CHECK (integration_id != depends_on_integration_id)
);

-- Maintenance windows scheduling
CREATE TABLE maintenance_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Window identification
  title VARCHAR(255) NOT NULL,
  description TEXT,
  maintenance_type VARCHAR(50) DEFAULT 'planned', -- 'planned', 'emergency', 'routine'
  
  -- Timing
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  
  -- Affected integrations
  affected_integrations UUID[] NOT NULL,
  affected_services TEXT[],
  
  -- Impact details
  expected_impact VARCHAR(20) DEFAULT 'partial' CHECK (expected_impact IN ('none', 'partial', 'full')),
  impact_description TEXT,
  
  -- Notification settings
  notify_users BOOLEAN DEFAULT TRUE,
  notification_advance_hours INTEGER DEFAULT 24,
  notifications_sent BOOLEAN DEFAULT FALSE,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT TRUE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (scheduled_end > scheduled_start)
);

-- Integration performance baselines
CREATE TABLE integration_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Baseline period
  baseline_start_date DATE NOT NULL,
  baseline_end_date DATE NOT NULL,
  baseline_type VARCHAR(50) DEFAULT 'rolling_30d', -- 'rolling_30d', 'monthly', 'custom'
  
  -- Performance baselines
  baseline_response_time_ms DECIMAL(8,2),
  baseline_uptime_percentage DECIMAL(5,2),
  baseline_error_rate DECIMAL(5,2),
  baseline_requests_per_hour DECIMAL(10,2),
  
  -- Variability metrics
  response_time_std_dev DECIMAL(8,2),
  uptime_std_dev DECIMAL(5,2),
  
  -- Baseline confidence
  sample_size INTEGER,
  confidence_level DECIMAL(5,2) DEFAULT 95.0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(integration_id, baseline_type, baseline_start_date)
);

-- System configuration
CREATE TABLE integration_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  config_type VARCHAR(50) DEFAULT 'global', -- 'global', 'integration_specific'
  description TEXT,
  
  -- Validation
  validation_schema JSONB,
  is_encrypted BOOLEAN DEFAULT FALSE,
  
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_integrations_status ON integrations(current_health_status, is_active);
CREATE INDEX idx_integrations_category ON integrations(category, service_type);
CREATE INDEX idx_health_checks_integration_time ON integration_health_checks(integration_id, check_timestamp DESC);
CREATE INDEX idx_health_checks_status ON integration_health_checks(health_status, check_timestamp DESC);
CREATE INDEX idx_metrics_integration_date ON integration_metrics(integration_id, metric_date DESC, metric_hour DESC);
CREATE INDEX idx_metrics_uptime ON integration_metrics(uptime_percentage, metric_date DESC);
CREATE INDEX idx_alert_rules_active ON alert_rules(is_active, integration_id);
CREATE INDEX idx_alert_incidents_status ON alert_incidents(status, triggered_at DESC);
CREATE INDEX idx_alert_incidents_integration ON alert_incidents(integration_id, triggered_at DESC);
CREATE INDEX idx_maintenance_windows_time ON maintenance_windows(scheduled_start, scheduled_end);
CREATE INDEX idx_dependencies_integration ON integration_dependencies(integration_id);

-- Row Level Security
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_system_config ENABLE ROW LEVEL SECURITY;

-- Access policies
CREATE POLICY "Users can view integrations" ON integrations
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Managers can manage integrations" ON integrations
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

CREATE POLICY "Users can view health checks" ON integration_health_checks
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Users can view metrics" ON integration_metrics
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Managers can manage alert rules" ON alert_rules
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

CREATE POLICY "Users can view alert incidents" ON alert_incidents
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Staff can acknowledge incidents" ON alert_incidents
  FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin')
    AND (status = 'open' OR acknowledged_by = auth.uid())
  );

CREATE POLICY "Managers can manage maintenance windows" ON maintenance_windows
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

-- Insert default system configuration
INSERT INTO integration_system_config (config_key, config_value, description) VALUES
('default_health_check_interval', '5', 'Default health check interval in minutes'),
('default_timeout_seconds', '30', 'Default timeout for health checks in seconds'),
('max_consecutive_failures', '3', 'Maximum consecutive failures before marking as critical'),
('alert_cooldown_minutes', '15', 'Default cooldown period between alerts'),
('metrics_retention_days', '90', 'Number of days to retain detailed metrics'),
('health_check_retention_days', '30', 'Number of days to retain health check history'),
('enable_auto_recovery_detection', 'true', 'Automatically detect when services recover'),
('business_hours_start', '08:00', 'Default business hours start time'),
('business_hours_end', '18:00', 'Default business hours end time'),
('notification_rate_limit', '5', 'Maximum notifications per integration per hour');

-- Insert default integrations (examples)
INSERT INTO integrations (name, display_name, description, service_type, base_url, health_check_endpoint, auth_type, is_critical) VALUES
('google_calendar', 'Google Calendar', 'Google Calendar API for scheduling', 'api', 'https://www.googleapis.com/calendar/v3', '/calendar/v3/users/me/calendarList', 'oauth', true),
('supabase_db', 'Supabase Database', 'Primary application database', 'database', 'https://pfqtzmxxxhhsxmlddrta.supabase.co', '/rest/v1/', 'bearer', true),
('stripe_payments', 'Stripe Payments', 'Payment processing service', 'api', 'https://api.stripe.com', '/v1/account', 'bearer', true),
('twilio_sms', 'Twilio SMS', 'SMS and communication service', 'messaging', 'https://api.twilio.com', '/2010-04-01/Accounts', 'basic', false),
('cloudflare_cdn', 'Cloudflare CDN', 'Content delivery and DNS', 'infrastructure', 'https://api.cloudflare.com', '/client/v4/user', 'bearer', true);