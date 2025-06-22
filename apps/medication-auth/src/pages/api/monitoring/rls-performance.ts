import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@ganger/db';
import { withAuth } from '../../../lib/auth/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [
      rlsRecommendations,
      indexUsage,
      slowQueries,
      benchmarkResults
    ] = await Promise.all([
      supabaseAdmin.rpc('get_rls_recommendations'),
      supabaseAdmin.rpc('get_rls_index_usage'),
      supabaseAdmin.rpc('get_slow_rls_queries', { threshold_ms: 100 }),
      supabaseAdmin.rpc('benchmark_rls_policies')
    ]);

    const response = {
      timestamp: new Date().toISOString(),
      rls_performance: {
        recommendations: rlsRecommendations.data,
        index_usage: indexUsage.data,
        slow_queries: slowQueries.data,
        benchmark: benchmarkResults.data
      },
      summary: {
        total_indexes_monitored: Array.isArray(indexUsage.data) ? indexUsage.data.length : 0,
        slow_queries_count: Array.isArray(slowQueries.data) ? slowQueries.data.length : 0,
        performance_status: rlsRecommendations.data?.optimization_status || 'Unknown'
      },
      next_steps: [
        'Monitor RLS query performance regularly',
        'Review slow queries and add appropriate indexes',
        'Consider using optimized RLS helper functions for better performance',
        'Benchmark RLS policies after making changes'
      ]
    };

    return res.status(200).json(response);

  } catch (error) {
    
    return res.status(500).json({
      error: 'Failed to get RLS performance data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler, {
  requiredRole: 'manager',
  logPHIAccess: true
});
// Cloudflare Workers Edge Runtime
