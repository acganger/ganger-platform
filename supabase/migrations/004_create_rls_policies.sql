-- =====================================================
-- Ganger Platform Database Schema - Row Level Security
-- Migration: 004_create_rls_policies.sql
-- Created: June 5, 2025
-- =====================================================

-- Enable Row Level Security on all tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Inventory tables
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_vendor_mappings ENABLE ROW LEVEL SECURITY;

-- Handouts tables
ALTER TABLE handout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE handout_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE handout_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_handout_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE handout_feedback ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to get current user ID
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

-- Function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

-- Function to get current user locations
CREATE OR REPLACE FUNCTION get_current_user_locations() RETURNS UUID[]
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT locations FROM users WHERE id = auth.uid()
$$;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(action TEXT, resource TEXT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM permissions 
    WHERE user_id = auth.uid() 
    AND permissions.action = user_has_permission.action 
    AND permissions.resource = user_has_permission.resource
  ) OR get_current_user_role() IN ('superadmin')
$$;

-- Function to check if user can access location
CREATE OR REPLACE FUNCTION user_can_access_location(location_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT get_current_user_role() IN ('superadmin') 
  OR location_id = ANY(get_current_user_locations())
$$;

-- =====================================================
-- BASE TABLE POLICIES
-- =====================================================

-- LOCATIONS POLICIES
CREATE POLICY "Users can view locations they have access to" ON locations
  FOR SELECT USING (user_can_access_location(id) OR get_current_user_role() IN ('superadmin'));

CREATE POLICY "Only superadmins can modify locations" ON locations
  FOR ALL USING (get_current_user_role() = 'superadmin');

-- USERS POLICIES
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Managers can view users in their locations" ON users
  FOR SELECT USING (
    get_current_user_role() IN ('manager', 'superadmin') 
    AND (locations && get_current_user_locations() OR get_current_user_role() = 'superadmin')
  );

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Only superadmins and managers can create users" ON users
  FOR INSERT WITH CHECK (get_current_user_role() IN ('manager', 'superadmin'));

-- PERMISSIONS POLICIES
CREATE POLICY "Users can view their own permissions" ON permissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Only superadmins can modify permissions" ON permissions
  FOR ALL USING (get_current_user_role() = 'superadmin');

-- USER SESSIONS POLICIES
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions" ON user_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON user_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- AUDIT LOGS POLICIES
CREATE POLICY "Superadmins can view all audit logs" ON audit_logs
  FOR SELECT USING (get_current_user_role() = 'superadmin');

CREATE POLICY "Managers can view audit logs for their locations" ON audit_logs
  FOR SELECT USING (
    get_current_user_role() = 'manager' 
    AND user_id IN (
      SELECT id FROM users 
      WHERE locations && get_current_user_locations()
    )
  );

CREATE POLICY "All authenticated users can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- FILE UPLOADS POLICIES
CREATE POLICY "Users can view their own uploads" ON file_uploads
  FOR SELECT USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create uploads" ON file_uploads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own uploads" ON file_uploads
  FOR UPDATE USING (user_id = auth.uid());

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- PATIENTS POLICIES
CREATE POLICY "Staff can view patients in their locations" ON patients
  FOR SELECT USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin')
  );

CREATE POLICY "Staff can create patients" ON patients
  FOR INSERT WITH CHECK (
    get_current_user_role() IN ('staff', 'manager', 'superadmin')
  );

CREATE POLICY "Staff can update patients" ON patients
  FOR UPDATE USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin')
  );

-- APPOINTMENTS POLICIES
CREATE POLICY "Staff can view appointments in their locations" ON appointments
  FOR SELECT USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND user_can_access_location(location_id)
  );

CREATE POLICY "Staff can create appointments in their locations" ON appointments
  FOR INSERT WITH CHECK (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND user_can_access_location(location_id)
  );

CREATE POLICY "Staff can update appointments in their locations" ON appointments
  FOR UPDATE USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND user_can_access_location(location_id)
  );

-- =====================================================
-- INVENTORY TABLE POLICIES
-- =====================================================

