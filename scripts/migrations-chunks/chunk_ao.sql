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
CREATE INDEX idx_user_activity_type_time ON user_activity_log(activity_type, created_at DESC);
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
('help_center', 'Help & Support', 'Access help and support resources', 'information', true, ARRAY['staff', 'manager', 'superadmin']);

-- Insert default quick actions
INSERT INTO quick_actions (action_id, display_name, description, icon_name, action_type, action_target, required_roles) VALUES
('new_support_ticket', 'New Support Ticket', 'Create a new IT support ticket', 'plus', 'app_launch', 'staff', ARRAY['staff', 'manager', 'superadmin']),
('request_time_off', 'Request Time Off', 'Submit a time off request', 'calendar', 'app_launch', 'staff', ARRAY['staff', 'manager', 'superadmin']),
('access_help_center', 'Help Center', 'Access help articles and guides', 'help-circle', 'app_launch', 'help', ARRAY['staff', 'manager', 'superadmin']),
('system_status', 'System Status', 'View platform health status', 'activity', 'modal_form', 'system_status', ARRAY['manager', 'superadmin']);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_user_dashboard_preferences_updated_at
  BEFORE UPDATE ON user_dashboard_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_announcements_updated_at
  BEFORE UPDATE ON platform_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quick_actions_updated_at
  BEFORE UPDATE ON quick_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_health_status_updated_at
  BEFORE UPDATE ON application_health_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Migration: 2025_01_11_create_socials_reviews_tables.sql
-- ==========================================

-- Socials & Reviews Management - Database Schema
-- Migration: 2025_01_11_create_socials_reviews_tables.sql
-- Purpose: Create all tables for Google Business review management and social media monitoring

-- Google Business profiles tracking
CREATE TABLE google_business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  location_id UUID REFERENCES locations(id),
  address TEXT,
  phone TEXT,
  website TEXT,
  google_maps_url TEXT,
  average_rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Google Business reviews
CREATE TABLE google_business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_review_id TEXT UNIQUE NOT NULL,
  profile_id UUID NOT NULL REFERENCES google_business_profiles(id),
  reviewer_name TEXT,
  reviewer_profile_photo_url TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  review_date TIMESTAMPTZ NOT NULL,
  
  -- AI-generated analysis
  sentiment_category TEXT CHECK (sentiment_category IN ('positive', 'negative', 'neutral')),
  sentiment_score DECIMAL(3,2), -- -1 to 1
  urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
  key_topics TEXT[],
  
  -- Response management
  response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'draft', 'published', 'not_needed')),
  ai_generated_response TEXT,
  final_response TEXT,
  response_published_at TIMESTAMPTZ,
  response_published_by UUID REFERENCES users(id),
  
  -- Processing metadata
  processed_at TIMESTAMPTZ,
  last_analyzed_at TIMESTAMPTZ,
  sync_source TEXT DEFAULT 'google_api',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media accounts monitoring
CREATE TABLE social_account_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'youtube')),
  account_username TEXT NOT NULL,
  account_display_name TEXT,
  account_url TEXT,
  account_id TEXT,
  
  -- Monitoring configuration
  is_active BOOLEAN DEFAULT TRUE,
  monitoring_enabled BOOLEAN DEFAULT TRUE,
  auto_adaptation_enabled BOOLEAN DEFAULT FALSE,
  
  -- Account metrics
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4), -- 0.0000 to 1.0000
  
  -- API configuration
  api_access_token TEXT,
  api_token_expires_at TIMESTAMPTZ,
  api_last_error TEXT,
  
  -- Processing metadata
  last_monitored_at TIMESTAMPTZ,
  last_successful_sync TIMESTAMPTZ,
  sync_frequency_hours INTEGER DEFAULT 6,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(platform, account_username)
);

