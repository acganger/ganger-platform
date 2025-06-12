-- ================================================
-- MEDICATION AUTHORIZATION SYSTEM - ROW LEVEL SECURITY
-- Migration: 012_create_medication_authorization_rls.sql
-- Description: HIPAA-compliant RLS policies for medication authorization system
-- Date: 2025-01-08
-- ================================================

-- ================================================
-- ENABLE ROW LEVEL SECURITY
-- ================================================

ALTER TABLE medication_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorization_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorization_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorization_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorization_audit_logs ENABLE ROW LEVEL SECURITY;

-- ================================================
-- MEDICATION AUTHORIZATIONS POLICIES
-- ================================================

-- Providers can view and manage their own authorizations
CREATE POLICY "Providers can view their own authorizations" ON medication_authorizations
    FOR SELECT USING (
        provider_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'nurse', 'medical_assistant')
        )
    );

CREATE POLICY "Providers can create authorizations" ON medication_authorizations
    FOR INSERT WITH CHECK (
        provider_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'nurse', 'medical_assistant', 'provider')
        )
    );

CREATE POLICY "Providers can update their own authorizations" ON medication_authorizations
    FOR UPDATE USING (
        provider_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'nurse', 'medical_assistant')
        )
    ) WITH CHECK (
        provider_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'nurse', 'medical_assistant')
        )
    );

-- Only admins can delete authorizations (for compliance)
CREATE POLICY "Only admins can delete authorizations" ON medication_authorizations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ================================================
-- PATIENTS POLICIES
-- ================================================

-- Healthcare staff can view patient information
CREATE POLICY "Healthcare staff can view patients" ON patients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'provider', 'nurse', 'medical_assistant', 'pharmacy_tech')
        )
    );

-- Only admins and providers can create/update patient records
CREATE POLICY "Providers can manage patient records" ON patients
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'provider', 'nurse')
        )
    );

CREATE POLICY "Providers can update patient records" ON patients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'provider', 'nurse')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'provider', 'nurse')
        )
    );

-- Only admins can delete patient records
CREATE POLICY "Only admins can delete patients" ON patients
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ================================================
-- MEDICATIONS POLICIES
-- ================================================

-- All authenticated users can view medication database
CREATE POLICY "Authenticated users can view medications" ON medications
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins and pharmacy staff can manage medication database
CREATE POLICY "Pharmacy staff can manage medications" ON medications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pharmacy_tech', 'provider')
        )
    );

CREATE POLICY "Pharmacy staff can update medications" ON medications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pharmacy_tech', 'provider')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pharmacy_tech', 'provider')
        )
    );

-- Only admins can delete medications
CREATE POLICY "Only admins can delete medications" ON medications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ================================================
-- INSURANCE PROVIDERS POLICIES
-- ================================================

-- All authenticated users can view insurance provider information
CREATE POLICY "Authenticated users can view insurance providers" ON insurance_providers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage insurance provider data
CREATE POLICY "Only admins can manage insurance providers" ON insurance_providers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update insurance providers" ON insurance_providers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete insurance providers" ON insurance_providers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ================================================
-- AI RECOMMENDATIONS POLICIES
-- ================================================

-- Users can view AI recommendations for authorizations they can access
CREATE POLICY "Users can view accessible AI recommendations" ON ai_recommendations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medication_authorizations ma
            WHERE ma.id = authorization_id
            AND (
                ma.provider_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'nurse', 'medical_assistant')
                )
            )
        )
    );

-- System can create AI recommendations (service role)
CREATE POLICY "System can create AI recommendations" ON ai_recommendations
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'provider')
        )
    );

-- No updates or deletes on AI recommendations (audit trail)
CREATE POLICY "AI recommendations are immutable" ON ai_recommendations
    FOR UPDATE USING (false);

CREATE POLICY "AI recommendations cannot be deleted" ON ai_recommendations
    FOR DELETE USING (false);

-- ================================================
-- WORKFLOW STEPS POLICIES
-- ================================================

-- Users can view workflow steps for accessible authorizations
CREATE POLICY "Users can view accessible workflow steps" ON authorization_workflow_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medication_authorizations ma
            WHERE ma.id = authorization_id
            AND (
                ma.provider_id = auth.uid() OR
                assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'nurse', 'medical_assistant')
                )
            )
        )
    );

