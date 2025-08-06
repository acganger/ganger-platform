import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build query
    let query = supabase
      .from('social_content_library')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('adaptation_status', status);
    }
    if (platform) {
      query = query.eq('target_platform', platform);
    }

    // Add ordering and pagination
    query = query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      content: data || [],
      total: count || 0,
      page,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      originalContent, 
      targetPlatform, 
      adaptationMethod = 'ai_rewrite',
      instructions 
    } = body;

    if (!originalContent || !targetPlatform) {
      return NextResponse.json(
        { error: 'Original content and target platform are required' },
        { status: 400 }
      );
    }

    // Generate adapted content based on platform
    const adaptedContent = await generateAdaptedContent(
      originalContent, 
      targetPlatform,
      instructions
    );

    // Store in database
    const { data, error } = await supabase
      .from('social_content_library')
      .insert({
        original_content: originalContent,
        adapted_content: adaptedContent.text,
        adaptation_method: adaptationMethod,
        adaptation_status: 'pending',
        target_platform: targetPlatform,
        ganger_brand_voice_score: adaptedContent.brandScore,
        content_compliance_check: true,
        medical_accuracy_verified: false,
        legal_review_required: adaptedContent.requiresLegalReview,
        adapted_hashtags: adaptedContent.hashtags,
        adapted_media_urls: [],
        adaptation_notes: instructions || '',
        created_by: 'system' // Would get from auth context
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      content: data
    });

  } catch (error) {
    console.error('Error creating adapted content:', error);
    return NextResponse.json(
      { error: 'Failed to create adapted content' },
      { status: 500 }
    );
  }
}

async function generateAdaptedContent(
  originalContent: string, 
  platform: string,
  instructions?: string
): Promise<{
  text: string;
  hashtags: string[];
  brandScore: number;
  requiresLegalReview: boolean;
}> {
  // Platform-specific content guidelines
  const platformGuidelines = {
    instagram: {
      maxLength: 2200,
      hashtagLimit: 30,
      tone: 'friendly, visual, community-focused'
    },
    facebook: {
      maxLength: 63206,
      hashtagLimit: 10,
      tone: 'informative, caring, professional'
    },
    linkedin: {
      maxLength: 3000,
      hashtagLimit: 5,
      tone: 'professional, educational, authoritative'
    },
    twitter: {
      maxLength: 280,
      hashtagLimit: 3,
      tone: 'concise, engaging, informative'
    }
  };

  const guidelines = platformGuidelines[platform as keyof typeof platformGuidelines] || platformGuidelines.instagram;
  
  // Generate Ganger-specific content
  let adaptedText = originalContent;
  
  // Add Ganger branding
  if (!adaptedText.includes('Ganger Dermatology')) {
    adaptedText = adaptedText.replace(
      /dermatology|skin clinic|medical practice/gi,
      'Ganger Dermatology'
    );
  }

  // Add location mentions
  if (platform !== 'twitter' && !adaptedText.includes('Ann Arbor') && !adaptedText.includes('Plymouth')) {
    adaptedText += '\n\n📍 Conveniently located in Ann Arbor, Plymouth, and Wixom';
  }

  // Generate appropriate hashtags
  const hashtags = generateHashtags(adaptedText, platform);
  
  // Add call-to-action
  if (!adaptedText.match(/call|book|schedule|contact/i)) {
    adaptedText += '\n\n📞 Schedule your consultation today!';
  }

  // Check for medical claims that need review
  const requiresLegalReview = checkMedicalClaims(adaptedText);
  
  // Calculate brand voice score
  const brandScore = calculateBrandScore(adaptedText);

  // Trim to platform limits
  if (adaptedText.length > guidelines.maxLength) {
    adaptedText = adaptedText.substring(0, guidelines.maxLength - 3) + '...';
  }

  return {
    text: adaptedText,
    hashtags: hashtags.slice(0, guidelines.hashtagLimit),
    brandScore,
    requiresLegalReview
  };
}

function generateHashtags(content: string, platform: string): string[] {
  const baseHashtags = ['#GangerDermatology', '#SkinHealth', '#Michigan'];
  
  const topicHashtags: string[] = [];
  
  // Detect topics and add relevant hashtags
  if (content.match(/acne/i)) {
    topicHashtags.push('#AcneTreatment', '#ClearSkin');
  }
  if (content.match(/sun|spf|protection/i)) {
    topicHashtags.push('#SunProtection', '#SPF', '#SkinCancerPrevention');
  }
  if (content.match(/cosmetic|beauty|aesthetic/i)) {
    topicHashtags.push('#CosmeticDermatology', '#HealthySkin');
  }
  if (content.match(/eczema|psoriasis|rosacea/i)) {
    topicHashtags.push('#MedicalDermatology', '#SkinConditions');
  }
  
  // Add location hashtags
  const locationHashtags = ['#AnnArbor', '#Plymouth', '#Wixom'];
  
  return [...baseHashtags, ...topicHashtags, ...locationHashtags];
}

function checkMedicalClaims(content: string): boolean {
  // Check for specific medical claims that need legal review
  const medicalTerms = [
    'cure', 'guaranteed', 'breakthrough', 'revolutionary',
    'FDA', 'clinical trial', 'proven to', 'eliminates',
    'medical study', 'research shows'
  ];
  
  return medicalTerms.some(term => 
    content.toLowerCase().includes(term.toLowerCase())
  );
}

function calculateBrandScore(content: string): number {
  let score = 70; // Base score
  
  // Brand elements that increase score
  if (content.includes('Ganger Dermatology')) score += 10;
  if (content.includes('Dr. Ganger')) score += 5;
  if (content.match(/Ann Arbor|Plymouth|Wixom/)) score += 5;
  if (content.match(/board-certified|expert|experienced/i)) score += 5;
  if (content.includes('📞') || content.includes('Schedule')) score += 5;
  
  // Cap at 100
  return Math.min(score, 100);
}