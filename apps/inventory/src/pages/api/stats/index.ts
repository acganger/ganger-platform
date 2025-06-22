import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get inventory statistics from database
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('current_stock, minimum_stock, last_ordered, status')
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Error fetching inventory items:', itemsError);
      throw itemsError;
    }

    // Get recent orders
    const { data: orders, error: ordersError } = await supabase
      .from('inventory_orders')
      .select('id')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching recent orders:', ordersError);
    }

    // Calculate statistics
    const totalItems = items?.length || 0;
    const lowStock = items?.filter(item => 
      item.current_stock <= item.minimum_stock && item.current_stock > 0
    ).length || 0;
    const outOfStock = items?.filter(item => 
      item.current_stock === 0
    ).length || 0;
    const recentOrders = orders?.length || 0;

    // Calculate monthly usage (simplified - based on recent orders)
    const monthlyUsage = recentOrders * 4; // Extrapolate weekly to monthly

    const stats = {
      totalItems,
      lowStock: lowStock + outOfStock,
      recentOrders,
      monthlyUsage,
      breakdown: {
        inStock: totalItems - lowStock - outOfStock,
        lowStock,
        outOfStock
      }
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error('Error in inventory stats API:', error);
    
    // Return empty stats if database not available
    res.status(200).json({
      totalItems: 0,
      lowStock: 0,
      recentOrders: 0,
      monthlyUsage: 0,
      breakdown: {
        inStock: 0,
        lowStock: 0,
        outOfStock: 0
      }
    });
  }
}

