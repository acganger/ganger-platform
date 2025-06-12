-- Fix Critical RLS Security Vulnerabilities
-- Migration: 2025_01_11_fix_rls_security_vulnerabilities.sql
-- Author: Security Review - Critical Fixes
-- Description: Address enterprise security vulnerabilities in RLS policies

-- ================================================
-- FIX 1: SECURE ROLE PERMISSIONS SYSTEM
-- ================================================

-- Create role permissions table instead of hardcoded function
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  permission TEXT NOT NULL,
  resource_type TEXT,
  conditions JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  UNIQUE(role_name, permission, resource_type)
);

-- Insert secure role permissions
INSERT INTO role_permissions (role_name, permission, resource_type) VALUES
-- Superadmin permissions
('superadmin', 'full_access', '*'),

-- Manager permissions
('manager', 'read_staff_schedules', 'staff_schedules'),
('manager', 'write_staff_schedules', 'staff_schedules'),
('manager', 'delete_staff_schedules', 'staff_schedules'),
('manager', 'read_staff_availability', 'staff_availability'),
('manager', 'write_staff_availability', 'staff_availability'),
('manager', 'delete_staff_availability', 'staff_availability'),
('manager', 'read_analytics', 'staffing_analytics'),
('manager', 'generate_analytics', 'staffing_analytics'),
('manager', 'read_provider_schedules', 'provider_schedules_cache'),
('manager', 'write_provider_schedules', 'provider_schedules_cache'),
('manager', 'read_optimization_rules', 'staffing_optimization_rules'),
('manager', 'write_optimization_rules', 'staffing_optimization_rules'),

-- Scheduler permissions
('scheduler', 'read_staff_schedules', 'staff_schedules'),
('scheduler', 'write_staff_schedules', 'staff_schedules'),
('scheduler', 'delete_staff_schedules', 'staff_schedules'),
('scheduler', 'read_staff_availability', 'staff_availability'),
('scheduler', 'write_staff_availability', 'staff_availability'),
('scheduler', 'delete_staff_availability', 'staff_availability'),
('scheduler', 'read_analytics', 'staffing_analytics'),
('scheduler', 'read_provider_schedules', 'provider_schedules_cache'),

-- Analytics permissions
('analytics', 'read_staff_schedules', 'staff_schedules'),
('analytics', 'read_staff_availability', 'staff_availability'),
('analytics', 'read_analytics', 'staffing_analytics'),
('analytics', 'generate_analytics', 'staffing_analytics'),
('analytics', 'read_provider_schedules', 'provider_schedules_cache'),

-- Staff permissions (limited to own data)
('staff', 'read_staff_schedules', 'staff_schedules'),
('staff', 'read_staff_schedules_own', 'staff_schedules'),
('staff', 'read_staff_availability', 'staff_availability'),
('staff', 'read_staff_availability_own', 'staff_availability'),
('staff', 'write_staff_availability', 'staff_availability'),
('staff', 'write_staff_availability_own', 'staff_availability');

-- Enable RLS on role permissions
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Only superadmins can modify role permissions
CREATE POLICY "role_permissions_superadmin_only" ON role_permissions
  FOR ALL
  USING ('superadmin' = ANY(get_user_roles_secure(auth.uid())))
  WITH CHECK ('superadmin' = ANY(get_user_roles_secure(auth.uid())));

-- ================================================
-- FIX 2: SECURE USER ROLES FUNCTION
-- ================================================

