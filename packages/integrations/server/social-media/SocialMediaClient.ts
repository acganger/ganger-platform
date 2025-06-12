/**
 * Social Media Monitoring Client
 * Handles monitoring of Instagram, Facebook, TikTok, LinkedIn, and YouTube for high-performing content
 */

import { createClient } from '@supabase/supabase-js';
import { OpenAIClient } from '../ai/OpenAIClient';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SocialMediaPost {
  id: string;
  platform_post_id: string;
  account_id: string;
  platform: string;
  caption?: string;
  hashtags?: string[];
  media_urls?: string[];
  media_types?: string[];
  post_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  content_topics?: string[];
  relevance_score?: number;
  is_high_performing: boolean;
  performance_threshold_met: boolean;
  adaptation_status: 'not_adapted' | 'queued' | 'adapted' | 'published';
  adapted_content_id?: string;
  posted_at: Date;
  discovered_at: Date;
  last_analyzed_at?: Date;
}

export interface SocialAccount {
  id: string;
  platform: string;
  account_username: string;
  account_display_name?: string;
  account_url?: string;
  account_id?: string;
  is_active: boolean;
  monitoring_enabled: boolean;
  auto_adaptation_enabled: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  engagement_rate?: number;
  api_access_token?: string;
  api_token_expires_at?: Date;
  api_last_error?: string;
  last_monitored_at?: Date;
  last_successful_sync?: Date;
  sync_frequency_hours: number;
}

export interface PlatformPost {
  id: string;
  caption?: string;
  hashtags?: string[];
  mediaUrls?: string[];
  mediaTypes?: string[];
  url?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  timestamp: string;
}

export interface RelevanceAnalysis {
  score: number;
  topics: string[];
  isRelevant: boolean;
}

export class SocialMediaClient {
  private aiClient: OpenAIClient;

  constructor() {
    this.aiClient = new OpenAIClient();
  }

  /**
   * Monitor all active social media accounts for new content
   */
  async monitorAccounts(): Promise<SocialMediaPost[]> {
    try {
      console.log('Starting social media monitoring...');

      // Get all active accounts
      const monitoredAccounts = await this.getMonitoredAccounts();
      
      if (!monitoredAccounts || monitoredAccounts.length === 0) {
        console.log('No monitored accounts found');
        return [];
      }

      const allPosts: SocialMediaPost[] = [];

      for (const account of monitoredAccounts) {
        try {
          console.log(`Monitoring account: ${account.account_username} on ${account.platform}`);
          
          // Get posts from platform
          const posts = await this.getPostsFromPlatform(account);
          
          for (const post of posts) {
            // Check if post already exists
            const existingPost = await this.findExistingPost(post.id, account.platform);
            
            if (!existingPost) {
              // Analyze content relevance
              const relevanceAnalysis = await this.analyzeContentRelevance(post);
              
              // Determine if high-performing
              const isHighPerforming = this.calculatePerformanceThreshold(post, account);

              // Create new post record
              const newPost = await this.createPostRecord({
                post,
                account,
                relevanceAnalysis,
                isHighPerforming
              });

              if (newPost) {
                allPosts.push(newPost);
                console.log(`New post discovered: ${post.id} (${account.platform})`);
              }
            }
          }

          // Update account last monitored timestamp
          await this.updateAccountLastMonitored(account.id);
          
        } catch (accountError) {
          console.error(`Error monitoring account ${account.account_username}:`, accountError);
          
          // Log API error for account
          await this.logAccountError(account.id, accountError.message);
          continue;
        }
      }

      console.log(`Social media monitoring completed. Discovered ${allPosts.length} new posts`);
      return allPosts;

    } catch (error) {
      console.error('Social media monitoring error:', error);
      throw new Error(`Failed to monitor social accounts: ${error.message}`);
    }
  }

  /**
   * Get posts from specific platform API
   */
  private async getPostsFromPlatform(account: SocialAccount): Promise<PlatformPost[]> {
    switch (account.platform) {
      case 'instagram':
        return this.getInstagramPosts(account);
      case 'facebook':
        return this.getFacebookPosts(account);
      case 'tiktok':
        return this.getTikTokPosts(account);
      case 'linkedin':
        return this.getLinkedInPosts(account);
      case 'youtube':
        return this.getYouTubePosts(account);
      default:
        console.warn(`Unknown platform: ${account.platform}`);
        return [];
    }
  }

