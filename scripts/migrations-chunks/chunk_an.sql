-- Physician support requirements access policies
CREATE POLICY "All staff can view support requirements" ON physician_support_requirements
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage support requirements" ON physician_support_requirements
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

-- Optimization rules access policies
CREATE POLICY "All staff can view optimization rules" ON staffing_optimization_rules
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage optimization rules" ON staffing_optimization_rules
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

-- Analytics access policies
CREATE POLICY "Managers can view analytics" ON staffing_analytics
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'analytics'));

CREATE POLICY "System can manage analytics" ON staffing_analytics
  FOR ALL USING (auth.jwt() ->> 'role' IN ('system', 'superadmin'));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_physician_support_requirements_updated_at BEFORE UPDATE ON physician_support_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON staff_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_availability_updated_at BEFORE UPDATE ON staff_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staffing_optimization_rules_updated_at BEFORE UPDATE ON staffing_optimization_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE staff_members IS 'Clinical support staff members including medical assistants, scribes, nurses, and technicians';
COMMENT ON TABLE physician_support_requirements IS 'Requirements for support staff per provider and appointment type';
COMMENT ON TABLE staff_schedules IS 'Daily schedules for support staff assignments';
COMMENT ON TABLE provider_schedules_cache IS 'Cached provider schedules from ModMed FHIR API';
COMMENT ON TABLE staff_availability IS 'Staff availability preferences and constraints';
COMMENT ON TABLE staffing_optimization_rules IS 'Rules and parameters for AI-powered staffing optimization';
COMMENT ON TABLE staffing_analytics IS 'Daily analytics and metrics for staffing efficiency';

COMMENT ON COLUMN staff_members.role_type IS 'Type of clinical support role: medical_assistant, scribe, nurse, technician';
COMMENT ON COLUMN staff_members.skill_level IS 'Skill level classification for matching requirements';
COMMENT ON COLUMN staff_schedules.assignment_method IS 'How the schedule was created: manual, ai_suggested, auto_optimized';
COMMENT ON COLUMN staff_schedules.coverage_priority IS 'Priority level for coverage (1-100, higher = more important)';
COMMENT ON COLUMN provider_schedules_cache.estimated_support_need IS 'AI-calculated support hours needed';
COMMENT ON COLUMN staffing_optimization_rules.enforcement_level IS 'How strictly to enforce: strict, warning, suggestion';


-- Migration: 2025_01_11_create_dashboard_platform_tables.sql
-- ==========================================

-- Platform Entrypoint Dashboard Backend Database Migration
-- Migration: 2025_01_11_create_dashboard_platform_tables.sql
-- Terminal 2: Backend Implementation

-- User dashboard customization
CREATE TABLE user_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Layout preferences
  layout_columns INTEGER DEFAULT 3 CHECK (layout_columns BETWEEN 1 AND 4),
  widget_arrangement JSONB DEFAULT '[]'::jsonb, -- [{widget_id, position, size}]
  theme_preference VARCHAR(20) DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  
  -- Content preferences
  show_weather BOOLEAN DEFAULT true,
  show_team_activity BOOLEAN DEFAULT true,
  show_recent_documents BOOLEAN DEFAULT true,
  show_upcoming_meetings BOOLEAN DEFAULT true,
  
  -- Notification preferences
  desktop_notifications BOOLEAN DEFAULT true,
  notification_sound BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '18:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  -- Quick actions
  pinned_applications TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_quick_actions JSONB DEFAULT '[]'::jsonb,
  
  UNIQUE(user_id)
);

-- Dashboard widgets registry
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Widget identification
  widget_id VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Widget metadata
  category VARCHAR(50) NOT NULL CHECK (category IN ('application', 'information', 'action', 'communication')),
  icon_url TEXT,
  
  -- Widget behavior
  supports_resize BOOLEAN DEFAULT true,
  min_width INTEGER DEFAULT 1,
  min_height INTEGER DEFAULT 1,
  max_width INTEGER DEFAULT 4,
  max_height INTEGER DEFAULT 4,
  
  -- Widget content source
  source_application VARCHAR(100) REFERENCES platform_applications(app_name),
  data_endpoint TEXT, -- API endpoint for widget data
  refresh_interval_seconds INTEGER DEFAULT 300, -- 5 minutes default
  
  -- Access control
  required_permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  required_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Widget availability
  is_active BOOLEAN DEFAULT true,
  is_system_widget BOOLEAN DEFAULT false, -- Cannot be removed by users
  
  CONSTRAINT valid_category CHECK (category IN ('application', 'information', 'action', 'communication'))
);

