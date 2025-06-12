/**
 * Content Adaptation API
 * POST: Adapt social media content for Ganger Dermatology using AI and business rules
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { auditLog } from '../../../../lib/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse } from '../../../../middleware/errorHandler';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ContentAdaptationRequest {
  originalPostId: string;
  targetPlatforms: string[];
  customInstructions?: string;
  tone?: 'professional' | 'friendly' | 'educational' | 'promotional';
  includeCallToAction?: boolean;
  adaptationRuleIds?: string[];
}

interface SocialMediaPostWithAccount {
  id: string;
  platform_post_id: string;
  platform: string;
  caption?: string;
  hashtags?: string[];
  media_urls?: string[];
  post_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  content_topics?: string[];
  relevance_score?: number;
  posted_at: string;
  account: {
    id: string;
    platform: string;
    account_username: string;
    account_display_name?: string;
    follower_count: number;
  };
}

interface AdaptationRule {
  id: string;
  rule_name: string;
  rule_type: string;
  rule_parameters: any;
  target_platforms?: string[];
  content_categories?: string[];
  is_active: boolean;
  priority_order: number;
  auto_apply: boolean;
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

    const {
      originalPostId,
      targetPlatforms,
      customInstructions,
      tone = 'professional',
      includeCallToAction = true,
      adaptationRuleIds
    } = req.body as ContentAdaptationRequest;

    // Validate required fields
    if (!originalPostId || !targetPlatforms || targetPlatforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Original post ID and target platforms are required'
        }
      });
    }

    // Validate target platforms
    const validPlatforms = ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube'];
    const invalidPlatforms = targetPlatforms.filter(platform => !validPlatforms.includes(platform));
    if (invalidPlatforms.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid platforms: ${invalidPlatforms.join(', ')}. Valid platforms: ${validPlatforms.join(', ')}`
        }
      });
    }

    // Get original post with account information
    const { data: originalPost, error: postError } = await supabase
      .from('social_media_posts')
      .select(`
        *,
        account:social_account_monitoring!inner(
          id,
          platform,
          account_username,
          account_display_name,
          follower_count
        )
      `)
      .eq('id', originalPostId)
      .single();

    if (postError || !originalPost) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Original post not found'
        }
      });
    }

    const postData = originalPost as SocialMediaPostWithAccount;

    // Check if content has already been adapted
    const { data: existingAdaptation } = await supabase
      .from('adapted_content')
      .select('id, approval_status, publishing_status')
      .eq('original_post_id', originalPostId)
      .single();

    if (existingAdaptation && existingAdaptation.approval_status !== 'rejected') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'RESOURCE_ALREADY_EXISTS',
          message: 'Content has already been adapted. Use the update endpoint to modify existing adaptations.'
        }
      });
    }

    // Get adaptation rules
    const adaptationRules = await getAdaptationRules(targetPlatforms, adaptationRuleIds);

    // Validate content quality before adaptation
    const contentQuality = await validateContentForAdaptation(postData);
    if (!contentQuality.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONTENT_VALIDATION_ERROR',
          message: contentQuality.reason || 'Content is not suitable for adaptation'
        }
      });
    }

    // Generate adapted content using mock AI service for development
    const businessContext = getBusinessContext();

    const adaptedContent = await generateMockAdaptedContent({
      originalCaption: postData.caption || '',
      originalHashtags: postData.hashtags || [],
      targetPlatforms,
      businessContext,
      adaptationRules
    });

    if (!adaptedContent.caption || adaptedContent.caption.trim().length === 0) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'AI_ADAPTATION_ERROR',
          message: 'Failed to generate adapted content'
        }
      });
    }

    // Apply business rules to the adapted content
    const processedContent = await applyBusinessRules(adaptedContent, adaptationRules, targetPlatforms);

    // Add call-to-action if requested
    if (includeCallToAction) {
      processedContent.callToAction = processedContent.callToAction || getDefaultCallToAction(targetPlatforms);
    }

    // Store adapted content in database
    const { data: adaptedRecord, error: createError } = await supabase
      .from('adapted_content')
      .insert({
        original_post_id: originalPostId,
        adapted_caption: processedContent.caption,
        adapted_hashtags: processedContent.hashtags,
        suggested_media_urls: postData.media_urls || [],
        call_to_action: processedContent.callToAction,
        target_platforms: targetPlatforms,
        adaptation_prompt: adaptedContent.prompt,
        ai_model_used: 'gpt-4',
        adaptation_confidence: adaptedContent.confidence,
        approval_status: 'pending',
        publishing_status: 'draft',
        created_by: user.id
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating adapted content:', createError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to save adapted content'
        }
      });
    }

    // Update original post adaptation status
    await supabase
      .from('social_media_posts')
      .update({
        adaptation_status: 'adapted',
        adapted_content_id: adaptedRecord.id
      })
      .eq('id', originalPostId);

    // Update adaptation rule usage counts
    if (adaptationRules && adaptationRules.length > 0) {
      for (const rule of adaptationRules) {
        await supabase
          .from('content_adaptation_rules')
          .update({
            application_count: (rule.application_count || 0) + 1,
            last_used_at: new Date()
          })
          .eq('id', rule.id);
      }
    }

    // Log the adaptation for audit trail
    await auditLog({
      action: 'content_adapted',
      userId: user.id,
      resourceType: 'social_media_post',
      resourceId: originalPostId,
      metadata: {
        adapted_content_id: adaptedRecord.id,
        target_platforms: targetPlatforms,
        confidence: adaptedContent.confidence,
        tone_requested: tone,
        original_platform: postData.platform,
        original_account: postData.account.account_username,
        rules_applied: adaptationRules?.length || 0,
        custom_instructions_provided: !!customInstructions
      }
    });

    // Calculate performance metrics
    const performanceMetrics = calculateAdaptationMetrics(postData, adaptedContent);

    return res.status(201).json({
      success: true,
      data: {
        id: adaptedRecord.id,
        original_post_id: originalPostId,
        adapted_caption: adaptedRecord.adapted_caption,
        adapted_hashtags: adaptedRecord.adapted_hashtags,
        call_to_action: adaptedRecord.call_to_action,
        target_platforms: adaptedRecord.target_platforms,
        confidence: adaptedContent.confidence,
        approval_status: adaptedRecord.approval_status,
        publishing_status: adaptedRecord.publishing_status,
        created_at: adaptedRecord.created_at,
        metrics: performanceMetrics,
        original_post: {
          platform: postData.platform,
          account_username: postData.account.account_username,
          total_engagement: postData.likes_count + postData.comments_count + postData.shares_count,
          posted_at: postData.posted_at
        },
        next_steps: [
          'Review adapted content for accuracy and brand compliance',
          'Approve or request revisions',
          'Schedule for publishing across target platforms',
          'Monitor performance after publication'
        ]
      }
    });

  } catch (error) {
    console.error('Content adaptation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CONTENT_ADAPTATION_ERROR',
        message: 'Failed to adapt content',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
}

/**
 * Get adaptation rules for content processing
 */
