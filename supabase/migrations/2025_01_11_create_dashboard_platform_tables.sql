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