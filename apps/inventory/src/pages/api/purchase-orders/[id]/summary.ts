import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Fetch the purchase order with items
    const { data: order, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          *,
          inventory_items (
            id,
            name,
            sku,
            unit_of_measure,
            category
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching purchase order:', error);
      throw error;
    }

    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Generate markdown summary
    const markdown = generateMarkdownSummary(order);

    res.status(200).json({
      markdown,
      order
    });

  } catch (error) {
    console.error('Error in purchase order summary API:', error);
    res.status(500).json({ 
      error: 'Failed to generate purchase order summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function generateMarkdownSummary(order: any): string {
  const date = new Date(order.created_at).toLocaleDateString();
  const expectedDelivery = order.expected_delivery 
    ? new Date(order.expected_delivery).toLocaleDateString() 
    : 'Not specified';

  let markdown = `# Purchase Order: ${order.order_number}\n\n`;
  markdown += `**Date:** ${date}\n`;
  markdown += `**Vendor:** ${order.vendor}\n`;
  markdown += `**Status:** ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}\n`;
  markdown += `**Expected Delivery:** ${expectedDelivery}\n\n`;

  if (order.notes) {
    markdown += `**Notes:** ${order.notes}\n\n`;
  }

  markdown += `## Order Details\n\n`;
  markdown += `| Item | SKU | Quantity | Unit Price | Total |\n`;
  markdown += `|------|-----|----------|------------|-------|\n`;

  let subtotal = 0;
  order.purchase_order_items.forEach((item: any) => {
    const itemTotal = item.quantity * item.unit_price;
    subtotal += itemTotal;
    
    markdown += `| ${item.inventory_items.name} | ${item.inventory_items.sku || 'N/A'} | `;
    markdown += `${item.quantity} ${item.inventory_items.unit_of_measure || 'units'} | `;
    markdown += `$${item.unit_price.toFixed(2)} | $${itemTotal.toFixed(2)} |\n`;
  });

  markdown += `\n**Subtotal:** $${subtotal.toFixed(2)}\n`;
  
  if (order.tax_amount > 0) {
    markdown += `**Tax:** $${order.tax_amount.toFixed(2)}\n`;
  }
  
  if (order.shipping_amount > 0) {
    markdown += `**Shipping:** $${order.shipping_amount.toFixed(2)}\n`;
  }
  
  markdown += `**Total:** $${order.total_amount.toFixed(2)}\n\n`;

  if (order.metadata?.approved_by) {
    markdown += `---\n`;
    markdown += `**Approved by:** ${order.metadata.approved_by}\n`;
    markdown += `**Approved on:** ${new Date(order.metadata.approved_at).toLocaleDateString()}\n`;
  }

  return markdown;
}