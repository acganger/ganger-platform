-- Combined Supabase Migrations for Ganger Platform
-- Execute this in Supabase SQL Editor

BEGIN;


-- Migration: 001_auth_schema.sql
-- ==========================================

-- Ganger Platform Authentication Schema
-- Creates comprehensive user management, teams, and role-based access control

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles Table
-- Extends Supabase auth.users with additional metadata
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'viewer')),
    department TEXT,
    position TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teams Table (for L10 EOS management)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Team Members Table
-- Links users to teams with specific roles
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member', 'viewer')),
    seat TEXT, -- EOS seat/role in the company
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(team_id, user_id)
);

-- 4. Application Access Table
-- Controls which apps users can access
CREATE TABLE IF NOT EXISTS public.app_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    app_name TEXT NOT NULL, -- 'l10', 'handouts', 'inventory', etc.
    permission_level TEXT NOT NULL DEFAULT 'read' CHECK (permission_level IN ('admin', 'write', 'read', 'none')),
    granted_by UUID REFERENCES public.profiles(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, app_name)
);

-- 5. Audit Log Table (HIPAA compliance)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'login', 'logout', 'access_app', 'modify_data', etc.
    resource_type TEXT, -- 'patient_handout', 'inventory_item', 'team_data', etc.
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_app_permissions_user_id ON public.app_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_app_permissions_app_name ON public.app_permissions(app_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 7. Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Teams policies
CREATE POLICY "Team members can view their teams" ON public.teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members 
            WHERE team_id = id AND user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Team leaders can update their teams" ON public.teams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.team_members 
            WHERE team_id = id AND user_id = auth.uid() AND role = 'leader'
        )
    );

CREATE POLICY "Admins can manage all teams" ON public.teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Team members policies
CREATE POLICY "Users can view team memberships" ON public.team_members
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.team_members tm2 
            WHERE tm2.team_id = team_id AND tm2.user_id = auth.uid()
        )
    );

-- App permissions policies
CREATE POLICY "Users can view own app permissions" ON public.app_permissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all app permissions" ON public.app_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Audit logs policies
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 8. Functions for common operations

-- Function to check if user is team member
CREATE OR REPLACE FUNCTION public.is_team_member(user_uuid UUID, team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE user_id = user_uuid AND team_id = team_uuid AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role for app
CREATE OR REPLACE FUNCTION public.get_app_permission(user_uuid UUID, app_name_param TEXT)
RETURNS TEXT AS $$
DECLARE
    permission TEXT;
BEGIN
    SELECT permission_level INTO permission
    FROM public.app_permissions 
    WHERE user_id = user_uuid AND app_name = app_name_param 
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Default permissions based on user role if no specific permission
    IF permission IS NULL THEN
        SELECT CASE 
            WHEN role = 'admin' THEN 'admin'
            WHEN role = 'staff' THEN 'write'
            WHEN role = 'viewer' THEN 'read'
            ELSE 'none'
        END INTO permission
        FROM public.profiles 
        WHERE id = user_uuid;
    END IF;
    
    RETURN COALESCE(permission, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
    action_param TEXT,
    resource_type_param TEXT DEFAULT NULL,
    resource_id_param TEXT DEFAULT NULL,
    details_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (auth.uid(), action_param, resource_type_param, resource_id_param, details_param)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Triggers for automatic updates

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT DEFAULT 'staff';
BEGIN
    -- Determine role based on email domain
    IF NEW.email LIKE '%@gangerdermatology.com' THEN
        user_role := 'staff';
        -- Special case for admin
        IF NEW.email = 'anand@gangerdermatology.com' THEN
            user_role := 'admin';
        END IF;
    ELSE
        user_role := 'viewer';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        user_role
    );

    -- Log signup event
    INSERT INTO public.audit_logs (user_id, action, details)
    VALUES (
        NEW.id,
        'user_signup',
        jsonb_build_object('email', NEW.email, 'role', user_role)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Initial data setup

-- Create default admin user profile (if not exists)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email),
    'admin'
FROM auth.users u
WHERE u.email = 'anand@gangerdermatology.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Create default team for Ganger Dermatology
INSERT INTO public.teams (id, name, description, settings)
VALUES (
    uuid_generate_v4(),
    'Ganger Dermatology Leadership Team',
    'Main leadership team for EOS Level 10 meetings',
    '{"meeting_day": "monday", "meeting_time": "09:00", "timezone": "America/New_York", "meeting_duration": 90, "scorecard_frequency": "weekly", "rock_quarters": ["Q2 2025", "Q3 2025"]}'
)
ON CONFLICT DO NOTHING;

-- Grant default app permissions for staff
INSERT INTO public.app_permissions (user_id, app_name, permission_level)
SELECT 
    p.id,
    app.name,
    CASE 
        WHEN p.role = 'admin' THEN 'admin'
        WHEN p.role = 'staff' THEN 'write'
        ELSE 'read'
    END
FROM public.profiles p
CROSS JOIN (
    VALUES 
    ('l10'),
    ('handouts'),
    ('inventory'),
    ('medication-auth'),
    ('checkin-kiosk'),
    ('call-center-ops')
) AS app(name)
WHERE p.email LIKE '%@gangerdermatology.com'
ON CONFLICT (user_id, app_name) DO UPDATE SET
    permission_level = EXCLUDED.permission_level,
    granted_at = NOW();

COMMENT ON TABLE public.profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE public.teams IS 'Teams for EOS L10 management and collaboration';
COMMENT ON TABLE public.team_members IS 'Team membership with specific roles';
COMMENT ON TABLE public.app_permissions IS 'Application-level permissions for users';
COMMENT ON TABLE public.audit_logs IS 'HIPAA-compliant audit trail for all user actions';


-- Migration: 001_create_base_tables.sql
-- ==========================================

-- =====================================================
-- Ganger Platform Database Schema - Base Tables
-- Migration: 001_create_base_tables.sql
-- Created: June 5, 2025
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'V1ny@C0nstruct10n2025!';

-- =====================================================
-- LOCATIONS TABLE
-- =====================================================
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state CHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url VARCHAR(500),
    role VARCHAR(20) NOT NULL CHECK (role IN ('staff', 'manager', 'superadmin', 'pharma_rep', 'patient', 'vinya_tech')),
    locations UUID[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERMISSIONS TABLE
-- =====================================================
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, action, resource)
);

