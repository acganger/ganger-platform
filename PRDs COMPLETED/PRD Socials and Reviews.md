# Socials & Reviews Management - Ganger Platform Standard
*AI-powered social media monitoring and review management for multi-location dermatology practice*

## 📋 Document Information
- **Application Name**: Socials & Reviews Management
- **Priority**: High
- **Development Timeline**: 5-6 weeks
- **Dependencies**: @ganger/ui, @ganger/auth, @ganger/db, @ganger/integrations, @ganger/ai
- **Integration Requirements**: Google Business API, Facebook/Instagram API, TikTok API, LinkedIn API, OpenAI API

---

## 🎯 Product Overview

### **Purpose Statement**
Empower the marketing manager to efficiently monitor competitor social media, manage Google Business reviews across three locations, and maintain fresh online presence through AI-assisted content creation and review response automation.

### **Target Users**
- **Primary**: Marketing Manager (part-time role requiring maximum efficiency)
- **Secondary**: Practice Managers for location-specific oversight
- **Tertiary**: Superadmin for system configuration and analytics

### **Success Metrics**
- 80% reduction in time spent monitoring competitor content
- 95% faster review response time with AI assistance
- 100% review response rate within 24 hours
- 3x increase in engaging social content publication
- Complete Google Business profile freshness across all locations

---

## 🏗️ Technical Architecture

### **Shared Infrastructure (Standard)**
```yaml
Frontend: Next.js 14+ with TypeScript
Backend: Next.js API routes + Supabase Edge Functions
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Cloudflare Workers (with static asset support)
Styling: Tailwind CSS + Ganger Design System
Real-time: Supabase subscriptions
File Storage: Supabase Storage with CDN
```

### **Required Shared Packages**
```typescript
import { 
  AppLayout, PageHeader, DataTable, Button, Card, 
  StatCard, FormField, LoadingSpinner, SuccessToast 
} from '@ganger/ui';
import { useAuth, withAuth, requireRole } from '@ganger/auth';
import { db, User, AuditLog } from '@ganger/db';
import { 
  GoogleBusinessClient, FacebookClient, InstagramClient, 
  TikTokClient, LinkedInClient, OpenAIClient, SlackClient 
} from '@ganger/integrations';
import { analytics, notifications } from '@ganger/utils';
```

### **App-Specific Technology**
- **AI Content Generation**: OpenAI GPT-4 for review responses and content adaptation
- **Social Media APIs**: Facebook Graph API, Instagram Basic Display, TikTok Business API
- **Google Business API**: Review management and profile updates
- **Image Processing**: Sharp.js for content image optimization
- **Sentiment Analysis**: OpenAI for review sentiment scoring
- **Content Similarity Detection**: Vector embeddings for "GD it" feature
- **Scheduling System**: Cron-based social monitoring and automated tasks

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard)**
```typescript
type UserRole = 'staff' | 'manager' | 'superadmin' | 'marketing_manager';

interface SocialsPermissions {
  viewReviews: UserRole[];
  respondToReviews: UserRole[];
  publishContent: UserRole[];
  manageMonitoring: UserRole[];
  viewAnalytics: UserRole[];
  systemConfig: UserRole[];
}

const permissions: SocialsPermissions = {
  viewReviews: ['marketing_manager', 'manager', 'superadmin'],
  respondToReviews: ['marketing_manager', 'superadmin'],
  publishContent: ['marketing_manager', 'superadmin'],
  manageMonitoring: ['marketing_manager', 'superadmin'],
  viewAnalytics: ['marketing_manager', 'manager', 'superadmin'],
  systemConfig: ['superadmin']
};
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com (Google OAuth)
- **Location-Based Access**: Marketing manager has access to all 3 locations
- **Cross-Platform Integration**: Secure token management for social media APIs
- **AI Usage Limits**: Rate limiting for OpenAI API calls

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
-- Standard tables (automatically available)
users, user_roles, user_permissions, audit_logs,
locations, location_configs, location_staff,
notifications, notification_preferences,
file_uploads, document_storage
```

