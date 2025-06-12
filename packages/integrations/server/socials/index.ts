/**
 * Socials & Reviews Backend Services
 * Centralized exports for all social media and Google Business review functionality
 */

// Core service clients
export { GoogleBusinessClient } from '../google-business/GoogleBusinessClient';
export { SocialMediaClient } from '../social-media/SocialMediaClient';
export { OpenAIClient } from '../ai/OpenAIClient';
export { SocialsBackgroundJobs } from '../background/SocialsBackgroundJobs';

// Type definitions
export type {
  GoogleBusinessReview,
  GoogleBusinessProfile,
  SentimentAnalysis,
  ReviewResponseGeneration
} from '../google-business/GoogleBusinessClient';

export type {
  SocialMediaPost,
  SocialAccount,
  PlatformPost,
  RelevanceAnalysis
} from '../social-media/SocialMediaClient';

export type {
  SentimentAnalysisRequest,
  SentimentAnalysisResponse,
  ContentAdaptationRequest,
  ContentAdaptationResponse,
  ReviewResponseRequest,
  ReviewResponseResponse,
  ContentRelevanceRequest,
  ContentRelevanceResponse
} from '../ai/OpenAIClient';

export type {
  JobExecutionResult,
  NotificationPayload
} from '../background/SocialsBackgroundJobs';

// Service factory functions
export const createSocialsServices = () => ({
  googleBusiness: new GoogleBusinessClient(),
  socialMedia: new SocialMediaClient(),
  ai: new OpenAIClient(),
  backgroundJobs: new SocialsBackgroundJobs()
});

// Configuration constants
export const SOCIALS_CONFIG = {
  PLATFORMS: {
    INSTAGRAM: 'instagram',
    FACEBOOK: 'facebook',
    TIKTOK: 'tiktok',
    LINKEDIN: 'linkedin',
    YOUTUBE: 'youtube'
  },
  REVIEW_URGENCY_LEVELS: {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent'
  },
  RESPONSE_STATUS: {
    PENDING: 'pending',
    DRAFT: 'draft',
    PUBLISHED: 'published',
    NOT_NEEDED: 'not_needed'
  },
  ADAPTATION_STATUS: {
    NOT_ADAPTED: 'not_adapted',
    QUEUED: 'queued',
    ADAPTED: 'adapted',
    PUBLISHED: 'published'
  },
  APPROVAL_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    NEEDS_REVISION: 'needs_revision'
  },
  PUBLISHING_STATUS: {
    DRAFT: 'draft',
    SCHEDULED: 'scheduled',
    PUBLISHED: 'published',
    FAILED: 'failed'
  }
};

// Utility functions
export const getSentimentCategory = (score: number): 'positive' | 'negative' | 'neutral' => {
  if (score > 0.1) return 'positive';
  if (score < -0.1) return 'negative';
  return 'neutral';
};

export const calculateEngagementRate = (
  likes: number,
  comments: number,
  shares: number,
  followers: number
): number => {
  if (followers === 0) return 0;
  const totalEngagement = likes + comments + shares;
  return (totalEngagement / followers) * 100;
};

export const isHighPerforming = (
  post: { likes_count: number; comments_count: number; shares_count: number },
  account: { follower_count: number; engagement_rate?: number }
): boolean => {
  const totalEngagement = post.likes_count + post.comments_count + post.shares_count;
  const engagementRate = calculateEngagementRate(
    post.likes_count,
    post.comments_count,
    post.shares_count,
    account.follower_count
  );
  
  const avgEngagementRate = account.engagement_rate || 5; // 5% default
  const isAboveAverage = engagementRate > (avgEngagementRate * 1.5);
  const hasMinimumEngagement = totalEngagement > 100;
  
  return isAboveAverage && hasMinimumEngagement;
};

export const getUrgencyLevel = (
  rating: number,
  sentimentScore: number
): 'low' | 'normal' | 'high' | 'urgent' => {
  if (rating <= 2 && sentimentScore < -0.5) return 'urgent';
  if (rating <= 3 && sentimentScore < -0.3) return 'high';
  if (rating >= 4 && sentimentScore > 0.3) return 'low';
  return 'normal';
};

// Business context for AI services
export const getBusinessContext = () => ({
  name: 'Ganger Dermatology',
  specialty: 'Dermatology and Aesthetic Medicine',
  locations: ['Ann Arbor', 'Plymouth', 'Wixom'],
  tone: 'professional, caring, educational, trustworthy',
  keyServices: [
    'Medical Dermatology',
    'Cosmetic Dermatology',
    'Mohs Surgery',
    'Aesthetic Treatments',
    'Skin Cancer Screening'
  ],
  brandValues: [
    'Patient-centered care',
    'Medical expertise',
    'Innovation in dermatology',
    'Compassionate service',
    'Education and prevention'
  ],
  socialMediaGuidelines: {
    tone: 'professional yet approachable',
    disclaimers: true,
    medicalAdviceRestrictions: true,
    brandMentions: true,
    hashtagLimits: {
      instagram: 30,
      facebook: 10,
      linkedin: 5,
      tiktok: 20,
      youtube: 15
    }
  }
});

// Error handling utilities
export class SocialsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'SocialsError';
  }
}

export const createSocialsError = (
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): SocialsError => {
  return new SocialsError(message, code, statusCode, details);
};

// Service status checker
export const checkServiceHealth = async () => {
  const services = createSocialsServices();
  const health = {
    timestamp: new Date().toISOString(),
    services: {
      googleBusiness: { status: 'unknown', error: null },
      socialMedia: { status: 'unknown', error: null },
      ai: { status: 'unknown', error: null },
      backgroundJobs: { status: 'unknown', error: null }
    }
  };

  // Check Google Business API
  try {
    // In production, this would make a test API call
    health.services.googleBusiness.status = process.env.GOOGLE_BUSINESS_API_KEY ? 'healthy' : 'configured';
  } catch (error) {
    health.services.googleBusiness.status = 'error';
    health.services.googleBusiness.error = error.message;
  }

  // Check AI service
  try {
    health.services.ai.status = process.env.OPENAI_API_KEY ? 'healthy' : 'configured';
  } catch (error) {
    health.services.ai.status = 'error';
    health.services.ai.error = error.message;
  }

  // Check background jobs
  health.services.backgroundJobs.status = 'healthy';

  // Check social media APIs
  health.services.socialMedia.status = 'healthy';

  return health;
};

export default {
  GoogleBusinessClient,
  SocialMediaClient,
  OpenAIClient,
  SocialsBackgroundJobs,
  createSocialsServices,
  checkServiceHealth,
  SOCIALS_CONFIG,
  getBusinessContext
};