-- =====================================================
-- USER SESSIONS TABLE
-- =====================================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FILE UPLOADS TABLE
-- =====================================================
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder')),
    read_at TIMESTAMPTZ,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PATIENTS TABLE
-- =====================================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state CHAR(2),
    zip_code VARCHAR(10),
    mrn VARCHAR(50) UNIQUE NOT NULL,
    insurance_info JSONB DEFAULT '{}',
    emergency_contact JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES users(id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    appointment_type VARCHAR(100) NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_locations ON users USING GIN(locations);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Patients indexes
CREATE INDEX idx_patients_mrn ON patients(mrn);
CREATE INDEX idx_patients_last_name ON patients(last_name);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_phone ON patients(phone);

-- Appointments indexes
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX idx_appointments_location_id ON appointments(location_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

-- File uploads indexes
CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX idx_file_uploads_mime_type ON file_uploads(mime_type);
CREATE INDEX idx_file_uploads_is_public ON file_uploads(is_public);

-- Locations indexes
CREATE INDEX idx_locations_is_active ON locations(is_active);
CREATE INDEX idx_locations_state ON locations(state);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_file_uploads_updated_at BEFORE UPDATE ON file_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Migration: 002_create_inventory_tables.sql
-- ==========================================

-- =====================================================
-- Ganger Platform Database Schema - Inventory Tables
-- Migration: 002_create_inventory_tables.sql
-- Created: June 5, 2025
-- =====================================================

-- =====================================================
-- INVENTORY ITEMS TABLE
-- =====================================================
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(50),
    henry_schein_id VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    vendor VARCHAR(100) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_items_unit_price_positive CHECK (unit_price >= 0),
    CONSTRAINT inventory_items_quantity_non_negative CHECK (quantity_on_hand >= 0),
    CONSTRAINT inventory_items_reorder_level_non_negative CHECK (reorder_level >= 0)
);

-- =====================================================
-- INVENTORY TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('scan', 'manual_count', 'order', 'adjustment', 'receive', 'waste', 'transfer')),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reference_id UUID, -- Can reference orders, transfers, etc.
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_transactions_quantity_valid CHECK (new_quantity >= 0)
);

