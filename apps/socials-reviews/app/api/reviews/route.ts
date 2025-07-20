import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@ganger/auth';
import { cacheManager } from '@ganger/cache';
import { headers } from 'next/headers';

// Review status and sentiment mappings
const REVIEW_STATUS = ['new', 'responded', 'pending', 'archived'];
const SENTIMENT_CATEGORIES = ['positive', 'neutral', 'negative', 'mixed'];
const URGENCY_LEVELS = ['low', 'medium', 'high', 'urgent'];

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const location = searchParams.get('location');
    const status = searchParams.get('status');
    const sentiment = searchParams.get('sentiment');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const sortBy = searchParams.get('sort_by') || 'review_date';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '20');

    // Check cache first
    const cacheKey = `reviews:${location || 'all'}:${status || 'all'}:${page}`;
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Build query
    let query = supabase
      .from('social_reviews')
      .select('*', { count: 'exact' });

    // Apply filters
    if (location && location !== 'all') {
      query = query.eq('business_location', location);
    }
    
    if (status && REVIEW_STATUS.includes(status)) {
      query = query.eq('review_status', status);
    }
    
    if (sentiment && SENTIMENT_CATEGORIES.includes(sentiment)) {
      query = query.eq('sentiment_category', sentiment);
    }
    
    if (dateFrom) {
      query = query.gte('review_date', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('review_date', dateTo);
    }

    // Apply sorting
    const validSortColumns = ['review_date', 'rating', 'urgency_level'];
    if (validSortColumns.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data: reviews, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' }, 
        { status: 500 }
      );
    }

    const responseData = {
      reviews: reviews || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };

    // Cache the response for 5 minutes
    await cacheManager.set(cacheKey, responseData, 300);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Handle review response posting
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, responseText, publishImmediately } = body;

    if (!reviewId || !responseText) {
      return NextResponse.json(
        { error: 'Review ID and response text are required' }, 
        { status: 400 }
      );
    }

    // Update the review with the response
    const { data, error } = await supabase
      .from('social_reviews')
      .update({
        response_text: responseText,
        response_status: publishImmediately ? 'published' : 'draft',
        responded_by: user.email,
        responded_at: new Date().toISOString(),
        review_status: 'responded',
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save response' }, 
        { status: 500 }
      );
    }

    // Invalidate cache for reviews
    await cacheManager.invalidatePattern('reviews:*');

    // If publishing immediately, add to queue for Google My Business API
    if (publishImmediately && data) {
      // TODO: Implement Google My Business API integration
      // For now, just log that we would publish
      console.log(`Would publish response for review ${reviewId} to Google My Business`);
    }

    return NextResponse.json({
      success: true,
      review: data
    });
  } catch (error) {
    console.error('Review response API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}