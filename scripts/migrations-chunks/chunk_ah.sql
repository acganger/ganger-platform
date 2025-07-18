-- This should be run after the table creation migration

-- Create temporary function to map legacy status to new status
CREATE OR REPLACE FUNCTION map_legacy_status(legacy_status TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE legacy_status
    WHEN 'Pending Approval' THEN 'pending_approval'
    WHEN 'Open' THEN 'open'
    WHEN 'In Progress' THEN 'in_progress'
    WHEN 'Stalled' THEN 'stalled'
    WHEN 'Approved' THEN 'approved'
    WHEN 'Denied' THEN 'denied'
    WHEN 'Completed' THEN 'completed'
    ELSE 'pending'
  END;
END;
$$ LANGUAGE plpgsql;

-- Create temporary function to map legacy priority
CREATE OR REPLACE FUNCTION map_legacy_priority(legacy_priority TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN legacy_priority ILIKE '%urgent%important%' THEN 'urgent'
    WHEN legacy_priority ILIKE '%urgent%' THEN 'high'
    WHEN legacy_priority ILIKE '%important%' THEN 'high'
    WHEN legacy_priority ILIKE '%not urgent%not important%' THEN 'low'
    ELSE 'normal'
  END;
END;
$$ LANGUAGE plpgsql;

-- Create temporary function to extract title from form data
CREATE OR REPLACE FUNCTION extract_title_from_payload(form_type TEXT, payload JSONB)
RETURNS TEXT AS $$
DECLARE
  title TEXT;
BEGIN
  title := CASE form_type
    WHEN 'support_ticket' THEN 
      COALESCE(payload->>'request_type', 'Support Ticket') || ' - ' || COALESCE(payload->>'location', 'Unknown')
    WHEN 'time_off_request' THEN 
      'Time Off Request - ' || COALESCE(payload->>'start_date', 'Unknown Date')
    WHEN 'punch_fix' THEN 
      'Punch Fix - ' || COALESCE(payload->>'date', 'Unknown Date')
    WHEN 'change_of_availability' THEN 
      'Availability Change - ' || COALESCE(payload->>'effective_date', 'Unknown Date')
    WHEN 'expense_reimbursement' THEN 
      'Expense Reimbursement - $' || COALESCE(payload->>'amount', '0')
    WHEN 'meeting_request' THEN 
      'Meeting Request - ' || COALESCE(payload->>'subject', 'Unknown Subject')
    WHEN 'impact_filter' THEN 
      'Impact Filter - ' || LEFT(COALESCE(payload->>'goal', 'Unknown Goal'), 50)
    ELSE form_type
  END;
  
  RETURN title;
END;
$$ LANGUAGE plpgsql;

-- Create temporary function to extract description
CREATE OR REPLACE FUNCTION extract_description_from_payload(form_type TEXT, payload JSONB)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE form_type
    WHEN 'support_ticket' THEN payload->>'details'
    WHEN 'time_off_request' THEN payload->>'reason'
    WHEN 'punch_fix' THEN payload->>'comments'
    WHEN 'change_of_availability' THEN payload->>'reason'
    WHEN 'expense_reimbursement' THEN payload->>'description'
    WHEN 'meeting_request' THEN payload->>'details'
    WHEN 'impact_filter' THEN payload->>'goal'
    ELSE payload::TEXT
  END;
END;
$$ LANGUAGE plpgsql;

-- Sample migration query (to be customized based on actual legacy data import)
-- This assumes you've imported the legacy MySQL data into a temporary table first

/*
-- Example: Import tickets from legacy system
INSERT INTO tickets (
  ticket_number,
  form_type,
  submitter_email,
  submitter_name,
  status,
  priority,
  location,
  assigned_to_email,
  created_at,
  updated_at,
  title,
  description,
  form_data,
  action_taken_at,
  completed_by_email
)
SELECT
  -- Generate new ticket numbers or use a mapping
  CASE 
    WHEN id < 100 THEN '24-' || LPAD(id::TEXT, 6, '0')
    ELSE '25-' || LPAD((id - 100)::TEXT, 6, '0')
  END,
  form_type,
  submitter_email,
  COALESCE(payload->>'submitter_name', split_part(submitter_email, '@', 1)),
  map_legacy_status(status),
  map_legacy_priority(priority),
  location,
  assigned_to_email,
  created_at,
  updated_at,
  extract_title_from_payload(form_type, payload::JSONB),
  extract_description_from_payload(form_type, payload::JSONB),
  payload::JSONB,
  action_taken_at,
  completed_by
FROM legacy_staff_tickets
WHERE submitter_email LIKE '%@gangerdermatology.com';

-- Import job queue entries
INSERT INTO job_queue (
  handler,
  payload,
  priority,
  retry_count,
  status,
  created_at
)
SELECT
  handler,
  payload::JSONB,
  priority,
  retry_count,
  LOWER(status),
  created_at
FROM legacy_staff_job_queue
WHERE status = 'pending';

*/

-- Clean up temporary functions
DROP FUNCTION IF EXISTS map_legacy_status(TEXT);
DROP FUNCTION IF EXISTS map_legacy_priority(TEXT);
DROP FUNCTION IF EXISTS extract_title_from_payload(TEXT, JSONB);
DROP FUNCTION IF EXISTS extract_description_from_payload(TEXT, JSONB);

-- Add some sample data for testing
INSERT INTO tickets (
  form_type,
  submitter_email,
  submitter_name,
  status,
  priority,
  location,
  title,
  description,
  form_data
) VALUES
(
  'support_ticket',
  'test@gangerdermatology.com',
  'Test User',
  'open',
  'normal',
  'Ann Arbor',
  'IT Support - Computer Issue',
  'My computer is running slowly and needs to be checked.',
  '{"location": "Ann Arbor", "request_type": "it_support", "priority": "Not Urgent + Important", "details": "My computer is running slowly and needs to be checked."}'::JSONB
),
(
  'time_off_request',
  'test@gangerdermatology.com',
  'Test User',
  'pending_approval',
  'normal',
  NULL,
  'Time Off Request - 2025-01-15',
  'Vacation request for family trip.',
  '{"start_date": "2025-01-15", "end_date": "2025-01-17", "reason": "Vacation request for family trip.", "requesting_pto": "Yes"}'::JSONB
);


-- Migration: 20250108_create_ai_purchasing_rls_policies.sql
-- ==========================================

-- Row Level Security Policies for AI Purchasing Agent Tables

-- Helper function to check if user is staff
CREATE OR REPLACE FUNCTION is_staff_member(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email LIKE '%@gangerdermatology.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin/manager
CREATE OR REPLACE FUNCTION is_purchasing_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- In future, this could check against a roles table
  -- For now, check if user is in finance or management
  RETURN user_email IN (
    'anand@gangerdermatology.com',
    'finance@gangerdermatology.com',
    'admin@gangerdermatology.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vendor Configurations Policies
-- Only admins can manage vendor configurations
CREATE POLICY "Admins can view all vendor configurations"
  ON vendor_configurations FOR SELECT
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'));

CREATE POLICY "Admins can create vendor configurations"
  ON vendor_configurations FOR INSERT
  TO authenticated
  WITH CHECK (is_purchasing_admin(auth.jwt()->>'email'));

CREATE POLICY "Admins can update vendor configurations"
  ON vendor_configurations FOR UPDATE
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'))
  WITH CHECK (is_purchasing_admin(auth.jwt()->>'email'));

CREATE POLICY "Admins can delete vendor configurations"
  ON vendor_configurations FOR DELETE
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'));

-- Standardized Products Policies
-- All staff can view products
CREATE POLICY "Staff can view active products"
  ON standardized_products FOR SELECT
  TO authenticated
  USING (is_staff_member(auth.jwt()->>'email') AND is_active = true);

CREATE POLICY "Admins can view all products"
  ON standardized_products FOR SELECT
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'));

CREATE POLICY "Admins can create products"
  ON standardized_products FOR INSERT
  TO authenticated
  WITH CHECK (is_purchasing_admin(auth.jwt()->>'email'));

CREATE POLICY "Admins can update products"
  ON standardized_products FOR UPDATE
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'))
  WITH CHECK (is_purchasing_admin(auth.jwt()->>'email'));

CREATE POLICY "Admins can delete products"
  ON standardized_products FOR DELETE
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'));

-- Vendor Product Mappings Policies
-- Staff can view mappings for active products
CREATE POLICY "Staff can view product mappings"
  ON vendor_product_mappings FOR SELECT
  TO authenticated
  USING (
    is_staff_member(auth.jwt()->>'email') AND
    EXISTS (
      SELECT 1 FROM standardized_products sp
      WHERE sp.id = vendor_product_mappings.standardized_product_id
      AND sp.is_active = true
    )
  );

CREATE POLICY "Admins can manage product mappings"
  ON vendor_product_mappings FOR ALL
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'))
  WITH CHECK (is_purchasing_admin(auth.jwt()->>'email'));

-- Purchase Requests Policies
-- Users can view their own requests
CREATE POLICY "Users can view their own purchase requests"
  ON purchase_requests FOR SELECT
  TO authenticated
  USING (requester_email = auth.jwt()->>'email');

-- Staff can view all requests from their department
CREATE POLICY "Staff can view department purchase requests"
  ON purchase_requests FOR SELECT
  TO authenticated
  USING (
    is_staff_member(auth.jwt()->>'email') AND
    department IN (
      SELECT department FROM purchase_requests
      WHERE requester_email = auth.jwt()->>'email'
    )
  );

-- Admins can view all requests
CREATE POLICY "Admins can view all purchase requests"
  ON purchase_requests FOR SELECT
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'));

-- All staff can create purchase requests
CREATE POLICY "Staff can create purchase requests"
  ON purchase_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    is_staff_member(auth.jwt()->>'email') AND
    requester_email = auth.jwt()->>'email'
  );

-- Users can update their own draft requests
CREATE POLICY "Users can update their draft purchase requests"
  ON purchase_requests FOR UPDATE
  TO authenticated
  USING (
    requester_email = auth.jwt()->>'email' AND
    status = 'draft'
  )
  WITH CHECK (
    requester_email = auth.jwt()->>'email' AND
    status IN ('draft', 'submitted')
  );

-- Admins can update any request
CREATE POLICY "Admins can update any purchase request"
  ON purchase_requests FOR UPDATE
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'))
  WITH CHECK (is_purchasing_admin(auth.jwt()->>'email'));

-- Only admins can delete requests
CREATE POLICY "Admins can delete purchase requests"
  ON purchase_requests FOR DELETE
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'));

-- Purchase Request Items Policies
-- Follow parent request permissions
CREATE POLICY "Users can view items for accessible requests"
  ON purchase_request_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchase_requests pr
      WHERE pr.id = purchase_request_items.purchase_request_id
      AND (
        pr.requester_email = auth.jwt()->>'email' OR
        is_purchasing_admin(auth.jwt()->>'email') OR
        (is_staff_member(auth.jwt()->>'email') AND pr.department IN (
          SELECT department FROM purchase_requests
          WHERE requester_email = auth.jwt()->>'email'
        ))
      )
    )
  );

CREATE POLICY "Users can manage items for their draft requests"
  ON purchase_request_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchase_requests pr
      WHERE pr.id = purchase_request_items.purchase_request_id
      AND pr.requester_email = auth.jwt()->>'email'
      AND pr.status = 'draft'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_requests pr
      WHERE pr.id = purchase_request_items.purchase_request_id
      AND pr.requester_email = auth.jwt()->>'email'
      AND pr.status = 'draft'
    )
  );

