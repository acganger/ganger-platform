# Socials & Reviews Management - Backend Development PRD
*Server-side API and Database Implementation for Ganger Platform*

## 📋 Document Information
- **Application Name**: Socials & Reviews Management (Backend)
- **Terminal Assignment**: TERMINAL 2 - BACKEND
- **Priority**: High
- **Development Timeline**: 3-4 weeks
- **Dependencies**: @ganger/db, @ganger/auth/server, @ganger/integrations/server, @ganger/utils/server
- **Integration Requirements**: Google Business API, Social Media APIs, AI Content Services

---

## 🎯 Backend Scope

### **Terminal 2 Responsibilities**
- Database schema and migrations
- API route implementations
- External service integrations (Google Business, social platforms)
- AI content generation and adaptation
- Server-side authentication and authorization
- Background processing for monitoring and analytics
- Data validation and business logic

### **Excluded from Backend Terminal**
- React components and UI (Terminal 1)
- Client-side state management (Terminal 1)
- Frontend form handling (Terminal 1)
- Real-time dashboard interfaces (Terminal 1)

---

## 🏗️ Backend Technology Stack

### **Required Server-Side Packages**
```typescript
// Server-only imports
import { withAuth, getUserFromToken, verifyPermissions } from '@ganger/auth/server';
import { db, DatabaseService } from '@ganger/db';
import { 
  GoogleBusinessClient, SocialMediaClient, OpenAIClient,
  ServerCommunicationService, ServerCacheService 
} from '@ganger/integrations/server';
import { auditLog, validateSocialData } from '@ganger/utils/server';
import type { 
  User, GoogleBusinessReview, SocialMediaPost, AdaptedContent,
  SocialAccountMonitoring, GoogleBusinessProfile
} from '@ganger/types';
```

### **Backend-Specific Technology**
- **Google Business API**: Review monitoring and response publishing
- **Social Media APIs**: Instagram, Facebook, TikTok, LinkedIn content monitoring
- **OpenAI API**: AI-powered content adaptation and review responses
- **Background Jobs**: Automated monitoring and content scraping
- **Caching Layer**: Redis for social media data optimization
- **Sentiment Analysis**: AI-powered review and content analysis

---

## 🗄️ Database Implementation

### **Migration Files**
```sql
-- Migration: 2025_01_11_create_socials_reviews_tables.sql

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
```

---

## 🔌 API Route Implementation

### **Review Management APIs**
```typescript
// pages/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@ganger/auth/server';
import { db } from '@ganger/db';
import { GoogleBusinessClient } from '@ganger/integrations/server';

export const GET = withAuth(async (request: NextRequest, user: User) => {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || 'all';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    // Build query filters
    let whereClause = {};
    
    if (location !== 'all') {
      whereClause.profile = {
        location_id: location
      };
    }
    
    if (status !== 'all') {
      whereClause.response_status = status;
    }

    const [reviews, total] = await Promise.all([
      db.google_business_reviews.findMany({
        where: whereClause,
        include: {
          profile: {
            include: {
              location: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { urgency_level: 'desc' },
          { review_date: 'desc' }
        ]
      }),
      db.google_business_reviews.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: reviews,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['staff', 'manager', 'superadmin'] });

// pages/api/reviews/generate-response/route.ts
export const POST = withAuth(async (request: NextRequest, user: User) => {
  try {
    const { reviewId } = await request.json();

    // Get review details
    const review = await db.google_business_reviews.findUnique({
      where: { id: reviewId },
      include: {
        profile: {
          include: { location: true }
        }
      }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Generate AI response using OpenAI
    const aiClient = new OpenAIClient();
    const responseTemplate = await getOptimalTemplate(review);
    
    const aiResponse = await aiClient.generateReviewResponse({
      reviewText: review.review_text,
      rating: review.rating,
      businessName: review.profile.business_name,
      location: review.profile.location.name,
      template: responseTemplate,
      sentimentCategory: review.sentiment_category,
      keyTopics: review.key_topics
    });

    // Store AI-generated response
    await db.google_business_reviews.update({
      where: { id: reviewId },
      data: {
        ai_generated_response: aiResponse.text,
        response_status: 'draft',
        last_analyzed_at: new Date()
      }
    });

    // Log the generation
    await auditLog({
      action: 'ai_response_generated',
      userId: user.id,
      resourceType: 'google_business_review',
      resourceId: reviewId,
      metadata: {
        confidence: aiResponse.confidence,
        template_used: responseTemplate?.template_name
      }
    });

    return NextResponse.json({
      success: true,
      response: aiResponse.text,
      confidence: aiResponse.confidence,
      template_used: responseTemplate?.template_name
    });
  } catch (error) {
    console.error('AI response generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['staff', 'manager', 'superadmin'] });

async function getOptimalTemplate(review: GoogleBusinessReview) {
  // Find best matching template based on rating and sentiment
  return await db.review_response_templates.findFirst({
    where: {
      is_active: true,
      template_category: review.sentiment_category,
      rating_range_min: { lte: review.rating },
      rating_range_max: { gte: review.rating }
    },
    orderBy: [
      { success_rate: 'desc' },
      { usage_count: 'desc' }
    ]
  });
}
```