-- Social media posts
CREATE TABLE social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_post_id TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES social_account_monitoring(id),
  platform TEXT NOT NULL,
  
  -- Post content
  caption TEXT,
  hashtags TEXT[],
  media_urls TEXT[],
  media_types TEXT[], -- 'image', 'video', 'carousel'
  post_url TEXT,
  
  -- Engagement metrics
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- AI analysis
  content_topics TEXT[],
  relevance_score DECIMAL(3,2), -- 0 to 1
  is_high_performing BOOLEAN DEFAULT FALSE,
  performance_threshold_met BOOLEAN DEFAULT FALSE,
  
  -- Adaptation tracking
  adaptation_status TEXT DEFAULT 'not_adapted' CHECK (adaptation_status IN ('not_adapted', 'queued', 'adapted', 'published')),
  adapted_content_id UUID,
  
  -- Post metadata
  posted_at TIMESTAMPTZ NOT NULL,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_analyzed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(platform, platform_post_id)
);

-- Adapted content for Ganger Dermatology
CREATE TABLE adapted_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_post_id UUID REFERENCES social_media_posts(id),
  
  -- Content adaptation
  adapted_caption TEXT NOT NULL,
  adapted_hashtags TEXT[],
  suggested_media_urls TEXT[],
  call_to_action TEXT,
  target_platforms TEXT[] NOT NULL,
  
  -- AI generation metadata
  adaptation_prompt TEXT,
  ai_model_used TEXT DEFAULT 'gpt-4',
  adaptation_confidence DECIMAL(3,2), -- 0 to 1
  
  -- Content approval
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Publishing
  publishing_status TEXT DEFAULT 'draft' CHECK (publishing_status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_post_urls JSONB,
  
  -- Performance tracking
  published_performance JSONB,
  roi_metrics JSONB,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content adaptation rules and preferences
CREATE TABLE content_adaptation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('keyword_filter', 'brand_guideline', 'tone_adjustment', 'cta_template')),
  
  -- Rule configuration
  rule_parameters JSONB NOT NULL,
  target_platforms TEXT[],
  content_categories TEXT[],
  
  -- Rule application
  is_active BOOLEAN DEFAULT TRUE,
  priority_order INTEGER DEFAULT 100,
  auto_apply BOOLEAN DEFAULT FALSE,
  
  -- Effectiveness tracking
  application_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  last_used_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI response templates for reviews
CREATE TABLE review_response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_category TEXT NOT NULL CHECK (template_category IN ('positive', 'negative', 'neutral', 'complaint', 'compliment')),
  
  -- Template content
  template_text TEXT NOT NULL,
  template_variables TEXT[], -- ['customer_name', 'service_type', etc.]
  
  -- Usage rules
  rating_range_min INTEGER CHECK (rating_range_min BETWEEN 1 AND 5),
  rating_range_max INTEGER CHECK (rating_range_max BETWEEN 1 AND 5),
  keyword_triggers TEXT[],
  topic_triggers TEXT[],
  
  -- Template effectiveness
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  customer_satisfaction_score DECIMAL(3,2),
  
  -- Template status
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media analytics aggregation
CREATE TABLE social_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analytics_date DATE NOT NULL,
  
  -- Review metrics
  new_reviews_count INTEGER DEFAULT 0,
  average_daily_rating DECIMAL(3,2),
  positive_reviews_count INTEGER DEFAULT 0,
  negative_reviews_count INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2),
  average_response_time_hours DECIMAL(8,2),
  
  -- Social media metrics
  high_performing_posts_count INTEGER DEFAULT 0,
  content_adapted_count INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  follower_growth INTEGER DEFAULT 0,
  
  -- Content generation metrics
  ai_responses_generated INTEGER DEFAULT 0,
  ai_content_adapted INTEGER DEFAULT 0,
  content_approval_rate DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(analytics_date)
);

-- Performance indexes
CREATE INDEX idx_business_reviews_profile ON google_business_reviews(profile_id, review_date DESC);
CREATE INDEX idx_business_reviews_status ON google_business_reviews(response_status);
CREATE INDEX idx_business_reviews_sentiment ON google_business_reviews(sentiment_category, urgency_level);
CREATE INDEX idx_social_posts_account ON social_media_posts(account_id, posted_at DESC);
CREATE INDEX idx_social_posts_performance ON social_media_posts(is_high_performing, platform);
CREATE INDEX idx_adapted_content_status ON adapted_content(approval_status, publishing_status);
CREATE INDEX idx_social_analytics_date ON social_analytics_daily(analytics_date DESC);

