import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { integrationQueries } from '@ganger/integrations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const location = searchParams.get('location');
    const status = searchParams.get('status');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const platform = searchParams.get('platform') || 'google';

    // Build query
    let query = supabase
      .from('review_management')
      .select('*', { count: 'exact' })
      .eq('platform', platform);

    // Apply filters
    if (location && location !== 'all') {
      query = query.eq('business_location', location);
    }
    if (status) {
      query = query.eq('response_status', status);
    }
    if (minRating) {
      query = query.gte('rating', parseInt(minRating));
    }
    if (maxRating) {
      query = query.lte('rating', parseInt(maxRating));
    }
    if (startDate) {
      query = query.gte('review_date', startDate);
    }
    if (endDate) {
      query = query.lte('review_date', endDate);
    }

    // Add ordering and pagination
    query = query
      .order('review_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Check if we need to fetch new reviews from Google
    const lastSync = await supabase
      .from('sync_logs')
      .select('last_sync')
      .eq('integration_type', 'google_business')
      .single();

    const shouldSync = !lastSync.data || 
      new Date().getTime() - new Date(lastSync.data.last_sync).getTime() > 3600000; // 1 hour

    if (shouldSync) {
      // Fetch new reviews from Google Business API
      try {
        const googleReviews = await integrationQueries.googleBusiness.getReviews({
          accountId: process.env.GOOGLE_BUSINESS_ACCOUNT_ID!,
          locationIds: ['all'], // or specific location IDs
        });

        // Process and store new reviews
        if (googleReviews && googleReviews.length > 0) {
          const newReviews = googleReviews.map((review: any) => ({
            platform: 'google',
            platform_review_id: review.reviewId,
            reviewer_name: review.reviewer.displayName || 'Anonymous',
            rating: review.starRating === 'FIVE' ? 5 : 
                   review.starRating === 'FOUR' ? 4 :
                   review.starRating === 'THREE' ? 3 :
                   review.starRating === 'TWO' ? 2 : 1,
            review_text: review.comment || '',
            review_date: review.createTime,
            business_location: review.locationId,
            response_status: review.reviewReply ? 'responded' : 'pending',
            response_text: review.reviewReply?.comment || null,
            response_date: review.reviewReply?.updateTime || null,
            sentiment_score: 0.5, // Would need sentiment analysis
            sentiment_category: review.starRating === 'FIVE' || review.starRating === 'FOUR' ? 'positive' :
                               review.starRating === 'THREE' ? 'neutral' : 'negative',
            key_topics: [], // Would need NLP processing
            urgency_level: review.starRating === 'ONE' || review.starRating === 'TWO' ? 'high' : 'low',
          }));

          // Upsert reviews
          await supabase
            .from('review_management')
            .upsert(newReviews, { onConflict: 'platform_review_id' });

          // Update sync log
          await supabase
            .from('sync_logs')
            .upsert({
              integration_type: 'google_business',
              last_sync: new Date().toISOString(),
              status: 'success',
              records_synced: newReviews.length
            }, { onConflict: 'integration_type' });
        }
      } catch (syncError) {
        console.error('Error syncing Google reviews:', syncError);
      }
    }

    return NextResponse.json({
      reviews: data || [],
      total: count || 0,
      page,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, responseText, platform = 'google' } = body;

    if (!reviewId || !responseText) {
      return NextResponse.json(
        { error: 'Review ID and response text are required' },
        { status: 400 }
      );
    }

    // Get the review details
    const { data: review, error: reviewError } = await supabase
      .from('review_management')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Post response to Google Business API
    if (platform === 'google') {
      try {
        const response = await integrationQueries.googleBusiness.postReviewReply({
          accountId: process.env.GOOGLE_BUSINESS_ACCOUNT_ID!,
          locationId: review.business_location,
          reviewId: review.platform_review_id,
          comment: responseText
        });

        // Update local database
        await supabase
          .from('review_management')
          .update({
            response_status: 'responded',
            response_text: responseText,
            response_date: new Date().toISOString(),
            responded_by: 'system' // Would get from auth context
          })
          .eq('id', reviewId);

        return NextResponse.json({
          success: true,
          message: 'Response posted successfully',
          response
        });

      } catch (apiError) {
        console.error('Error posting to Google Business API:', apiError);
        return NextResponse.json(
          { error: 'Failed to post response to Google' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Unsupported platform' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error posting review response:', error);
    return NextResponse.json(
      { error: 'Failed to post review response' },
      { status: 500 }
    );
  }
}