### **Social Media Monitoring APIs**
```typescript
// pages/api/social/trending/route.ts
export const GET = withAuth(async (request: NextRequest, user: User) => {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || 'all';
    const sortBy = searchParams.get('sortBy') || 'engagement';
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause = {
      is_high_performing: true,
      posted_at: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    };

    if (platform !== 'all') {
      whereClause.platform = platform;
    }

    let orderBy;
    switch (sortBy) {
      case 'engagement':
        orderBy = [
          { likes_count: 'desc' },
          { comments_count: 'desc' }
        ];
        break;
      case 'recent':
        orderBy = { posted_at: 'desc' };
        break;
      case 'relevance':
        orderBy = { relevance_score: 'desc' };
        break;
      default:
        orderBy = { posted_at: 'desc' };
    }

    const posts = await db.social_media_posts.findMany({
      where: whereClause,
      include: {
        account: true
      },
      take: limit,
      orderBy
    });

    return NextResponse.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Trending posts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending posts' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['staff', 'manager', 'superadmin'] });

// pages/api/content/adapt/route.ts
export const POST = withAuth(async (request: NextRequest, user: User) => {
  try {
    const { originalPostId, targetPlatforms } = await request.json();

    // Get original post
    const originalPost = await db.social_media_posts.findUnique({
      where: { id: originalPostId },
      include: { account: true }
    });

    if (!originalPost) {
      return NextResponse.json(
        { error: 'Original post not found' },
        { status: 404 }
      );
    }

    // Get adaptation rules
    const adaptationRules = await db.content_adaptation_rules.findMany({
      where: {
        is_active: true,
        target_platforms: { hasSome: targetPlatforms }
      },
      orderBy: { priority_order: 'asc' }
    });

    // Generate adapted content using AI
    const aiClient = new OpenAIClient();
    const adaptedContent = await aiClient.adaptContent({
      originalCaption: originalPost.caption,
      originalHashtags: originalPost.hashtags,
      targetPlatforms,
      businessContext: {
        name: 'Ganger Dermatology',
        specialty: 'Dermatology',
        locations: ['Ann Arbor', 'Plymouth', 'Wixom'],
        tone: 'professional, caring, educational'
      },
      adaptationRules
    });

    // Store adapted content
    const adaptedRecord = await db.adapted_content.create({
      data: {
        original_post_id: originalPostId,
        adapted_caption: adaptedContent.caption,
        adapted_hashtags: adaptedContent.hashtags,
        call_to_action: adaptedContent.callToAction,
        target_platforms: targetPlatforms,
        adaptation_prompt: adaptedContent.prompt,
        ai_model_used: 'gpt-4',
        adaptation_confidence: adaptedContent.confidence,
        created_by: user.id
      }
    });

    // Update original post adaptation status
    await db.social_media_posts.update({
      where: { id: originalPostId },
      data: {
        adaptation_status: 'adapted',
        adapted_content_id: adaptedRecord.id
      }
    });

    // Log the adaptation
    await auditLog({
      action: 'content_adapted',
      userId: user.id,
      resourceType: 'social_media_post',
      resourceId: originalPostId,
      metadata: {
        adapted_content_id: adaptedRecord.id,
        target_platforms: targetPlatforms,
        confidence: adaptedContent.confidence
      }
    });

    return NextResponse.json({
      success: true,
      adaptedContent: {
        id: adaptedRecord.id,
        adapted_caption: adaptedRecord.adapted_caption,
        adapted_hashtags: adaptedRecord.adapted_hashtags,
        call_to_action: adaptedRecord.call_to_action,
        confidence: adaptedContent.confidence
      }
    });
  } catch (error) {
    console.error('Content adaptation error:', error);
    return NextResponse.json(
      { error: 'Failed to adapt content' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['staff', 'manager', 'superadmin'] });
```

