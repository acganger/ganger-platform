import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@ganger/db';
import { withAuth } from '@ganger/auth/api';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient();
    const { status = 'all', session_id } = req.query;

    let query = supabase
      .from('stock_counts')
      .select(`
        id,
        item_id,
        expected_quantity,
        counted_quantity,
        variance,
        variance_value,
        counted_by,
        counted_at,
        notes,
        is_variance_approved,
        approved_by,
        approved_at,
        item:inventory_items(id, name, sku)
      `)
      .neq('variance', 0) // Only show items with variances
      .order('counted_at', { ascending: false });

    // Filter by approval status
    if (status === 'pending') {
      query = query.eq('is_variance_approved', false);
    } else if (status === 'approved') {
      query = query.eq('is_variance_approved', true);
    }

    // Filter by session if provided
    if (session_id && typeof session_id === 'string') {
      query = query.eq('session_id', session_id);
    }

    const { data: variances, error } = await query;

    if (error) {
      throw error;
    }

    // Transform the data for easier consumption
    const transformedVariances = (variances || []).map(variance => ({
      id: variance.id,
      item_id: variance.item_id,
      item_name: variance.item?.name || 'Unknown Item',
      item_sku: variance.item?.sku,
      expected_quantity: variance.expected_quantity,
      counted_quantity: variance.counted_quantity,
      variance: variance.variance,
      variance_value: variance.variance_value,
      counted_by: variance.counted_by,
      counted_at: variance.counted_at,
      notes: variance.notes,
      is_variance_approved: variance.is_variance_approved,
      approved_by: variance.approved_by,
      approved_at: variance.approved_at
    }));

    return res.status(200).json(transformedVariances);
  } catch (error) {
    console.error('Error fetching variances:', error);
    return res.status(500).json({ error: 'Failed to fetch variances' });
  }
}

export default withAuth(handler, { requiredLevel: 'staff' });