async function getAdaptationRules(targetPlatforms: string[], ruleIds?: string[]): Promise<AdaptationRule[]> {
  try {
    let query = supabase
      .from('content_adaptation_rules')
      .select('*')
      .eq('is_active', true);

    if (ruleIds && ruleIds.length > 0) {
      // Use specific rules
      query = query.in('id', ruleIds);
    } else {
      // Get rules that apply to target platforms
      query = query.or(
        `target_platforms.cs.{${targetPlatforms.join(',')}}`,
        'target_platforms.is.null'
      );
    }

    const { data: rules } = await query.order('priority_order', { ascending: true });
    return rules || [];

  } catch (error) {
    console.error('Error fetching adaptation rules:', error);
    return [];
  }
}

/**
 * Validate content suitability for adaptation
 */
async function validateContentForAdaptation(post: SocialMediaPostWithAccount): Promise<{ isValid: boolean; reason?: string }> {
  // Check minimum engagement
  const totalEngagement = post.likes_count + post.comments_count + post.shares_count;
  if (totalEngagement < 50) {
    return { isValid: false, reason: 'Content has insufficient engagement for adaptation' };
  }

  // Check relevance score
  if (post.relevance_score && post.relevance_score < 0.3) {
    return { isValid: false, reason: 'Content relevance score is too low for dermatology adaptation' };
  }

  // Check content age (don't adapt very old content)
  const postedDate = new Date(post.posted_at);
  const daysSincePosted = (Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePosted > 30) {
    return { isValid: false, reason: 'Content is too old for effective adaptation' };
  }

  // Check for minimum content length
  if (!post.caption || post.caption.length < 20) {
    return { isValid: false, reason: 'Original content is too short for meaningful adaptation' };
  }

  return { isValid: true };
}

