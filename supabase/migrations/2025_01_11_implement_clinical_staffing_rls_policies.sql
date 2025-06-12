-- Clinical Staffing Row Level Security (RLS) Policies
-- 
-- This migration implements comprehensive Row Level Security policies
-- for the clinical staffing system to ensure data protection and
-- proper access control based on user roles and organizational hierarchy.

-- Enable RLS on all clinical staffing tables
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE physician_support_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_schedules_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_optimization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_analytics ENABLE ROW LEVEL SECURITY;

-- Create a function to get user roles from auth.users metadata
CREATE OR REPLACE FUNCTION get_user_roles(user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    user_roles TEXT[];
BEGIN
    SELECT COALESCE(
        (auth.users.raw_app_meta_data->>'roles')::TEXT[],
        ARRAY['staff']::TEXT[]
    )
    INTO user_roles
    FROM auth.users
    WHERE auth.users.id = user_id;
    
    RETURN COALESCE(user_roles, ARRAY['staff']::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_roles TEXT[];
    role_permissions RECORD;
BEGIN
    -- Get user roles
    user_roles := get_user_roles(user_id);
    
    -- Define role permissions
    FOR role_permissions IN 
        SELECT * FROM (VALUES
            ('superadmin', ARRAY['*']),
            ('manager', ARRAY[
                'read_staff_schedules', 'write_staff_schedules', 'delete_staff_schedules',
                'read_staff_availability', 'write_staff_availability', 'delete_staff_availability',
                'read_analytics', 'generate_analytics',
                'read_provider_schedules', 'write_provider_schedules',
                'read_optimization_rules', 'write_optimization_rules'
            ]),
            ('scheduler', ARRAY[
                'read_staff_schedules', 'write_staff_schedules',
                'read_staff_availability', 'write_staff_availability',
                'read_analytics',
                'read_provider_schedules'
            ]),
            ('analytics', ARRAY[
                'read_staff_schedules', 'read_staff_availability',
                'read_analytics', 'generate_analytics',
                'read_provider_schedules'
            ]),
            ('staff', ARRAY[
                'read_staff_schedules_own', 'read_staff_availability_own', 'write_staff_availability_own'
            ])
        ) AS role_perms(role_name, permissions)
    LOOP
        IF role_permissions.role_name = ANY(user_roles) THEN
            -- Check for wildcard permission
            IF '*' = ANY(role_permissions.permissions) THEN
                RETURN TRUE;
            END IF;
            
            -- Check for specific permission
            IF permission = ANY(role_permissions.permissions) THEN
                RETURN TRUE;
            END IF;
        END IF;
    END LOOP;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user's staff member record
CREATE OR REPLACE FUNCTION get_user_staff_member_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
    staff_member_id UUID;
BEGIN
    SELECT id INTO staff_member_id
    FROM staff_members
    WHERE user_id = user_id;
    
    RETURN staff_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user can access location
CREATE OR REPLACE FUNCTION user_can_access_location(user_id UUID, location_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_roles TEXT[];
    staff_member_locations UUID[];
BEGIN
    user_roles := get_user_roles(user_id);
    
    -- Superadmins and managers can access all locations
    IF 'superadmin' = ANY(user_roles) OR 'manager' = ANY(user_roles) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if staff member has access to this location
    SELECT ARRAY[primary_location_id] || COALESCE(additional_locations, ARRAY[]::UUID[])
    INTO staff_member_locations
    FROM staff_members
    WHERE staff_members.user_id = user_id;
    
    RETURN location_id = ANY(staff_member_locations);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- STAFF MEMBERS TABLE RLS POLICIES
-- ================================================

-- Policy: Allow users to read their own staff member record
CREATE POLICY "staff_members_read_own" ON staff_members
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        user_has_permission(auth.uid(), 'read_staff_schedules')
    );

-- Policy: Allow managers and superadmins to read all staff member records
CREATE POLICY "staff_members_read_all" ON staff_members
    FOR SELECT
    USING (
        user_has_permission(auth.uid(), 'read_staff_schedules')
    );

-- Policy: Allow managers and superadmins to insert new staff members
CREATE POLICY "staff_members_insert" ON staff_members
    FOR INSERT
    WITH CHECK (
        user_has_permission(auth.uid(), 'write_staff_schedules')
    );

-- Policy: Allow managers and superadmins to update staff member records
CREATE POLICY "staff_members_update" ON staff_members
    FOR UPDATE
    USING (
        user_has_permission(auth.uid(), 'write_staff_schedules')
    )
    WITH CHECK (
        user_has_permission(auth.uid(), 'write_staff_schedules')
    );

-- Policy: Allow only superadmins to delete staff member records
CREATE POLICY "staff_members_delete" ON staff_members
    FOR DELETE
    USING (
        'superadmin' = ANY(get_user_roles(auth.uid()))
    );

-- ================================================
-- STAFF SCHEDULES TABLE RLS POLICIES
-- ================================================

-- Policy: Allow staff to read their own schedules
CREATE POLICY "staff_schedules_read_own" ON staff_schedules
    FOR SELECT
    USING (
        staff_member_id = get_user_staff_member_id(auth.uid()) OR
        user_has_permission(auth.uid(), 'read_staff_schedules')
    );

-- Policy: Allow managers/schedulers to read schedules for their locations
CREATE POLICY "staff_schedules_read_location" ON staff_schedules
    FOR SELECT
    USING (
        user_has_permission(auth.uid(), 'read_staff_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    );

-- Policy: Allow schedulers and managers to create new schedules
CREATE POLICY "staff_schedules_insert" ON staff_schedules
    FOR INSERT
    WITH CHECK (
        user_has_permission(auth.uid(), 'write_staff_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    );

-- Policy: Allow schedulers and managers to update schedules
CREATE POLICY "staff_schedules_update" ON staff_schedules
    FOR UPDATE
    USING (
        user_has_permission(auth.uid(), 'write_staff_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    )
    WITH CHECK (
        user_has_permission(auth.uid(), 'write_staff_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    );

-- Policy: Allow managers to delete schedules
CREATE POLICY "staff_schedules_delete" ON staff_schedules
    FOR DELETE
    USING (
        user_has_permission(auth.uid(), 'delete_staff_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    );

-- ================================================
-- STAFF AVAILABILITY TABLE RLS POLICIES
-- ================================================

-- Policy: Allow staff to read and manage their own availability
CREATE POLICY "staff_availability_read_own" ON staff_availability
    FOR SELECT
    USING (
        staff_member_id = get_user_staff_member_id(auth.uid()) OR
        user_has_permission(auth.uid(), 'read_staff_availability')
    );

-- Policy: Allow staff to insert their own availability
CREATE POLICY "staff_availability_insert_own" ON staff_availability
    FOR INSERT
    WITH CHECK (
        staff_member_id = get_user_staff_member_id(auth.uid()) OR
        user_has_permission(auth.uid(), 'write_staff_availability')
    );

-- Policy: Allow staff to update their own availability
CREATE POLICY "staff_availability_update_own" ON staff_availability
    FOR UPDATE
    USING (
        staff_member_id = get_user_staff_member_id(auth.uid()) OR
        user_has_permission(auth.uid(), 'write_staff_availability')
    )
    WITH CHECK (
        staff_member_id = get_user_staff_member_id(auth.uid()) OR
        user_has_permission(auth.uid(), 'write_staff_availability')
    );

-- Policy: Allow managers to delete availability records
CREATE POLICY "staff_availability_delete" ON staff_availability
    FOR DELETE
    USING (
        user_has_permission(auth.uid(), 'delete_staff_availability')
    );

-- ================================================
-- PROVIDER SCHEDULES CACHE TABLE RLS POLICIES
-- ================================================

-- Policy: Allow users with read permissions to view provider schedules
CREATE POLICY "provider_schedules_read" ON provider_schedules_cache
    FOR SELECT
    USING (
        user_has_permission(auth.uid(), 'read_provider_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    );

-- Policy: Allow managers to insert/update provider schedules
CREATE POLICY "provider_schedules_insert" ON provider_schedules_cache
    FOR INSERT
    WITH CHECK (
        user_has_permission(auth.uid(), 'write_provider_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    );

CREATE POLICY "provider_schedules_update" ON provider_schedules_cache
    FOR UPDATE
    USING (
        user_has_permission(auth.uid(), 'write_provider_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    )
    WITH CHECK (
        user_has_permission(auth.uid(), 'write_provider_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    );

-- Policy: Allow managers to delete provider schedules
CREATE POLICY "provider_schedules_delete" ON provider_schedules_cache
    FOR DELETE
    USING (
        user_has_permission(auth.uid(), 'write_provider_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    );

-- ================================================
-- PHYSICIAN SUPPORT REQUIREMENTS TABLE RLS POLICIES
-- ================================================

-- Policy: Allow users with read permissions to view support requirements
CREATE POLICY "support_requirements_read" ON physician_support_requirements
    FOR SELECT
    USING (
        user_has_permission(auth.uid(), 'read_provider_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    );

-- Policy: Allow managers to manage support requirements
CREATE POLICY "support_requirements_insert" ON physician_support_requirements
    FOR INSERT
    WITH CHECK (
        user_has_permission(auth.uid(), 'write_provider_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    );

CREATE POLICY "support_requirements_update" ON physician_support_requirements
    FOR UPDATE
    USING (
        user_has_permission(auth.uid(), 'write_provider_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    )
    WITH CHECK (
        user_has_permission(auth.uid(), 'write_provider_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    );

CREATE POLICY "support_requirements_delete" ON physician_support_requirements
    FOR DELETE
    USING (
        user_has_permission(auth.uid(), 'write_provider_schedules') AND
        user_can_access_location(auth.uid(), location_id)
    );

-- ================================================
-- STAFFING OPTIMIZATION RULES TABLE RLS POLICIES
-- ================================================

-- Policy: Allow users to read optimization rules
CREATE POLICY "optimization_rules_read" ON staffing_optimization_rules
    FOR SELECT
    USING (
        user_has_permission(auth.uid(), 'read_optimization_rules') AND
        (location_id IS NULL OR user_can_access_location(auth.uid(), location_id))
    );

-- Policy: Allow managers to manage optimization rules
CREATE POLICY "optimization_rules_insert" ON staffing_optimization_rules
    FOR INSERT
    WITH CHECK (
        user_has_permission(auth.uid(), 'write_optimization_rules') AND
        (location_id IS NULL OR user_can_access_location(auth.uid(), location_id))
    );

CREATE POLICY "optimization_rules_update" ON staffing_optimization_rules
    FOR UPDATE
    USING (
        user_has_permission(auth.uid(), 'write_optimization_rules') AND
        (location_id IS NULL OR user_can_access_location(auth.uid(), location_id))
    )
    WITH CHECK (
        user_has_permission(auth.uid(), 'write_optimization_rules') AND
        (location_id IS NULL OR user_can_access_location(auth.uid(), location_id))
    );

CREATE POLICY "optimization_rules_delete" ON staffing_optimization_rules
    FOR DELETE
    USING (
        user_has_permission(auth.uid(), 'write_optimization_rules') AND
        (location_id IS NULL OR user_can_access_location(auth.uid(), location_id))
    );

-- ================================================
-- STAFFING ANALYTICS TABLE RLS POLICIES
-- ================================================

-- Policy: Allow users with analytics permissions to read analytics
CREATE POLICY "staffing_analytics_read" ON staffing_analytics
    FOR SELECT
    USING (
        user_has_permission(auth.uid(), 'read_analytics') AND
        user_can_access_location(auth.uid(), location_id)
    );

-- Policy: Allow analytics users and managers to generate/update analytics
CREATE POLICY "staffing_analytics_insert" ON staffing_analytics
    FOR INSERT
    WITH CHECK (
        user_has_permission(auth.uid(), 'generate_analytics') AND
        user_can_access_location(auth.uid(), location_id)
    );

CREATE POLICY "staffing_analytics_update" ON staffing_analytics
    FOR UPDATE
    USING (
        user_has_permission(auth.uid(), 'generate_analytics') AND
        user_can_access_location(auth.uid(), location_id)
    )
    WITH CHECK (
        user_has_permission(auth.uid(), 'generate_analytics') AND
        user_can_access_location(auth.uid(), location_id)
    );

-- Policy: Allow managers to delete analytics
CREATE POLICY "staffing_analytics_delete" ON staffing_analytics
    FOR DELETE
    USING (
        'manager' = ANY(get_user_roles(auth.uid())) AND
        user_can_access_location(auth.uid(), location_id)
    );

-- ================================================
-- SYSTEM USER POLICIES (for background jobs)
-- ================================================

-- Create a special policy for system operations
-- This allows background jobs to operate with elevated permissions

CREATE OR REPLACE FUNCTION is_system_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the current user is the service role or a designated system user
    RETURN (
        auth.uid() IS NULL OR  -- Service role
        auth.jwt() ->> 'email' = 'system@gangerdermatology.com' OR
        auth.jwt() ->> 'role' = 'service_role'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add system user policies to all tables
CREATE POLICY "system_user_full_access_staff_members" ON staff_members
    FOR ALL
    USING (is_system_user())
    WITH CHECK (is_system_user());

CREATE POLICY "system_user_full_access_staff_schedules" ON staff_schedules
    FOR ALL
    USING (is_system_user())
    WITH CHECK (is_system_user());

CREATE POLICY "system_user_full_access_staff_availability" ON staff_availability
    FOR ALL
    USING (is_system_user())
    WITH CHECK (is_system_user());

CREATE POLICY "system_user_full_access_provider_schedules" ON provider_schedules_cache
    FOR ALL
    USING (is_system_user())
    WITH CHECK (is_system_user());

CREATE POLICY "system_user_full_access_support_requirements" ON physician_support_requirements
    FOR ALL
    USING (is_system_user())
    WITH CHECK (is_system_user());

CREATE POLICY "system_user_full_access_optimization_rules" ON staffing_optimization_rules
    FOR ALL
    USING (is_system_user())
    WITH CHECK (is_system_user());

CREATE POLICY "system_user_full_access_analytics" ON staffing_analytics
    FOR ALL
    USING (is_system_user())
    WITH CHECK (is_system_user());

-- ================================================
-- AUDIT LOGGING SUPPORT
-- ================================================

-- Create a function to log RLS policy violations
CREATE OR REPLACE FUNCTION log_rls_violation(
    table_name TEXT,
    operation TEXT,
    user_id UUID,
    record_id UUID DEFAULT NULL
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
        'rls_policy_violation',
        user_id,
        table_name,
        record_id::TEXT,
        jsonb_build_object(
            'operation', operation,
            'table_name', table_name,
            'timestamp', NOW(),
            'user_roles', get_user_roles(user_id)
        ),
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- PERFORMANCE INDEXES FOR RLS
-- ================================================

-- Create indexes to optimize RLS policy performance
CREATE INDEX IF NOT EXISTS idx_staff_members_user_id ON staff_members(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_member_id ON staff_schedules(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_location_id ON staff_schedules(location_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_member_id ON staff_availability(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_provider_schedules_location_id ON provider_schedules_cache(location_id);
CREATE INDEX IF NOT EXISTS idx_support_requirements_location_id ON physician_support_requirements(location_id);
CREATE INDEX IF NOT EXISTS idx_optimization_rules_location_id ON staffing_optimization_rules(location_id);
CREATE INDEX IF NOT EXISTS idx_analytics_location_id ON staffing_analytics(location_id);

-- ================================================
-- COMMENTS AND DOCUMENTATION
-- ================================================

COMMENT ON FUNCTION get_user_roles(UUID) IS 'Extract user roles from auth.users metadata for RLS policies';
COMMENT ON FUNCTION user_has_permission(UUID, TEXT) IS 'Check if user has specific permission based on their roles';
COMMENT ON FUNCTION get_user_staff_member_id(UUID) IS 'Get staff member ID associated with a user';
COMMENT ON FUNCTION user_can_access_location(UUID, UUID) IS 'Check if user can access a specific location';
COMMENT ON FUNCTION is_system_user() IS 'Check if current user is a system user with elevated permissions';

-- Grant necessary permissions to the authenticated role
GRANT EXECUTE ON FUNCTION get_user_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_permission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_staff_member_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_can_access_location(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_system_user() TO authenticated;

-- Grant system permissions to service role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Log the completion of RLS setup
INSERT INTO audit_logs (
    action,
    user_id,
    resource_type,
    resource_id,
    metadata,
    created_at
) VALUES (
    'rls_policies_implemented',
    NULL,
    'clinical_staffing_system',
    'rls_migration',
    jsonb_build_object(
        'migration_name', '2025_01_11_implement_clinical_staffing_rls_policies',
        'tables_secured', ARRAY[
            'staff_members',
            'physician_support_requirements', 
            'staff_schedules',
            'provider_schedules_cache',
            'staff_availability',
            'staffing_optimization_rules',
            'staffing_analytics'
        ],
        'policies_created', 'comprehensive_role_based_access_control',
        'completion_time', NOW()
    ),
    NOW()
);