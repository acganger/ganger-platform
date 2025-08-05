import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesRouterSupabaseClient } from '@ganger/auth';

interface StockCountItem {
  item_id: string;
  counted_quantity: number;
  needs_reorder: boolean;
  notes?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, counted_by, session_id } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required' });
  }

  if (!counted_by) {
    return res.status(400).json({ error: 'Counted by user is required' });
  }

  try {
    const supabase = createPagesRouterSupabaseClient(req, res);
    const timestamp = new Date().toISOString();
    const results = [];

    // Process each item
    for (const item of items as StockCountItem[]) {
      // Get current item data
      const { data: currentItem, error: itemError } = await supabase
        .from('inventory_items')
        .select('current_stock, cost_per_unit')
        .eq('id', item.item_id)
        .single();

      if (itemError || !currentItem) {
        console.error('Error fetching item:', itemError);
        continue;
      }

      const variance = item.counted_quantity - currentItem.current_stock;
      const variance_value = variance * (currentItem.cost_per_unit || 0);

      // Create stock count record
      const { data: stockCount, error: countError } = await supabase
        .from('stock_counts')
        .insert({
          session_id: session_id || null,
          item_id: item.item_id,
          expected_quantity: currentItem.current_stock,
          counted_quantity: item.counted_quantity,
          variance,
          variance_value,
          counted_by,
          counted_at: timestamp,
          notes: item.notes,
          is_variance_approved: false,
          adjustment_made: false
        })
        .select()
        .single();

      if (countError) {
        console.error('Error creating stock count:', countError);
        continue;
      }

      // Update inventory item
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          current_stock: item.counted_quantity,
          last_counted_at: timestamp,
          updated_at: timestamp
        })
        .eq('id', item.item_id);

      if (updateError) {
        console.error('Error updating inventory item:', updateError);
      }

      // Create inventory transaction
      const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert({
          item_id: item.item_id,
          transaction_type: 'adjustment',
          quantity: variance,
          user_id: counted_by,
          location_id: 'default', // TODO: Get from session or user
          reason: 'Stock count adjustment',
          notes: `Stock count on ${timestamp}. Previous: ${currentItem.current_stock}, Counted: ${item.counted_quantity}`,
          created_at: timestamp
        });

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
      }

      // Create reorder request if needed
      if (item.needs_reorder) {
        const { error: reorderError } = await supabase
          .from('reorder_requests')
          .insert({
            item_id: item.item_id,
            requested_by: counted_by,
            reason: 'Low stock detected during count',
            current_stock: item.counted_quantity,
            status: 'pending',
            created_at: timestamp
          });

        if (reorderError) {
          console.error('Error creating reorder request:', reorderError);
        }
      }

      results.push({
        item_id: item.item_id,
        success: true,
        stock_count_id: stockCount?.id
      });
    }

    console.log('stock_count_submitted', {
      item_count: items.length,
      reorder_count: items.filter((i: StockCountItem) => i.needs_reorder).length,
      counted_by,
      session_id
    });

    return res.status(200).json({
      success: true,
      results,
      processed: results.length,
      total: items.length
    });
  } catch (error) {
    console.error('Error submitting stock counts:', error);
    console.log('stock_count_submit_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      counted_by
    });
    return res.status(500).json({ error: 'Failed to submit stock counts' });
  }
}

export default handler;