-- User activity tracking for intelligent suggestions
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('app_launch', 'widget_interaction', 'quick_action', 'dashboard_view', 'search')),
  target_app VARCHAR(100),
  target_widget VARCHAR(100),
  target_action VARCHAR(100),
  
  -- Context
  session_id VARCHAR(100),
  time_spent_seconds INTEGER,
  interaction_count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Analytics metadata
  user_agent TEXT,
  ip_address INET,
  location_context VARCHAR(100),
  
  CONSTRAINT valid_activity_type CHECK (activity_type IN ('app_launch', 'widget_interaction', 'quick_action', 'dashboard_view', 'search'))
);

-- Platform notifications and announcements
CREATE TABLE platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Announcement content
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  announcement_type VARCHAR(50) DEFAULT 'info' CHECK (announcement_type IN ('info', 'warning', 'urgent', 'maintenance')),
  
  -- Display settings
  priority INTEGER DEFAULT 0, -- Higher numbers show first
  banner_color VARCHAR(20) DEFAULT 'blue',
  show_icon BOOLEAN DEFAULT true,
  
  -- Targeting
  target_roles TEXT[] DEFAULT ARRAY[]::TEXT[], -- Empty = all users
  target_locations TEXT[] DEFAULT ARRAY[]::TEXT[], -- Empty = all locations
  target_specific_users UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Scheduling
  display_start TIMESTAMPTZ DEFAULT NOW(),
  display_end TIMESTAMPTZ,
  auto_dismiss_hours INTEGER DEFAULT 24,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_dismissible BOOLEAN DEFAULT true,
  
  CONSTRAINT valid_announcement_type CHECK (announcement_type IN ('info', 'warning', 'urgent', 'maintenance'))
);

-- User announcement dismissals
CREATE TABLE user_announcement_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES platform_announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, announcement_id)
);

-- Quick actions registry
CREATE TABLE quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Action identification
  action_id VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Action appearance
  icon_name VARCHAR(100) NOT NULL, -- Lucide icon name
  button_color VARCHAR(20) DEFAULT 'blue',
  
  -- Action behavior
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('app_launch', 'external_link', 'modal_form', 'api_call')),
  action_target TEXT NOT NULL, -- URL, app name, or form ID
  opens_in_new_tab BOOLEAN DEFAULT false,
  
  -- Access control
  required_permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  required_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Categorization
  category VARCHAR(100) DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  is_system_action BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT valid_action_type CHECK (action_type IN ('app_launch', 'external_link', 'modal_form', 'api_call'))
);

-- Dashboard metrics for analytics
CREATE TABLE dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metric identification
  metric_type VARCHAR(100) NOT NULL, -- 'daily_active_users', 'app_launches', 'widget_interactions'
  metric_date DATE NOT NULL,
  
  -- Metric value
  metric_value NUMERIC NOT NULL,
  metric_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Dimensions
  user_role VARCHAR(100),
  location_name VARCHAR(100),
  application_name VARCHAR(100),
  
  UNIQUE(metric_type, metric_date, user_role, location_name, application_name)
);

-- Application health monitoring
CREATE TABLE application_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_name VARCHAR(100) NOT NULL,
  health_check_url TEXT,
  
  -- Status tracking
  current_status VARCHAR(20) DEFAULT 'unknown' CHECK (current_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
  last_check_at TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER,
  error_message TEXT,
  
  -- Historical data
  uptime_percentage DECIMAL(5,2),
  avg_response_time_24h DECIMAL(8,2),
  incidents_count_7d INTEGER DEFAULT 0,
  
  -- Alert configuration
  alert_threshold_ms INTEGER DEFAULT 5000,
  alert_enabled BOOLEAN DEFAULT true,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(application_name)
);

-- Search index for global search
CREATE TABLE search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Document identification
  content_type VARCHAR(50) NOT NULL, -- 'application', 'help_article', 'user', 'document'
  content_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  
  -- Search metadata
  keywords TEXT[],
  categories TEXT[],
  search_vector TSVECTOR,
  
  -- Access control
  required_permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  required_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Content metadata
  url TEXT,
  icon_url TEXT,
  last_modified TIMESTAMPTZ DEFAULT NOW(),
  indexed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(content_type, content_id)
);

-- Widget data cache
CREATE TABLE widget_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Cached data
  data_content JSONB NOT NULL,
  data_hash VARCHAR(64), -- For change detection
  
  -- Cache metadata
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  
  -- Performance tracking
  generation_time_ms INTEGER,
  cache_hits INTEGER DEFAULT 0,
  
  UNIQUE(widget_id, user_id)
);