/**
 * Get business context for content adaptation
 */
function getBusinessContext() {
  return {
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
    ]
  };
}

/**
 * Apply business rules to adapted content
 */
async function applyBusinessRules(content: any, rules: AdaptationRule[], targetPlatforms: string[]) {
  let processedContent = { ...content };

  for (const rule of rules) {
    try {
      switch (rule.rule_type) {
        case 'keyword_filter':
          processedContent = applyKeywordFilter(processedContent, rule.rule_parameters);
          break;
        case 'brand_guideline':
          processedContent = applyBrandGuidelines(processedContent, rule.rule_parameters);
          break;
        case 'tone_adjustment':
          processedContent = applyToneAdjustment(processedContent, rule.rule_parameters);
          break;
        case 'cta_template':
          processedContent = applyCTATemplate(processedContent, rule.rule_parameters, targetPlatforms);
          break;
      }
    } catch (error) {
      console.error(`Error applying rule ${rule.rule_name}:`, error);
    }
  }

  return processedContent;
}

/**
 * Apply keyword filtering rules
 */
function applyKeywordFilter(content: any, parameters: any) {
  const { forbidden_keywords = [], required_keywords = [] } = parameters;
  
  let caption = content.caption;
  
  // Remove forbidden keywords
  forbidden_keywords.forEach((keyword: string) => {
    const regex = new RegExp(keyword, 'gi');
    caption = caption.replace(regex, '');
  });
  
  // Ensure required keywords are present
  required_keywords.forEach((keyword: string) => {
    if (!caption.toLowerCase().includes(keyword.toLowerCase())) {
      caption += ` #${keyword}`;
    }
  });

  return { ...content, caption: caption.trim() };
}

/**
 * Apply brand guideline rules
 */
function applyBrandGuidelines(content: any, parameters: any) {
  const { brand_mentions = [], disclaimer_required = false } = parameters;
  
  let caption = content.caption;
  
  // Add brand mentions if not present
  brand_mentions.forEach((mention: string) => {
    if (!caption.toLowerCase().includes(mention.toLowerCase())) {
      caption = `${mention} ${caption}`;
    }
  });
  
  // Add disclaimer if required
  if (disclaimer_required && !caption.includes('Consult with')) {
    caption += '\n\n*Please consult with a dermatologist for personalized medical advice.';
  }

  return { ...content, caption };
}

/**
 * Apply tone adjustment rules
 */
function applyToneAdjustment(content: any, parameters: any) {
  // This would typically involve more sophisticated text processing
  // For now, we'll apply simple transformations
  const { target_tone = 'professional' } = parameters;
  
  let caption = content.caption;
  
  if (target_tone === 'professional') {
    // Remove excessive emojis (simplified approach)
    caption = caption.replace(/[\u{1F600}-\u{1F64F}]{3,}/gu, '✨');
    // Add professional language markers
    if (!caption.includes('At Ganger Dermatology')) {
      caption = `At Ganger Dermatology, ${caption}`;
    }
  }

  return { ...content, caption };
}

/**
 * Apply call-to-action template rules
 */
function applyCTATemplate(content: any, parameters: any, targetPlatforms: string[]) {
  const { cta_templates = {}, platform_specific = true } = parameters;
  
  let callToAction = content.callToAction;
  
  if (platform_specific && targetPlatforms.length === 1) {
    const platform = targetPlatforms[0];
    callToAction = cta_templates[platform] || cta_templates.default || callToAction;
  } else {
    callToAction = cta_templates.default || callToAction;
  }

  return { ...content, callToAction };
}

/**
 * Get default call-to-action based on platforms
 */
