/**
 * Google Business API Integration Client
 * Handles Google Business Profile review monitoring and response management
 */

import { createClient } from '@supabase/supabase-js';
import { auditLog } from '../../utils/ApiErrorHandler';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface GoogleBusinessReview {
  id: string;
  google_review_id: string;
  profile_id: string;
  reviewer_name?: string;
  reviewer_profile_photo_url?: string;
  rating: number;
  review_text?: string;
  review_date: Date;
  sentiment_category?: 'positive' | 'negative' | 'neutral';
  sentiment_score?: number;
  urgency_level: 'low' | 'normal' | 'high' | 'urgent';
  key_topics?: string[];
  response_status: 'pending' | 'draft' | 'published' | 'not_needed';
  ai_generated_response?: string;
  final_response?: string;
  response_published_at?: Date;
  response_published_by?: string;
  processed_at?: Date;
  last_analyzed_at?: Date;
  sync_source: string;
}

export interface GoogleBusinessProfile {
  id: string;
  profile_id: string;
  business_name: string;
  location_id?: string;
  address?: string;
  phone?: string;
  website?: string;
  google_maps_url?: string;
  average_rating?: number;
  review_count: number;
  is_active: boolean;
  last_sync_at?: Date;
}

export interface SentimentAnalysis {
  category: 'positive' | 'negative' | 'neutral';
  score: number;
  topics: string[];
}

export interface ReviewResponseGeneration {
  text: string;
  confidence: number;
  template_used?: string;
}

export class GoogleBusinessClient {
  private apiKey: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_BUSINESS_API_KEY!;
    this.clientId = process.env.GOOGLE_CLIENT_ID!;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