CREATE POLICY "Admins can manage any request items"
  ON purchase_request_items FOR ALL
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'))
  WITH CHECK (is_purchasing_admin(auth.jwt()->>'email'));

-- Price Comparisons Policies
-- View permissions follow request item permissions
CREATE POLICY "View price comparisons for accessible items"
  ON price_comparisons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchase_request_items pri
      JOIN purchase_requests pr ON pr.id = pri.purchase_request_id
      WHERE pri.id = price_comparisons.purchase_request_item_id
      AND (
        pr.requester_email = auth.jwt()->>'email' OR
        is_purchasing_admin(auth.jwt()->>'email')
      )
    )
  );

-- Only system/admins can create price comparisons
CREATE POLICY "Admins can manage price comparisons"
  ON price_comparisons FOR ALL
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'))
  WITH CHECK (is_purchasing_admin(auth.jwt()->>'email'));

-- Vendor Quotes Policies
-- Follow price comparison permissions
CREATE POLICY "View vendor quotes for accessible comparisons"
  ON vendor_quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM price_comparisons pc
      JOIN purchase_request_items pri ON pri.id = pc.purchase_request_item_id
      JOIN purchase_requests pr ON pr.id = pri.purchase_request_id
      WHERE pc.id = vendor_quotes.price_comparison_id
      AND (
        pr.requester_email = auth.jwt()->>'email' OR
        is_purchasing_admin(auth.jwt()->>'email')
      )
    )
  );