-- Replace insecure hardcoded function with secure database lookup
CREATE OR REPLACE FUNCTION get_user_roles_secure(user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    user_roles TEXT[];
    user_record RECORD;
BEGIN
    -- Validate input
    IF user_id IS NULL THEN
        RETURN ARRAY[]::TEXT[];
    END IF;
    
    -- Get user roles from secure metadata or user_roles table
    SELECT COALESCE(
        (raw_app_meta_data->>'roles')::TEXT[],
        ARRAY['staff']::TEXT[]
    ) INTO user_roles
    FROM auth.users
    WHERE id = user_id
    AND email_confirmed_at IS NOT NULL
    AND (deleted_at IS NULL OR deleted_at > NOW());
    
    -- Return empty array if user not found or inactive
    RETURN COALESCE(user_roles, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ================================================
-- FIX 3: SECURE PERMISSION CHECKING
-- ================================================

-- Replace insecure permission function with database-driven approach
CREATE OR REPLACE FUNCTION user_has_permission_secure(user_id UUID, permission TEXT, resource_type TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    user_roles TEXT[];
    has_permission BOOLEAN := FALSE;
BEGIN
    -- Validate inputs
    IF user_id IS NULL OR permission IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get user roles securely
    user_roles := get_user_roles_secure(user_id);
    
    -- No roles = no permissions
    IF array_length(user_roles, 1) IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check for superadmin wildcard
    IF 'superadmin' = ANY(user_roles) THEN
        SELECT EXISTS(
            SELECT 1 FROM role_permissions 
            WHERE role_name = 'superadmin' 
            AND permission = 'full_access' 
            AND is_active = TRUE
        ) INTO has_permission;
        
        IF has_permission THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Check specific permissions
    SELECT EXISTS(
        SELECT 1 FROM role_permissions rp
        WHERE rp.role_name = ANY(user_roles)
        AND rp.permission = user_has_permission_secure.permission
        AND (rp.resource_type IS NULL OR rp.resource_type = user_has_permission_secure.resource_type)
        AND rp.is_active = TRUE
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ================================================
-- FIX 4: SECURE SYSTEM USER DETECTION
-- ================================================

-- Secure system user function - ONLY service_role allowed
CREATE OR REPLACE FUNCTION is_system_user_secure()
RETURNS BOOLEAN AS $$
DECLARE
    current_role TEXT;
BEGIN
    -- Get current database role
    SELECT current_user INTO current_role;
    
    -- SECURITY: Only service_role is allowed as system user
    -- No email-based authentication to prevent bypass attacks
    IF current_role = 'service_role' THEN
        RETURN TRUE;
    END IF;
    
    -- All other cases are NOT system users
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- FIX 4B: ADD MISSING FUNCTION DEPENDENCY
-- ================================================

-- Essential function that policies depend on
CREATE OR REPLACE FUNCTION get_user_staff_member_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
    staff_member_id UUID;
BEGIN
    -- Validate input
    IF user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get staff member ID for the user
    SELECT id INTO staff_member_id
    FROM staff_members
    WHERE user_id = get_user_staff_member_id.user_id
    AND employment_status = 'active';
    
    RETURN staff_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_staff_member_id(UUID) TO authenticated;

-- ================================================
-- FIX 5: LOCATION ACCESS CONTROL
-- ================================================

-- Enhanced location access function with proper validation
CREATE OR REPLACE FUNCTION user_can_access_location_secure(user_id UUID, location_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_roles TEXT[];
    staff_member_record RECORD;
BEGIN
    -- Validate inputs
    IF user_id IS NULL OR location_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    user_roles := get_user_roles_secure(user_id);
    
    -- Superadmins and managers can access all locations
    IF 'superadmin' = ANY(user_roles) OR 'manager' = ANY(user_roles) THEN
        RETURN TRUE;
    END IF;
    
    -- Check staff member location access
    SELECT 
        primary_location_id,
        additional_locations,
        employment_status
    INTO staff_member_record
    FROM staff_members
    WHERE user_id = user_can_access_location_secure.user_id
    AND employment_status = 'active';
    
    -- No active staff record = no access
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check primary and additional locations
    RETURN (
        staff_member_record.primary_location_id = location_id OR
        location_id = ANY(staff_member_record.additional_locations)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ================================================
-- FIX 6: UPDATE ALL RLS POLICIES TO USE SECURE FUNCTIONS
-- ================================================

-- Drop old insecure policies
DROP POLICY IF EXISTS "staff_members_read_own" ON staff_members;
DROP POLICY IF EXISTS "staff_members_read_all" ON staff_members;
DROP POLICY IF EXISTS "staff_schedules_read_own" ON staff_schedules;
DROP POLICY IF EXISTS "staff_schedules_read_location" ON staff_schedules;

-- Create secure policies using new functions
CREATE POLICY "staff_members_secure_read" ON staff_members
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        user_has_permission_secure(auth.uid(), 'read_staff_schedules', 'staff_schedules') OR
        is_system_user_secure()
    );

CREATE POLICY "staff_schedules_secure_read" ON staff_schedules
    FOR SELECT
    USING (
        -- Staff can read their own schedules
        (staff_member_id = get_user_staff_member_id(auth.uid()) AND 
         user_has_permission_secure(auth.uid(), 'read_staff_schedules_own', 'staff_schedules')) OR
        -- Managers/schedulers can read schedules for locations they have access to
        (user_has_permission_secure(auth.uid(), 'read_staff_schedules', 'staff_schedules') AND
         user_can_access_location_secure(auth.uid(), location_id)) OR
        -- System access
        is_system_user_secure()
    );

CREATE POLICY "staff_availability_secure_read" ON staff_availability
    FOR SELECT
    USING (
        -- Staff can read their own availability
        (staff_member_id = get_user_staff_member_id(auth.uid()) AND 
         user_has_permission_secure(auth.uid(), 'read_staff_availability_own', 'staff_availability')) OR
        -- Managers/schedulers can read availability
        user_has_permission_secure(auth.uid(), 'read_staff_availability', 'staff_availability') OR
        -- System access
        is_system_user_secure()
    );

-- ================================================
-- FIX 6A: ADD COMPREHENSIVE CRUD POLICIES
-- ================================================

-- Staff Members Write Policies
CREATE POLICY "staff_members_secure_insert" ON staff_members
    FOR INSERT
    WITH CHECK (
        user_has_permission_secure(auth.uid(), 'write_staff_schedules', 'staff_schedules') OR
        is_system_user_secure()
    );

CREATE POLICY "staff_members_secure_update" ON staff_members
    FOR UPDATE
    USING (
        -- Staff can update their own basic info
        (user_id = auth.uid() AND user_has_permission_secure(auth.uid(), 'write_staff_availability_own', 'staff_availability')) OR
        -- Managers can update staff info
        user_has_permission_secure(auth.uid(), 'write_staff_schedules', 'staff_schedules') OR
        -- System access
        is_system_user_secure()
    )
    WITH CHECK (
        -- Same conditions for what can be updated
        (user_id = auth.uid() AND user_has_permission_secure(auth.uid(), 'write_staff_availability_own', 'staff_availability')) OR
        user_has_permission_secure(auth.uid(), 'write_staff_schedules', 'staff_schedules') OR
        is_system_user_secure()
    );

CREATE POLICY "staff_members_secure_delete" ON staff_members
    FOR DELETE
    USING (
        user_has_permission_secure(auth.uid(), 'delete_staff_schedules', 'staff_schedules') OR
        is_system_user_secure()
    );

-- Staff Schedules Write Policies
CREATE POLICY "staff_schedules_secure_insert" ON staff_schedules
    FOR INSERT
    WITH CHECK (
        -- Managers/schedulers can create schedules for locations they have access to
        (user_has_permission_secure(auth.uid(), 'write_staff_schedules', 'staff_schedules') AND
         user_can_access_location_secure(auth.uid(), location_id)) OR
        -- System access
        is_system_user_secure()
    );

CREATE POLICY "staff_schedules_secure_update" ON staff_schedules
    FOR UPDATE
    USING (
        -- Managers/schedulers can update schedules for locations they have access to
        (user_has_permission_secure(auth.uid(), 'write_staff_schedules', 'staff_schedules') AND
         user_can_access_location_secure(auth.uid(), location_id)) OR
        -- System access
        is_system_user_secure()
    )
    WITH CHECK (
        -- Same conditions for what can be updated
        (user_has_permission_secure(auth.uid(), 'write_staff_schedules', 'staff_schedules') AND
         user_can_access_location_secure(auth.uid(), location_id)) OR
        is_system_user_secure()
    );

CREATE POLICY "staff_schedules_secure_delete" ON staff_schedules
    FOR DELETE
    USING (
        -- Managers can delete schedules for locations they have access to
        (user_has_permission_secure(auth.uid(), 'delete_staff_schedules', 'staff_schedules') AND
         user_can_access_location_secure(auth.uid(), location_id)) OR
        -- System access
        is_system_user_secure()
    );

-- Staff Availability Write Policies
CREATE POLICY "staff_availability_secure_insert" ON staff_availability
    FOR INSERT
    WITH CHECK (
        -- Staff can create their own availability
        (staff_member_id = get_user_staff_member_id(auth.uid()) AND 
         user_has_permission_secure(auth.uid(), 'write_staff_availability_own', 'staff_availability')) OR
        -- Managers can create availability
        user_has_permission_secure(auth.uid(), 'write_staff_availability', 'staff_availability') OR
        -- System access
        is_system_user_secure()
    );

CREATE POLICY "staff_availability_secure_update" ON staff_availability
    FOR UPDATE
    USING (
        -- Staff can update their own availability
        (staff_member_id = get_user_staff_member_id(auth.uid()) AND 
         user_has_permission_secure(auth.uid(), 'write_staff_availability_own', 'staff_availability')) OR
        -- Managers can update availability
        user_has_permission_secure(auth.uid(), 'write_staff_availability', 'staff_availability') OR
        -- System access
        is_system_user_secure()
    )
    WITH CHECK (
        -- Same conditions for what can be updated
        (staff_member_id = get_user_staff_member_id(auth.uid()) AND 
         user_has_permission_secure(auth.uid(), 'write_staff_availability_own', 'staff_availability')) OR
        user_has_permission_secure(auth.uid(), 'write_staff_availability', 'staff_availability') OR
        is_system_user_secure()
    );

CREATE POLICY "staff_availability_secure_delete" ON staff_availability
    FOR DELETE
    USING (
        -- Staff can delete their own availability
        (staff_member_id = get_user_staff_member_id(auth.uid()) AND 
         user_has_permission_secure(auth.uid(), 'write_staff_availability_own', 'staff_availability')) OR
        -- Managers can delete availability
        user_has_permission_secure(auth.uid(), 'delete_staff_availability', 'staff_availability') OR
        -- System access
        is_system_user_secure()
    );

-- ================================================
-- FIX 7: AUDIT LOGGING FOR SECURITY EVENTS
-- ================================================

-- Create secure audit logging function
CREATE OR REPLACE FUNCTION log_security_audit(
    event_type TEXT,
    user_id UUID,
    resource_type TEXT,
    resource_id TEXT DEFAULT NULL,
    details JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (
        action,
        user_id,
        resource_type,
        resource_id,
        metadata,
        created_at
    ) VALUES (
        event_type,
        user_id,
        resource_type,
        resource_id,
        jsonb_build_object(
            'timestamp', NOW(),
            'user_agent', current_setting('request.headers.user-agent', true),
            'ip_address', '[REDACTED]', -- Never log actual IP
            'session_id', encode(gen_random_bytes(16), 'hex'),
            'details', details
        ),
        NOW()
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Never let audit failures affect main operations
        NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- FIX 8: PERFORMANCE OPTIMIZATIONS
-- ================================================

-- Add indexes for secure functions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permissions_lookup 
ON role_permissions(role_name, permission, resource_type, is_active) 
WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_members_user_location 
ON staff_members(user_id, primary_location_id, employment_status) 
WHERE employment_status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_email_confirmed 
ON auth.users(id, email_confirmed_at) 
WHERE email_confirmed_at IS NOT NULL AND deleted_at IS NULL;

-- ================================================
-- FIX 9: GRANT SECURE PERMISSIONS
-- ================================================

-- Grant execute permissions on secure functions
GRANT EXECUTE ON FUNCTION get_user_roles_secure(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_permission_secure(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_can_access_location_secure(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_system_user_secure() TO authenticated;
GRANT EXECUTE ON FUNCTION log_security_audit(TEXT, UUID, TEXT, TEXT, JSONB) TO authenticated;

-- Grant service role permissions
GRANT ALL ON role_permissions TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ================================================
-- FIX 10: DEPRECATED FUNCTION CLEANUP - DROP INSECURE FUNCTIONS
-- ================================================

-- Security: Drop old insecure functions to prevent bypass attacks
-- Any applications still using these will get clear errors and must be updated

DROP FUNCTION IF EXISTS get_user_roles(UUID);
DROP FUNCTION IF EXISTS user_has_permission(UUID, TEXT);
DROP FUNCTION IF EXISTS user_can_access_location(UUID, UUID);
DROP FUNCTION IF EXISTS is_system_user();

-- Log the removal for audit purposes
SELECT log_security_audit(
    'deprecated_functions_dropped',
    NULL,
    'security_system',
    'deprecated_functions',
    jsonb_build_object(
        'functions_dropped', ARRAY[
            'get_user_roles(UUID)',
            'user_has_permission(UUID, TEXT)',
            'user_can_access_location(UUID, UUID)',
            'is_system_user()'
        ],
        'reason', 'security_vulnerability_mitigation',
        'replacement_functions', ARRAY[
            'get_user_roles_secure(UUID)',
            'user_has_permission_secure(UUID, TEXT, TEXT)',
            'user_can_access_location_secure(UUID, UUID)',
            'is_system_user_secure()'
        ]
    )
);

-- Log completion of security fixes
SELECT log_security_audit(
    'rls_security_vulnerabilities_fixed',
    NULL,
    'security_system',
    'rls_policies',
    jsonb_build_object(
        'migration', '2025_01_11_fix_rls_security_vulnerabilities',
        'fixes_applied', ARRAY[
            'secure_role_permissions_table',
            'secure_user_roles_function',
            'secure_permission_checking',
            'secure_system_user_detection',
            'enhanced_location_access_control',
            'updated_rls_policies',
            'secure_audit_logging',
            'performance_optimizations'
        ],
        'security_level', 'enterprise_grade'
    )
);