### **App-Specific Tables**
```sql
-- Google Business review management
CREATE TABLE google_business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  
  -- Google Business data
  google_review_id TEXT UNIQUE NOT NULL,
  google_place_id TEXT NOT NULL,
  reviewer_name TEXT,
  reviewer_profile_photo_url TEXT,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_language TEXT DEFAULT 'en',
  
  -- Timing
  review_date TIMESTAMPTZ NOT NULL,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- AI analysis
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
  sentiment_category TEXT CHECK (sentiment_category IN ('positive', 'neutral', 'negative')),
  key_topics TEXT[], -- Extracted themes
  urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
  
  -- Response management
  response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'draft', 'approved', 'published', 'not_needed')),
  ai_suggested_response TEXT,
  final_response TEXT,
  response_approved_by UUID REFERENCES users(id),
  response_approved_at TIMESTAMPTZ,
  response_published_at TIMESTAMPTZ,
  
  -- Flags and notes
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media accounts to monitor
CREATE TABLE social_accounts_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Account identification
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'youtube')),
  account_handle TEXT NOT NULL, -- @username or handle
  account_name TEXT, -- Display name
  account_url TEXT NOT NULL,
  platform_account_id TEXT, -- API ID if available
  
  -- Monitoring settings
  is_active BOOLEAN DEFAULT TRUE,
  monitor_frequency TEXT DEFAULT 'hourly' CHECK (monitor_frequency IN ('hourly', 'daily', 'weekly')),
  engagement_threshold INTEGER DEFAULT 100, -- Posts above this threshold flagged
  
  -- Account metadata
  follower_count INTEGER,
  account_type TEXT, -- 'competitor', 'inspiration', 'industry_leader'
  speciality_tags TEXT[], -- 'dermatology', 'skincare', 'medical_spa', etc.
  
  -- Monitoring status
  last_checked_at TIMESTAMPTZ,
  last_successful_check TIMESTAMPTZ,
  check_error_count INTEGER DEFAULT 0,
  
  -- Added by user
  added_by UUID REFERENCES users(id) NOT NULL,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(platform, account_handle)
);

-- Collected social media posts
CREATE TABLE social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitoring_account_id UUID REFERENCES social_accounts_monitoring(id) NOT NULL,
  
  -- Post identification
  platform_post_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  post_url TEXT NOT NULL,
  
  -- Content
  caption TEXT,
  hashtags TEXT[],
  media_urls TEXT[], -- Images/videos
  media_types TEXT[], -- 'image', 'video', 'carousel'
  
  -- Engagement metrics
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  total_engagement INTEGER GENERATED ALWAYS AS (likes_count + comments_count + shares_count) STORED,
  
  -- Performance analysis
  engagement_rate DECIMAL(5,2), -- Engagement / followers * 100
  is_high_performing BOOLEAN DEFAULT FALSE,
  performance_score INTEGER, -- Calculated score 1-100
  
  -- AI analysis
  content_topics TEXT[],
  content_sentiment TEXT,
  relevance_score DECIMAL(3,2), -- How relevant to dermatology (0-1)
  
  -- Adaptation tracking
  is_favorited BOOLEAN DEFAULT FALSE,
  adaptation_status TEXT DEFAULT 'none' CHECK (adaptation_status IN ('none', 'queued', 'adapting', 'adapted', 'published')),
  adapted_content_id UUID REFERENCES adapted_content(id),
  
  -- Timing
  posted_at TIMESTAMPTZ NOT NULL,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(platform, platform_post_id)
);

-- AI-adapted content ready for publication
CREATE TABLE adapted_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_post_id UUID REFERENCES social_media_posts(id),
  
  -- Adapted content
  adapted_caption TEXT NOT NULL,
  adapted_hashtags TEXT[],
  suggested_media_urls TEXT[], -- Links to adapted/selected images
  
  -- Target platforms for publication
  target_platforms TEXT[] DEFAULT '{"instagram","facebook"}',
  target_locations TEXT[], -- Which GD locations to post for
  
  -- Content strategy
  adaptation_style TEXT, -- 'educational', 'promotional', 'behind_scenes', 'testimonial'
  call_to_action TEXT,
  dermatology_focus TEXT[], -- 'acne', 'anti-aging', 'skin-cancer', 'cosmetic'
  
  -- Approval workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready_for_review', 'approved', 'rejected', 'published')),
  created_by UUID REFERENCES users(id) NOT NULL,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- Scheduling
  scheduled_publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  publish_platforms TEXT[], -- Where actually published
  
  -- Performance tracking
  post_urls TEXT[], -- URLs of published posts
  engagement_summary JSONB, -- Combined metrics from all platforms
  
  -- Notes and feedback
  creation_notes TEXT,
  approval_notes TEXT,
  performance_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Google Business profile management
CREATE TABLE google_business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) UNIQUE NOT NULL,
  
  -- Google Business data
  google_place_id TEXT UNIQUE NOT NULL,
  google_account_id TEXT,
  
  -- Profile information
  business_name TEXT NOT NULL,
  description TEXT,
  phone_number TEXT,
  website_url TEXT,
  
  -- Address information
  street_address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- Hours of operation (JSON)
  business_hours JSONB,
  special_hours JSONB, -- Holidays, temporary changes
  
  -- Profile status
  verification_status TEXT,
  profile_completeness_score INTEGER, -- 0-100
  last_updated_at TIMESTAMPTZ,
  
  -- Review summary
  average_rating DECIMAL(2,1),
  total_review_count INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2), -- Percentage of reviews responded to
  
  -- Photo management
  profile_photos TEXT[], -- URLs to current photos
  cover_photo_url TEXT,
  logo_url TEXT,
  
  -- Auto-update settings
  auto_sync_enabled BOOLEAN DEFAULT TRUE,
  sync_frequency TEXT DEFAULT 'daily',
  last_sync_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics and reporting data
CREATE TABLE social_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time period
  date_period DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Scope
  location_id UUID REFERENCES locations(id), -- NULL for all locations
  platform TEXT, -- NULL for all platforms
  
  -- Review metrics
  reviews_received INTEGER DEFAULT 0,
  reviews_responded INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1),
  response_time_hours DECIMAL(5,1), -- Average response time
  
  -- Social monitoring metrics
  posts_discovered INTEGER DEFAULT 0,
  high_performing_posts INTEGER DEFAULT 0,
  content_adapted INTEGER DEFAULT 0,
  content_published INTEGER DEFAULT 0,
  
  -- AI usage metrics
  ai_responses_generated INTEGER DEFAULT 0,
  ai_content_adaptations INTEGER DEFAULT 0,
  ai_cost_dollars DECIMAL(8,2) DEFAULT 0,
  
  -- Engagement metrics
  total_engagement INTEGER DEFAULT 0,
  follower_growth INTEGER DEFAULT 0,
  reach_growth DECIMAL(8,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date_period, period_type, location_id, platform)
);

-- System configuration and API credentials
CREATE TABLE social_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Configuration key
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  
  -- Metadata
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE, -- Encrypted values
  last_updated_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated)**
```typescript
// CRUD operations follow standard patterns
GET    /api/reviews                      // List reviews with filters
POST   /api/reviews                      // Manual review entry
GET    /api/reviews/[id]                 // Get specific review
PUT    /api/reviews/[id]                 // Update review response

