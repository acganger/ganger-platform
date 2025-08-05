import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesRouterSupabaseClient } from '@ganger/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, period = 'week' } = req.query;

  if (!user || typeof user !== 'string') {
    return res.status(400).json({ error: 'User email is required' });
  }

  try {
    const supabase = createPagesRouterSupabaseClient(req, res);
    
    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'all':
        startDate = new Date('2000-01-01'); // Effectively all time
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Default to week
    }

    const { data: submissions, error } = await supabase
      .from('stock_counts')
      .select(`
        id,
        item_id,
        counted_quantity,
        variance,
        counted_at,
        is_variance_approved,
        approved_by,
        approved_at,
        notes,
        item:inventory_items(id, name, sku),
        session:stock_count_sessions(id, session_name)
      `)
      .eq('counted_by', user)
      .gte('counted_at', startDate.toISOString())
      .order('counted_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the data for easier consumption
    const transformedSubmissions = (submissions || []).map((submission: any) => ({
      id: submission.id,
      item_id: submission.item_id,
      item_name: submission.item?.name || 'Unknown Item',
      item_sku: submission.item?.sku,
      counted_quantity: submission.counted_quantity,
      variance: submission.variance,
      counted_at: submission.counted_at,
      is_variance_approved: submission.is_variance_approved,
      approved_by: submission.approved_by,
      approved_at: submission.approved_at,
      notes: submission.notes,
      session_name: submission.session?.session_name
    }));

    return res.status(200).json(transformedSubmissions);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    return res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}

export default handler;