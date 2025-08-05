import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesRouterSupabaseClient } from '@ganger/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { barcode } = req.query;

  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).json({ error: 'Barcode is required' });
  }

  try {
    const supabase = createPagesRouterSupabaseClient(req, res);

    // Look up item by barcode
    const { data: item, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(id, name),
        supplier:suppliers(id, name)
      `)
      .eq('barcode', barcode)
      .single();

    if (error || !item) {
      console.log('barcode_lookup_failed', { barcode, error: error?.message });
      return res.status(404).json({ error: 'Item not found' });
    }

    console.log('barcode_lookup_success', { barcode, item_id: item.id, item_name: item.name });

    return res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching item by barcode:', error);
    console.log('barcode_lookup_error', { barcode, error: error instanceof Error ? error.message : 'Unknown error' });
    return res.status(500).json({ error: 'Failed to fetch item' });
  }
}

export default handler;