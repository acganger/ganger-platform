import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { z } from 'zod';

// Config change interface
interface ConfigChange {
  id: string;
  created_at: string;
  updated_at: string;
  app_id: string;
  requested_by: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  change_type: string;
  current_value?: any;
  proposed_value: any;
  description?: string;
  metadata?: Record<string, any>;
  platform_applications?: {
    app_name: string;
    display_name: string;
  };
  requested_by_user?: {
    email: string;
    name?: string;
  };
  approved_by_user?: {
    email: string;
    name?: string;
  };
}

// Request validation schemas
const QuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  app_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional().default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional()
});

// Standard API response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method allowed'
      }
    });
  }

  try {
    const supabase = createSupabaseServerClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Validate query parameters
    const queryResult = QuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY_PARAMS',
          message: 'Invalid query parameters',
          details: queryResult.error.issues
        }
      });
      return;
    }

    const { page, limit, app_id, status, priority } = queryResult.data!;

    // Check user permissions - need approval permission
    const { data: userPermissions, error: permError } = await supabase
      .rpc('get_effective_permissions', { 
        p_user_id: user.id,
        p_app_id: app_id
      });

    if (permError) {
      console.error('Permission check error:', permError);
      res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: 'Failed to verify permissions'
        }
      });
    }

    // Require admin permission or superadmin role to manage approvals
    const hasAccess = userPermissions?.some((perm: any) => 
      perm.permission_level === 'admin' || 
      perm.role_name === 'superadmin'
    );

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to view pending approvals'
        }
      });
    }

    // Build query for pending config changes
    let query = supabase
      .from('pending_config_changes')
      .select(`
        *,
        platform_applications (
          app_name,
          display_name
        ),
        requested_by_user:users!requested_by (
          email,
          name
        ),
        approved_by_user:users!approved_by (
          email,
          name
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (app_id) {
      query = query.eq('app_id', app_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('pending_config_changes')
      .select('*', { count: 'exact', head: true });

    // Apply same filters to count query
    if (app_id) countQuery = countQuery.eq('app_id', app_id);
    if (status) countQuery = countQuery.eq('status', status);
    if (priority) countQuery = countQuery.eq('priority', priority);

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Count query error:', countError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch pending approvals count'
        }
      });
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: pendingChanges, error: fetchError } = await query;

    if (fetchError) {
      console.error('Pending changes fetch error:', fetchError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch pending approvals'
        }
      });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    // Calculate urgency scores for sorting
    const enrichedChanges = pendingChanges?.map((change: ConfigChange) => {
      const createdAt = new Date(change.created_at);
      const now = new Date();
      const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      // Calculate urgency score based on priority and age
      let urgencyScore = 0;
      switch (change.priority) {
        case 'critical': urgencyScore = 4; break;
        case 'high': urgencyScore = 3; break;
        case 'medium': urgencyScore = 2; break;
        case 'low': urgencyScore = 1; break;
      }
      
      // Increase urgency based on age
      if (hoursOld > 24) urgencyScore += 2;
      else if (hoursOld > 8) urgencyScore += 1;
      
      return {
        ...change,
        urgency_score: urgencyScore,
        hours_old: Math.round(hoursOld)
      };
    }) || [];

    // Sort by urgency score (highest first)
    enrichedChanges.sort((a: any, b: any) => b.urgency_score - a.urgency_score);

    res.status(200).json({
      success: true,
      data: enrichedChanges,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages
      }
    });

  } catch (error) {
    console.error('Pending approvals API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch pending approvals'
      }
    });
  }
}
// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