    if (!this.apiKey || !this.clientId || !this.clientSecret) {
      throw new Error('Google Business API credentials not configured');
    }
  }

  /**
   * Sync reviews from Google Business API for all active profiles
   */
  async syncReviews(profileId?: string): Promise<GoogleBusinessReview[]> {
    try {
      console.log('Starting Google Business reviews sync...');

      // Get profiles to sync
      const profiles = profileId 
        ? await this.getSingleProfile(profileId)
        : await this.getActiveProfiles();

      if (!profiles || profiles.length === 0) {
        console.log('No active profiles found for sync');
        return [];
      }

      const allReviews: GoogleBusinessReview[] = [];

      for (const profile of profiles) {
        try {
          console.log(`Syncing reviews for profile: ${profile.business_name}`);
          
          // Get reviews from Google Business API
          const reviews = await this.fetchReviewsFromGoogle(profile.profile_id);
          
          for (const reviewData of reviews) {
            // Check if review already exists
            const { data: existingReview } = await supabase
              .from('google_business_reviews')
              .select('id')
              .eq('google_review_id', reviewData.reviewId)
              .single();

            if (!existingReview) {
              // Analyze sentiment using AI
              const sentimentAnalysis = await this.analyzeSentiment(reviewData.comment || '');
              
              // Calculate urgency level
              const urgencyLevel = this.calculateUrgencyLevel(reviewData, sentimentAnalysis);

              // Create new review record
              const { data: newReview, error } = await supabase
                .from('google_business_reviews')
                .insert({
                  google_review_id: reviewData.reviewId,
                  profile_id: profile.id,
                  reviewer_name: reviewData.reviewer?.displayName,
                  reviewer_profile_photo_url: reviewData.reviewer?.profilePhotoUrl,
                  rating: reviewData.starRating,
                  review_text: reviewData.comment,
                  review_date: new Date(reviewData.createTime),
                  sentiment_category: sentimentAnalysis.category,
                  sentiment_score: sentimentAnalysis.score,
                  urgency_level: urgencyLevel,
                  key_topics: sentimentAnalysis.topics,
                  processed_at: new Date(),
                  sync_source: 'google_api'
                })
                .select()
                .single();

              if (error) {
                console.error('Error creating review record:', error);
                continue;
              }

              if (newReview) {
                allReviews.push(newReview as GoogleBusinessReview);
                console.log(`New review synced: ${reviewData.reviewId}`);
              }
            }
          }

          // Update profile metrics
          await this.updateProfileMetrics(profile.id);
          
        } catch (profileError) {
          console.error(`Error syncing profile ${profile.business_name}:`, profileError);
          continue;
        }
      }

      console.log(`Sync completed. Processed ${allReviews.length} new reviews`);
      return allReviews;

    } catch (error) {
      console.error('Google Business sync error:', error);
      throw new Error(`Failed to sync reviews: ${error.message}`);
    }
  }

  /**
   * Fetch reviews from Google Business API
   */
  private async fetchReviewsFromGoogle(profileId: string): Promise<any[]> {
    try {
      // In production, this would use the actual Google Business API
      // For development, we'll return mock data
      if (process.env.NODE_ENV === 'development') {
        return this.getMockReviews();
      }

      const url = `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/${profileId}/reviews`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.reviews || [];

    } catch (error) {
      console.error('Error fetching reviews from Google:', error);
      throw error;
    }
  }

  /**
   * Get access token for Google Business API
   */
  private async getAccessToken(): Promise<string> {
    // In production, implement OAuth2 flow to get access token
    // For development, return a mock token
    if (process.env.NODE_ENV === 'development') {
      return 'mock_access_token';
    }

    // OAuth2 implementation would go here
    throw new Error('OAuth2 implementation required for production');
  }

  /**
   * Analyze sentiment of review text using AI
   */
  private async analyzeSentiment(reviewText: string): Promise<SentimentAnalysis> {
    try {
      if (!reviewText || reviewText.trim().length === 0) {
        return { category: 'neutral', score: 0, topics: [] };
      }

      // In development, use mock sentiment analysis
      if (process.env.NODE_ENV === 'development') {
        return this.getMockSentimentAnalysis(reviewText);
      }

      // In production, integrate with OpenAI or other sentiment analysis service
      const { OpenAIClient } = await import('../ai/OpenAIClient');
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

    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      // Return neutral sentiment on error
      return { category: 'neutral', score: 0, topics: [] };
    }
  }

  /**
   * Calculate urgency level based on rating and sentiment
   */
  private calculateUrgencyLevel(review: any, sentiment: SentimentAnalysis): string {
    const rating = review.starRating || 5;
    const sentimentScore = sentiment.score || 0;

    // Urgent: Low rating + very negative sentiment
    if (rating <= 2 && sentimentScore < -0.5) {
      return 'urgent';
    }

    // High: Moderate rating + negative sentiment
    if (rating <= 3 && sentimentScore < -0.3) {
      return 'high';
    }

    // Low: High rating + positive sentiment
    if (rating >= 4 && sentimentScore > 0.3) {
      return 'low';
    }

    return 'normal';
  }

  /**
   * Publish response to Google Business review
   */
  async publishResponse(reviewId: string, responseText: string, userId: string): Promise<void> {
    try {
      // Get review details
      const { data: review, error: reviewError } = await supabase
        .from('google_business_reviews')
        .select(`
          *,
          profile:google_business_profiles(*)
        `)
        .eq('id', reviewId)
        .single();

      if (reviewError || !review) {
        throw new Error('Review not found');
      }

      // In development, mock the API call
      if (process.env.NODE_ENV === 'development') {
        console.log(`Mock: Publishing response to review ${review.google_review_id}`);
        console.log(`Response: ${responseText}`);
      } else {
        // Publish response via Google Business API
        await this.publishResponseToGoogle(
          review.profile.profile_id,
          review.google_review_id,
          responseText
        );
      }

      // Update database
      const { error: updateError } = await supabase
        .from('google_business_reviews')
        .update({
          final_response: responseText,
          response_status: 'published',
          response_published_at: new Date(),
          response_published_by: userId
        })
        .eq('id', reviewId);

      if (updateError) {
        throw new Error(`Failed to update review status: ${updateError.message}`);
      }

      // Log the publication
      await auditLog({
        action: 'review_response_published',
        userId,
        resourceType: 'google_business_review',
        resourceId: reviewId,
        metadata: {
          response_length: responseText.length,
          google_review_id: review.google_review_id,
          profile_id: review.profile.profile_id
        }
      });

      console.log(`Response published successfully for review ${reviewId}`);

    } catch (error) {
      console.error('Response publication error:', error);
      throw new Error(`Failed to publish response: ${error.message}`);
    }
  }

  /**
   * Publish response to Google Business API
   */
  private async publishResponseToGoogle(profileId: string, reviewId: string, responseText: string): Promise<void> {
    try {
      const url = `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/${profileId}/reviews/${reviewId}/reply`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: responseText
        })
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      console.error('Error publishing response to Google:', error);
      throw error;
    }
  }

  /**
   * Get active Google Business profiles
   */
  private async getActiveProfiles(): Promise<GoogleBusinessProfile[]> {
    const { data: profiles, error } = await supabase
      .from('google_business_profiles')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching active profiles:', error);
      return [];
    }

    return profiles || [];
  }

  /**
   * Get single profile by ID
   */
  private async getSingleProfile(profileId: string): Promise<GoogleBusinessProfile[]> {
    const { data: profile, error } = await supabase
      .from('google_business_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return [];
    }

    return profile ? [profile] : [];
  }

  /**
   * Update profile metrics (review count, average rating)
   */
  private async updateProfileMetrics(profileId: string): Promise<void> {
    try {
      // Calculate metrics from reviews
      const { data: metrics } = await supabase
        .from('google_business_reviews')
        .select('rating')
        .eq('profile_id', profileId);

      if (!metrics || metrics.length === 0) {
        return;
      }

      const reviewCount = metrics.length;
      const averageRating = metrics.reduce((sum, review) => sum + review.rating, 0) / reviewCount;

      // Update profile
      await supabase
        .from('google_business_profiles')
        .update({
          review_count: reviewCount,
          average_rating: Number(averageRating.toFixed(2)),
          last_sync_at: new Date()
        })
        .eq('id', profileId);

    } catch (error) {
      console.error('Error updating profile metrics:', error);
    }
  }

  /**
   * Mock reviews for development
   */
  private getMockReviews(): any[] {
    return [
      {
        reviewId: `mock_review_${Date.now()}_1`,
        reviewer: {
          displayName: 'Sarah Johnson',
          profilePhotoUrl: 'https://example.com/photo1.jpg'
        },
        starRating: 5,
        comment: 'Excellent dermatology service! Dr. Ganger was very professional and thorough.',
        createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        reviewId: `mock_review_${Date.now()}_2`,
        reviewer: {
          displayName: 'Michael Chen',
          profilePhotoUrl: 'https://example.com/photo2.jpg'
        },
        starRating: 2,
        comment: 'Long wait times and rushed appointment. Not satisfied with the experience.',
        createTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  /**
   * Mock sentiment analysis for development
   */
  private getMockSentimentAnalysis(reviewText: string): SentimentAnalysis {
    const positiveKeywords = ['excellent', 'great', 'professional', 'satisfied', 'recommend'];
    const negativeKeywords = ['bad', 'terrible', 'rude', 'disappointed', 'worst', 'rushed'];

    const text = reviewText.toLowerCase();
    let score = 0;

    positiveKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.3;
    });

    negativeKeywords.forEach(keyword => {
      if (text.includes(keyword)) score -= 0.3;
    });

    // Clamp score between -1 and 1
    score = Math.max(-1, Math.min(1, score));

    const category = score > 0.1 ? 'positive' : 
                    score < -0.1 ? 'negative' : 'neutral';

    // Extract simple topics
    const topics = [];
    if (text.includes('wait')) topics.push('waiting_time');
    if (text.includes('staff') || text.includes('service')) topics.push('customer_service');
    if (text.includes('doctor') || text.includes('dr')) topics.push('medical_care');
    if (text.includes('appointment')) topics.push('scheduling');

    return { category, score, topics };
  }
}

export default GoogleBusinessClient;