  /**
   * Get Instagram posts using Instagram Basic Display API
   */
  private async getInstagramPosts(account: SocialAccount): Promise<PlatformPost[]> {
    try {
      if (process.env.NODE_ENV === 'development') {
        return this.getMockPosts('instagram');
      }

      if (!account.api_access_token) {
        throw new Error('Instagram access token not configured');
      }

      const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${account.api_access_token}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.data || []).map((item: any) => ({
        id: item.id,
        caption: item.caption || '',
        hashtags: this.extractHashtags(item.caption || ''),
        mediaUrls: [item.media_url],
        mediaTypes: [item.media_type.toLowerCase()],
        url: item.permalink,
        likesCount: item.like_count || 0,
        commentsCount: item.comments_count || 0,
        sharesCount: 0, // Instagram doesn't provide shares
        viewsCount: 0, // Not available in basic API
        timestamp: item.timestamp
      }));

    } catch (error) {
      console.error('Instagram API error:', error);
      throw error;
    }
  }

  /**
   * Get Facebook posts using Facebook Graph API
   */
  private async getFacebookPosts(account: SocialAccount): Promise<PlatformPost[]> {
    try {
      if (process.env.NODE_ENV === 'development') {
        return this.getMockPosts('facebook');
      }

      if (!account.api_access_token) {
        throw new Error('Facebook access token not configured');
      }

      const url = `https://graph.facebook.com/v18.0/${account.account_id}/posts?fields=id,message,created_time,permalink_url,reactions.summary(true),comments.summary(true),shares&access_token=${account.api_access_token}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.data || []).map((item: any) => ({
        id: item.id,
        caption: item.message || '',
        hashtags: this.extractHashtags(item.message || ''),
        mediaUrls: [], // Would need additional API call for media
        mediaTypes: [],
        url: item.permalink_url,
        likesCount: item.reactions?.summary?.total_count || 0,
        commentsCount: item.comments?.summary?.total_count || 0,
        sharesCount: item.shares?.count || 0,
        viewsCount: 0,
        timestamp: item.created_time
      }));

    } catch (error) {
      console.error('Facebook API error:', error);
      throw error;
    }
  }

  /**
   * Get TikTok posts (mock implementation)
   */
  private async getTikTokPosts(account: SocialAccount): Promise<PlatformPost[]> {
    // TikTok API is complex and requires special approval
    // Using mock data for development
    return this.getMockPosts('tiktok');
  }

  /**
   * Get LinkedIn posts using LinkedIn API
   */
  private async getLinkedInPosts(account: SocialAccount): Promise<PlatformPost[]> {
    try {
      if (process.env.NODE_ENV === 'development') {
        return this.getMockPosts('linkedin');
      }

      // LinkedIn API implementation would go here
      // For now, return mock data
      return this.getMockPosts('linkedin');

    } catch (error) {
      console.error('LinkedIn API error:', error);
      throw error;
    }
  }

  /**
   * Get YouTube posts using YouTube Data API
   */
  private async getYouTubePosts(account: SocialAccount): Promise<PlatformPost[]> {
    try {
      if (process.env.NODE_ENV === 'development') {
        return this.getMockPosts('youtube');
      }

      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API key not configured');
      }

      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${account.account_id}&maxResults=50&order=date&type=video&key=${apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Get video statistics
      const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`;
      const statsResponse = await fetch(statsUrl);
      const statsData = await statsResponse.json();

      return data.items.map((item: any, index: number) => {
        const stats = statsData.items[index]?.statistics || {};
        return {
          id: item.id.videoId,
          caption: item.snippet.description,
          hashtags: this.extractHashtags(item.snippet.description),
          mediaUrls: [item.snippet.thumbnails.high.url],
          mediaTypes: ['video'],
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          likesCount: parseInt(stats.likeCount || '0'),
          commentsCount: parseInt(stats.commentCount || '0'),
          sharesCount: 0, // Not provided by API
          viewsCount: parseInt(stats.viewCount || '0'),
          timestamp: item.snippet.publishedAt
        };
      });

    } catch (error) {
      console.error('YouTube API error:', error);
      throw error;
    }
  }

  /**
   * Extract hashtags from caption text
   */
  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
  }

  /**
   * Calculate if post meets high-performance threshold
   */
  private calculatePerformanceThreshold(post: PlatformPost, account: SocialAccount): boolean {
    // Calculate engagement rate
    const totalEngagement = post.likesCount + post.commentsCount + post.sharesCount;
    const engagementRate = totalEngagement / Math.max(account.follower_count, 1);
    
    // Use account's average engagement rate as baseline
    const avgEngagementRate = account.engagement_rate || 0.05; // 5% default
    
    // Consider high-performing if:
    // 1. Engagement rate > 1.5x average
    // 2. Total engagement > 100 interactions
    const isHighEngagement = engagementRate > (avgEngagementRate * 1.5);
    const hasMinimumEngagement = totalEngagement > 100;
    
    return isHighEngagement && hasMinimumEngagement;
  }

  /**
   * Analyze content relevance for dermatology business
   */
  private async analyzeContentRelevance(post: PlatformPost): Promise<RelevanceAnalysis> {
    try {
      return await this.aiClient.analyzeContentRelevance({
        text: post.caption || '',
        hashtags: post.hashtags || [],
        context: 'dermatology and skincare',
        businessCategories: ['medical', 'healthcare', 'skincare', 'beauty', 'wellness', 'dermatology']
      });
    } catch (error) {
      console.error('Error analyzing content relevance:', error);
      return { score: 0, topics: [], isRelevant: false };
    }
  }

  /**
   * Get monitored accounts from database
   */
  private async getMonitoredAccounts(): Promise<SocialAccount[]> {
    const { data: accounts, error } = await supabase
      .from('social_account_monitoring')
      .select('*')
      .eq('is_active', true)
      .eq('monitoring_enabled', true);

    if (error) {
      console.error('Error fetching monitored accounts:', error);
      return [];
    }

    return accounts || [];
  }

  /**
   * Check if post already exists in database
   */
  private async findExistingPost(platformPostId: string, platform: string): Promise<boolean> {
    const { data: existingPost } = await supabase
      .from('social_media_posts')
      .select('id')
      .eq('platform_post_id', platformPostId)
      .eq('platform', platform)
      .single();

    return !!existingPost;
  }

  /**
   * Create new post record in database
   */
  private async createPostRecord({
    post,
    account,
    relevanceAnalysis,
    isHighPerforming
  }: {
    post: PlatformPost;
    account: SocialAccount;
    relevanceAnalysis: RelevanceAnalysis;
    isHighPerforming: boolean;
  }): Promise<SocialMediaPost | null> {
    try {
      const { data: newPost, error } = await supabase
        .from('social_media_posts')
        .insert({
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
          performance_threshold_met: isHighPerforming,
          adaptation_status: 'not_adapted',
          posted_at: new Date(post.timestamp),
          last_analyzed_at: new Date()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating post record:', error);
        return null;
      }

      return newPost as SocialMediaPost;

    } catch (error) {
      console.error('Error creating post record:', error);
      return null;
    }
  }

  /**
   * Update account last monitored timestamp
   */
  private async updateAccountLastMonitored(accountId: string): Promise<void> {
    await supabase
      .from('social_account_monitoring')
      .update({
        last_monitored_at: new Date(),
        last_successful_sync: new Date()
      })
      .eq('id', accountId);
  }

  /**
   * Log API error for account
   */
  private async logAccountError(accountId: string, errorMessage: string): Promise<void> {
    await supabase
      .from('social_account_monitoring')
      .update({
        api_last_error: errorMessage,
        last_monitored_at: new Date()
      })
      .eq('id', accountId);
  }

  /**
   * Generate mock posts for development
   */
  private getMockPosts(platform: string): PlatformPost[] {
    const basePosts = [
      {
        caption: '✨ 5 Simple Steps to Glowing Skin ✨\n\n1. Gentle cleansing morning and night\n2. Moisturize with SPF during the day\n3. Hydrate with a good serum\n4. Don\'t forget your neck and décolletage\n5. Stay consistent!\n\nWhat\'s your favorite skincare tip? 💫\n\n#SkincareTips #GlowingSkin #HealthySkin #SkinCareRoutine #Beauty #Dermatology',
        hashtags: ['#skincaretips', '#glowingskin', '#healthyskin', '#skincaeroutine', '#beauty', '#dermatology'],
        likes: 2500,
        comments: 150,
        shares: 85
      },
      {
        caption: 'The secret to radiant skin isn\'t expensive products - it\'s consistency! 🌟\n\nI\'ve been following this simple routine for 30 days and the results are amazing:\n\n• Morning: Vitamin C serum + SPF 30\n• Evening: Retinol + Hyaluronic acid\n• Weekly: Gentle exfoliation\n\nWhat changes have you noticed in your skin routine? Drop a comment! 👇\n\n#30DaySkinChallenge #SkincareBefore #HealthySkinJourney',
        hashtags: ['#30dayskinchallenoge', '#skincarebefore', '#healthyskinjourney'],
        likes: 1800,
        comments: 220,
        shares: 120
      },
      {
        caption: 'Myth Busting Monday! 🚫❌\n\nMyth: "You don\'t need sunscreen on cloudy days"\n\nFact: UV rays penetrate clouds! Up to 80% of UV radiation can pass through clouds. ☁️☀️\n\nAlways wear SPF 30+ regardless of weather. Your future skin will thank you! 🙏\n\n#MythBustingMonday #SunscreenFacts #UVProtection #SkincareEducation #DermatologyTips',
        hashtags: ['#mythbustingmonday', '#sunscreenfacts', '#uvprotection', '#skincareeducation', '#dermatologytips'],
        likes: 3200,
        comments: 95,
        shares: 180
      }
    ];

    return basePosts.map((post, index) => ({
      id: `${platform}_mock_${Date.now()}_${index}`,
      caption: post.caption,
      hashtags: post.hashtags,
      mediaUrls: [`https://example.com/${platform}_image_${index}.jpg`],
      mediaTypes: ['image'],
      url: `https://${platform}.com/post/${index}`,
      likesCount: post.likes,
      commentsCount: post.comments,
      sharesCount: post.shares,
      viewsCount: platform === 'youtube' ? post.likes * 50 : 0,
      timestamp: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString()
    }));
  }
}

export default SocialMediaClient;