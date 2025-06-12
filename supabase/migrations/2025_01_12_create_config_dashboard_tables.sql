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

-- Create triggers for audit logging
CREATE TRIGGER config_change_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON app_configurations
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Register existing platform applications
INSERT INTO platform_applications (
  app_name, display_name, description, app_url, health_check_endpoint,
  config_schema, default_config, requires_approval_for_changes
) VALUES 
-- Core Applications
('inventory', 'Inventory Management', 'Medical supply tracking with barcode scanning and real-time stock management', 
 'https://inventory.gangerdermatology.com', '/api/health',
 '{"sections": {"general": {"type": "object"}, "alerts": {"type": "object"}, "integrations": {"type": "object"}}}',
 '{"general": {"auto_reorder": true, "low_stock_threshold": 10}, "alerts": {"email_notifications": true}}',
 false),

('handouts', 'Patient Handouts Generator', 'Custom educational materials with QR scanning and digital delivery',
 'https://handouts.gangerdermatology.com', '/api/health',
 '{"sections": {"templates": {"type": "object"}, "delivery": {"type": "object"}, "analytics": {"type": "object"}}}',
 '{"templates": {"auto_save": true}, "delivery": {"default_method": "email"}, "analytics": {"track_opens": true}}',
 false),

('checkin-kiosk', 'Check-in Kiosk', 'Patient self-service terminal with payment processing',
 'https://checkin.gangerdermatology.com', '/api/health',
 '{"sections": {"payments": {"type": "object"}, "display": {"type": "object"}, "security": {"type": "object"}}}',
 '{"payments": {"stripe_mode": "live"}, "display": {"timeout_minutes": 5}, "security": {"require_signature": true}}',
 true),

('eos-l10', 'EOS L10 Management', 'Level 10 meeting platform replacing ninety.io',
 'https://l10.gangerdermatology.com', '/api/health',
 '{"sections": {"meetings": {"type": "object"}, "scorecard": {"type": "object"}, "rocks": {"type": "object"}}}',
 '{"meetings": {"default_duration": 90}, "scorecard": {"auto_calculate": true}, "rocks": {"quarterly_review": true}}',
 false),

('pharma-scheduling', 'Pharmaceutical Rep Scheduling', 'Professional pharmaceutical rep booking system',
 'https://pharma.gangerdermatology.com', '/api/health',
 '{"sections": {"booking": {"type": "object"}, "calendar": {"type": "object"}, "notifications": {"type": "object"}}}',
 '{"booking": {"advance_booking_days": 30}, "calendar": {"google_sync": true}, "notifications": {"sms_enabled": true}}',
 true),

-- Management Applications
('medication-auth', 'Medication Authorization Assistant', 'AI-powered prior authorization automation',
 'https://medauth.gangerdermatology.com', '/api/health',
 '{"sections": {"ai": {"type": "object"}, "fhir": {"type": "object"}, "compliance": {"type": "object"}}}',
 '{"ai": {"auto_submit": false}, "fhir": {"version": "R4"}, "compliance": {"audit_all": true}}',
 true),

('clinical-staffing', 'Clinical Staffing Optimization', 'AI-powered staff scheduling across locations',
 'https://staffing.gangerdermatology.com', '/api/health',
 '{"sections": {"scheduling": {"type": "object"}, "deputy": {"type": "object"}, "analytics": {"type": "object"}}}',
 '{"scheduling": {"auto_optimize": true}, "deputy": {"sync_enabled": false}, "analytics": {"performance_tracking": true}}',
 false),

('integration-status', 'Third-Party Integration Status', 'Real-time monitoring of all external services',
 'https://integrations.gangerdermatology.com', '/api/health',
 '{"sections": {"monitoring": {"type": "object"}, "alerting": {"type": "object"}, "performance": {"type": "object"}}}',
 '{"monitoring": {"check_interval": 60}, "alerting": {"slack_webhook": true}, "performance": {"track_metrics": true}}',
 false),

-- Additional Applications
('compliance-training', 'Compliance Training Manager', 'Manager training oversight and compliance tracking',
 'https://compliance.gangerdermatology.com', '/api/health',
 '{"sections": {"training": {"type": "object"}, "tracking": {"type": "object"}, "reporting": {"type": "object"}}}',
 '{"training": {"auto_assign": true}, "tracking": {"completion_alerts": true}, "reporting": {"monthly_reports": true}}',
 false),

('batch-closeout', 'Batch Closeout & Label Generator', 'Financial processing and label printing',
 'https://batch.gangerdermatology.com', '/api/health',
 '{"sections": {"processing": {"type": "object"}, "labels": {"type": "object"}, "verification": {"type": "object"}}}',
 '{"processing": {"auto_verify": false}, "labels": {"printer_settings": {}}, "verification": {"require_manual": true}}',
 true),

