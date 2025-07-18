-- HANDOUT GENERATIONS TABLE
-- =====================================================
CREATE TABLE handout_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES handout_templates(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('print', 'email', 'sms', 'portal')),
    delivery_address VARCHAR(255), -- Email address, phone number, or portal user ID
    pdf_url VARCHAR(500),
    pdf_size_bytes INTEGER,
    status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'delivered', 'failed', 'cancelled')),
    variables_used JSONB DEFAULT '{}',
    delivery_attempts INTEGER DEFAULT 0,
    last_delivery_attempt TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    tracking_id VARCHAR(100), -- For email/SMS tracking
    patient_viewed_at TIMESTAMPTZ, -- When patient opened/viewed
    print_queue_id VARCHAR(100), -- For print management
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT handout_generations_delivery_attempts_non_negative CHECK (delivery_attempts >= 0),
    CONSTRAINT handout_generations_pdf_size_positive CHECK (pdf_size_bytes IS NULL OR pdf_size_bytes > 0)
);

-- =====================================================
-- TEMPLATE CATEGORIES TABLE
-- =====================================================
CREATE TABLE template_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES template_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(50), -- Icon name for UI
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TEMPLATE VARIABLES TABLE (predefined variables)
-- =====================================================
CREATE TABLE template_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    variable_type VARCHAR(20) NOT NULL CHECK (variable_type IN ('text', 'number', 'date', 'boolean', 'email', 'phone', 'url', 'textarea')),
    is_required BOOLEAN DEFAULT false,
    default_value TEXT,
    validation_pattern VARCHAR(500), -- Regex pattern for validation
    data_source VARCHAR(50), -- 'patient', 'appointment', 'provider', 'location', 'manual'
    source_field VARCHAR(100), -- Field name in source data
    format_template VARCHAR(255), -- How to format the value
    category VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_system_variable BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- HANDOUT DELIVERY LOGS TABLE
-- =====================================================
CREATE TABLE handout_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handout_generation_id UUID REFERENCES handout_generations(id) ON DELETE CASCADE,
    delivery_method VARCHAR(20) NOT NULL,
    delivery_address VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
    external_id VARCHAR(255), -- ID from email/SMS service
    response_data JSONB DEFAULT '{}',
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT handout_delivery_logs_retry_count_non_negative CHECK (retry_count >= 0)
);

-- =====================================================
-- TEMPLATE USAGE ANALYTICS TABLE
-- =====================================================
CREATE TABLE template_usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES handout_templates(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    usage_date DATE NOT NULL,
    generation_count INTEGER DEFAULT 1,
    delivery_count INTEGER DEFAULT 0,
    print_count INTEGER DEFAULT 0,
    email_count INTEGER DEFAULT 0,
    sms_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT template_usage_analytics_counts_non_negative CHECK (
        generation_count >= 0 AND 
        delivery_count >= 0 AND 
        print_count >= 0 AND 
        email_count >= 0 AND 
        sms_count >= 0 AND 
        success_count >= 0 AND 
        failure_count >= 0
    ),
    UNIQUE(template_id, location_id, user_id, usage_date)
);

-- =====================================================
-- PATIENT HANDOUT PREFERENCES TABLE
-- =====================================================
CREATE TABLE patient_handout_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    preferred_delivery_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_delivery_method IN ('print', 'email', 'sms', 'portal')),
    email_address VARCHAR(255),
    phone_number VARCHAR(20),
    language_preference VARCHAR(10) DEFAULT 'en',
    font_size_preference VARCHAR(10) DEFAULT 'normal' CHECK (font_size_preference IN ('small', 'normal', 'large')),
    opt_out_email BOOLEAN DEFAULT false,
    opt_out_sms BOOLEAN DEFAULT false,
    communication_consent BOOLEAN DEFAULT true,
    consent_date TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(patient_id)
);