-- Users can create workflow steps for accessible authorizations
CREATE POLICY "Users can create workflow steps" ON authorization_workflow_steps
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM medication_authorizations ma
            WHERE ma.id = authorization_id
            AND (
                ma.provider_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'nurse', 'medical_assistant')
                )
            )
        )
    );

-- Users can update workflow steps they're assigned to or have access to
CREATE POLICY "Users can update assigned workflow steps" ON authorization_workflow_steps
    FOR UPDATE USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM medication_authorizations ma
            WHERE ma.id = authorization_id
            AND (
                ma.provider_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'nurse', 'medical_assistant')
                )
            )
        )
    ) WITH CHECK (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM medication_authorizations ma
            WHERE ma.id = authorization_id
            AND (
                ma.provider_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'nurse', 'medical_assistant')
                )
            )
        )
    );

-- Only admins can delete workflow steps
CREATE POLICY "Only admins can delete workflow steps" ON authorization_workflow_steps
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ================================================
-- COMMUNICATIONS POLICIES
-- ================================================

-- Users can view communications for accessible authorizations
CREATE POLICY "Users can view accessible communications" ON authorization_communications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medication_authorizations ma
            WHERE ma.id = authorization_id
            AND (
                ma.provider_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'nurse', 'medical_assistant')
                )
            )
        )
    );

-- Users can create communications for accessible authorizations
CREATE POLICY "Users can create communications" ON authorization_communications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM medication_authorizations ma
            WHERE ma.id = authorization_id
            AND (
                ma.provider_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'nurse', 'medical_assistant')
                )
            )
        )
    );

-- Communications are immutable for audit purposes
CREATE POLICY "Communications are immutable" ON authorization_communications
    FOR UPDATE USING (false);

CREATE POLICY "Communications cannot be deleted" ON authorization_communications
    FOR DELETE USING (false);

-- ================================================
-- ANALYTICS POLICIES
-- ================================================

-- Analytics can be viewed by staff and providers
CREATE POLICY "Staff can view analytics" ON authorization_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'provider', 'nurse', 'medical_assistant', 'manager')
        )
    );

-- Only system and admins can manage analytics
CREATE POLICY "System can manage analytics" ON authorization_analytics
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "System can update analytics" ON authorization_analytics
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    ) WITH CHECK (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Only admins can delete analytics
CREATE POLICY "Only admins can delete analytics" ON authorization_analytics
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ================================================
-- AUDIT LOGS POLICIES
-- ================================================

-- Audit logs can be viewed by admins and compliance officers
CREATE POLICY "Admins can view audit logs" ON authorization_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'compliance_officer')
        )
    );

-- Only system can create audit logs
CREATE POLICY "System can create audit logs" ON authorization_audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Audit logs are immutable
CREATE POLICY "Audit logs are immutable" ON authorization_audit_logs
    FOR UPDATE USING (false);

CREATE POLICY "Audit logs cannot be deleted" ON authorization_audit_logs
    FOR DELETE USING (false);

-- ================================================
-- HELPER FUNCTIONS FOR RLS
-- ================================================

-- Function to check if user can access specific authorization
CREATE OR REPLACE FUNCTION user_can_access_authorization(auth_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM medication_authorizations ma
        WHERE ma.id = auth_id
        AND (
            ma.provider_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE id = auth.uid() 
                AND role IN ('admin', 'nurse', 'medical_assistant')
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is healthcare staff
CREATE OR REPLACE FUNCTION is_healthcare_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'provider', 'nurse', 'medical_assistant', 'pharmacy_tech')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- GRANT PERMISSIONS
-- ================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION user_can_access_authorization(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_healthcare_staff() TO authenticated;

-- ================================================
-- COMMENTS FOR DOCUMENTATION
-- ================================================

COMMENT ON FUNCTION user_can_access_authorization(UUID) IS 'Helper function to check if current user can access a specific authorization';
COMMENT ON FUNCTION get_user_role() IS 'Returns the role of the current authenticated user';
COMMENT ON FUNCTION is_healthcare_staff() IS 'Returns true if current user is healthcare staff with patient access';

-- ================================================
-- RLS MIGRATION COMPLETE
-- ================================================