-- Row Level Security policies
ALTER TABLE google_business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_account_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE adapted_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_adaptation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Access policies
CREATE POLICY "Users can view business profiles" ON google_business_profiles
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Users can view reviews" ON google_business_reviews
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Managers can manage reviews" ON google_business_reviews
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

CREATE POLICY "Users can view social content" ON social_media_posts
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Managers can manage adapted content" ON adapted_content
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

CREATE POLICY "Managers can view analytics" ON social_analytics_daily
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

CREATE POLICY "Staff can view social accounts" ON social_account_monitoring
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Managers can manage social accounts" ON social_account_monitoring
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

CREATE POLICY "Managers can manage adaptation rules" ON content_adaptation_rules
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

CREATE POLICY "Staff can view response templates" ON review_response_templates
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Managers can manage response templates" ON review_response_templates
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

-- Database functions for advanced queries
CREATE OR REPLACE FUNCTION calculate_compliance_rate()
RETURNS DECIMAL AS $$
DECLARE
  total_reviews INTEGER;
  responded_reviews INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_reviews FROM google_business_reviews;
  SELECT COUNT(*) INTO responded_reviews FROM google_business_reviews WHERE response_status IN ('published', 'not_needed');
  
  IF total_reviews = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (responded_reviews::DECIMAL / total_reviews::DECIMAL) * 100;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_database_performance_metrics(time_period TEXT)
RETURNS TABLE (
  total_queries INTEGER,
  slow_queries INTEGER,
  avg_response_time DECIMAL,
  connection_pool_usage DECIMAL
) AS $$
BEGIN
  -- Mock implementation for development
  -- In production, this would query actual database performance metrics
  RETURN QUERY SELECT 
    1000 as total_queries,
    5 as slow_queries,
    45.5 as avg_response_time,
    75.0 as connection_pool_usage;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_job_execution_history(p_limit INTEGER)
RETURNS TABLE (
  execution_time TIMESTAMPTZ,
  success BOOLEAN,
  duration INTEGER
) AS $$
BEGIN
  -- Mock implementation for development
  -- In production, this would query actual job execution logs
  RETURN QUERY SELECT 
    NOW() - INTERVAL '1 hour' as execution_time,
    true as success,
    1500 as duration
  FROM generate_series(1, p_limit);
END;
$$ LANGUAGE plpgsql;

-- Automated triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_google_business_profiles_updated_at
  BEFORE UPDATE ON google_business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_business_reviews_updated_at
  BEFORE UPDATE ON google_business_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_account_monitoring_updated_at
  BEFORE UPDATE ON social_account_monitoring
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_media_posts_updated_at
  BEFORE UPDATE ON social_media_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adapted_content_updated_at
  BEFORE UPDATE ON adapted_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_adaptation_rules_updated_at
  BEFORE UPDATE ON content_adaptation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_response_templates_updated_at
  BEFORE UPDATE ON review_response_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE google_business_profiles IS 'Tracks Google Business Profile information for all Ganger Dermatology locations';
COMMENT ON TABLE google_business_reviews IS 'Stores Google Business reviews with AI sentiment analysis and response management';
COMMENT ON TABLE social_account_monitoring IS 'Configuration for monitoring external social media accounts';
COMMENT ON TABLE social_media_posts IS 'High-performing social media posts discovered through monitoring';
COMMENT ON TABLE adapted_content IS 'AI-generated content adaptations for Ganger Dermatology social media';
COMMENT ON TABLE content_adaptation_rules IS 'Business rules for automated content adaptation';
COMMENT ON TABLE review_response_templates IS 'AI response templates for Google Business reviews';
COMMENT ON TABLE social_analytics_daily IS 'Daily aggregated analytics for reviews and social media performance';


-- Migration: 2025_01_11_create_staff_management_tables.sql
-- ==========================================

-- Staff Management System Database Migration
-- Created: 2025-01-11
-- Purpose: Complete staff management, ticketing, and HR workflow system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================
-- CORE TABLES
-- =====================================