### **External Service Integration**
```typescript
// packages/integrations/server/google-business-client.ts
import { GoogleBusinessAPI } from 'google-business-api';

export class GoogleBusinessClient {
  private apiClient: GoogleBusinessAPI;

  constructor() {
    this.apiClient = new GoogleBusinessAPI({
      apiKey: process.env.GOOGLE_BUSINESS_API_KEY,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    });
  }

  async syncReviews(profileId?: string): Promise<GoogleBusinessReview[]> {
    try {
      const profiles = profileId 
        ? [{ profile_id: profileId }]
        : await db.google_business_profiles.findMany({
            where: { is_active: true }
          });

      const allReviews: GoogleBusinessReview[] = [];

      for (const profile of profiles) {
        // Get reviews from Google Business API
        const reviews = await this.apiClient.getReviews(profile.profile_id, {
          orderBy: 'updateTime desc',
          pageSize: 50
        });

        for (const review of reviews) {
          // Check if review already exists
          const existingReview = await db.google_business_reviews.findFirst({
            where: { google_review_id: review.reviewId }
          });

          if (!existingReview) {
            // Analyze sentiment using AI
            const sentimentAnalysis = await this.analyzeSentiment(review.comment);
            
            // Create new review record
            const newReview = await db.google_business_reviews.create({
              data: {
                google_review_id: review.reviewId,
                profile_id: profile.id,
                reviewer_name: review.reviewer?.displayName,
                reviewer_profile_photo_url: review.reviewer?.profilePhotoUrl,
                rating: review.starRating,
                review_text: review.comment,
                review_date: new Date(review.createTime),
                sentiment_category: sentimentAnalysis.category,
                sentiment_score: sentimentAnalysis.score,
                urgency_level: this.calculateUrgencyLevel(review, sentimentAnalysis),
                key_topics: sentimentAnalysis.topics,
                processed_at: new Date()
              }
            });

            allReviews.push(newReview);
          }
        }

        // Update profile metrics
        await this.updateProfileMetrics(profile.id);
      }

      return allReviews;
    } catch (error) {
      console.error('Google Business sync error:', error);
      throw new Error(`Failed to sync reviews: ${error.message}`);
    }
  }

  private async analyzeSentiment(reviewText: string) {
    const aiClient = new OpenAIClient();
    
    const analysis = await aiClient.analyzeSentiment({
      text: reviewText,
      context: 'medical practice review',
      extractTopics: true
    });

    return {
      category: analysis.sentiment > 0.1 ? 'positive' : 
                analysis.sentiment < -0.1 ? 'negative' : 'neutral',
      score: analysis.sentiment,
      topics: analysis.topics
    };
  }

  private calculateUrgencyLevel(review: any, sentiment: any): string {
    // Calculate urgency based on rating and sentiment
    if (review.starRating <= 2 && sentiment.score < -0.5) {
      return 'urgent';
    }
    if (review.starRating <= 3 && sentiment.score < -0.3) {
      return 'high';
    }
    if (review.starRating >= 4) {
      return 'low';
    }
    return 'normal';
  }

  async publishResponse(reviewId: string, responseText: string, userId: string): Promise<void> {
    try {
      const review = await db.google_business_reviews.findUnique({
        where: { id: reviewId },
        include: { profile: true }
      });

      if (!review) {
        throw new Error('Review not found');
      }

      // Publish response via Google Business API
      await this.apiClient.replyToReview(
        review.profile.profile_id,
        review.google_review_id,
        responseText
      );

      // Update database
      await db.google_business_reviews.update({
        where: { id: reviewId },
        data: {
          final_response: responseText,
          response_status: 'published',
          response_published_at: new Date(),
          response_published_by: userId
        }
      });

      // Log the publication
      await auditLog({
        action: 'review_response_published',
        userId,
        resourceType: 'google_business_review',
        resourceId: reviewId,
        metadata: {
          response_length: responseText.length,
          google_review_id: review.google_review_id
        }
      });
    } catch (error) {
      console.error('Response publication error:', error);
      throw new Error(`Failed to publish response: ${error.message}`);
    }
  }
}

// packages/integrations/server/social-media-client.ts
export class SocialMediaClient {
  private instagramClient: InstagramAPI;
  private facebookClient: FacebookAPI;
  private tiktokClient: TikTokAPI;
  private linkedinClient: LinkedInAPI;

  constructor() {
    this.instagramClient = new InstagramAPI({
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN
    });
    // ... initialize other clients
  }

  async monitorAccounts(): Promise<SocialMediaPost[]> {
    try {
      const monitoredAccounts = await db.social_account_monitoring.findMany({
        where: { 
          is_active: true,
          monitoring_enabled: true
        }
      });

      const allPosts: SocialMediaPost[] = [];

      for (const account of monitoredAccounts) {
        const posts = await this.getPostsFromPlatform(account);
        
        for (const post of posts) {
          // Check if post already exists
          const existingPost = await db.social_media_posts.findFirst({
            where: {
              platform_post_id: post.id,
              platform: account.platform
            }
          });

          if (!existingPost) {
            // Analyze content relevance
            const relevanceAnalysis = await this.analyzeContentRelevance(post);
            
            // Determine if high-performing
            const isHighPerforming = this.calculatePerformanceThreshold(post, account);

            const newPost = await db.social_media_posts.create({
              data: {
                platform_post_id: post.id,
                account_id: account.id,
                platform: account.platform,
                caption: post.caption,
                hashtags: post.hashtags,
                media_urls: post.mediaUrls,
                media_types: post.mediaTypes,
                post_url: post.url,
                likes_count: post.likesCount,
                comments_count: post.commentsCount,
                shares_count: post.sharesCount,
                views_count: post.viewsCount,
                content_topics: relevanceAnalysis.topics,
                relevance_score: relevanceAnalysis.score,
                is_high_performing: isHighPerforming,
                posted_at: new Date(post.timestamp),
                last_analyzed_at: new Date()
              }
            });

            allPosts.push(newPost);
          }
        }

        // Update account last monitored timestamp
        await db.social_account_monitoring.update({
          where: { id: account.id },
          data: { last_monitored_at: new Date() }
        });
      }

      return allPosts;
    } catch (error) {
      console.error('Social media monitoring error:', error);
      throw new Error(`Failed to monitor social accounts: ${error.message}`);
    }
  }

  private calculatePerformanceThreshold(post: any, account: any): boolean {
    // Calculate if post meets high-performance criteria
    const engagementRate = (post.likesCount + post.commentsCount + post.sharesCount) / 
                          Math.max(account.follower_count, 1);
    
    const avgEngagementRate = account.engagement_rate || 0.05;
    
    return engagementRate > (avgEngagementRate * 1.5) && 
           (post.likesCount + post.commentsCount) > 100;
  }

  private async analyzeContentRelevance(post: any) {
    const aiClient = new OpenAIClient();
    
    return await aiClient.analyzeContentRelevance({
      text: post.caption,
      hashtags: post.hashtags,
      context: 'dermatology and skincare',
      businessCategories: ['medical', 'healthcare', 'skincare', 'beauty', 'wellness']
    });
  }
}
```