-- Performance indexes
CREATE INDEX idx_user_preferences_user ON user_dashboard_preferences(user_id);
CREATE INDEX idx_widgets_category ON dashboard_widgets(category, is_active);
CREATE INDEX idx_user_activity_user_time ON user_activity_log(user_id, created_at DESC);
CREATE INDEX idx_user_activity_type ON user_activity_log(activity_type, created_at DESC);
CREATE INDEX idx_announcements_active ON platform_announcements(is_active, display_start, display_end);
CREATE INDEX idx_quick_actions_role ON quick_actions USING GIN(required_roles);
CREATE INDEX idx_dashboard_metrics_date ON dashboard_metrics(metric_date DESC, metric_type);
CREATE INDEX idx_app_health_status ON application_health_status(current_status, last_check_at);
CREATE INDEX idx_search_vector ON search_index USING GIN(search_vector);
CREATE INDEX idx_search_content_type ON search_index(content_type, last_modified DESC);
CREATE INDEX idx_widget_cache_expiry ON widget_data_cache(expires_at);
CREATE INDEX idx_widget_cache_user_widget ON widget_data_cache(user_id, widget_id);

-- Row Level Security
ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_announcement_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_health_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_data_cache ENABLE ROW LEVEL SECURITY;

-- Access policies
CREATE POLICY "Users can manage own preferences" ON user_dashboard_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view widgets they have access to" ON dashboard_widgets
  FOR SELECT USING (
    CASE 
      WHEN required_roles = ARRAY[]::TEXT[] THEN true
      ELSE auth.jwt() ->> 'role' = ANY(required_roles)
    END
  );

