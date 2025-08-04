import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { approved_by, user_email } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Check if user is authorized to approve
    // Managers (OU) or anand@gangerdermatology.com can approve
    const isAuthorized = user_email === 'anand@gangerdermatology.com' || 
                        user_email.toLowerCase().includes('ou@') ||
                        user_email.toLowerCase().includes('manager');

    if (!isAuthorized) {
      return res.status(403).json({ 
        error: 'Unauthorized', 
        message: 'Only managers or anand@gangerdermatology.com can approve purchase orders' 
      });
    }

    // Update the purchase order status
    const { data: updatedOrder, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'approved',
        ordered_by: approved_by,
        ordered_at: new Date().toISOString(),
        metadata: supabase.sql`metadata || jsonb_build_object('approved_by', ${user_email}, 'approved_at', ${new Date().toISOString()})`
      })
      .eq('id', id)
      .select(`
        *,
        purchase_order_items (
          *,
          inventory_items (
            id,
            name,
            sku,
            unit_of_measure
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error approving purchase order:', error);
      throw error;
    }

    // TODO: Send notification to buyers list
    // This would integrate with your notification system

    res.status(200).json({
      order: updatedOrder,
      message: 'Purchase order approved successfully'
    });

  } catch (error) {
    console.error('Error in approve purchase order API:', error);
    res.status(500).json({ 
      error: 'Failed to approve purchase order',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}