CREATE POLICY "Admins can manage vendor quotes"
  ON vendor_quotes FOR ALL
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'))
  WITH CHECK (is_purchasing_admin(auth.jwt()->>'email'));

-- Consolidated Orders Policies
-- Clinical staff can create and view their own orders
CREATE POLICY "Staff can view their own consolidated orders"
  ON consolidated_orders FOR SELECT
  TO authenticated
  USING (requester_email = auth.jwt()->>'email');

CREATE POLICY "Staff can view department consolidated orders"
  ON consolidated_orders FOR SELECT
  TO authenticated
  USING (
    is_staff_member(auth.jwt()->>'email') AND
    department IN (
      SELECT department FROM consolidated_orders
      WHERE requester_email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Admins can view all consolidated orders"
  ON consolidated_orders FOR SELECT
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'));

CREATE POLICY "Staff can create consolidated orders"
  ON consolidated_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    is_staff_member(auth.jwt()->>'email') AND
    requester_email = auth.jwt()->>'email'
  );

CREATE POLICY "Staff can update their draft consolidated orders"
  ON consolidated_orders FOR UPDATE
  TO authenticated
  USING (
    requester_email = auth.jwt()->>'email' AND
    status = 'draft'
  )
  WITH CHECK (
    requester_email = auth.jwt()->>'email' AND
    status IN ('draft', 'submitted')
  );

CREATE POLICY "Admins can manage any consolidated order"
  ON consolidated_orders FOR ALL
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'))
  WITH CHECK (is_purchasing_admin(auth.jwt()->>'email'));

-- Consolidated Order Items Policies
-- Follow parent order permissions
CREATE POLICY "View items for accessible consolidated orders"
  ON consolidated_order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consolidated_orders co
      WHERE co.id = consolidated_order_items.consolidated_order_id
      AND (
        co.requester_email = auth.jwt()->>'email' OR
        is_purchasing_admin(auth.jwt()->>'email') OR
        (is_staff_member(auth.jwt()->>'email') AND co.department IN (
          SELECT department FROM consolidated_orders
          WHERE requester_email = auth.jwt()->>'email'
        ))
      )
    )
  );

