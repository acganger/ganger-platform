import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetPurchaseOrders(req, res);
  } else if (req.method === 'POST') {
    return handleCreatePurchaseOrder(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetPurchaseOrders(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status, vendor, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('purchase_orders')
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
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (vendor) {
      query = query.eq('vendor', vendor);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }

    res.status(200).json({
      orders: orders || [],
      total: orders?.length || 0
    });

  } catch (error) {
    console.error('Error in get purchase orders API:', error);
    res.status(500).json({ 
      error: 'Failed to fetch purchase orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleCreatePurchaseOrder(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      vendor,
      items,
      notes,
      expected_delivery,
      location_id,
      shipping_amount = 0,
      tax_amount = 0,
      ordered_by
    } = req.body;

    // Validate required fields
    if (!vendor || !items || items.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: vendor and items are required' 
      });
    }

    // Generate order number
    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate total amount
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const total_amount = subtotal + Number(shipping_amount) + Number(tax_amount);

    // Create purchase order
    const { data: newOrder, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        order_number: orderNumber,
        vendor,
        location_id,
        status: 'draft',
        total_amount,
        tax_amount,
        shipping_amount,
        ordered_by,
        expected_delivery,
        notes,
        metadata: {
          created_via: 'inventory_app',
          items_count: items.length
        }
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating purchase order:', orderError);
      throw orderError;
    }

    // Create purchase order items
    const orderItems = items.map((item: any) => ({
      order_id: newOrder.id,
      item_id: item.item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      notes: item.notes
    }));

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating purchase order items:', itemsError);
      // Rollback the order if items fail
      await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', newOrder.id);
      throw itemsError;
    }

    // Fetch the complete order with items
    const { data: completeOrder } = await supabase
      .from('purchase_orders')
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
      .eq('id', newOrder.id)
      .single();

    res.status(201).json({
      order: completeOrder,
      message: 'Purchase order created successfully'
    });

  } catch (error) {
    console.error('Error in create purchase order API:', error);
    res.status(500).json({ 
      error: 'Failed to create purchase order',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}