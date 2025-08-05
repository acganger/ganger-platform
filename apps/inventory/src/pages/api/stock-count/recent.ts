import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesRouterSupabaseClient } from '@ganger/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createPagesRouterSupabaseClient(req, res);
    const { user_email } = req.query;

    // Get recent stock counts (last 24 hours or last 20 items)
    let query = supabase
      .from('stock_counts')
      .select(`
        id,
        counted_quantity,
        variance,
        counted_at,
        notes,
        item:inventory_items(id, name, sku, reorder_point)
      `)
      .order('counted_at', { ascending: false })
      .limit(20);

    // If user_email is provided, filter by that user
    if (user_email && typeof user_email === 'string') {
      query = query.eq('counted_by', user_email);
    }

    const { data: counts, error } = await query;

    if (error) {
      throw error;
    }

    // Transform the data for easier consumption
    const recentCounts = (counts || []).map((count: any) => ({
      id: count.id,
      item_id: count.item?.id,
      item_name: count.item?.name || 'Unknown Item',
      item_sku: count.item?.sku,
      counted_quantity: count.counted_quantity,
      variance: count.variance,
      counted_at: count.counted_at,
      notes: count.notes,
      needs_reorder: count.counted_quantity <= (count.item?.reorder_point || 0)
    }));

    return res.status(200).json(recentCounts);
  } catch (error) {
    console.error('Error fetching recent stock counts:', error);
    return res.status(500).json({ error: 'Failed to fetch recent counts' });
  }
}

export default handler;