GET    /api/social-posts                 // List discovered posts
GET    /api/adapted-content              // List adapted content
POST   /api/adapted-content              // Create new adaptation

// Real-time subscriptions
WS     /api/reviews/subscribe             // Live review updates
WS     /api/social-posts/subscribe        // Live post discoveries
```

### **App-Specific Endpoints**
```typescript
// Review management
POST   /api/reviews/generate-response     // AI-generate review response
POST   /api/reviews/approve-response      // Approve and publish response
POST   /api/reviews/bulk-respond          // Bulk response operations
GET    /api/reviews/analytics             // Review performance analytics

// Social media monitoring
POST   /api/social/accounts/add           // Add account to monitor
DELETE /api/social/accounts/[id]          // Remove monitoring
POST   /api/social/sync/[account-id]      // Force sync account posts
GET    /api/social/trending               // Get high-performing posts

// Content adaptation ("GD it" feature)
POST   /api/content/adapt                 // "GD it" - adapt post for GD
PUT    /api/content/[id]/approve          // Approve adapted content
POST   /api/content/[id]/schedule         // Schedule for publication
POST   /api/content/[id]/publish          // Publish immediately

// Google Business management
GET    /api/google-business/profiles      // List all location profiles
PUT    /api/google-business/[id]/update   // Update profile information
POST   /api/google-business/sync          // Sync all profiles and reviews
GET    /api/google-business/insights      // Get profile insights

