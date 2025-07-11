import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetItems(req, res);
  } else if (req.method === 'POST') {
    return handleCreateItem(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetItems(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { search, category, status, limit = 50 } = req.query;

    let query = supabase
      .from('inventory_items')
      .select(`
        id,
        name,
        description,
        category,
        current_stock,
        minimum_stock,
        maximum_stock,
        unit_of_measure,
        last_ordered,
        supplier,
        cost_per_unit,
        status,
        location,
        created_at,
        updated_at
      `)
      .order('name', { ascending: true })
      .limit(parseInt(limit as string));

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }

    // Transform data to match frontend interface
    const transformedItems = items?.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      currentStock: item.current_stock,
      minStock: item.minimum_stock,
      lastOrdered: item.last_ordered,
      status: getStockStatus(item.current_stock, item.minimum_stock),
      description: item.description,
      unit: item.unit_of_measure,
      supplier: item.supplier,
      cost: item.cost_per_unit,
      location: item.location
    })) || [];

    res.status(200).json({
      items: transformedItems,
      total: transformedItems.length
    });

  } catch (error) {
    console.error('Error in get items API:', error);
    
    // Return empty items list if database not available
    res.status(200).json({
      items: [],
      total: 0
    });
  }
}

async function handleCreateItem(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      name,
      description,
      category,
      minimum_stock,
      maximum_stock,
      unit_of_measure,
      supplier,
      cost_per_unit,
      location
    } = req.body;

    const { data: newItem, error } = await supabase
      .from('inventory_items')
      .insert({
        name,
        description,
        category,
        current_stock: 0, // Start with 0 stock
        minimum_stock,
        maximum_stock,
        unit_of_measure,
        supplier,
        cost_per_unit,
        location,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }

    res.status(201).json({
      item: newItem,
      message: 'Inventory item created successfully'
    });

  } catch (error) {
    console.error('Error in create item API:', error);
    res.status(500).json({ 
      error: 'Failed to create inventory item',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getStockStatus(currentStock: number, minStock: number): string {
  if (currentStock === 0) {
    return 'Out of Stock';
  } else if (currentStock <= minStock) {
    return 'Low Stock';
  } else {
    return 'In Stock';
  }
}

