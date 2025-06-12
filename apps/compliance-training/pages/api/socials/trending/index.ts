/**
 * Social Media Trending Posts API
 * GET: Fetch high-performing social media posts for content adaptation
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse, validatePagination } from '../../../../middleware/errorHandler';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TrendingQueryParams {
  platform?: string;
  sortBy?: string;
  timeRange?: string;
  minEngagement?: string;
  relevanceThreshold?: string;
  adaptationStatus?: string;
  page?: string;
  limit?: string;
}


async function handler(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is allowed'
      }
    });
  }

  try {

    const {
      platform = 'all',
      sortBy = 'engagement',
      timeRange = '7d',
      minEngagement = '0',
      relevanceThreshold = '0.3',
      adaptationStatus = 'all',
      page = '1',
      limit = '50'
    } = req.query as TrendingQueryParams;

    // Validate pagination
    const pagination = validatePagination(parseInt(page), parseInt(limit));

    // Calculate time range
    const timeRangeDate = getTimeRangeDate(timeRange);
    const minEngagementCount = parseInt(minEngagement);
    const relevanceThresholdValue = parseFloat(relevanceThreshold);

    // Build base query
    let query = supabase
      .from('social_media_posts')
      .select(`
        *,
        account:social_account_monitoring!inner(
          id,
          platform,
          account_username,
          account_display_name,
          account_url,
          follower_count,
          engagement_rate
        ),
        adapted_content:adapted_content(
          id,
          adapted_caption,
          approval_status,
          publishing_status
        )
      `)
      .eq('is_high_performing', true)
      .gte('posted_at', timeRangeDate.toISOString());

    // Apply platform filter
    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    // Apply relevance threshold filter
    if (relevanceThresholdValue > 0) {
      query = query.gte('relevance_score', relevanceThresholdValue);
    }

    // Apply adaptation status filter
    if (adaptationStatus !== 'all') {
      query = query.eq('adaptation_status', adaptationStatus);
    }

    // Apply sorting
    switch (sortBy) {
      case 'engagement':
        // Sort by total engagement (likes + comments + shares)
        query = query.order('likes_count', { ascending: false });
        break;
      case 'recent':
        query = query.order('posted_at', { ascending: false });
        break;
      case 'relevance':
        query = query.order('relevance_score', { ascending: false });
        break;
      case 'views':
        query = query.order('views_count', { ascending: false });
        break;
      case 'discovered':
        query = query.order('discovered_at', { ascending: false });
        break;
      default:
        query = query.order('posted_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(
      (pagination.page - 1) * pagination.limit,
      pagination.page * pagination.limit - 1
    );

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Database error fetching trending posts:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch trending posts'
        }
      });
    }

    // Filter by minimum engagement if specified
    let filteredPosts = posts || [];
    if (minEngagementCount > 0) {
      filteredPosts = filteredPosts.filter(post => {
        const totalEngagement = post.likes_count + post.comments_count + post.shares_count;
        return totalEngagement >= minEngagementCount;
      });
    }

    // Calculate engagement metrics for each post
    const enrichedPosts = filteredPosts.map(post => {
      const totalEngagement = post.likes_count + post.comments_count + post.shares_count;
      const engagementRate = post.account.follower_count > 0 
        ? (totalEngagement / post.account.follower_count) * 100
        : 0;

      return {
        ...post,
        total_engagement: totalEngagement,
        engagement_rate: Number(engagementRate.toFixed(4)),
        time_since_posted: getTimeSincePosted(post.posted_at),
        adaptation_opportunity_score: calculateAdaptationScore(post)
      };
    });

    // Get total count for pagination
    const totalCount = count || enrichedPosts.length;

    // Calculate summary statistics
    const summary = calculateTrendingSummary(enrichedPosts, timeRange);

    return res.status(200).json({
      success: true,
      data: enrichedPosts,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / pagination.limit),
        hasNext: pagination.page * pagination.limit < totalCount,
        hasPrev: pagination.page > 1,
        filters: {
          platform,
          sortBy,
          timeRange,
          minEngagement: minEngagementCount,
          relevanceThreshold: relevanceThresholdValue,
          adaptationStatus
        },
        summary
      }
    });

  } catch (error) {
    console.error('Trending posts fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch trending posts'
      }
    });
  }
}

/**
 * Get date for time range filter
 */
function getTimeRangeDate(timeRange: string): Date {
  const now = new Date();
  
  switch (timeRange) {
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '3d':
      return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '14d':
      return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Calculate time since post was published
 */
function getTimeSincePosted(postedAt: string): string {
  const now = new Date();
  const posted = new Date(postedAt);
  const diffMs = now.getTime() - posted.getTime();
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
}

/**
 * Calculate adaptation opportunity score
 */
function calculateAdaptationScore(post: any): number {
  let score = 0;
  
  // Base score from relevance
  if (post.relevance_score) {
    score += post.relevance_score * 40; // Up to 40 points
  }
  
  // Engagement score
  const totalEngagement = post.likes_count + post.comments_count + post.shares_count;
  if (totalEngagement > 1000) score += 30;
  else if (totalEngagement > 500) score += 20;
  else if (totalEngagement > 100) score += 10;
  
  // Recency score (newer posts get higher scores)
  const hoursOld = (new Date().getTime() - new Date(post.posted_at).getTime()) / (1000 * 60 * 60);
  if (hoursOld < 24) score += 20;
  else if (hoursOld < 72) score += 15;
  else if (hoursOld < 168) score += 10; // 1 week
  
  // Content quality indicators
  if (post.content_topics && post.content_topics.length > 0) {
    score += Math.min(post.content_topics.length * 5, 20); // Up to 20 points for topics
  }
  
  // Adaptation status penalty
  if (post.adaptation_status === 'adapted') score -= 20;
  else if (post.adaptation_status === 'published') score -= 40;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate summary statistics for trending posts
 */
function calculateTrendingSummary(posts: any[], timeRange: string) {
  if (!posts || posts.length === 0) {
    return {
      total_posts: 0,
      avg_engagement: 0,
      top_platform: null,
      adaptation_opportunities: 0,
      high_opportunity_posts: 0
    };
  }

  const totalEngagement = posts.reduce((sum, post) => sum + post.total_engagement, 0);
  const avgEngagement = totalEngagement / posts.length;

  // Count posts by platform
  const platformCounts = posts.reduce((acc, post) => {
    acc[post.platform] = (acc[post.platform] || 0) + 1;
    return acc;
  }, {});

  const topPlatform = Object.entries(platformCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || null;

  const adaptationOpportunities = posts.filter(
    post => post.adaptation_status === 'not_adapted' || post.adaptation_status === 'queued'
  ).length;

  const highOpportunityPosts = posts.filter(
    post => post.adaptation_opportunity_score >= 70
  ).length;

  return {
    total_posts: posts.length,
    avg_engagement: Math.round(avgEngagement),
    top_platform: topPlatform,
    adaptation_opportunities: adaptationOpportunities,
    high_opportunity_posts: highOpportunityPosts,
    time_range_analyzed: timeRange,
    platform_breakdown: platformCounts
  };
}

export default withAuth(handler, {
  requiredPermissions: ['compliance:view']
});