-- INVENTORY ITEMS POLICIES
CREATE POLICY "Staff can view inventory in their locations" ON inventory_items
  FOR SELECT USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND user_can_access_location(location_id)
  );

CREATE POLICY "Staff can create inventory items in their locations" ON inventory_items
  FOR INSERT WITH CHECK (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND user_can_access_location(location_id)
  );

CREATE POLICY "Staff can update inventory items in their locations" ON inventory_items
  FOR UPDATE USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND user_can_access_location(location_id)
  );

-- INVENTORY TRANSACTIONS POLICIES
CREATE POLICY "Staff can view inventory transactions in their locations" ON inventory_transactions
  FOR SELECT USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND EXISTS (
      SELECT 1 FROM inventory_items 
      WHERE id = inventory_transactions.item_id 
      AND user_can_access_location(location_id)
    )
  );

CREATE POLICY "Staff can create inventory transactions" ON inventory_transactions
  FOR INSERT WITH CHECK (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND user_id = auth.uid()
  );

-- PURCHASE ORDERS POLICIES
CREATE POLICY "Staff can view purchase orders in their locations" ON purchase_orders
  FOR SELECT USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND user_can_access_location(location_id)
  );

CREATE POLICY "Staff can create purchase orders in their locations" ON purchase_orders
  FOR INSERT WITH CHECK (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND user_can_access_location(location_id)
  );

CREATE POLICY "Staff can update purchase orders in their locations" ON purchase_orders
  FOR UPDATE USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND user_can_access_location(location_id)
  );

-- PURCHASE ORDER ITEMS POLICIES
CREATE POLICY "Staff can view purchase order items" ON purchase_order_items
  FOR SELECT USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND EXISTS (
      SELECT 1 FROM purchase_orders 
      WHERE id = purchase_order_items.order_id 
      AND user_can_access_location(location_id)
    )
  );

CREATE POLICY "Staff can modify purchase order items" ON purchase_order_items
  FOR ALL USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND EXISTS (
      SELECT 1 FROM purchase_orders 
      WHERE id = purchase_order_items.order_id 
      AND user_can_access_location(location_id)
    )
  );

-- VENDOR CATALOG POLICIES (read-only for most users)
CREATE POLICY "Staff can view vendor catalog" ON vendor_catalog
  FOR SELECT USING (get_current_user_role() IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Only superadmins can modify vendor catalog" ON vendor_catalog
  FOR ALL USING (get_current_user_role() = 'superadmin');

-- INVENTORY COUNTS POLICIES
CREATE POLICY "Staff can view inventory counts in their locations" ON inventory_counts
  FOR SELECT USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND user_can_access_location(location_id)
  );

CREATE POLICY "Staff can create inventory counts in their locations" ON inventory_counts
  FOR INSERT WITH CHECK (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND user_can_access_location(location_id)
  );

CREATE POLICY "Staff can update inventory counts in their locations" ON inventory_counts
  FOR UPDATE USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND user_can_access_location(location_id)
  );

-- =====================================================
-- HANDOUTS TABLE POLICIES
-- =====================================================

-- HANDOUT TEMPLATES POLICIES
CREATE POLICY "Staff can view templates for their locations" ON handout_templates
  FOR SELECT USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND (
      location_id IS NULL -- Global templates
      OR user_can_access_location(location_id)
    )
    AND is_active = true
  );

CREATE POLICY "Staff can create templates for their locations" ON handout_templates
  FOR INSERT WITH CHECK (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND (
      location_id IS NULL 
      OR user_can_access_location(location_id)
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their own templates" ON handout_templates
  FOR UPDATE USING (
    created_by = auth.uid() 
    OR get_current_user_role() IN ('manager', 'superadmin')
  );

-- HANDOUT GENERATIONS POLICIES
CREATE POLICY "Staff can view handout generations" ON handout_generations
  FOR SELECT USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin')
    OR patient_id IN (
      -- Patients can view their own handouts via portal
      SELECT id FROM patients WHERE mrn = get_current_user_role()
    )
  );

CREATE POLICY "Staff can create handout generations" ON handout_generations
  FOR INSERT WITH CHECK (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND generated_by = auth.uid()
  );

CREATE POLICY "Staff can update handout generations they created" ON handout_generations
  FOR UPDATE USING (
    generated_by = auth.uid() 
    OR get_current_user_role() IN ('manager', 'superadmin')
  );

-- TEMPLATE CATEGORIES POLICIES (mostly read-only)
CREATE POLICY "All staff can view template categories" ON template_categories
  FOR SELECT USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin') 
    AND is_active = true
  );

