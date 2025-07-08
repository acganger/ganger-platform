-- AI Purchasing Agent Database Schema
-- This migration creates all tables needed for the AI-powered medical supply procurement system

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.consolidated_order_items CASCADE;
DROP TABLE IF EXISTS public.consolidated_orders CASCADE;
DROP TABLE IF EXISTS public.vendor_order_splits CASCADE;
DROP TABLE IF EXISTS public.vendor_quotes CASCADE;
DROP TABLE IF EXISTS public.price_comparisons CASCADE;
DROP TABLE IF EXISTS public.purchase_request_items CASCADE;
DROP TABLE IF EXISTS public.purchase_requests CASCADE;
DROP TABLE IF EXISTS public.vendor_product_mappings CASCADE;
DROP TABLE IF EXISTS public.standardized_products CASCADE;
DROP TABLE IF EXISTS public.vendor_configurations CASCADE;
DROP TABLE IF EXISTS public.procurement_analytics CASCADE;

-- Create vendor configurations table
CREATE TABLE public.vendor_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  auth_method TEXT CHECK (auth_method IN ('api_key', 'oauth', 'basic', 'none')),
  rate_limit_per_minute INTEGER DEFAULT 60,
  supports_real_time_pricing BOOLEAN DEFAULT false,
  supports_bulk_ordering BOOLEAN DEFAULT false,
  minimum_order_amount DECIMAL(10,2),
  free_shipping_threshold DECIMAL(10,2),
  average_delivery_days INTEGER,
  gpo_contract_number TEXT,
  contract_expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create standardized products catalog
CREATE TABLE public.standardized_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'gloves_ppe',
    'wound_care',
    'syringes',
    'paper_products',
    'antiseptics',
    'diagnostic_supplies',
    'surgical_supplies',
    'medications',
    'other'
  )),
  description TEXT,
  specifications JSONB DEFAULT '[]',
  standard_package_size TEXT NOT NULL,
  unit_of_measure TEXT NOT NULL,
  units_per_package INTEGER NOT NULL,
  minimum_order_quantity INTEGER DEFAULT 1,
  maximum_order_quantity INTEGER,
  reorder_point INTEGER,
  average_monthly_usage DECIMAL(10,2),
  last_order_date DATE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_critical BOOLEAN DEFAULT false,
  substitute_product_ids UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor product mappings
CREATE TABLE public.vendor_product_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  standardized_product_id UUID NOT NULL REFERENCES standardized_products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendor_configurations(id) ON DELETE CASCADE,
  vendor_sku TEXT NOT NULL,
  vendor_product_name TEXT NOT NULL,
  vendor_package_size TEXT,
  vendor_unit_price DECIMAL(10,2),
  last_known_price DECIMAL(10,2),
  last_price_update TIMESTAMPTZ,
  is_preferred BOOLEAN DEFAULT false,
  is_contract_item BOOLEAN DEFAULT false,
  contract_price DECIMAL(10,2),
  lead_time_days INTEGER,
  minimum_order_quantity INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, vendor_sku)
);

-- Create purchase requests table
CREATE TABLE public.purchase_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT UNIQUE NOT NULL,
  requester_email TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_id UUID REFERENCES auth.users(id),
  department TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN (
    'consolidated_order',
    'shopping_cart',
    'manual_entry',
    'recurring_order'
  )),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'submitted',
    'analyzing',
    'pending_approval',
    'approved',
    'rejected',
    'ordering',
    'ordered',
    'partially_received',
    'received',
    'cancelled'
  )),
  urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'emergency')),
  total_estimated_cost DECIMAL(10,2),
  total_actual_cost DECIMAL(10,2),
  estimated_savings DECIMAL(10,2),
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by_email TEXT,
  approved_by_id UUID REFERENCES auth.users(id),
  ordered_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create purchase request items table
CREATE TABLE public.purchase_request_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  standardized_product_id UUID REFERENCES standardized_products(id),
  product_name TEXT NOT NULL,
  requested_quantity INTEGER NOT NULL,
  unit_of_measure TEXT NOT NULL,
  estimated_unit_price DECIMAL(10,2),
  notes TEXT,
  vendor_sku TEXT,
  clinical_specifications TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create price comparisons table
CREATE TABLE public.price_comparisons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_request_item_id UUID NOT NULL REFERENCES purchase_request_items(id) ON DELETE CASCADE,
  analysis_timestamp TIMESTAMPTZ DEFAULT NOW(),
  recommended_vendor_id UUID REFERENCES vendor_configurations(id),
  potential_savings DECIMAL(10,2),
  savings_percentage DECIMAL(5,2),
  recommendation_reason TEXT,
  ai_confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor quotes table
