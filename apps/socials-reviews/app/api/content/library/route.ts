import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@ganger/auth';
import { cacheManager } from '@ganger/cache';
import { headers } from 'next/headers';

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
    const platform = searchParams.get('platform');
    const campaignId = searchParams.get('campaign_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const sortBy = searchParams.get('sort_by') || 'adapted_date';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '10');
    const status = searchParams.get('status') || 'all';

    // Check cache first
    const cacheKey = `content_library:${platform || 'all'}:${status}:${page}`;
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Build query
    let query = supabase
      .from('content_library')
      .select('*', { count: 'exact' });

    // Apply filters
    if (platform && platform !== 'all') {
      query = query.eq('target_platform', platform);
    }
    
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    
    if (status && status !== 'all') {
      switch (status) {
        case 'pending':
          query = query.in('approval_status', ['pending', 'needs_revision']);
          break;
        case 'approved':
          query = query.eq('approval_status', 'approved');
          break;
        case 'published':
          query = query.eq('publish_status', 'published');
          break;
      }
    }
    
    if (dateFrom) {
      query = query.gte('adapted_date', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('adapted_date', dateTo);
    }

    // Apply sorting
    const validSortColumns = ['adapted_date', 'scheduled_date', 'engagement_rate'];
    if (validSortColumns.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data: content, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch content library' }, 
        { status: 500 }
      );
    }

    const responseData = {
      content: content || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };

    // Cache the response for 5 minutes
    await cacheManager.set(cacheKey, responseData, 300);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Content library API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}