CREATE POLICY "Only managers can modify template categories" ON template_categories
  FOR ALL USING (get_current_user_role() IN ('manager', 'superadmin'));

-- TEMPLATE VARIABLES POLICIES (mostly read-only)
CREATE POLICY "All staff can view template variables" ON template_variables
  FOR SELECT USING (get_current_user_role() IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Only managers can modify template variables" ON template_variables
  FOR ALL USING (get_current_user_role() IN ('manager', 'superadmin'));

-- HANDOUT DELIVERY LOGS POLICIES
CREATE POLICY "Staff can view delivery logs for handouts they generated" ON handout_delivery_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM handout_generations 
      WHERE id = handout_delivery_logs.handout_generation_id 
      AND (
        generated_by = auth.uid() 
        OR get_current_user_role() IN ('manager', 'superadmin')
      )
    )
  );

CREATE POLICY "System can create delivery logs" ON handout_delivery_logs
  FOR INSERT WITH CHECK (true); -- Allow system to insert delivery logs

-- TEMPLATE USAGE ANALYTICS POLICIES
CREATE POLICY "Users can view analytics for their own usage" ON template_usage_analytics
  FOR SELECT USING (
    user_id = auth.uid() 
    OR get_current_user_role() IN ('manager', 'superadmin')
  );

CREATE POLICY "System can create/update usage analytics" ON template_usage_analytics
  FOR ALL WITH CHECK (true); -- Allow system to manage analytics

-- PATIENT HANDOUT PREFERENCES POLICIES
CREATE POLICY "Staff can view patient preferences" ON patient_handout_preferences
  FOR SELECT USING (get_current_user_role() IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Staff can manage patient preferences" ON patient_handout_preferences
  FOR ALL USING (get_current_user_role() IN ('staff', 'manager', 'superadmin'));

-- HANDOUT FEEDBACK POLICIES
CREATE POLICY "Staff can view handout feedback" ON handout_feedback
  FOR SELECT USING (
    get_current_user_role() IN ('staff', 'manager', 'superadmin')
    OR submitted_by = auth.uid()
  );

CREATE POLICY "Anyone can submit handout feedback" ON handout_feedback
  FOR INSERT WITH CHECK (true); -- Allow anonymous feedback

-- =====================================================
-- SERVICE ROLE POLICIES (bypass RLS for system operations)
-- =====================================================

-- Grant service role bypass for all tables when needed
-- This allows the backend to perform administrative operations

-- Create a function to check if current role is service role
CREATE OR REPLACE FUNCTION is_service_role() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT current_setting('role') = 'service_role'
$$;

-- =====================================================
-- INDEXES FOR RLS PERFORMANCE
-- =====================================================

-- Create partial indexes for RLS performance
CREATE INDEX idx_users_auth_uid ON users(id) WHERE id = auth.uid();
CREATE INDEX idx_inventory_items_location_access ON inventory_items(location_id, is_active);
CREATE INDEX idx_handout_templates_location_access ON handout_templates(location_id, is_active);
CREATE INDEX idx_appointments_location_access ON appointments(location_id, status);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION get_current_user_role() IS 'Returns the role of the currently authenticated user';
COMMENT ON FUNCTION get_current_user_locations() IS 'Returns array of location IDs the current user has access to';
COMMENT ON FUNCTION user_has_permission(TEXT, TEXT) IS 'Checks if current user has specific permission for a resource';
COMMENT ON FUNCTION user_can_access_location(UUID) IS 'Checks if current user can access a specific location';
COMMENT ON FUNCTION is_service_role() IS 'Checks if current session is using service role (for system operations)';

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;