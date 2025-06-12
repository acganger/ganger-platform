// Re-export common types from mock types
export type {
  User,
  ApiResponse,
  PaginationMeta,
  ValidationRule,
} from '@/lib/types-mock';

// ==========================================
// GOOGLE BUSINESS REVIEW TYPES
// ==========================================

export type ReviewSentiment = 'positive' | 'neutral' | 'negative';
export type ReviewUrgency = 'low' | 'medium' | 'high' | 'critical';
export type ResponseStatus = 'pending' | 'draft' | 'approved' | 'published' | 'rejected';
export type ReviewStatus = 'new' | 'in_progress' | 'responded' | 'archived';

export interface GoogleBusinessReview {
  id: string;
  google_review_id: string;
  business_location: 'ann_arbor' | 'plymouth' | 'wixom';
  reviewer_name: string;
  reviewer_photo_url?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  review_text: string;
  review_date: string;
  response_text?: string;
  response_date?: string;
  sentiment_category: ReviewSentiment;
  urgency_level: ReviewUrgency;
  response_status: ResponseStatus;
  review_status: ReviewStatus;
  key_topics: string[];
  ai_generated_response?: string;
  staff_notes?: string;
  created_at: string;
  updated_at: string;
  last_modified_by?: string;
}

export interface GoogleBusinessProfile {
  id: string;
  location_name: string;
  location_key: 'ann_arbor' | 'plymouth' | 'wixom';
  google_place_id: string;
  address: string;
  phone_number: string;
  website_url: string;
  average_rating: number;
  total_reviews: number;
  profile_photo_url?: string;
  business_hours: Record<string, string>;
  is_active: boolean;
  last_sync: string;
}

// ==========================================
// SOCIAL MEDIA MONITORING TYPES
// ==========================================

export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
export type ContentTopics = 'skincare' | 'acne_treatment' | 'cosmetic_procedures' | 'sun_protection' | 'medical_dermatology' | 'patient_testimonials' | 'educational' | 'before_after' | 'product_recommendations' | 'seasonal_tips';
export type PerformanceLevel = 'high' | 'medium' | 'low';
export type ContentType = 'image' | 'video' | 'carousel' | 'text' | 'story' | 'reel';

export interface SocialMediaPost {
  id: string;
  platform: SocialPlatform;
  account_handle: string;
  account_name: string;
  account_verified: boolean;
  post_id: string;
  post_url: string;
  caption: string;
  content_type: ContentType;
  media_urls: string[];
  hashtags: string[];
  mentions: string[];
  post_date: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  engagement_rate: number;
  is_high_performing: boolean;
  performance_level: PerformanceLevel;
  relevance_score: number;
  content_topics: ContentTopics[];
  competitor_name: string;
  discovered_at: string;
  last_analyzed: string;
}

export interface SocialAccountMonitoring {
  id: string;
  platform: SocialPlatform;
  account_handle: string;
  account_name: string;
  account_url: string;
  competitor_name: string;
  follower_count: number;
  is_verified: boolean;
  is_active_monitoring: boolean;
  monitoring_keywords: string[];
  last_checked: string;
  created_at: string;
}

// ==========================================
// CONTENT ADAPTATION TYPES
// ==========================================

export type AdaptationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'published';
export type AdaptationMethod = 'ai_rewrite' | 'manual_edit' | 'template_based';

export interface AdaptedContent {
  id: string;
  original_post_id: string;
  original_content: string;
  adapted_content: string;
  adaptation_method: AdaptationMethod;
  adaptation_status: AdaptationStatus;
  target_platform?: SocialPlatform;
  scheduled_publish_date?: string;
  ganger_brand_voice_score: number;
  content_compliance_check: boolean;
  medical_accuracy_verified: boolean;
  legal_review_required: boolean;
  adapted_hashtags: string[];
  adapted_media_urls: string[];
  adaptation_notes: string;
  created_by: string;
  created_at: string;
  published_at?: string;
}

// ==========================================
// DASHBOARD & UI TYPES
// ==========================================

