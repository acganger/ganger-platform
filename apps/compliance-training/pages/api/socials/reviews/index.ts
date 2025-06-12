/**
 * Google Business Reviews Management API
 * GET: Fetch reviews with filtering and pagination
 * POST: Create new review (for testing/manual entry)
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { ApiResponse, validatePagination } from '../../../../middleware/errorHandler';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ReviewsQueryParams {
  location?: string;
  status?: string;
  sentiment?: string;
  urgency?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}


async function handleGet(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  try {

    const {
      location = 'all',
      status = 'all',
      sentiment = 'all',
      urgency = 'all',
      page = '1',
      limit = '25',
      sortBy = 'review_date',
      sortOrder = 'desc'
    } = req.query as ReviewsQueryParams;

    // Validate pagination
    const pagination = validatePagination(parseInt(page), parseInt(limit));

    // Build query filters
    let query = supabase
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
      `);

    // Apply filters
    if (location !== 'all') {
      query = query.eq('profile.location_id', location);
    }

    if (status !== 'all') {
      query = query.eq('response_status', status);
    }

    if (sentiment !== 'all') {
      query = query.eq('sentiment_category', sentiment);
    }

    if (urgency !== 'all') {
      query = query.eq('urgency_level', urgency);
    }

    // Apply sorting
    const validSortFields = ['review_date', 'rating', 'urgency_level', 'response_status', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'review_date';
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    // Special sorting for urgency level
    if (sortField === 'urgency_level') {
      query = query.order('urgency_level', { 
        ascending: false,
        nullsFirst: false
      });
    } else {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }

    // Apply pagination
    query = query
      .range(
        (pagination.page - 1) * pagination.limit,
        pagination.page * pagination.limit - 1
      );

    const { data: reviews, error, count } = await query;

    if (error) {
      console.error('Database error fetching reviews:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch reviews'
        }
      });
    }

    // Get total count for pagination
    let totalCount = 0;
    if (count !== null) {
      totalCount = count;
    } else {
      // Fallback count query
      let countQuery = supabase
        .from('google_business_reviews')
        .select('id', { count: 'exact', head: true });

      if (location !== 'all') {
        countQuery = countQuery.eq('profile.location_id', location);
      }
      if (status !== 'all') {
        countQuery = countQuery.eq('response_status', status);
      }
      if (sentiment !== 'all') {
        countQuery = countQuery.eq('sentiment_category', sentiment);
      }
      if (urgency !== 'all') {
        countQuery = countQuery.eq('urgency_level', urgency);
      }

      const { count: fallbackCount } = await countQuery;
      totalCount = fallbackCount || 0;
    }

    return res.status(200).json({
      success: true,
      data: reviews,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / pagination.limit),
        hasNext: pagination.page * pagination.limit < totalCount,
        hasPrev: pagination.page > 1
      }
    });

  } catch (error) {
    console.error('Reviews fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch reviews'
      }
    });
  }
}

async function handlePost(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const user = req.user;

    // Check if user has manager+ permissions
    const hasPermission = ['manager', 'superadmin', 'hr_admin'].includes(user.role?.toLowerCase() || '');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Manager permissions required'
        }
      });
    }

    const {
      google_review_id,
      profile_id,
      reviewer_name,
      rating,
      review_text,
      review_date
    } = req.body;

    // Validate required fields
    if (!google_review_id || !profile_id || !rating || !review_date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: google_review_id, profile_id, rating, review_date'
        }
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rating must be between 1 and 5'
        }
      });
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('google_business_profiles')
      .select('id')
      .eq('id', profile_id)
      .single();

    if (profileError || !profile) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid profile_id'
        }
      });
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('google_business_reviews')
      .select('id')
      .eq('google_review_id', google_review_id)
      .single();

    if (existingReview) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'RESOURCE_ALREADY_EXISTS',
          message: 'Review with this google_review_id already exists'
        }
      });
    }

    // Calculate sentiment and urgency (mock for now)
    const sentiment_category = rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';
    const sentiment_score = rating >= 4 ? 0.7 : rating <= 2 ? -0.7 : 0;
    const urgency_level = rating <= 2 ? 'high' : rating <= 3 ? 'normal' : 'low';

    // Create review
    const { data: newReview, error: createError } = await supabase
      .from('google_business_reviews')
      .insert({
        google_review_id,
        profile_id,
        reviewer_name,
        rating,
        review_text,
        review_date: new Date(review_date),
        sentiment_category,
        sentiment_score,
        urgency_level,
        response_status: 'pending',
        processed_at: new Date(),
        sync_source: 'manual_entry'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating review:', createError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create review'
        }
      });
    }

    return res.status(201).json({
      success: true,
      data: newReview
    });

  } catch (error) {
    console.error('Review creation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create review'
      }
    });
  }
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method ${req.method} not allowed`
        }
      });
  }
}

export default withAuth(handler, {
  requiredPermissions: ['compliance:view']
});