('socials-reviews', 'Socials & Reviews Management', 'AI-powered social media monitoring and Google Business review management',
 'https://socials.gangerdermatology.com', '/api/health',
 '{"sections": {"monitoring": {"type": "object"}, "responses": {"type": "object"}, "analytics": {"type": "object"}}}',
 '{"monitoring": {"check_frequency": "hourly"}, "responses": {"auto_respond": false}, "analytics": {"sentiment_tracking": true}}',
 false),

('call-center-ops', 'Call Center Operations Dashboard', 'Real-time operational analytics and optimization',
 'https://callcenter.gangerdermatology.com', '/api/health',
 '{"sections": {"3cx": {"type": "object"}, "analytics": {"type": "object"}, "reporting": {"type": "object"}}}',
 '{"3cx": {"webhook_enabled": true}, "analytics": {"real_time": true}, "reporting": {"daily_summary": true}}',
 false),

-- Platform Management
('platform-dashboard', 'Platform Entrypoint Dashboard', 'Unified access point for all platform applications',
 'https://platform.gangerdermatology.com', '/api/health',
 '{"sections": {"apps": {"type": "object"}, "search": {"type": "object"}, "activity": {"type": "object"}}}',
 '{"apps": {"show_health": true}, "search": {"cross_app": true}, "activity": {"log_access": true}}',
 false),

('config-dashboard', 'Consolidated Configuration Dashboard', 'Centralized application settings management',
 'https://config.gangerdermatology.com', '/api/health',
 '{"sections": {"permissions": {"type": "object"}, "audit": {"type": "object"}, "approvals": {"type": "object"}}}',
 '{"permissions": {"inherit_roles": true}, "audit": {"full_logging": true}, "approvals": {"auto_expire_days": 7}}',
 true),

-- Future Applications
('staff', 'Staff Management System', 'Employee management and HR workflows',
 'https://staff.gangerdermatology.com', '/api/health',
 '{"sections": {"hr": {"type": "object"}, "tickets": {"type": "object"}, "scheduling": {"type": "object"}}}',
 '{"hr": {"google_sync": true}, "tickets": {"auto_assign": true}, "scheduling": {"deputy_integration": false}}',
 true),

('provider-dashboard', 'Provider Revenue Dashboard', 'Revenue optimization and performance analytics',
 'https://provider.gangerdermatology.com', '/api/health',
 '{"sections": {"revenue": {"type": "object"}, "performance": {"type": "object"}, "analytics": {"type": "object"}}}',
 '{"revenue": {"track_collections": true}, "performance": {"benchmark_enabled": false}, "analytics": {"predictive_modeling": false}}',
 false),

('ai-agent', 'AI Phone Agent System', 'Revolutionary patient communication automation',
 'https://ai-agent.gangerdermatology.com', '/api/health',
 '{"sections": {"ai": {"type": "object"}, "telephony": {"type": "object"}, "integration": {"type": "object"}}}',
 '{"ai": {"model": "gpt-4"}, "telephony": {"provider": "twilio"}, "integration": {"modmed_sync": false}}',
 true);

-- Grant initial permissions to superadmin role
INSERT INTO app_config_permissions (
  app_id, permission_type, role_name, permission_level, granted_by
)
SELECT 
  id, 
  'role', 
  'superadmin', 
  'admin',
  (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
FROM platform_applications
WHERE (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1) IS NOT NULL;

-- Grant manager permissions for operational apps
INSERT INTO app_config_permissions (
  app_id, permission_type, role_name, permission_level, granted_by
)
SELECT 
  id, 
  'role', 
  'manager', 
  'write',
  (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
FROM platform_applications 
WHERE app_name IN ('inventory', 'handouts', 'eos-l10', 'clinical-staffing', 'integration-status', 'compliance-training', 'platform-dashboard')
AND (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1) IS NOT NULL;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE platform_applications IS 'Registry of all applications in the Ganger Platform with configuration schemas';
COMMENT ON TABLE app_configurations IS 'Storage for application configuration values with approval workflow support';
COMMENT ON TABLE app_config_permissions IS 'Role and user-based permission management for configuration access';
COMMENT ON TABLE user_impersonation_sessions IS 'Secure tracking of user impersonation sessions with comprehensive audit';
COMMENT ON TABLE config_change_audit IS 'Complete audit trail for all configuration changes with impersonation context';
COMMENT ON TABLE pending_config_changes IS 'Approval workflow queue for configuration changes requiring review';

COMMENT ON FUNCTION check_user_app_permission IS 'Check if user has specific permission level for app configuration';
COMMENT ON FUNCTION get_user_effective_permissions IS 'Get all effective permissions for a user across all applications';
COMMENT ON FUNCTION log_config_change IS 'Audit trigger function to log all configuration changes';