CREATE POLICY "Users can view own activity" ON user_activity_log
  FOR SELECT USING (
    user_id = auth.uid() 
    OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Users can insert own activity" ON user_activity_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view announcements targeted to them" ON platform_announcements
  FOR SELECT USING (
    is_active = true
    AND (display_start IS NULL OR display_start <= NOW())
    AND (display_end IS NULL OR display_end >= NOW())
    AND (
      target_roles = ARRAY[]::TEXT[] 
      OR auth.jwt() ->> 'role' = ANY(target_roles)
      OR auth.uid() = ANY(target_specific_users)
    )
  );

CREATE POLICY "Users can manage own dismissals" ON user_announcement_dismissals
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view quick actions they have access to" ON quick_actions
  FOR SELECT USING (
    is_active = true
    AND (
      required_roles = ARRAY[]::TEXT[] 
      OR auth.jwt() ->> 'role' = ANY(required_roles)
    )
  );

CREATE POLICY "Managers can view metrics" ON dashboard_metrics
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

CREATE POLICY "Users can view app health" ON application_health_status
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Users can search accessible content" ON search_index
  FOR SELECT USING (
    CASE 
      WHEN required_roles = ARRAY[]::TEXT[] THEN true
      ELSE auth.jwt() ->> 'role' = ANY(required_roles)
    END
  );

CREATE POLICY "Users can access own widget cache" ON widget_data_cache
  FOR ALL USING (user_id = auth.uid());

-- Create full-text search trigger
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.content, '') || ' ' ||
    COALESCE(array_to_string(NEW.keywords, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER search_vector_update
  BEFORE INSERT OR UPDATE ON search_index
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Insert default widgets
INSERT INTO dashboard_widgets (widget_id, display_name, description, category, is_system_widget, required_roles) VALUES
('application_launcher', 'Application Launcher', 'Launch any platform application', 'application', true, ARRAY['staff', 'manager', 'superadmin']),
('notifications_center', 'Notifications', 'View and manage notifications', 'communication', true, ARRAY['staff', 'manager', 'superadmin']),
('quick_actions', 'Quick Actions', 'Frequently used actions and shortcuts', 'action', false, ARRAY['staff', 'manager', 'superadmin']),
('upcoming_meetings', 'Upcoming Meetings', 'Google Calendar integration', 'information', false, ARRAY['staff', 'manager', 'superadmin']),
('recent_documents', 'Recent Documents', 'Google Drive recent files', 'information', false, ARRAY['staff', 'manager', 'superadmin']),
('team_activity', 'Team Activity', 'Recent team member activities', 'communication', false, ARRAY['manager', 'superadmin']),
('pending_approvals', 'Pending Approvals', 'Items requiring approval', 'action', false, ARRAY['manager', 'superadmin']),
('help_center', 'Help & Support', 'Access help and support resources', 'information', true, ARRAY['staff', 'manager', 'superadmin']),
('system_health', 'System Health', 'Monitor application status and performance', 'information', false, ARRAY['superadmin']);

-- Insert default quick actions
INSERT INTO quick_actions (action_id, display_name, description, icon_name, action_type, action_target, required_roles) VALUES
('new_support_ticket', 'New Support Ticket', 'Create a new IT support ticket', 'plus', 'app_launch', 'staff', ARRAY['staff', 'manager', 'superadmin']),
('request_time_off', 'Request Time Off', 'Submit a time off request', 'calendar', 'app_launch', 'staff', ARRAY['staff', 'manager', 'superadmin']),
('access_help_center', 'Help Center', 'Access help articles and guides', 'help-circle', 'app_launch', 'help', ARRAY['staff', 'manager', 'superadmin']),
('system_status', 'System Status', 'View platform health status', 'activity', 'modal_form', 'system_status', ARRAY['manager', 'superadmin']),
('create_announcement', 'Create Announcement', 'Post a platform-wide announcement', 'megaphone', 'modal_form', 'create_announcement', ARRAY['manager', 'superadmin']),
('view_analytics', 'View Analytics', 'Access platform usage analytics', 'bar-chart', 'app_launch', 'analytics', ARRAY['manager', 'superadmin']);


-- Migration: 2025_01_11_create_integration_monitoring_tables.sql
-- ==========================================

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


-- Migration: 2025_01_11_create_platform_entrypoint_dashboard_tables.sql
-- ==========================================

-- Platform Entrypoint Dashboard - Database Schema Migration
-- Creates all tables for the centralized platform entry point and dashboard system
-- This is separate from the existing "Platform Dashboard" - this is the main homepage/entry point

-- User dashboard customization
CREATE TABLE user_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Layout preferences
  layout_columns INTEGER DEFAULT 3 CHECK (layout_columns BETWEEN 1 AND 4),
  widget_arrangement JSONB DEFAULT '[]'::jsonb, -- [{widget_id, position, size}]
  theme_preference VARCHAR(20) DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  
  -- Content preferences
  show_weather BOOLEAN DEFAULT true,
  show_team_activity BOOLEAN DEFAULT true,
  show_recent_documents BOOLEAN DEFAULT true,
  show_upcoming_meetings BOOLEAN DEFAULT true,
  
  -- Notification preferences
  desktop_notifications BOOLEAN DEFAULT true,
  notification_sound BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '18:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  -- Quick actions
  pinned_applications TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_quick_actions JSONB DEFAULT '[]'::jsonb,
  
  UNIQUE(user_id)
);

-- Dashboard widgets registry
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Widget identification
  widget_id VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Widget metadata
  category VARCHAR(50) NOT NULL CHECK (category IN ('application', 'information', 'action', 'communication')),
  icon_url TEXT,
  
  -- Widget behavior
  supports_resize BOOLEAN DEFAULT true,
  min_width INTEGER DEFAULT 1,
  min_height INTEGER DEFAULT 1,
  max_width INTEGER DEFAULT 4,
  max_height INTEGER DEFAULT 4,
  
  -- Widget content source
  source_application VARCHAR(100) REFERENCES platform_applications(app_name),
  data_endpoint TEXT, -- API endpoint for widget data
  refresh_interval_seconds INTEGER DEFAULT 300, -- 5 minutes default
  
  -- Access control
  required_permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  required_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Widget availability
  is_active BOOLEAN DEFAULT true,
  is_system_widget BOOLEAN DEFAULT false, -- Cannot be removed by users
  
  CONSTRAINT valid_category CHECK (category IN ('application', 'information', 'action', 'communication'))
);

-- User activity tracking for intelligent suggestions
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('app_launch', 'widget_interaction', 'quick_action', 'dashboard_view', 'search')),
  target_app VARCHAR(100),
  target_widget VARCHAR(100),
  target_action VARCHAR(100),
  
  -- Context
  session_id VARCHAR(100),
  time_spent_seconds INTEGER,
  interaction_count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Analytics metadata
  user_agent TEXT,
  ip_address INET,
  location_context VARCHAR(100),
  
  CONSTRAINT valid_activity_type CHECK (activity_type IN ('app_launch', 'widget_interaction', 'quick_action', 'dashboard_view', 'search'))
);

-- Platform notifications and announcements
CREATE TABLE platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Announcement content
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  announcement_type VARCHAR(50) DEFAULT 'info' CHECK (announcement_type IN ('info', 'warning', 'urgent', 'maintenance')),
  
  -- Display settings
  priority INTEGER DEFAULT 0, -- Higher numbers show first
  banner_color VARCHAR(20) DEFAULT 'blue',
  show_icon BOOLEAN DEFAULT true,
  
  -- Targeting
  target_roles TEXT[] DEFAULT ARRAY[]::TEXT[], -- Empty = all users
  target_locations TEXT[] DEFAULT ARRAY[]::TEXT[], -- Empty = all locations
  target_specific_users UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Scheduling