// Analytics and reporting
GET    /api/analytics/dashboard           // Main dashboard metrics
GET    /api/analytics/reviews             // Review trend analysis
GET    /api/analytics/social              // Social monitoring performance
GET    /api/analytics/content             // Content adaptation success rates
POST   /api/analytics/export              // Export reports

// AI and automation
POST   /api/ai/analyze-sentiment          // Analyze review sentiment
POST   /api/ai/suggest-hashtags           // Suggest relevant hashtags
POST   /api/ai/optimize-content           // Optimize content for engagement
GET    /api/ai/usage-stats                // AI API usage and costs
```

---

## 📱 User Experience

### **Primary Workflows**

#### **1. Daily Review Management** (5 minutes)
1. **Dashboard Overview**: See pending reviews across all locations
2. **AI Response Generation**: Click "Generate Response" for each review
3. **Quick Approval**: Review, edit, and approve AI-generated responses
4. **Bulk Publishing**: Publish approved responses with one click
5. **Analytics Check**: Review performance metrics and trends

#### **2. Social Media Monitoring** (10 minutes)
1. **High-Performance Feed**: View posts above engagement threshold
2. **Platform Filtering**: Focus on specific platforms (Instagram, TikTok)
3. **Relevance Scoring**: See AI-ranked posts by dermatology relevance
4. **"GD It" Action**: Click to adapt interesting posts for Ganger Dermatology
5. **Content Queue**: Review and schedule adapted content

#### **3. Content Adaptation Workflow** (15 minutes)
1. **Source Selection**: Choose high-performing post from competitors
2. **AI Adaptation**: System generates GD-specific version with proper hashtags
3. **Content Review**: Marketing manager reviews and edits adapted content
4. **Multi-Platform Scheduling**: Schedule for Instagram, Facebook, LinkedIn
5. **Performance Tracking**: Monitor engagement on published content

### **Key Features**

#### **"GD It" Button**
- **Purpose**: One-click adaptation of competitor content for Ganger Dermatology
- **AI Processing**: Analyzes original post and creates dermatology-focused version
- **Output**: New caption, hashtags, and suggested images that align with GD brand
- **Approval Flow**: Marketing manager reviews and approves before publication

#### **Smart Review Response**
- **AI Generation**: Creates personalized responses based on review sentiment and content
- **Brand Consistency**: Maintains professional, empathetic tone across all responses
- **Template Learning**: Improves over time based on approved responses
- **Urgent Flagging**: Automatically prioritizes negative reviews for immediate attention

#### **Performance Intelligence**
- **Engagement Tracking**: Monitors likes, comments, shares across all monitored accounts
- **Trend Detection**: Identifies viral content in dermatology/healthcare space
- **Relevance Scoring**: AI rates how applicable content is to Ganger Dermatology
- **ROI Measurement**: Tracks performance of adapted content vs original posts

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] Google Business API integration functional for all 3 locations
- [ ] AI review response generation with >80% acceptance rate
- [ ] Social media monitoring operational for 5+ competitor accounts
- [ ] "GD it" content adaptation feature working end-to-end
- [ ] Marketing manager training completed and workflow optimized

### **Success Metrics (3 months)**
- **Review Management**: 100% response rate within 24 hours, 4.5+ average rating maintained
- **Content Efficiency**: 3x increase in social content publication frequency
- **Time Savings**: 80% reduction in time spent on social media monitoring
- **Engagement Growth**: 25% increase in average engagement on published content
- **Profile Optimization**: 95%+ completeness score on all Google Business profiles

### **Success Metrics (6 months)**
- **Competitive Intelligence**: Identification and adaptation of 50+ high-performing posts
- **Review Response Quality**: >90% positive sentiment on AI-assisted responses
- **Cross-Platform Growth**: 15% increase in followers across all platforms
- **Cost Efficiency**: ROI-positive AI usage with measurable time and quality benefits
- **Practice Growth**: Measurable increase in appointment bookings from improved online presence

---

*This Socials & Reviews Management system transforms a part-time marketing role into a highly efficient, AI-powered operation that maintains consistent online presence, responds to reviews promptly, and creates engaging content by intelligently adapting successful competitor strategies.*