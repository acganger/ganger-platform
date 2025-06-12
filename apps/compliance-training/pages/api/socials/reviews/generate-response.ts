/**
 * AI Review Response Generation API
 * POST: Generate AI-powered response to Google Business review
 */

import type { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { auditLog } from '../../../../lib/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '../../../../middleware/errorHandler';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GenerateResponseRequest {
  reviewId: string;
  customPrompt?: string;
  templateId?: string;
  tone?: 'professional' | 'friendly' | 'formal';
}

interface ReviewWithProfile {
  id: string;
  google_review_id: string;
  profile_id: string;
  reviewer_name?: string;
  rating: number;
  review_text?: string;
  review_date: string;
  sentiment_category?: string;
  sentiment_score?: number;
  urgency_level: string;
  key_topics?: string[];
  response_status: string;
  ai_generated_response?: string;
  profile: {
    id: string;
    business_name: string;
    location?: {
      id: string;
      name: string;
    };
  };
}

interface ResponseTemplate {
  id: string;
  template_name: string;
  template_category: string;
  template_text: string;
  template_variables?: string[];
  rating_range_min?: number;
  rating_range_max?: number;
  keyword_triggers?: string[];
  topic_triggers?: string[];
  usage_count: number;
  success_rate?: number;
  is_active: boolean;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed'
      }
    });
  }

  try {
    const user = req.user;

    const { reviewId, templateId, tone = 'professional' } = req.body as GenerateResponseRequest;

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Review ID is required'
        }
      });
    }

    // Get review details with profile information
    const { data: review, error: reviewError } = await supabase
      .from('google_business_reviews')
      .select(`
        *,
        profile:google_business_profiles!inner(
          id,
          business_name,
          location:locations(
            id,
            name
          )
        )
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Review not found'
        }
      });
    }

    const reviewData = review as ReviewWithProfile;

    // Get optimal response template
    let responseTemplate: ResponseTemplate | null = null;
    if (templateId) {
      // Use specific template
      const { data: template } = await supabase
        .from('review_response_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();
      responseTemplate = template;
    } else {
      // Find best matching template
      responseTemplate = await getOptimalTemplate(reviewData);
    }

    // Generate AI response using mock service for development
    const aiResponse = await generateMockReviewResponse({
      reviewText: reviewData.review_text || '',
      rating: reviewData.rating,
      businessName: reviewData.profile.business_name,
      location: reviewData.profile.location?.name || 'our clinic'
    });

    if (!aiResponse.text || aiResponse.text.trim().length === 0) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'AI_GENERATION_ERROR',
          message: 'Failed to generate response text'
        }
      });
    }

    // Store AI-generated response in database
    const { error: updateError } = await supabase
      .from('google_business_reviews')
      .update({
        ai_generated_response: aiResponse.text,
        response_status: 'draft',
        last_analyzed_at: new Date()
      })
      .eq('id', reviewId);

    if (updateError) {
      console.error('Error updating review with AI response:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to save generated response'
        }
      });
    }

    // Update template usage count if template was used
    if (responseTemplate) {
      await supabase
        .from('review_response_templates')
        .update({
          usage_count: (responseTemplate.usage_count || 0) + 1,
          last_used_at: new Date()
        })
        .eq('id', responseTemplate.id);
    }

    // Log the generation for audit trail
    await auditLog({
      action: 'ai_response_generated',
      userId: user.id,
      resourceType: 'google_business_review',
      resourceId: reviewId,
      metadata: {
        confidence: aiResponse.confidence,
        template_used: responseTemplate?.template_name || 'none',
        response_length: aiResponse.text.length,
        tone_requested: tone,
        google_review_id: reviewData.google_review_id,
        business_name: reviewData.profile.business_name
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        response: aiResponse.text,
        confidence: aiResponse.confidence,
        template_used: responseTemplate?.template_name || null,
        template_id: responseTemplate?.id || null,
        review_id: reviewId,
        generated_at: new Date().toISOString(),
        word_count: aiResponse.text.split(' ').length,
        character_count: aiResponse.text.length
      }
    });

  } catch (error) {
    console.error('AI response generation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AI_GENERATION_ERROR',
        message: 'Failed to generate response',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
}

/**
 * Find the best matching response template for a review
 */
async function getOptimalTemplate(review: ReviewWithProfile): Promise<ResponseTemplate | null> {
  try {
    // Build query to find matching templates
    let query = supabase
      .from('review_response_templates')
      .select('*')
      .eq('is_active', true);

    // Filter by sentiment category if available
    if (review.sentiment_category) {
      query = query.eq('template_category', review.sentiment_category);
    }

    // Filter by rating range
    if (review.rating) {
      query = query
        .lte('rating_range_min', review.rating)
        .gte('rating_range_max', review.rating);
    }

    // Order by success rate and usage count
    const { data: templates } = await query
      .order('success_rate', { ascending: false })
      .order('usage_count', { ascending: false })
      .limit(5);

    if (!templates || templates.length === 0) {
      // Fallback to default template
      const { data: defaultTemplate } = await supabase
        .from('review_response_templates')
        .select('*')
        .eq('is_active', true)
        .eq('is_default', true)
        .single();

      return defaultTemplate || null;
    }

    // If we have key topics, try to match topic triggers
    if (review.key_topics && review.key_topics.length > 0) {
      for (const template of templates) {
        if (template.topic_triggers && template.topic_triggers.length > 0) {
          const hasMatchingTopic = template.topic_triggers.some(trigger =>
            review.key_topics!.some(topic => 
              topic.toLowerCase().includes(trigger.toLowerCase())
            )
          );
          if (hasMatchingTopic) {
            return template;
          }
        }
      }
    }

    // If we have review text, try to match keyword triggers
    if (review.review_text) {
      const reviewTextLower = review.review_text.toLowerCase();
      for (const template of templates) {
        if (template.keyword_triggers && template.keyword_triggers.length > 0) {
          const hasMatchingKeyword = template.keyword_triggers.some(keyword =>
            reviewTextLower.includes(keyword.toLowerCase())
          );
          if (hasMatchingKeyword) {
            return template;
          }
        }
      }
    }

    // Return the template with the highest success rate
    return templates[0] || null;

  } catch (error) {
    console.error('Error finding optimal template:', error);
    return null;
  }
}

/**
 * Mock AI response generation for development
 */
async function generateMockReviewResponse({
  rating,
  businessName,
  location
}: {
  reviewText: string;
  rating: number;
  businessName: string;
  location: string;
}): Promise<{ text: string; confidence: number }> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  let responseText = '';

  if (rating >= 4) {
    responseText = `Thank you so much for your wonderful review! We're thrilled that you had such a positive experience at ${businessName} in ${location}. Our team works hard to provide excellent dermatological care, and your feedback means the world to us. We look forward to seeing you again! 🌟`;
  } else if (rating >= 3) {
    responseText = `Thank you for your feedback about your visit to ${businessName} in ${location}. We appreciate you taking the time to share your experience. If there's anything specific we can improve, please don't hesitate to reach out to us directly. We value your input and hope to provide an even better experience next time.`;
  } else {
    responseText = `Thank you for bringing your concerns to our attention. We sincerely apologize that your experience at ${businessName} in ${location} didn't meet your expectations. We take all feedback seriously and would appreciate the opportunity to discuss this further. Please contact our office directly so we can address your concerns and make things right. Your experience matters to us.`;
  }

  return {
    text: responseText,
    confidence: 0.85
  };
}

export default withAuth(handler, {
  requiredPermissions: ['compliance:view']
});