export interface DashboardStats {
  reviews: {
    total_pending: number;
    new_today: number;
    avg_rating_this_month: number;
    response_rate: number;
    sentiment_breakdown: Record<ReviewSentiment, number>;
  };
  social: {
    high_performing_posts_discovered: number;
    content_adapted_this_week: number;
    total_monitored_accounts: number;
    avg_engagement_rate: number;
  };
  content: {
    total_adapted_content: number;
    published_this_month: number;
    pending_approval: number;
    compliance_review_needed: number;
  };
}

export interface FilterOptions {
  reviews: {
    location?: GoogleBusinessProfile['location_key'][];
    sentiment?: ReviewSentiment[];
    urgency?: ReviewUrgency[];
    status?: ReviewStatus[];
    date_range?: {
      start?: string;
      end?: string;
    };
    rating?: number[];
  };
  social: {
    platform?: SocialPlatform[];
    performance_level?: PerformanceLevel[];
    content_topics?: ContentTopics[];
    competitor?: string[];
    date_range?: {
      start?: string;
      end?: string;
    };
    min_engagement?: number;
  };
  content: {
    status?: AdaptationStatus[];
    platform?: SocialPlatform[];
    created_by?: string[];
    date_range?: {
      start?: string;
      end?: string;
    };
  };
}

export interface SearchOptions {
  query: string;
  filters: Partial<FilterOptions>;
  sort_by: 'date' | 'rating' | 'engagement' | 'relevance';
  sort_order: 'asc' | 'desc';
  page: number;
  limit: number;
}

// ==========================================
// API REQUEST/RESPONSE TYPES
// ==========================================

export interface ReviewResponseRequest {
  review_id: string;
  response_text: string;
  is_ai_generated: boolean;
  staff_notes?: string;
}

export interface ContentAdaptationRequest {
  original_post_id: string;
  adaptation_instructions?: string;
  target_platform?: SocialPlatform;
  preserve_elements?: ('hashtags' | 'mentions' | 'links')[];
}

export interface BulkActionRequest {
  action: 'approve' | 'reject' | 'archive' | 'mark_urgent';
  item_ids: string[];
  reason?: string;
}

// ==========================================
// REAL-TIME SUBSCRIPTION TYPES
// ==========================================

export interface RealtimeEvent<T = unknown> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  commit_timestamp: string;
  new?: T;
  old?: T;
}

export interface NotificationEvent {
  id: string;
  type: 'new_review' | 'high_performing_post' | 'urgent_review' | 'content_ready';
  title: string;
  message: string;
  data: unknown;
  timestamp: string;
  read: boolean;
}

// ==========================================
// COMPONENT PROP TYPES
// ==========================================

export interface ReviewCardProps {
  review: GoogleBusinessReview;
  onRespond: (reviewId: string) => void;
  onUpdateStatus: (reviewId: string, status: ReviewStatus) => void;
  onGenerateResponse: (reviewId: string) => void;
  className?: string;
}

export interface SocialPostCardProps {
  post: SocialMediaPost;
  onAdapt: (postId: string) => void;
  onViewDetails: (postId: string) => void;
  className?: string;
}

export interface ContentPreviewProps {
  content: AdaptedContent;
  onEdit: (contentId: string) => void;
  onPublish: (contentId: string) => void;
  onApprove: (contentId: string) => void;
  className?: string;
}

// ==========================================
// HOOK RETURN TYPES
// ==========================================

export interface UseReviewsResult {
  reviews: GoogleBusinessReview[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
  updateReview: (reviewId: string, updates: Partial<GoogleBusinessReview>) => void;
}

export interface UseSocialPostsResult {
  posts: SocialMediaPost[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

export interface UseAdaptedContentResult {
  content: AdaptedContent[];
  loading: boolean;
  error: string | null;
  createAdaptation: (request: ContentAdaptationRequest) => Promise<AdaptedContent>;
  updateContent: (contentId: string, updates: Partial<AdaptedContent>) => void;
  publishContent: (contentId: string) => Promise<boolean>;
}

// ==========================================
// ERROR TYPES
// ==========================================

export interface SocialsReviewsError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ==========================================
// UTILITY TYPES
// ==========================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export type SortOption<T> = {
  field: keyof T;
  direction: 'asc' | 'desc';
  label: string;
};