CREATE POLICY "Manage items for own draft consolidated orders"
  ON consolidated_order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consolidated_orders co
      WHERE co.id = consolidated_order_items.consolidated_order_id
      AND co.requester_email = auth.jwt()->>'email'
      AND co.status = 'draft'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consolidated_orders co
      WHERE co.id = consolidated_order_items.consolidated_order_id
      AND co.requester_email = auth.jwt()->>'email'
      AND co.status = 'draft'
    )
  );

CREATE POLICY "Admins can manage any consolidated order items"
  ON consolidated_order_items FOR ALL
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'))
  WITH CHECK (is_purchasing_admin(auth.jwt()->>'email'));

-- Vendor Order Splits Policies
-- View permissions based on related request/order
CREATE POLICY "View vendor splits for accessible requests"
  ON vendor_order_splits FOR SELECT
  TO authenticated
  USING (
    (
      purchase_request_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM purchase_requests pr
        WHERE pr.id = vendor_order_splits.purchase_request_id
        AND (
          pr.requester_email = auth.jwt()->>'email' OR
          is_purchasing_admin(auth.jwt()->>'email')
        )
      )
    ) OR (
      consolidated_order_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM consolidated_orders co
        WHERE co.id = vendor_order_splits.consolidated_order_id
        AND (
          co.requester_email = auth.jwt()->>'email' OR
          is_purchasing_admin(auth.jwt()->>'email')
        )
      )
    )
  );

CREATE POLICY "Admins can manage vendor order splits"
  ON vendor_order_splits FOR ALL
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'))
  WITH CHECK (is_purchasing_admin(auth.jwt()->>'email'));

-- Procurement Analytics Policies
-- All staff can view analytics
CREATE POLICY "Staff can view procurement analytics"
  ON procurement_analytics FOR SELECT
  TO authenticated
  USING (is_staff_member(auth.jwt()->>'email'));

-- Only admins can manage analytics
CREATE POLICY "Admins can manage procurement analytics"
  ON procurement_analytics FOR ALL
  TO authenticated
  USING (is_purchasing_admin(auth.jwt()->>'email'))
  WITH CHECK (is_purchasing_admin(auth.jwt()->>'email'));