---

## 🔄 Background Processing

### **Automated Monitoring Jobs**
```typescript
// packages/integrations/server/background-jobs.ts
import { CronJob } from 'cron';
import { GoogleBusinessClient, SocialMediaClient } from './index';

export class SocialsBackgroundJobs {
  private googleBusinessClient: GoogleBusinessClient;
  private socialMediaClient: SocialMediaClient;

  constructor() {
    this.googleBusinessClient = new GoogleBusinessClient();
    this.socialMediaClient = new SocialMediaClient();
  }

  startJobs(): void {
    // Sync Google Business reviews every 2 hours
    new CronJob('0 */2 * * * *', async () => {
      try {
        console.log('Starting Google Business reviews sync...');
        const newReviews = await this.googleBusinessClient.syncReviews();
        
        // Send notifications for urgent reviews
        await this.processUrgentReviews(newReviews);
        
        console.log(`Synced ${newReviews.length} new reviews`);
      } catch (error) {
        console.error('Google Business sync failed:', error);
      }
    }, null, true);

    // Monitor social media accounts every 6 hours
    new CronJob('0 0 */6 * * *', async () => {
      try {
        console.log('Starting social media monitoring...');
        const newPosts = await this.socialMediaClient.monitorAccounts();
        
        // Process high-performing posts for adaptation
        await this.processHighPerformingPosts(newPosts);
        
        console.log(`Discovered ${newPosts.length} new posts`);
      } catch (error) {
        console.error('Social media monitoring failed:', error);
      }
    }, null, true);

    // Generate daily analytics at 11 PM
    new CronJob('0 0 23 * * *', async () => {
      try {
        console.log('Generating daily social analytics...');
        await this.generateDailyAnalytics();
        console.log('Analytics generation completed');
      } catch (error) {
        console.error('Analytics generation failed:', error);
      }
    }, null, true);

    console.log('Socials background jobs started successfully');
  }

  private async processUrgentReviews(reviews: GoogleBusinessReview[]): Promise<void> {
    const urgentReviews = reviews.filter(r => r.urgency_level === 'urgent');
    
    for (const review of urgentReviews) {
      // Send notification to managers
      await this.sendUrgentReviewNotification(review);
      
      // Auto-generate AI response if enabled
      if (process.env.AUTO_GENERATE_URGENT_RESPONSES === 'true') {
        await this.generateUrgentResponse(review);
      }
    }
  }

  private async processHighPerformingPosts(posts: SocialMediaPost[]): Promise<void> {
    const highPerformingPosts = posts.filter(p => p.is_high_performing);
    
    for (const post of highPerformingPosts) {
      // Queue for potential adaptation
      await db.social_media_posts.update({
        where: { id: post.id },
        data: { adaptation_status: 'queued' }
      });
      
      // Send notification about high-performing content
      await this.sendHighPerformingPostNotification(post);
    }
  }

  private async generateDailyAnalytics(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate review metrics
    const reviewMetrics = await db.google_business_reviews.aggregate({
      where: {
        review_date: {
          gte: today,
          lt: tomorrow
        }
      },
      _count: { id: true },
      _avg: { rating: true }
    });

    const positiveReviews = await db.google_business_reviews.count({
      where: {
        review_date: { gte: today, lt: tomorrow },
        sentiment_category: 'positive'
      }
    });

    const negativeReviews = await db.google_business_reviews.count({
      where: {
        review_date: { gte: today, lt: tomorrow },
        sentiment_category: 'negative'
      }
    });

    // Calculate social media metrics
    const socialMetrics = await db.social_media_posts.aggregate({
      where: {
        discovered_at: { gte: today, lt: tomorrow },
        is_high_performing: true
      },
      _count: { id: true },
      _sum: {
        likes_count: true,
        comments_count: true,
        shares_count: true
      }
    });

    const contentAdapted = await db.adapted_content.count({
      where: {
        created_at: { gte: today, lt: tomorrow }
      }
    });

    // Store analytics
    await db.social_analytics_daily.upsert({
      where: { analytics_date: today },
      update: {
        new_reviews_count: reviewMetrics._count.id,
        average_daily_rating: reviewMetrics._avg.rating,
        positive_reviews_count: positiveReviews,
        negative_reviews_count: negativeReviews,
        high_performing_posts_count: socialMetrics._count.id,
        content_adapted_count: contentAdapted,
        total_engagement: (socialMetrics._sum.likes_count || 0) + 
                         (socialMetrics._sum.comments_count || 0) + 
                         (socialMetrics._sum.shares_count || 0)
      },
      create: {
        analytics_date: today,
        new_reviews_count: reviewMetrics._count.id,
        average_daily_rating: reviewMetrics._avg.rating,
        positive_reviews_count: positiveReviews,
        negative_reviews_count: negativeReviews,
        high_performing_posts_count: socialMetrics._count.id,
        content_adapted_count: contentAdapted,
        total_engagement: (socialMetrics._sum.likes_count || 0) + 
                         (socialMetrics._sum.comments_count || 0) + 
                         (socialMetrics._sum.shares_count || 0)
      }
    });
  }
}
```