-- =====================================================
-- PURCHASE ORDERS TABLE
-- =====================================================
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    vendor VARCHAR(100) NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'ordered', 'partially_received', 'received', 'cancelled')),
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    shipping_amount DECIMAL(12,2) DEFAULT 0.00,
    ordered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ordered_at TIMESTAMPTZ,
    expected_delivery DATE,
    actual_delivery DATE,
    vendor_order_number VARCHAR(100),
    tracking_number VARCHAR(100),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT purchase_orders_total_amount_non_negative CHECK (total_amount >= 0),
    CONSTRAINT purchase_orders_tax_amount_non_negative CHECK (tax_amount >= 0),
    CONSTRAINT purchase_orders_shipping_amount_non_negative CHECK (shipping_amount >= 0)
);

-- =====================================================
-- PURCHASE ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    quantity_received INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT purchase_order_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT purchase_order_items_unit_price_non_negative CHECK (unit_price >= 0),
    CONSTRAINT purchase_order_items_quantity_received_valid CHECK (quantity_received >= 0 AND quantity_received <= quantity)
);

-- =====================================================
-- INVENTORY COUNTS TABLE (for periodic counting)
-- =====================================================
CREATE TABLE inventory_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    count_type VARCHAR(20) NOT NULL CHECK (count_type IN ('full', 'cycle', 'spot')),
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    started_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INVENTORY COUNT ITEMS TABLE
-- =====================================================
CREATE TABLE inventory_count_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    count_id UUID REFERENCES inventory_counts(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    system_quantity INTEGER NOT NULL,
    counted_quantity INTEGER,
    variance INTEGER GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
    counted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    counted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_count_items_system_quantity_non_negative CHECK (system_quantity >= 0),
    CONSTRAINT inventory_count_items_counted_quantity_non_negative CHECK (counted_quantity IS NULL OR counted_quantity >= 0),
    UNIQUE(count_id, item_id)
);

-- =====================================================
-- VENDOR CATALOG TABLE (for external product data)
-- =====================================================
CREATE TABLE vendor_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor VARCHAR(100) NOT NULL,
    vendor_product_id VARCHAR(100) NOT NULL,
    sku VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit_price DECIMAL(10,2),
    unit_of_measure VARCHAR(20),
    manufacturer VARCHAR(100),
    manufacturer_part_number VARCHAR(100),
    barcode VARCHAR(50),
    is_available BOOLEAN DEFAULT true,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT vendor_catalog_unit_price_non_negative CHECK (unit_price IS NULL OR unit_price >= 0),
    UNIQUE(vendor, vendor_product_id)
);

