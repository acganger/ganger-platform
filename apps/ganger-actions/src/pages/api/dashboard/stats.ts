import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { migrationAdapter } from '@ganger/db';
import { cacheManager } from '@ganger/cache';
import { 
  ApiErrors, 
  sendError, 
  sendSuccess, 
  withErrorHandler 
} from '@/lib/api/errors';
import { logger } from '@/lib/api/logger';

// Configure migration adapter for backward compatibility
migrationAdapter.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationQueries: process.env.NODE_ENV === 'development'
});

// Factory function to create Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw ApiErrors.internal('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  completed: number;
  pending_approval: number;
  average_resolution_time: number;
  tickets_by_priority: Record<string, number>;
  tickets_by_form_type: Record<string, number>;
  recent_tickets: any[];
}

// Get dashboard stats with caching
async function getDashboardStats(userEmail: string, isManagerOrAdmin: boolean): Promise<TicketStats> {
  // Generate cache key based on user and role
  const cacheKey = `dashboard-stats:${isManagerOrAdmin ? 'admin' : userEmail}`;
  
  // Try to get from cache first
  const cachedStats = await cacheManager.get(cacheKey) as TicketStats | null;
  if (cachedStats) {
    return cachedStats;
  }
    const supabase = getSupabaseClient();
    
    // Build base filters
    const userFilter = !isManagerOrAdmin ? {
      or: [
        { submitter_email: userEmail },
        { assigned_to: userEmail }
      ]
    } : {};

    // Helper function to create base query
    const createBaseQuery = () => {
      let query = supabase.from('staff_tickets').select('id', { count: 'exact', head: true });
      if (!isManagerOrAdmin) {
        query = query.or(`submitter_email.eq.${userEmail},assigned_to.eq.${userEmail}`);
      }
      return query;
    };
    
    // Get ticket counts by status using database aggregation
    const [
      totalResult,
      openResult,
      inProgressResult,
      completedResult,
      pendingResult
    ] = await Promise.all([
      createBaseQuery(),
      createBaseQuery().eq('status', 'open'),
      createBaseQuery().eq('status', 'in_progress'),
      createBaseQuery().eq('status', 'completed'),
      createBaseQuery().or('status.eq.pending,status.eq.pending_approval')
    ]);
    
    const totalCount = totalResult.count || 0;
    const openCount = openResult.count || 0;
    const inProgressCount = inProgressResult.count || 0;
    const completedCount = completedResult.count || 0;
    const pendingCount = pendingResult.count || 0;

    // Get tickets by priority
    const priorityCounts = await supabase
      .rpc('get_ticket_counts_by_field', {
        field_name: 'priority',
        user_email: isManagerOrAdmin ? null : userEmail
      });

    // Get tickets by form type
    const formTypeCounts = await supabase
      .rpc('get_ticket_counts_by_field', {
        field_name: 'form_type',
        user_email: isManagerOrAdmin ? null : userEmail
      });

    // Get average resolution time
    const resolutionTime = await supabase
      .rpc('get_average_resolution_time', {
        user_email: isManagerOrAdmin ? null : userEmail
      });

    // Get recent tickets (last 5)
    const recentTickets = await migrationAdapter.select(
      'staff_tickets',
      '*',
      userFilter,
      {
        orderBy: '-created_at',
        limit: 5
      }
    );

    const stats: TicketStats = {
      total: totalCount,
      open: openCount,
      in_progress: inProgressCount,
      completed: completedCount,
      pending_approval: pendingCount,
      average_resolution_time: resolutionTime?.data?.[0]?.avg_hours || 0,
      tickets_by_priority: priorityCounts?.data?.reduce((acc: any, item: any) => {
        acc[item.priority || 'none'] = item.count;
        return acc;
      }, {}) || {},
      tickets_by_form_type: formTypeCounts?.data?.reduce((acc: any, item: any) => {
        acc[item.form_type || 'other'] = item.count;
        return acc;
      }, {}) || {},
      recent_tickets: recentTickets
    };

    // Cache the results for 5 minutes
    await cacheManager.set(cacheKey, stats, 300);
    
    return stats;
}

export default withErrorHandler(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();
  
  if (req.method !== 'GET') {
    throw ApiErrors.validation(`Method ${req.method} not allowed`);
  }

  // Use @ganger/auth for authentication
  const supabase = createSupabaseServerClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session?.user?.email) {
    throw ApiErrors.unauthorized('Authentication required');
  }

  const userEmail = session.user.email;
  logger.logRequest(req, userEmail);

  try {
    // Check if user has manager or admin role
    const { data: userData } = await supabase
      .from('staff_user_profiles')
      .select('role')
      .eq('email', userEmail)
      .single();

    const isManagerOrAdmin = userData?.role === 'manager' || userData?.role === 'admin';

    // Get stats (with caching)
    const stats = await getDashboardStats(userEmail, isManagerOrAdmin);

    sendSuccess(res, {
      stats,
      isManagerOrAdmin,
      cached: true,
      cacheTTL: 300
    });
  } catch (error) {
    throw error; // Re-throw to be handled by withErrorHandler
  } finally {
    const duration = Date.now() - startTime;
    logger.logResponse(req, res.statusCode, duration);
  }
});
