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


-- Migration: 2025_01_12_create_config_dashboard_tables.sql
-- ==========================================

-- =====================================================
-- Ganger Platform Database Schema - Configuration Dashboard
-- Migration: 2025_01_12_create_config_dashboard_tables.sql
-- Created: January 12, 2025
-- Purpose: Centralized application configuration management
-- =====================================================

-- =====================================================
-- PLATFORM APPLICATIONS TABLE
-- Registry of all applications in the platform
-- =====================================================
CREATE TABLE platform_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Application Identity
  app_name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  app_version VARCHAR(50),
  
  -- Application URLs and Health
  app_url TEXT,
  health_check_endpoint TEXT,
  documentation_url TEXT,
  
  -- Configuration Schema
  config_schema JSONB,
  default_config JSONB,
  
  -- Status and Discovery
  is_active BOOLEAN DEFAULT true,
  last_discovered_at TIMESTAMPTZ DEFAULT NOW(),
  discovery_method VARCHAR(50) DEFAULT 'manual',
  
  -- Workflow Configuration
  requires_approval_for_changes BOOLEAN DEFAULT false,
  config_change_notification_roles TEXT[] DEFAULT ARRAY['superadmin']
);

-- =====================================================
-- APP CONFIGURATIONS TABLE
-- Storage for application configuration values
-- =====================================================
CREATE TABLE app_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES platform_applications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Configuration Identity
  config_key VARCHAR(255) NOT NULL,
  config_section VARCHAR(100),
  config_value JSONB NOT NULL,
  value_type VARCHAR(50) DEFAULT 'json',
  
  -- Configuration Metadata
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  requires_restart BOOLEAN DEFAULT false,
  environment VARCHAR(50) DEFAULT 'production',
  
  -- Approval Status
  approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  UNIQUE(app_id, config_key, environment)
);

-- =====================================================
-- APP CONFIG PERMISSIONS TABLE
-- Role and user-based permission management
-- =====================================================
CREATE TABLE app_config_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES platform_applications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  
  -- Permission Target
  permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('role', 'user')),
  role_name VARCHAR(100),
  user_id UUID REFERENCES auth.users(id),
  
  -- Permission Level
  permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('read', 'write', 'admin')),
  config_section VARCHAR(100),
  specific_keys TEXT[],
  
  -- Location Restrictions
  location_restricted BOOLEAN DEFAULT false,
  allowed_locations TEXT[],
  
  -- Status and Expiry
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  
  -- Ensure either role_name or user_id is set, not both
  CHECK (
    (permission_type = 'role' AND role_name IS NOT NULL AND user_id IS NULL) OR
    (permission_type = 'user' AND user_id IS NOT NULL AND role_name IS NULL)
  )
);

-- =====================================================
-- USER IMPERSONATION SESSIONS TABLE
-- Secure user impersonation tracking
-- =====================================================
CREATE TABLE user_impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_id UUID REFERENCES auth.users(id) NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Session Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  session_duration_minutes INTEGER,
  
  -- Session Context
  reason TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Session Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired', 'terminated')),
  ended_by VARCHAR(20) CHECK (ended_by IN ('impersonator', 'system', 'admin', 'timeout')),
  
  -- Security Constraints
  CHECK (impersonator_id != target_user_id),
  CHECK (started_at < ended_at OR ended_at IS NULL)
);

-- =====================================================
-- CONFIG CHANGE AUDIT TABLE
-- Comprehensive audit trail for all configuration changes
-- =====================================================
CREATE TABLE config_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES platform_applications(id) ON DELETE CASCADE,
  config_id UUID REFERENCES app_configurations(id) ON DELETE CASCADE,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Change Actor
  changed_by UUID REFERENCES auth.users(id),
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  
  -- Impersonation Context
  was_impersonating BOOLEAN DEFAULT false,
  impersonation_session_id UUID REFERENCES user_impersonation_sessions(id),
  actual_user_id UUID REFERENCES auth.users(id),
  
  -- Change Details
  old_value JSONB,
  new_value JSONB,
  change_reason TEXT,
  
  -- Request Context
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(255)
);

