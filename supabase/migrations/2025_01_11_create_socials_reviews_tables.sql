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