CREATE TABLE public.vendor_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  price_comparison_id UUID NOT NULL REFERENCES price_comparisons(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendor_configurations(id),
  vendor_product_mapping_id UUID REFERENCES vendor_product_mappings(id),
  product_match_score DECIMAL(3,2),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  estimated_delivery_date DATE,
  is_contract_pricing BOOLEAN DEFAULT false,
  is_in_stock BOOLEAN DEFAULT true,
  quote_valid_until TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create consolidated orders table (for order form functionality)
CREATE TABLE public.consolidated_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  requester_email TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_id UUID REFERENCES auth.users(id),
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'submitted',
    'analyzing',
    'optimized',
    'approved',
    'ordered'
  )),
  urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'emergency')),
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  optimized_at TIMESTAMPTZ,
  total_estimated_savings DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create consolidated order items table
CREATE TABLE public.consolidated_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consolidated_order_id UUID NOT NULL REFERENCES consolidated_orders(id) ON DELETE CASCADE,
  standardized_product_id UUID NOT NULL REFERENCES standardized_products(id),
  requested_quantity INTEGER NOT NULL,
  optimized_quantity INTEGER,
  justification TEXT,
  urgency_level TEXT DEFAULT 'routine' CHECK (urgency_level IN ('routine', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor order splits table (for optimized ordering)
CREATE TABLE public.vendor_order_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_request_id UUID REFERENCES purchase_requests(id) ON DELETE CASCADE,
  consolidated_order_id UUID REFERENCES consolidated_orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendor_configurations(id),
  order_total DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  estimated_delivery_date DATE,
  vendor_order_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'placed',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled'
  )),
  placed_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (purchase_request_id IS NOT NULL AND consolidated_order_id IS NULL) OR
    (purchase_request_id IS NULL AND consolidated_order_id IS NOT NULL)
  )
);

-- Create procurement analytics table
CREATE TABLE public.procurement_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_spend DECIMAL(12,2),
  total_savings DECIMAL(12,2),
  savings_percentage DECIMAL(5,2),
  total_orders INTEGER,
  average_order_value DECIMAL(10,2),
  contract_compliance_rate DECIMAL(5,2),
  vendor_diversity_score DECIMAL(5,2),
  top_products JSONB DEFAULT '[]',
  top_vendors JSONB DEFAULT '[]',
  savings_by_category JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_start, period_end)
);

-- Create indexes for performance
CREATE INDEX idx_standardized_products_category ON standardized_products(category);
CREATE INDEX idx_standardized_products_active ON standardized_products(is_active);
CREATE INDEX idx_standardized_products_name ON standardized_products USING GIN(to_tsvector('english', name));

CREATE INDEX idx_vendor_product_mappings_product ON vendor_product_mappings(standardized_product_id);
CREATE INDEX idx_vendor_product_mappings_vendor ON vendor_product_mappings(vendor_id);
CREATE INDEX idx_vendor_product_mappings_sku ON vendor_product_mappings(vendor_sku);

CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_requests_requester ON purchase_requests(requester_email);
CREATE INDEX idx_purchase_requests_created ON purchase_requests(created_at DESC);

CREATE INDEX idx_purchase_request_items_request ON purchase_request_items(purchase_request_id);
CREATE INDEX idx_purchase_request_items_product ON purchase_request_items(standardized_product_id);

CREATE INDEX idx_vendor_quotes_comparison ON vendor_quotes(price_comparison_id);
CREATE INDEX idx_vendor_quotes_vendor ON vendor_quotes(vendor_id);

CREATE INDEX idx_consolidated_orders_status ON consolidated_orders(status);
CREATE INDEX idx_consolidated_orders_requester ON consolidated_orders(requester_email);
CREATE INDEX idx_consolidated_orders_created ON consolidated_orders(created_at DESC);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendor_configurations_updated_at BEFORE UPDATE ON vendor_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_standardized_products_updated_at BEFORE UPDATE ON standardized_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_product_mappings_updated_at BEFORE UPDATE ON vendor_product_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON purchase_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_request_items_updated_at BEFORE UPDATE ON purchase_request_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consolidated_orders_updated_at BEFORE UPDATE ON consolidated_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consolidated_order_items_updated_at BEFORE UPDATE ON consolidated_order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_order_splits_updated_at BEFORE UPDATE ON vendor_order_splits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  current_date_str TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  current_date_str := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM LENGTH(prefix) + 10) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM purchase_requests
  WHERE request_number LIKE prefix || '-' || current_date_str || '%';
  
  new_number := prefix || '-' || current_date_str || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies (to be implemented in separate migration)
ALTER TABLE vendor_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE standardized_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consolidated_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE consolidated_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_order_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_analytics ENABLE ROW LEVEL SECURITY;