-- 1. Staff User Profiles (Extended User Information)
CREATE TABLE staff_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager', 'admin')),
  location TEXT CHECK (location IN ('Northfield', 'Woodbury', 'Burnsville', 'Multiple')),
  hire_date DATE,
  manager_id UUID REFERENCES staff_user_profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  phone_number TEXT,
  emergency_contact JSONB,
  google_user_data JSONB, -- Cached Google Workspace info
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Staff Form Definitions (Dynamic Form System)
CREATE TABLE staff_form_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  form_schema JSONB NOT NULL, -- JSON Schema for validation
  ui_schema JSONB, -- UI rendering configuration
  workflow_config JSONB, -- Status transitions and approvals
  notification_config JSONB, -- Notification settings
  is_active BOOLEAN DEFAULT TRUE,
  requires_manager_approval BOOLEAN DEFAULT FALSE,
  requires_admin_approval BOOLEAN DEFAULT FALSE,
  auto_assign_to TEXT, -- Email or role to auto-assign
  sla_hours INTEGER, -- Service level agreement in hours
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Staff Tickets (Main Ticket System)
CREATE TABLE staff_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL, -- Human-readable ticket number
  form_type TEXT NOT NULL REFERENCES staff_form_definitions(form_type),
  submitter_id UUID REFERENCES auth.users(id),
  submitter_email TEXT NOT NULL,
  submitter_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'in_progress', 'stalled', 'approved', 'denied', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  location TEXT CHECK (location IN ('Northfield', 'Woodbury', 'Burnsville', 'Multiple')),
  title TEXT NOT NULL CONSTRAINT title_length CHECK (LENGTH(title) <= 200),
  description TEXT CONSTRAINT description_length CHECK (LENGTH(description) <= 2000),
  form_data JSONB NOT NULL DEFAULT '{}', -- Form-specific data
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approval_required BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  impact_level TEXT DEFAULT 'low' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  urgency_level TEXT DEFAULT 'low' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Staff Ticket Comments (Comment System)
CREATE TABLE staff_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES staff_tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_email TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL CONSTRAINT content_length CHECK (LENGTH(content) <= 1000),
  comment_type TEXT DEFAULT 'comment' CHECK (comment_type IN ('comment', 'status_change', 'assignment', 'approval', 'system')),
  is_internal BOOLEAN DEFAULT FALSE, -- Manager-only comments
  mentions TEXT[] DEFAULT ARRAY[]::TEXT[], -- @mentioned users
  previous_status TEXT, -- For status change comments
  new_status TEXT, -- For status change comments
  edited_at TIMESTAMPTZ,
  edited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Staff Attachments (File Management)
CREATE TABLE staff_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES staff_tickets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  file_type TEXT NOT NULL,
  mime_type TEXT,
  storage_path TEXT NOT NULL, -- Supabase storage path
  storage_bucket TEXT DEFAULT 'staff-attachments',
  download_url TEXT, -- Cached download URL
  url_expires_at TIMESTAMPTZ,
  is_image BOOLEAN DEFAULT FALSE,
  thumbnail_path TEXT, -- For image thumbnails
  virus_scan_status TEXT DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'error')),
  virus_scan_result JSONB,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Staff Notifications (Notification System)
