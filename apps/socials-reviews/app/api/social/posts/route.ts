import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@ganger/auth';
import { cacheManager } from '@ganger/cache';

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    
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
    const competitor = searchParams.get('competitor');
    const performanceLevel = searchParams.get('performance_level');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const sortBy = searchParams.get('sort_by') || 'post_date';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '12');

    // Check cache first
    const cacheKey = `social_posts:${platform || 'all'}:${competitor || 'all'}:${page}`;
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Build query
    let query = supabase
      .from('social_media_monitoring')
      .select('*', { count: 'exact' });

    // Apply filters
    if (platform && platform !== 'all') {
      query = query.eq('platform', platform);
    }
    
    if (competitor && competitor !== 'all') {
      query = query.eq('competitor_name', competitor);
    }
    
    if (performanceLevel && performanceLevel !== 'all') {
      query = query.eq('performance_level', performanceLevel);
    }
    
    if (dateFrom) {
      query = query.gte('post_date', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('post_date', dateTo);
    }

    // Apply sorting
    const validSortColumns = ['post_date', 'engagement_rate', 'relevance_score'];
    if (validSortColumns.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch social posts' }, 
        { status: 500 }
      );
    }

    const responseData = {
      posts: posts || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };

    // Cache the response for 5 minutes
    await cacheManager.set(cacheKey, responseData, 300);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Social posts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}