-- =====================================================
-- PENDING CONFIG CHANGES TABLE
-- Approval workflow for configuration changes
-- =====================================================
CREATE TABLE pending_config_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES platform_applications(id) ON DELETE CASCADE,
  config_key VARCHAR(255) NOT NULL,
  
  -- Request Details
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_by UUID REFERENCES auth.users(id),
  
  -- Change Information
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  current_value JSONB,
  proposed_value JSONB,
  change_reason TEXT NOT NULL,
  
  -- Review Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Expiry
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Constraints
  CHECK (requested_at < expires_at),
  CHECK (
    (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
    (status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Platform Applications indexes
CREATE INDEX idx_platform_applications_name ON platform_applications(app_name);
CREATE INDEX idx_platform_applications_active ON platform_applications(is_active);
CREATE INDEX idx_platform_applications_discovery ON platform_applications(last_discovered_at) WHERE is_active = true;

-- App Configurations indexes
CREATE INDEX idx_app_configurations_app ON app_configurations(app_id);
CREATE INDEX idx_app_configurations_key ON app_configurations(config_key);
CREATE INDEX idx_app_configurations_section ON app_configurations(config_section);
CREATE INDEX idx_app_configurations_env ON app_configurations(environment);
CREATE INDEX idx_app_configurations_approval ON app_configurations(approval_status);
CREATE INDEX idx_app_configurations_sensitive ON app_configurations(is_sensitive);
CREATE INDEX idx_app_configurations_updated ON app_configurations(updated_at);

-- Permission indexes
CREATE INDEX idx_app_config_permissions_app ON app_config_permissions(app_id);
CREATE INDEX idx_app_config_permissions_user ON app_config_permissions(user_id) WHERE permission_type = 'user';
CREATE INDEX idx_app_config_permissions_role ON app_config_permissions(role_name) WHERE permission_type = 'role';
CREATE INDEX idx_app_config_permissions_active ON app_config_permissions(is_active);
CREATE INDEX idx_app_config_permissions_expires ON app_config_permissions(expires_at) WHERE expires_at IS NOT NULL;

-- Impersonation indexes
CREATE INDEX idx_impersonation_impersonator ON user_impersonation_sessions(impersonator_id);
CREATE INDEX idx_impersonation_target ON user_impersonation_sessions(target_user_id);
CREATE INDEX idx_impersonation_status ON user_impersonation_sessions(status);
CREATE INDEX idx_impersonation_active ON user_impersonation_sessions(started_at) WHERE status = 'active';

-- Audit indexes
CREATE INDEX idx_config_audit_app ON config_change_audit(app_id);
CREATE INDEX idx_config_audit_config ON config_change_audit(config_id);
CREATE INDEX idx_config_audit_user ON config_change_audit(changed_by);
CREATE INDEX idx_config_audit_date ON config_change_audit(changed_at);
CREATE INDEX idx_config_audit_impersonation ON config_change_audit(impersonation_session_id) WHERE was_impersonating = true;

-- Pending changes indexes
CREATE INDEX idx_pending_changes_app ON pending_config_changes(app_id);
CREATE INDEX idx_pending_changes_status ON pending_config_changes(status);
CREATE INDEX idx_pending_changes_requested ON pending_config_changes(requested_by);
CREATE INDEX idx_pending_changes_expires ON pending_config_changes(expires_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE platform_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_change_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_config_changes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PLATFORM APPLICATIONS RLS POLICIES
-- =====================================================

-- View applications policy
CREATE POLICY "app_access_policy" ON platform_applications
FOR SELECT USING (
  -- Superadmins can see all
  (auth.jwt() ->> 'role') = 'superadmin'
  OR
  -- Managers can see all active apps
  ((auth.jwt() ->> 'role') = 'manager' AND is_active = true)
  OR
  -- Users can see apps they have permissions for
  id IN (
    SELECT acp.app_id FROM app_config_permissions acp
    WHERE (
      (acp.permission_type = 'role' AND acp.role_name = (auth.jwt() ->> 'role'))
      OR (acp.permission_type = 'user' AND acp.user_id = auth.uid())
    ) 
    AND acp.is_active = true
    AND (acp.expires_at IS NULL OR acp.expires_at > NOW())
  )
);

-- Modify applications policy (superadmin only)
CREATE POLICY "app_modify_policy" ON platform_applications
FOR ALL USING ((auth.jwt() ->> 'role') = 'superadmin');

-- =====================================================
-- APP CONFIGURATIONS RLS POLICIES
-- =====================================================

-- View configurations policy
CREATE POLICY "config_view_policy" ON app_configurations
FOR SELECT USING (
  -- Superadmins can see all
  (auth.jwt() ->> 'role') = 'superadmin'
  OR
  -- Users with proper permissions can see configurations
  app_id IN (
    SELECT acp.app_id FROM app_config_permissions acp
    WHERE (
      (acp.permission_type = 'role' AND acp.role_name = (auth.jwt() ->> 'role'))
      OR (acp.permission_type = 'user' AND acp.user_id = auth.uid())
    ) 
    AND acp.permission_level IN ('read', 'write', 'admin')
    AND acp.is_active = true
    AND (acp.expires_at IS NULL OR acp.expires_at > NOW())
    -- Check section-level permissions if specified
    AND (acp.config_section IS NULL OR acp.config_section = config_section)
    -- Check specific key permissions if specified
    AND (acp.specific_keys IS NULL OR config_key = ANY(acp.specific_keys))
  )
  -- Filter sensitive configurations for non-admin users
  AND (
    NOT is_sensitive 
    OR (auth.jwt() ->> 'role') IN ('manager', 'superadmin')
    OR app_id IN (
      SELECT acp.app_id FROM app_config_permissions acp
      WHERE (
        (acp.permission_type = 'role' AND acp.role_name = (auth.jwt() ->> 'role'))
        OR (acp.permission_type = 'user' AND acp.user_id = auth.uid())
      ) 
      AND acp.permission_level = 'admin'
      AND acp.is_active = true
    )
  )
);

-- Modify configurations policy
CREATE POLICY "config_modify_policy" ON app_configurations
FOR ALL USING (
  -- Superadmins can modify all
  (auth.jwt() ->> 'role') = 'superadmin'
  OR
  -- Users with write or admin permissions can modify
  app_id IN (
    SELECT acp.app_id FROM app_config_permissions acp
    WHERE (
      (acp.permission_type = 'role' AND acp.role_name = (auth.jwt() ->> 'role'))
      OR (acp.permission_type = 'user' AND acp.user_id = auth.uid())
    ) 
    AND acp.permission_level IN ('write', 'admin')
    AND acp.is_active = true
    AND (acp.expires_at IS NULL OR acp.expires_at > NOW())
    -- Check section-level permissions if specified
    AND (acp.config_section IS NULL OR acp.config_section = config_section)
    -- Check specific key permissions if specified
    AND (acp.specific_keys IS NULL OR config_key = ANY(acp.specific_keys))
  )
);

-- =====================================================
-- PERMISSIONS TABLE RLS POLICIES
-- =====================================================

-- View permissions policy
CREATE POLICY "permissions_view_policy" ON app_config_permissions
FOR SELECT USING (
  -- Superadmins can see all
  (auth.jwt() ->> 'role') = 'superadmin'
  OR
  -- Managers can see permissions for apps they manage
  ((auth.jwt() ->> 'role') = 'manager' AND app_id IN (
    SELECT acp.app_id FROM app_config_permissions acp
    WHERE (
      (acp.permission_type = 'role' AND acp.role_name = 'manager')
      OR (acp.permission_type = 'user' AND acp.user_id = auth.uid())
    ) 
    AND acp.permission_level = 'admin'
    AND acp.is_active = true
  ))
  OR
  -- Users can see their own permissions
  (user_id = auth.uid() AND permission_type = 'user')
);

-- Modify permissions policy (admin-level only)
CREATE POLICY "permissions_modify_policy" ON app_config_permissions
FOR ALL USING (
  (auth.jwt() ->> 'role') = 'superadmin'
  OR
  ((auth.jwt() ->> 'role') = 'manager' AND app_id IN (
    SELECT acp.app_id FROM app_config_permissions acp
    WHERE (
      (acp.permission_type = 'role' AND acp.role_name = 'manager')
      OR (acp.permission_type = 'user' AND acp.user_id = auth.uid())
    ) 
    AND acp.permission_level = 'admin'
    AND acp.is_active = true
  ))
);

-- =====================================================
-- IMPERSONATION RLS POLICIES
-- =====================================================

-- View impersonation sessions
CREATE POLICY "impersonation_view_policy" ON user_impersonation_sessions
FOR SELECT USING (
  -- Superadmins can see all sessions
  (auth.jwt() ->> 'role') = 'superadmin'
  OR
  -- Users can see sessions where they were the impersonator or target
  (impersonator_id = auth.uid() OR target_user_id = auth.uid())
  OR
  -- Managers can see sessions involving their team members
  ((auth.jwt() ->> 'role') = 'manager')
);

-- Create impersonation sessions (superadmin and manager only)
CREATE POLICY "impersonation_create_policy" ON user_impersonation_sessions
FOR INSERT WITH CHECK (
  (auth.jwt() ->> 'role') IN ('superadmin', 'manager')
  AND impersonator_id = auth.uid()
);

-- Update impersonation sessions (only the impersonator or superadmin)
CREATE POLICY "impersonation_update_policy" ON user_impersonation_sessions
FOR UPDATE USING (
  (auth.jwt() ->> 'role') = 'superadmin'
  OR impersonator_id = auth.uid()
);

-- =====================================================
-- AUDIT LOG RLS POLICIES
-- =====================================================

-- View audit logs
CREATE POLICY "audit_view_policy" ON config_change_audit
FOR SELECT USING (
  -- Superadmins can see all audit logs
  (auth.jwt() ->> 'role') = 'superadmin'
  OR
  -- Managers can see audit logs for apps they manage
  ((auth.jwt() ->> 'role') = 'manager' AND app_id IN (
    SELECT acp.app_id FROM app_config_permissions acp
    WHERE (
      (acp.permission_type = 'role' AND acp.role_name = 'manager')
      OR (acp.permission_type = 'user' AND acp.user_id = auth.uid())
    ) 
    AND acp.permission_level = 'admin'
    AND acp.is_active = true
  ))
  OR
  -- Users can see their own actions
  (changed_by = auth.uid() OR actual_user_id = auth.uid())
);

-- Insert audit logs (system only - handled by triggers)
CREATE POLICY "audit_insert_policy" ON config_change_audit
FOR INSERT WITH CHECK (true); -- Allows system to insert, but RLS on SELECT controls visibility

-- =====================================================
-- PENDING CHANGES RLS POLICIES
-- =====================================================

-- View pending changes
CREATE POLICY "pending_view_policy" ON pending_config_changes
FOR SELECT USING (
  -- Superadmins can see all
  (auth.jwt() ->> 'role') = 'superadmin'
  OR
  -- Managers can see pending changes for apps they manage
  ((auth.jwt() ->> 'role') = 'manager' AND app_id IN (
    SELECT acp.app_id FROM app_config_permissions acp
    WHERE (
      (acp.permission_type = 'role' AND acp.role_name = 'manager')
      OR (acp.permission_type = 'user' AND acp.user_id = auth.uid())
    ) 
    AND acp.permission_level = 'admin'
    AND acp.is_active = true
  ))
  OR
  -- Users can see their own requests
  (requested_by = auth.uid())
);

-- Create pending changes
CREATE POLICY "pending_create_policy" ON pending_config_changes
FOR INSERT WITH CHECK (
  requested_by = auth.uid()
  AND app_id IN (
    SELECT acp.app_id FROM app_config_permissions acp
    WHERE (
      (acp.permission_type = 'role' AND acp.role_name = (auth.jwt() ->> 'role'))
      OR (acp.permission_type = 'user' AND acp.user_id = auth.uid())
    ) 
    AND acp.permission_level IN ('write', 'admin')
    AND acp.is_active = true
  )
);

-- Update pending changes (reviewers only)
CREATE POLICY "pending_update_policy" ON pending_config_changes
FOR UPDATE USING (
  (auth.jwt() ->> 'role') = 'superadmin'
  OR
  ((auth.jwt() ->> 'role') = 'manager' AND app_id IN (
    SELECT acp.app_id FROM app_config_permissions acp
    WHERE (
      (acp.permission_type = 'role' AND acp.role_name = 'manager')
      OR (acp.permission_type = 'user' AND acp.user_id = auth.uid())
    ) 
    AND acp.permission_level = 'admin'
    AND acp.is_active = true
  ))
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check user permission for specific app and action
CREATE OR REPLACE FUNCTION check_user_app_permission(
  user_id UUID,
  app_id UUID,
  required_level TEXT,
  config_key TEXT DEFAULT NULL,
  config_section TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  has_permission BOOLEAN := false;
BEGIN
  -- Get user role
  SELECT (auth.jwt() ->> 'role') INTO user_role;
  
  -- Superadmin has all permissions
  IF user_role = 'superadmin' THEN
    RETURN true;
  END IF;
  
  -- Check for explicit permissions
  SELECT EXISTS (
    SELECT 1 FROM app_config_permissions acp
    WHERE acp.app_id = check_user_app_permission.app_id
    AND (
      (acp.permission_type = 'role' AND acp.role_name = user_role)
      OR (acp.permission_type = 'user' AND acp.user_id = check_user_app_permission.user_id)
    )
    AND (
      (required_level = 'read' AND acp.permission_level IN ('read', 'write', 'admin'))
      OR (required_level = 'write' AND acp.permission_level IN ('write', 'admin'))
      OR (required_level = 'admin' AND acp.permission_level = 'admin')
    )
    AND acp.is_active = true
    AND (acp.expires_at IS NULL OR acp.expires_at > NOW())
    -- Check section restriction if specified
    AND (acp.config_section IS NULL OR acp.config_section = check_user_app_permission.config_section)
    -- Check key restriction if specified
    AND (acp.specific_keys IS NULL OR check_user_app_permission.config_key = ANY(acp.specific_keys))
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get effective user permissions
CREATE OR REPLACE FUNCTION get_user_effective_permissions(user_id UUID)
RETURNS TABLE (
  app_id UUID,
  app_name TEXT,
  permission_level TEXT,
  config_section TEXT,
  specific_keys TEXT[],
  source TEXT
) AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user role
  SELECT (auth.jwt() ->> 'role') INTO user_role;
  
  -- Return permissions based on role and explicit grants
  RETURN QUERY
  SELECT 
    pa.id as app_id,
    pa.app_name,
    acp.permission_level,
    acp.config_section,
    acp.specific_keys,
    CASE 
      WHEN acp.permission_type = 'role' THEN 'role:' || acp.role_name
      ELSE 'user:' || acp.user_id::text
    END as source
  FROM app_config_permissions acp
  JOIN platform_applications pa ON pa.id = acp.app_id
  WHERE (
    (acp.permission_type = 'role' AND acp.role_name = user_role)
    OR (acp.permission_type = 'user' AND acp.user_id = get_user_effective_permissions.user_id)
  )
  AND acp.is_active = true
  AND (acp.expires_at IS NULL OR acp.expires_at > NOW())
  ORDER BY pa.app_name, acp.permission_level DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUDIT TRIGGERS
-- =====================================================

-- Function to log configuration changes
CREATE OR REPLACE FUNCTION log_config_change()
RETURNS TRIGGER AS $$
DECLARE
  change_type_val TEXT;
  impersonation_session UUID;
  actual_user UUID;
  is_impersonating BOOLEAN := false;
BEGIN
  -- Determine change type
  IF TG_OP = 'INSERT' THEN
    change_type_val := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    change_type_val := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    change_type_val := 'delete';
  END IF;
  
  -- Check for active impersonation session
  SELECT id, impersonator_id INTO impersonation_session, actual_user
  FROM user_impersonation_sessions
  WHERE target_user_id = auth.uid()
  AND status = 'active'
  ORDER BY started_at DESC
  LIMIT 1;
  
  IF impersonation_session IS NOT NULL THEN
    is_impersonating := true;
  END IF;
  
  -- Insert audit record
  INSERT INTO config_change_audit (
    app_id,
    config_id,
    changed_by,
    change_type,
    was_impersonating,
    impersonation_session_id,
    actual_user_id,
    old_value,
    new_value,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(NEW.app_id, OLD.app_id),
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    change_type_val,
    is_impersonating,
    impersonation_session,
    actual_user,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) ELSE to_jsonb(NEW) END,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

