import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetVendors(req, res);
  } else if (req.method === 'POST') {
    return handleCreateVendor(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetVendors(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { search } = req.query;

    // Get unique vendors from inventory_items table
    let query = supabase
      .from('inventory_items')
      .select('vendor')
      .order('vendor', { ascending: true });

    const { data: items, error } = await query;

    if (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }

    // Get unique vendors
    const vendorSet = new Set(items?.map(item => item.vendor).filter(Boolean));
    const vendors = Array.from(vendorSet).map(vendor => ({
      id: vendor,
      name: vendor,
      value: vendor
    }));

    // Apply search filter if provided
    let filteredVendors = vendors;
    if (search) {
      const searchLower = search.toString().toLowerCase();
      filteredVendors = vendors.filter(v => 
        v.name.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({
      vendors: filteredVendors,
      total: filteredVendors.length
    });

  } catch (error) {
    console.error('Error in get vendors API:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vendors',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleCreateVendor(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'Vendor name is required' 
      });
    }

    // Since vendors are stored as strings in inventory_items,
    // we just return the vendor name as confirmation
    // The actual vendor will be created when an item is added with this vendor
    res.status(201).json({
      vendor: {
        id: name,
        name: name,
        value: name
      },
      message: 'Vendor will be available for selection'
    });

  } catch (error) {
    console.error('Error in create vendor API:', error);
    res.status(500).json({ 
      error: 'Failed to create vendor',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}