-- =====================================================
-- INVENTORY ITEM MAPPINGS (link internal items to vendor catalog)
-- =====================================================
CREATE TABLE inventory_vendor_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    vendor_catalog_id UUID REFERENCES vendor_catalog(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    price_multiplier DECIMAL(5,4) DEFAULT 1.0000,
    minimum_order_quantity INTEGER DEFAULT 1,
    lead_time_days INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_vendor_mappings_price_multiplier_positive CHECK (price_multiplier > 0),
    CONSTRAINT inventory_vendor_mappings_min_order_quantity_positive CHECK (minimum_order_quantity > 0),
    CONSTRAINT inventory_vendor_mappings_lead_time_non_negative CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
    UNIQUE(inventory_item_id, vendor_catalog_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Inventory items indexes
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_barcode ON inventory_items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_inventory_items_henry_schein_id ON inventory_items(henry_schein_id) WHERE henry_schein_id IS NOT NULL;
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_vendor ON inventory_items(vendor);
CREATE INDEX idx_inventory_items_location_id ON inventory_items(location_id);
CREATE INDEX idx_inventory_items_is_active ON inventory_items(is_active);
CREATE INDEX idx_inventory_items_low_stock ON inventory_items(location_id, reorder_level, quantity_on_hand) WHERE quantity_on_hand <= reorder_level;

-- Inventory transactions indexes
CREATE INDEX idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_user_id ON inventory_transactions(user_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at);
CREATE INDEX idx_inventory_transactions_reference_id ON inventory_transactions(reference_id) WHERE reference_id IS NOT NULL;

-- Purchase orders indexes
CREATE INDEX idx_purchase_orders_order_number ON purchase_orders(order_number);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders(vendor);
CREATE INDEX idx_purchase_orders_location_id ON purchase_orders(location_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_ordered_by ON purchase_orders(ordered_by);
CREATE INDEX idx_purchase_orders_ordered_at ON purchase_orders(ordered_at);
CREATE INDEX idx_purchase_orders_expected_delivery ON purchase_orders(expected_delivery);

-- Purchase order items indexes
CREATE INDEX idx_purchase_order_items_order_id ON purchase_order_items(order_id);
CREATE INDEX idx_purchase_order_items_item_id ON purchase_order_items(item_id);

-- Inventory counts indexes
CREATE INDEX idx_inventory_counts_location_id ON inventory_counts(location_id);
CREATE INDEX idx_inventory_counts_status ON inventory_counts(status);
CREATE INDEX idx_inventory_counts_started_at ON inventory_counts(started_at);

-- Inventory count items indexes
CREATE INDEX idx_inventory_count_items_count_id ON inventory_count_items(count_id);
CREATE INDEX idx_inventory_count_items_item_id ON inventory_count_items(item_id);
CREATE INDEX idx_inventory_count_items_variance ON inventory_count_items(variance) WHERE variance != 0;

-- Vendor catalog indexes
CREATE INDEX idx_vendor_catalog_vendor ON vendor_catalog(vendor);
CREATE INDEX idx_vendor_catalog_vendor_product_id ON vendor_catalog(vendor_product_id);
CREATE INDEX idx_vendor_catalog_sku ON vendor_catalog(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_vendor_catalog_barcode ON vendor_catalog(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_vendor_catalog_category ON vendor_catalog(category);
CREATE INDEX idx_vendor_catalog_is_available ON vendor_catalog(is_available);

-- Inventory vendor mappings indexes
CREATE INDEX idx_inventory_vendor_mappings_inventory_item_id ON inventory_vendor_mappings(inventory_item_id);
CREATE INDEX idx_inventory_vendor_mappings_vendor_catalog_id ON inventory_vendor_mappings(vendor_catalog_id);
CREATE INDEX idx_inventory_vendor_mappings_is_primary ON inventory_vendor_mappings(is_primary) WHERE is_primary = true;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_order_items_updated_at BEFORE UPDATE ON purchase_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_counts_updated_at BEFORE UPDATE ON inventory_counts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_count_items_updated_at BEFORE UPDATE ON inventory_count_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_catalog_updated_at BEFORE UPDATE ON vendor_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_vendor_mappings_updated_at BEFORE UPDATE ON inventory_vendor_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR INVENTORY MANAGEMENT
-- =====================================================

-- Function to update inventory quantity and create transaction
CREATE OR REPLACE FUNCTION update_inventory_quantity(
    p_item_id UUID,
    p_quantity_change INTEGER,
    p_transaction_type VARCHAR,
    p_user_id UUID,
    p_reference_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_current_quantity INTEGER;
    v_new_quantity INTEGER;
BEGIN
    -- Get current quantity with row lock
    SELECT quantity_on_hand INTO v_current_quantity
    FROM inventory_items
    WHERE id = p_item_id
    FOR UPDATE;
    
    IF v_current_quantity IS NULL THEN
        RAISE EXCEPTION 'Inventory item not found: %', p_item_id;
    END IF;
    
    v_new_quantity := v_current_quantity + p_quantity_change;
    
    IF v_new_quantity < 0 THEN
        RAISE EXCEPTION 'Insufficient inventory. Current: %, Requested change: %', v_current_quantity, p_quantity_change;
    END IF;
    
    -- Update inventory quantity
    UPDATE inventory_items
    SET quantity_on_hand = v_new_quantity,
        updated_at = NOW()
    WHERE id = p_item_id;
    
    -- Create transaction record
    INSERT INTO inventory_transactions (
        item_id,
        transaction_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        user_id,
        reference_id,
        notes
    ) VALUES (
        p_item_id,
        p_transaction_type,
        p_quantity_change,
        v_current_quantity,
        v_new_quantity,
        p_user_id,
        p_reference_id,
        p_notes
    );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0) INTO v_total
    FROM purchase_order_items
    WHERE order_id = p_order_id;
    
    UPDATE purchase_orders
    SET total_amount = v_total,
        updated_at = NOW()
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update order totals
CREATE OR REPLACE FUNCTION trigger_calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_order_total(OLD.order_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_order_total(NEW.order_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_total_on_items
    AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION trigger_calculate_order_total();


-- Migration: 003_create_handouts_tables.sql
-- ==========================================

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