-- =====================================================
-- HANDOUT FEEDBACK TABLE
-- =====================================================
CREATE TABLE handout_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handout_generation_id UUID REFERENCES handout_generations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES handout_templates(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('rating', 'comment', 'suggestion', 'complaint')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_helpful BOOLEAN,
    suggestions TEXT,
    contact_requested BOOLEAN DEFAULT false,
    feedback_source VARCHAR(20) DEFAULT 'patient' CHECK (feedback_source IN ('patient', 'provider', 'staff')),
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Handout templates indexes
CREATE INDEX idx_handout_templates_name ON handout_templates(name);
CREATE INDEX idx_handout_templates_category ON handout_templates(category);
CREATE INDEX idx_handout_templates_template_type ON handout_templates(template_type);
CREATE INDEX idx_handout_templates_is_active ON handout_templates(is_active);
CREATE INDEX idx_handout_templates_created_by ON handout_templates(created_by);
CREATE INDEX idx_handout_templates_location_id ON handout_templates(location_id);
CREATE INDEX idx_handout_templates_approval_status ON handout_templates(approval_status);
CREATE INDEX idx_handout_templates_tags ON handout_templates USING GIN(tags);

-- Handout generations indexes
CREATE INDEX idx_handout_generations_template_id ON handout_generations(template_id);
CREATE INDEX idx_handout_generations_patient_id ON handout_generations(patient_id);
CREATE INDEX idx_handout_generations_generated_by ON handout_generations(generated_by);
CREATE INDEX idx_handout_generations_delivery_method ON handout_generations(delivery_method);
CREATE INDEX idx_handout_generations_status ON handout_generations(status);
CREATE INDEX idx_handout_generations_created_at ON handout_generations(created_at);
CREATE INDEX idx_handout_generations_delivered_at ON handout_generations(delivered_at);

-- Template categories indexes
CREATE INDEX idx_template_categories_name ON template_categories(name);
CREATE INDEX idx_template_categories_parent_id ON template_categories(parent_category_id);
CREATE INDEX idx_template_categories_sort_order ON template_categories(sort_order);
CREATE INDEX idx_template_categories_is_active ON template_categories(is_active);

-- Template variables indexes
CREATE INDEX idx_template_variables_name ON template_variables(name);
CREATE INDEX idx_template_variables_variable_type ON template_variables(variable_type);
CREATE INDEX idx_template_variables_data_source ON template_variables(data_source);
CREATE INDEX idx_template_variables_category ON template_variables(category);
CREATE INDEX idx_template_variables_sort_order ON template_variables(sort_order);

-- Handout delivery logs indexes
CREATE INDEX idx_handout_delivery_logs_generation_id ON handout_delivery_logs(handout_generation_id);
CREATE INDEX idx_handout_delivery_logs_delivery_method ON handout_delivery_logs(delivery_method);
CREATE INDEX idx_handout_delivery_logs_status ON handout_delivery_logs(status);
CREATE INDEX idx_handout_delivery_logs_created_at ON handout_delivery_logs(created_at);
CREATE INDEX idx_handout_delivery_logs_external_id ON handout_delivery_logs(external_id) WHERE external_id IS NOT NULL;

-- Template usage analytics indexes
CREATE INDEX idx_template_usage_analytics_template_id ON template_usage_analytics(template_id);
CREATE INDEX idx_template_usage_analytics_location_id ON template_usage_analytics(location_id);
CREATE INDEX idx_template_usage_analytics_usage_date ON template_usage_analytics(usage_date);
CREATE INDEX idx_template_usage_analytics_user_id ON template_usage_analytics(user_id);

-- Patient handout preferences indexes
CREATE INDEX idx_patient_handout_preferences_patient_id ON patient_handout_preferences(patient_id);
CREATE INDEX idx_patient_handout_preferences_preferred_delivery ON patient_handout_preferences(preferred_delivery_method);

-- Handout feedback indexes
CREATE INDEX idx_handout_feedback_generation_id ON handout_feedback(handout_generation_id);
CREATE INDEX idx_handout_feedback_template_id ON handout_feedback(template_id);
CREATE INDEX idx_handout_feedback_patient_id ON handout_feedback(patient_id);
CREATE INDEX idx_handout_feedback_feedback_type ON handout_feedback(feedback_type);
CREATE INDEX idx_handout_feedback_rating ON handout_feedback(rating) WHERE rating IS NOT NULL;
CREATE INDEX idx_handout_feedback_created_at ON handout_feedback(created_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_handout_templates_updated_at BEFORE UPDATE ON handout_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_handout_generations_updated_at BEFORE UPDATE ON handout_generations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_categories_updated_at BEFORE UPDATE ON template_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_variables_updated_at BEFORE UPDATE ON template_variables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_usage_analytics_updated_at BEFORE UPDATE ON template_usage_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_handout_preferences_updated_at BEFORE UPDATE ON patient_handout_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR HANDOUT MANAGEMENT
-- =====================================================

-- Function to record template usage
CREATE OR REPLACE FUNCTION record_template_usage(
    p_template_id UUID,
    p_location_id UUID,
    p_user_id UUID,
    p_delivery_method VARCHAR DEFAULT 'email',
    p_success BOOLEAN DEFAULT true
) RETURNS VOID AS $$
BEGIN
    INSERT INTO template_usage_analytics (
        template_id,
        location_id,
        user_id,
        usage_date,
        generation_count,
        delivery_count,
        print_count,
        email_count,
        sms_count,
        success_count,
        failure_count
    ) VALUES (
        p_template_id,
        p_location_id,
        p_user_id,
        CURRENT_DATE,
        1,
        1,
        CASE WHEN p_delivery_method = 'print' THEN 1 ELSE 0 END,
        CASE WHEN p_delivery_method = 'email' THEN 1 ELSE 0 END,
        CASE WHEN p_delivery_method = 'sms' THEN 1 ELSE 0 END,
        CASE WHEN p_success THEN 1 ELSE 0 END,
        CASE WHEN p_success THEN 0 ELSE 1 END
    )
    ON CONFLICT (template_id, location_id, user_id, usage_date)
    DO UPDATE SET
        generation_count = template_usage_analytics.generation_count + 1,
        delivery_count = template_usage_analytics.delivery_count + 1,
        print_count = template_usage_analytics.print_count + CASE WHEN p_delivery_method = 'print' THEN 1 ELSE 0 END,
        email_count = template_usage_analytics.email_count + CASE WHEN p_delivery_method = 'email' THEN 1 ELSE 0 END,
        sms_count = template_usage_analytics.sms_count + CASE WHEN p_delivery_method = 'sms' THEN 1 ELSE 0 END,
        success_count = template_usage_analytics.success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
        failure_count = template_usage_analytics.failure_count + CASE WHEN p_success THEN 0 ELSE 1 END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get template variables with their values for a specific context
CREATE OR REPLACE FUNCTION get_template_variables_with_values(
    p_template_id UUID,
    p_patient_id UUID DEFAULT NULL,
    p_appointment_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    variable_name VARCHAR,
    display_name VARCHAR,
    variable_type VARCHAR,
    is_required BOOLEAN,
    resolved_value TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tv.name,
        tv.display_name,
        tv.variable_type,
        tv.is_required,
        CASE 
            WHEN tv.data_source = 'patient' AND p_patient_id IS NOT NULL THEN
                CASE tv.source_field
                    WHEN 'first_name' THEN (SELECT first_name FROM patients WHERE id = p_patient_id)
                    WHEN 'last_name' THEN (SELECT last_name FROM patients WHERE id = p_patient_id)
                    WHEN 'full_name' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM patients WHERE id = p_patient_id)
                    WHEN 'mrn' THEN (SELECT mrn FROM patients WHERE id = p_patient_id)
                    WHEN 'date_of_birth' THEN (SELECT date_of_birth::TEXT FROM patients WHERE id = p_patient_id)
                    WHEN 'email' THEN (SELECT email FROM patients WHERE id = p_patient_id)
                    WHEN 'phone' THEN (SELECT phone FROM patients WHERE id = p_patient_id)
                    ELSE tv.default_value
                END
            WHEN tv.data_source = 'user' AND p_user_id IS NOT NULL THEN
                CASE tv.source_field
                    WHEN 'name' THEN (SELECT name FROM users WHERE id = p_user_id)
                    WHEN 'email' THEN (SELECT email FROM users WHERE id = p_user_id)
                    ELSE tv.default_value
                END
            WHEN tv.data_source = 'system' THEN
                CASE tv.source_field
                    WHEN 'current_date' THEN CURRENT_DATE::TEXT
                    WHEN 'current_time' THEN CURRENT_TIME::TEXT
                    WHEN 'current_datetime' THEN NOW()::TEXT
                    ELSE tv.default_value
                END
            ELSE tv.default_value
        END
    FROM template_variables tv
    WHERE tv.name = ANY(
        SELECT jsonb_array_elements_text(variables)
        FROM handout_templates
        WHERE id = p_template_id
    )
    ORDER BY tv.sort_order, tv.name;
END;
$$ LANGUAGE plpgsql;


-- Migration: 004_create_rls_policies.sql
-- ==========================================

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


-- Migration: 005_seed_data.sql
-- ==========================================

-- =====================================================
-- Ganger Platform Database Schema - Seed Data
-- Migration: 005_seed_data.sql
-- Created: June 5, 2025
-- =====================================================

-- =====================================================
-- LOCATIONS SEED DATA
-- =====================================================
INSERT INTO locations (id, name, address, city, state, zip_code, phone, email, timezone, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Ganger Dermatology - Main Office', '123 Medical Plaza Dr', 'Charlotte', 'NC', '28207', '(704) 555-0123', 'main@gangerdermatology.com', 'America/New_York', true),
('550e8400-e29b-41d4-a716-446655440002', 'Ganger Dermatology - North Location', '456 Healthcare Blvd', 'Charlotte', 'NC', '28262', '(704) 555-0124', 'north@gangerdermatology.com', 'America/New_York', true),
('550e8400-e29b-41d4-a716-446655440003', 'Ganger Dermatology - South Location', '789 Medical Center Way', 'Charlotte', 'NC', '28226', '(704) 555-0125', 'south@gangerdermatology.com', 'America/New_York', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TEMPLATE CATEGORIES SEED DATA
-- =====================================================
INSERT INTO template_categories (id, name, description, parent_category_id, sort_order, icon, color, is_active) VALUES
('c1000000-0000-0000-0000-000000000001', 'General Education', 'General patient education materials', NULL, 1, 'book', '#3B82F6', true),
('c1000000-0000-0000-0000-000000000002', 'Pre-Procedure', 'Instructions before medical procedures', NULL, 2, 'calendar', '#059669', true),
('c1000000-0000-0000-0000-000000000003', 'Post-Procedure', 'Care instructions after procedures', NULL, 3, 'heart', '#DC2626', true),
('c1000000-0000-0000-0000-000000000004', 'Medication Information', 'Drug information and instructions', NULL, 4, 'pill', '#7C3AED', true),
('c1000000-0000-0000-0000-000000000005', 'Skin Care', 'Dermatology-specific care instructions', 'c1000000-0000-0000-0000-000000000001', 1, 'sun', '#F59E0B', true),
('c1000000-0000-0000-0000-000000000006', 'Appointment Preparation', 'How to prepare for appointments', 'c1000000-0000-0000-0000-000000000002', 1, 'clock', '#10B981', true),
('c1000000-0000-0000-0000-000000000007', 'Wound Care', 'Post-procedure wound care', 'c1000000-0000-0000-0000-000000000003', 1, 'bandage', '#EF4444', true),
('c1000000-0000-0000-0000-000000000008', 'Insurance Information', 'Insurance and billing information', NULL, 5, 'shield', '#6366F1', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TEMPLATE VARIABLES SEED DATA
-- =====================================================
INSERT INTO template_variables (id, name, display_name, description, variable_type, is_required, default_value, data_source, source_field, category, sort_order, is_system_variable) VALUES
-- Patient variables
('v1000000-0000-0000-0000-000000000001', 'patient_first_name', 'Patient First Name', 'The patient''s first name', 'text', true, NULL, 'patient', 'first_name', 'Patient Information', 1, true),
('v1000000-0000-0000-0000-000000000002', 'patient_last_name', 'Patient Last Name', 'The patient''s last name', 'text', true, NULL, 'patient', 'last_name', 'Patient Information', 2, true),
('v1000000-0000-0000-0000-000000000003', 'patient_full_name', 'Patient Full Name', 'The patient''s full name', 'text', true, NULL, 'patient', 'full_name', 'Patient Information', 3, true),
('v1000000-0000-0000-0000-000000000004', 'patient_mrn', 'Medical Record Number', 'The patient''s medical record number', 'text', true, NULL, 'patient', 'mrn', 'Patient Information', 4, true),
('v1000000-0000-0000-0000-000000000005', 'patient_dob', 'Date of Birth', 'The patient''s date of birth', 'date', false, NULL, 'patient', 'date_of_birth', 'Patient Information', 5, true),
('v1000000-0000-0000-0000-000000000006', 'patient_email', 'Patient Email', 'The patient''s email address', 'email', false, NULL, 'patient', 'email', 'Patient Information', 6, true),
('v1000000-0000-0000-0000-000000000007', 'patient_phone', 'Patient Phone', 'The patient''s phone number', 'phone', false, NULL, 'patient', 'phone', 'Patient Information', 7, true),

-- Provider variables
('v1000000-0000-0000-0000-000000000010', 'provider_name', 'Provider Name', 'The healthcare provider''s name', 'text', true, NULL, 'user', 'name', 'Provider Information', 10, true),
('v1000000-0000-0000-0000-000000000011', 'provider_email', 'Provider Email', 'The healthcare provider''s email', 'email', false, NULL, 'user', 'email', 'Provider Information', 11, true),

-- Location variables
('v1000000-0000-0000-0000-000000000020', 'location_name', 'Practice Name', 'The name of the medical practice', 'text', true, 'Ganger Dermatology', 'location', 'name', 'Practice Information', 20, true),
('v1000000-0000-0000-0000-000000000021', 'location_address', 'Practice Address', 'The address of the medical practice', 'text', false, NULL, 'location', 'address', 'Practice Information', 21, true),
('v1000000-0000-0000-0000-000000000022', 'location_phone', 'Practice Phone', 'The phone number of the medical practice', 'phone', false, NULL, 'location', 'phone', 'Practice Information', 22, true),

-- System variables
('v1000000-0000-0000-0000-000000000030', 'current_date', 'Current Date', 'Today''s date', 'date', false, NULL, 'system', 'current_date', 'System Information', 30, true),
('v1000000-0000-0000-0000-000000000031', 'current_time', 'Current Time', 'Current time', 'text', false, NULL, 'system', 'current_time', 'System Information', 31, true),
('v1000000-0000-0000-0000-000000000032', 'current_datetime', 'Current Date & Time', 'Current date and time', 'text', false, NULL, 'system', 'current_datetime', 'System Information', 32, true),

-- Custom variables for handouts
('v1000000-0000-0000-0000-000000000040', 'appointment_date', 'Appointment Date', 'Date of the appointment', 'date', false, NULL, 'manual', NULL, 'Appointment Information', 40, false),
('v1000000-0000-0000-0000-000000000041', 'appointment_time', 'Appointment Time', 'Time of the appointment', 'text', false, NULL, 'manual', NULL, 'Appointment Information', 41, false),
('v1000000-0000-0000-0000-000000000042', 'procedure_name', 'Procedure Name', 'Name of the medical procedure', 'text', false, NULL, 'manual', NULL, 'Procedure Information', 42, false),
('v1000000-0000-0000-0000-000000000043', 'medication_name', 'Medication Name', 'Name of prescribed medication', 'text', false, NULL, 'manual', NULL, 'Medication Information', 43, false),
('v1000000-0000-0000-0000-000000000044', 'medication_dosage', 'Medication Dosage', 'Dosage instructions for medication', 'text', false, NULL, 'manual', NULL, 'Medication Information', 44, false),
('v1000000-0000-0000-0000-000000000045', 'next_visit_date', 'Next Visit Date', 'Date of next scheduled visit', 'date', false, NULL, 'manual', NULL, 'Follow-up Information', 45, false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE HANDOUT TEMPLATES SEED DATA
-- =====================================================
INSERT INTO handout_templates (id, name, description, template_type, content, variables, category, tags, is_active, is_system_template, created_by, location_id, version, approval_status) VALUES
('t1000000-0000-0000-0000-000000000001', 'General Skin Care Instructions', 'Basic skin care instructions for dermatology patients', 'post_procedure', 
'<h1>Skin Care Instructions</h1>
<h2>Patient Information</h2>
<p><strong>Patient:</strong> {{patient_full_name}}<br>
<strong>MRN:</strong> {{patient_mrn}}<br>
<strong>Date:</strong> {{current_date}}</p>

<h2>General Skin Care Guidelines</h2>
<h3>Daily Care</h3>
<ul>
<li>Gently cleanse your skin with a mild, fragrance-free cleanser</li>
<li>Apply moisturizer while skin is still damp</li>
<li>Use sunscreen with SPF 30 or higher daily</li>
<li>Avoid harsh scrubbing or exfoliating</li>
</ul>

<h3>Important Notes</h3>
<div class="important">
<p><strong>Important:</strong> If you experience any unusual symptoms, redness, or irritation, please contact our office immediately.</p>
</div>

<h3>Contact Information</h3>
<p><strong>{{location_name}}</strong><br>
Phone: {{location_phone}}<br>
Email: {{provider_email}}</p>

<p><em>Instructions provided by: {{provider_name}}</em></p>',
'["patient_full_name", "patient_mrn", "current_date", "location_name", "location_phone", "provider_email", "provider_name"]',
'Skin Care', 
'{"general", "skin care", "daily routine"}',
true, true, NULL, NULL, 1, 'approved'),

('t1000000-0000-0000-0000-000000000002', 'Pre-Procedure Instructions', 'General instructions to prepare for dermatological procedures', 'pre_procedure',
'<h1>Pre-Procedure Instructions</h1>
<h2>Patient Information</h2>
<p><strong>Patient:</strong> {{patient_full_name}}<br>
<strong>MRN:</strong> {{patient_mrn}}<br>
<strong>Procedure:</strong> {{procedure_name}}<br>
<strong>Appointment Date:</strong> {{appointment_date}} at {{appointment_time}}</p>

<h2>Before Your Procedure</h2>
<h3>24 Hours Before</h3>
<ul>
<li>Avoid alcohol and blood-thinning medications (unless prescribed)</li>
<li>Get a good night''s sleep</li>
<li>Eat a light meal before your appointment</li>
</ul>

<h3>Day of Procedure</h3>
<ul>
<li>Arrive 15 minutes early for check-in</li>
<li>Bring a list of current medications</li>
<li>Wear comfortable, loose-fitting clothing</li>
<li>Arrange for transportation if sedation is involved</li>
</ul>

<h3>What to Bring</h3>
<ul>
<li>Photo identification</li>
<li>Insurance cards</li>
<li>Payment for any copays or deductibles</li>
<li>List of current medications and allergies</li>
</ul>

<div class="important">
<p><strong>Important:</strong> If you have any questions or concerns, please call our office at {{location_phone}}.</p>
</div>

<p><strong>{{location_name}}</strong><br>
{{location_address}}<br>
Phone: {{location_phone}}</p>',
'["patient_full_name", "patient_mrn", "procedure_name", "appointment_date", "appointment_time", "location_phone", "location_name", "location_address"]',
'Pre-Procedure',
'{"preparation", "procedure", "instructions"}',
true, true, NULL, NULL, 1, 'approved'),

('t1000000-0000-0000-0000-000000000003', 'Post-Procedure Wound Care', 'Instructions for caring for wounds after dermatological procedures', 'post_procedure',
'<h1>Post-Procedure Wound Care Instructions</h1>
<h2>Patient Information</h2>
<p><strong>Patient:</strong> {{patient_full_name}}<br>
<strong>MRN:</strong> {{patient_mrn}}<br>
<strong>Procedure Date:</strong> {{current_date}}<br>
<strong>Next Visit:</strong> {{next_visit_date}}</p>

<h2>Immediate Care (First 24 Hours)</h2>
<ul>
<li>Keep the bandage clean and dry</li>
<li>Do not remove the initial bandage for 24 hours</li>
<li>Apply ice for 10-15 minutes at a time to reduce swelling</li>
<li>Take pain medication as prescribed</li>
</ul>

<h2>Ongoing Care</h2>
<h3>Cleaning</h3>
<ol>
<li>Gently clean the area with mild soap and water</li>
<li>Pat dry with a clean towel</li>
<li>Apply prescribed ointment if recommended</li>
<li>Cover with a clean bandage</li>
</ol>

<h3>Activity Restrictions</h3>
<ul>
<li>Avoid strenuous activity for 48 hours</li>
<li>No swimming or soaking for 1 week</li>
<li>Protect the area from sun exposure</li>
</ul>

<div class="warning">
<h3>Call Our Office Immediately If You Experience:</h3>
<ul>
<li>Excessive bleeding that doesn''t stop with pressure</li>
<li>Signs of infection (increased redness, warmth, pus)</li>
