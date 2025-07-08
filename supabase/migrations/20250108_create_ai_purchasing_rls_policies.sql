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