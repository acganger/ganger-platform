-- =====================================================
-- Ganger Platform Database Schema - Handouts Tables
-- Migration: 003_create_handouts_tables.sql
-- Created: June 5, 2025
-- =====================================================

-- =====================================================
-- HANDOUT TEMPLATES TABLE
-- =====================================================
CREATE TABLE handout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    category VARCHAR(100) NOT NULL,
    tags VARCHAR(255)[], -- Array of tags for better organization
    is_active BOOLEAN DEFAULT true,
    is_system_template BOOLEAN DEFAULT false, -- System vs user-created templates
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL, -- NULL for global templates
    version INTEGER DEFAULT 1,
    parent_template_id UUID REFERENCES handout_templates(id) ON DELETE SET NULL, -- For template versioning
    approval_status VARCHAR(20) DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending_approval', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT handout_templates_version_positive CHECK (version > 0)
);

-- =====================================================
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