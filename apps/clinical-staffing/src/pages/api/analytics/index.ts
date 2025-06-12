import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@ganger/auth';
import type { AuthenticatedRequest } from '@ganger/auth';
import { createSupabaseServerClient } from '@ganger/auth';

/**
 * GET /api/analytics
 * Fetch staffing analytics with filtering and pagination
 */
export default withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { page = '1', limit = '10', location, dateFrom, dateTo } = req.query;
    const user = req.user;

    // Verify permissions (simplified check)
    if (!user || !user.permissions || !user.permissions.includes('read_analytics')) {
      return res.status(403).json({
        error: 'Insufficient permissions to read analytics'
      });
    }

    // Parse pagination parameters
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Initialize Supabase client
    const supabase = createSupabaseServerClient();
    
    // For now, provide mock data since tables aren't set up
    const data = [
      {
        id: '1',
        location: location || 'Northfield',
        metric_type: 'utilization',
        value: 85.5,
        created_at: new Date().toISOString()
      },
      {
        id: '2', 
        location: location || 'Northfield',
        metric_type: 'coverage',
        value: 92.3,
        created_at: new Date().toISOString()
      }
    ];
    
    const total = 2;

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});