---

## 🧪 Backend Testing

### **API Endpoint Testing**
```typescript
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '../../../pages/api/reviews';

describe('/api/reviews', () => {
  it('requires authentication', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
      }
    });
  });

  it('filters reviews by location', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer ' + await getTestToken('manager')
          },
          url: '?location=ann_arbor'
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
      }
    });
  });

  it('generates AI responses successfully', async () => {
    const mockReview = await createTestReview();
    
    await testApiHandler({
      handler: generateResponseHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer ' + await getTestToken('manager')
          },
          body: JSON.stringify({ reviewId: mockReview.id })
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.response).toBeDefined();
        expect(data.confidence).toBeGreaterThan(0);
      }
    });
  });
});

describe('External Integrations', () => {
  it('syncs Google Business reviews', async () => {
    const client = new GoogleBusinessClient();
    const reviews = await client.syncReviews();
    
    expect(reviews).toBeInstanceOf(Array);
    reviews.forEach(review => {
      expect(review.google_review_id).toBeDefined();
      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(5);
    });
  });

  it('monitors social media accounts', async () => {
    const client = new SocialMediaClient();
    const posts = await client.monitorAccounts();
    
    expect(posts).toBeInstanceOf(Array);
    posts.forEach(post => {
      expect(post.platform_post_id).toBeDefined();
      expect(post.platform).toBeDefined();
    });
  });

  it('adapts content successfully', async () => {
    const mockPost = await createTestSocialPost();
    const aiClient = new OpenAIClient();
    
    const adaptation = await aiClient.adaptContent({
      originalCaption: mockPost.caption,
      targetPlatforms: ['instagram', 'facebook'],
      businessContext: { name: 'Ganger Dermatology' }
    });
    
    expect(adaptation.caption).toBeDefined();
    expect(adaptation.hashtags).toBeInstanceOf(Array);
    expect(adaptation.confidence).toBeGreaterThan(0);
  });
});
```

---

## 📈 Success Criteria

### **Backend Launch Criteria**
- [ ] Database migrations executed successfully
- [ ] All API endpoints respond with correct status codes
- [ ] Google Business API integration syncs reviews
- [ ] Social media monitoring discovers and analyzes posts
- [ ] AI content adaptation generates quality adaptations
- [ ] Background jobs execute on schedule
- [ ] Row Level Security policies working correctly

### **Backend Success Metrics**
- API response times <500ms for standard queries
- External service sync success rate >95%
- AI content generation accuracy >80%
- Database query performance optimized
- Zero security vulnerabilities in production
- 100% test coverage for critical business logic

---

*This backend PRD provides comprehensive guidance for Terminal 2 to build all server-side functionality for the Socials & Reviews Management application, with clear separation from Terminal 1's frontend responsibilities.*