-- Migration: 20250108_create_ai_purchasing_tables.sql
-- ==========================================

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


-- Migration: 20250108_seed_ai_purchasing_data.sql
-- ==========================================

-- Seed Data for AI Purchasing Agent
-- Based on actual purchase history analysis from Amazon and Henry Schein

-- Insert vendor configurations
INSERT INTO public.vendor_configurations (vendor_name, is_active, supports_real_time_pricing, supports_bulk_ordering, minimum_order_amount, free_shipping_threshold, average_delivery_days, notes)
VALUES 
  ('Henry Schein', true, false, true, 50.00, 100.00, 3, 'Primary medical supply vendor - 68% of spend'),
  ('Amazon Business', true, true, true, 0.00, 25.00, 2, 'Secondary vendor - 32% of spend, healthcare marketplace available'),
  ('McKesson', true, false, true, 100.00, 250.00, 5, 'Alternative vendor for comparison'),
  ('Cardinal Health', true, false, true, 150.00, 300.00, 5, 'Alternative vendor for comparison'),
  ('Medline', false, false, true, 75.00, 200.00, 4, 'Future vendor option');

-- Insert standardized products based on purchase history
-- Gloves (most frequently ordered)
INSERT INTO public.standardized_products (name, category, description, specifications, standard_package_size, unit_of_measure, units_per_package, minimum_order_quantity, average_monthly_usage, is_critical)
VALUES 
  ('Criterion Nitrile Exam Gloves - Medium', 'gloves_ppe', 'Blue nitrile exam gloves, powder-free, chemo tested', 
   '["Powder-free", "Chemo tested", "Non-sterile", "Blue color", "Textured fingertips"]'::jsonb, 
   '1 case (10 boxes)', 'case', 1000, 1, 50, true),
  
  ('Criterion Nitrile Exam Gloves - Large', 'gloves_ppe', 'Blue nitrile exam gloves, powder-free, chemo tested', 
   '["Powder-free", "Chemo tested", "Non-sterile", "Blue color", "Textured fingertips"]'::jsonb, 
   '1 case (10 boxes)', 'case', 1000, 1, 35, true),
  
  ('Criterion Nitrile Exam Gloves - Small', 'gloves_ppe', 'Blue nitrile exam gloves, powder-free, chemo tested', 
   '["Powder-free", "Chemo tested", "Non-sterile", "Blue color", "Textured fingertips"]'::jsonb, 
   '1 case (10 boxes)', 'case', 1000, 1, 25, true),
  
  ('Criterion Nitrile Exam Gloves - X-Large', 'gloves_ppe', 'Blue nitrile exam gloves, powder-free, chemo tested', 
   '["Powder-free", "Chemo tested", "Non-sterile", "Blue color", "Textured fingertips"]'::jsonb, 
   '1 case (10 boxes)', 'case', 1000, 1, 10, true);

-- Gauze and wound care
INSERT INTO public.standardized_products (name, category, description, specifications, standard_package_size, unit_of_measure, units_per_package, minimum_order_quantity, average_monthly_usage, is_critical)
VALUES 
  ('Gauze Sponges 4x4 inch', 'wound_care', '100% cotton gauze sponges, 12-ply, non-sterile', 
   '["4x4 inch size", "12-ply", "Non-sterile", "100% cotton", "Highly absorbent"]'::jsonb, 
   '1 case (10 packs)', 'case', 2000, 1, 30, true),
  
  ('Gauze Sponges 2x2 inch', 'wound_care', '100% cotton gauze sponges, 8-ply, non-sterile', 
   '["2x2 inch size", "8-ply", "Non-sterile", "100% cotton", "Highly absorbent"]'::jsonb, 
   '1 case (25 packs)', 'case', 5000, 1, 15, true),
  
  ('Telfa Non-Adherent Dressing 3x4 inch', 'wound_care', 'Non-adherent wound dressing, sterile', 
   '["3x4 inch size", "Non-adherent", "Sterile", "Individually wrapped"]'::jsonb, 
   '1 box (50 count)', 'box', 50, 1, 5, false);

-- Syringes and needles
INSERT INTO public.standardized_products (name, category, description, specifications, standard_package_size, unit_of_measure, units_per_package, minimum_order_quantity, average_monthly_usage, is_critical)