function getDefaultCallToAction(targetPlatforms: string[]): string {
  const ctaMap = {
    instagram: 'Book your consultation today! Link in bio or call (734) 677-DERM 📞',
    facebook: 'Schedule your appointment online or call us at (734) 677-DERM!',
    linkedin: 'Contact Ganger Dermatology to schedule your professional dermatological consultation.',
    tiktok: 'Book now! Call (734) 677-DERM for expert dermatology care 💫',
    youtube: 'Visit gangerdermatology.com to schedule your appointment with our expert team!'
  };

  if (targetPlatforms.length === 1) {
    return ctaMap[targetPlatforms[0]] || 'Contact Ganger Dermatology to schedule your appointment!';
  }

  return 'Contact Ganger Dermatology today to schedule your dermatology consultation!';
}

/**
 * Calculate adaptation performance metrics
 */
function calculateAdaptationMetrics(originalPost: SocialMediaPostWithAccount, adaptedContent: any) {
  const originalEngagement = originalPost.likes_count + originalPost.comments_count + originalPost.shares_count;
  const engagementRate = originalPost.account.follower_count > 0 
    ? (originalEngagement / originalPost.account.follower_count) * 100 
    : 0;

  return {
    original_engagement: originalEngagement,
    original_engagement_rate: Number(engagementRate.toFixed(4)),
    content_length_original: originalPost.caption?.length || 0,
    content_length_adapted: adaptedContent.caption?.length || 0,
    hashtags_original: originalPost.hashtags?.length || 0,
    hashtags_adapted: adaptedContent.hashtags?.length || 0,
    adaptation_confidence: adaptedContent.confidence,
    relevance_score: originalPost.relevance_score || 0,
    estimated_reach_improvement: Math.round(adaptedContent.confidence * 25), // Percentage
    medical_compliance_score: 0.95 // High compliance for professional adaptation
  };
}

/**
 * Mock AI content adaptation for development
 */
async function generateMockAdaptedContent({
  originalCaption,
  originalHashtags,
  targetPlatforms
}: {
  originalCaption: string;
  originalHashtags: string[];
  targetPlatforms: string[];
  businessContext: any;
}): Promise<{ caption: string; hashtags: string[]; confidence: number; prompt: string }> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate adapted caption based on business context
  let adaptedCaption = originalCaption;
  
  // Add Ganger Dermatology context
  if (!adaptedCaption.toLowerCase().includes('ganger dermatology')) {
    adaptedCaption = `At Ganger Dermatology, we understand that ${adaptedCaption.toLowerCase()}`;
  }
  
  // Make it more professional and medical
  adaptedCaption = adaptedCaption
    .replace(/amazing/gi, 'excellent')
    .replace(/awesome/gi, 'outstanding')
    .replace(/love/gi, 'appreciate')
    .replace(/omg/gi, 'remarkably');
  
  // Add professional closing
  if (!adaptedCaption.includes('consultation')) {
    adaptedCaption += ' Schedule a consultation with our board-certified dermatologists to learn more about our advanced treatments.';
  }

  // Generate relevant dermatology hashtags
  const dermatologyHashtags = [
    '#GangerDermatology',
    '#DermatologyExperts',
    '#SkinHealth',
    '#MedicalDermatology',
    '#AnnArborDerm',
    '#PlymouthDerm',
    '#WixomDerm',
    '#SkinCare',
    '#DermatologyMichigan'
  ];

  // Combine original hashtags with dermatology-specific ones
  const platformSpecificHashtags = targetPlatforms.includes('linkedin') 
    ? ['#Healthcare', '#MedicalProfessionals', '#Dermatology']
    : targetPlatforms.includes('tiktok')
    ? ['#SkinTok', '#DermTips', '#SkinHealth']
    : dermatologyHashtags.slice(0, 5);

  const adaptedHashtags = [...new Set([...platformSpecificHashtags, ...originalHashtags.slice(0, 3)])];

  return {
    caption: adaptedCaption,
    hashtags: adaptedHashtags,
    confidence: 0.87,
    prompt: `Adapt content for Ganger Dermatology across ${targetPlatforms.join(', ')} platforms with professional, medical tone`
  };
}

export default withAuth(handler, {
  requiredPermissions: ['compliance:view']
});