CREATE TABLE staff_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES staff_tickets(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('status_change', 'new_comment', 'assignment', 'approval_required', 'approval_decision', 'due_date_reminder', 'escalation', 'mention', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT, -- Deep link to relevant page
  channels TEXT[] DEFAULT ARRAY['in_app'] CHECK (channels <@ ARRAY['in_app', 'email', 'slack', 'sms']),
  delivery_status JSONB DEFAULT '{}', -- Status per channel
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ, -- For delayed delivery
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Staff Analytics (Usage Analytics)
CREATE TABLE staff_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('ticket_created', 'ticket_updated', 'ticket_completed', 'comment_added', 'file_uploaded', 'user_login', 'form_submitted', 'approval_given', 'assignment_changed', 'status_changed')),
  user_id UUID REFERENCES auth.users(id),
  ticket_id UUID REFERENCES staff_tickets(id),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  duration_ms INTEGER, -- For timed events
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================

-- User profiles indexes
CREATE INDEX idx_staff_user_profiles_email ON staff_user_profiles(email);
CREATE INDEX idx_staff_user_profiles_employee_id ON staff_user_profiles(employee_id);
CREATE INDEX idx_staff_user_profiles_role ON staff_user_profiles(role);
CREATE INDEX idx_staff_user_profiles_department ON staff_user_profiles(department);
CREATE INDEX idx_staff_user_profiles_location ON staff_user_profiles(location);
CREATE INDEX idx_staff_user_profiles_manager_id ON staff_user_profiles(manager_id);
CREATE INDEX idx_staff_user_profiles_is_active ON staff_user_profiles(is_active);

-- Tickets indexes
CREATE INDEX idx_staff_tickets_ticket_number ON staff_tickets(ticket_number);
CREATE INDEX idx_staff_tickets_form_type ON staff_tickets(form_type);
CREATE INDEX idx_staff_tickets_submitter ON staff_tickets(submitter_id);
CREATE INDEX idx_staff_tickets_assigned_to ON staff_tickets(assigned_to);
CREATE INDEX idx_staff_tickets_status ON staff_tickets(status);
CREATE INDEX idx_staff_tickets_priority ON staff_tickets(priority);
CREATE INDEX idx_staff_tickets_location ON staff_tickets(location);
CREATE INDEX idx_staff_tickets_created_at ON staff_tickets(created_at DESC);
CREATE INDEX idx_staff_tickets_updated_at ON staff_tickets(updated_at DESC);
CREATE INDEX idx_staff_tickets_due_date ON staff_tickets(due_date);
CREATE INDEX idx_staff_tickets_completed_at ON staff_tickets(completed_at);
CREATE INDEX idx_staff_tickets_tags ON staff_tickets USING GIN (tags);

-- Comments indexes
CREATE INDEX idx_staff_ticket_comments_ticket_id ON staff_ticket_comments(ticket_id);
CREATE INDEX idx_staff_ticket_comments_author ON staff_ticket_comments(author_id);
CREATE INDEX idx_staff_ticket_comments_created_at ON staff_ticket_comments(created_at DESC);
CREATE INDEX idx_staff_ticket_comments_is_internal ON staff_ticket_comments(is_internal);

-- Attachments indexes
CREATE INDEX idx_staff_attachments_ticket_id ON staff_attachments(ticket_id);
CREATE INDEX idx_staff_attachments_uploaded_by ON staff_attachments(uploaded_by);
CREATE INDEX idx_staff_attachments_file_type ON staff_attachments(file_type);
CREATE INDEX idx_staff_attachments_virus_scan_status ON staff_attachments(virus_scan_status);

-- Notifications indexes
CREATE INDEX idx_staff_notifications_user_id ON staff_notifications(user_id);
CREATE INDEX idx_staff_notifications_ticket_id ON staff_notifications(ticket_id);
CREATE INDEX idx_staff_notifications_type ON staff_notifications(type);
CREATE INDEX idx_staff_notifications_read_at ON staff_notifications(read_at);
CREATE INDEX idx_staff_notifications_created_at ON staff_notifications(created_at DESC);
CREATE INDEX idx_staff_notifications_scheduled_for ON staff_notifications(scheduled_for);

-- Analytics indexes
CREATE INDEX idx_staff_analytics_event_type ON staff_analytics(event_type);
CREATE INDEX idx_staff_analytics_user_id ON staff_analytics(user_id);
CREATE INDEX idx_staff_analytics_ticket_id ON staff_analytics(ticket_id);
CREATE INDEX idx_staff_analytics_created_at ON staff_analytics(created_at DESC);

-- =====================================
-- FUNCTIONS AND TRIGGERS
-- =====================================

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    year_prefix TEXT;
    sequence_num INTEGER;
    ticket_num TEXT;
BEGIN
    year_prefix := TO_CHAR(NOW(), 'YY');
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM staff_tickets 
    WHERE ticket_number LIKE year_prefix || '%';
    
    ticket_num := year_prefix || LPAD(sequence_num::TEXT, 4, '0');
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get manager emails for RLS
CREATE OR REPLACE FUNCTION get_manager_emails()
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT email 
        FROM staff_user_profiles 
        WHERE role IN ('manager', 'admin') AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM staff_user_profiles 
        WHERE email = user_email 
        AND role IN ('manager', 'admin') 
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- TRIGGERS
-- =====================================

-- Auto-generate ticket numbers
CREATE TRIGGER set_ticket_number
    BEFORE INSERT ON staff_tickets
    FOR EACH ROW
    WHEN (NEW.ticket_number IS NULL)
