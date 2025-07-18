    INDEX idx_audit_logs_action ON authorization_audit_logs(action),
    INDEX idx_audit_logs_created_at ON authorization_audit_logs(created_at),
    INDEX idx_audit_logs_phi_access ON authorization_audit_logs(phi_accessed)
);

-- ================================================
-- CREATE UPDATED_AT TRIGGERS
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_medication_authorizations_updated_at
    BEFORE UPDATE ON medication_authorizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
    BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_providers_updated_at
    BEFORE UPDATE ON insurance_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authorization_workflow_steps_updated_at
    BEFORE UPDATE ON authorization_workflow_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authorization_analytics_updated_at
    BEFORE UPDATE ON authorization_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================================

-- Primary lookup indexes
CREATE INDEX idx_med_auth_patient_id ON medication_authorizations(patient_id);
CREATE INDEX idx_med_auth_provider_id ON medication_authorizations(provider_id);
CREATE INDEX idx_med_auth_medication_id ON medication_authorizations(medication_id);
CREATE INDEX idx_med_auth_insurance_id ON medication_authorizations(insurance_provider_id);
CREATE INDEX idx_med_auth_status ON medication_authorizations(status);
CREATE INDEX idx_med_auth_priority ON medication_authorizations(priority_level);
CREATE INDEX idx_med_auth_created_at ON medication_authorizations(created_at);
CREATE INDEX idx_med_auth_submitted_at ON medication_authorizations(submitted_at);

-- Patient lookup indexes
CREATE INDEX idx_patients_modmed_id ON patients(modmed_patient_id);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_sync_status ON patients(sync_status);

-- Medication lookup indexes
CREATE INDEX idx_medications_ndc ON medications(ndc_number);
CREATE INDEX idx_medications_brand_name ON medications(brand_name);
CREATE INDEX idx_medications_generic_name ON medications(generic_name);
CREATE INDEX idx_medications_prior_auth ON medications(requires_prior_auth);
CREATE INDEX idx_medications_active ON medications(active);

-- Insurance provider indexes
CREATE INDEX idx_insurance_name ON insurance_providers(name);
CREATE INDEX idx_insurance_plan_type ON insurance_providers(plan_type);
CREATE INDEX idx_insurance_active ON insurance_providers(active);

-- Composite indexes for common queries
CREATE INDEX idx_med_auth_status_priority ON medication_authorizations(status, priority_level);
CREATE INDEX idx_med_auth_patient_status ON medication_authorizations(patient_id, status);
CREATE INDEX idx_med_auth_provider_date ON medication_authorizations(provider_id, created_at);

-- ================================================
-- COMMENTS FOR DOCUMENTATION
-- ================================================

COMMENT ON TABLE medication_authorizations IS 'Core table for tracking medication prior authorization requests with AI-powered processing';
COMMENT ON TABLE patients IS 'Cached patient information synchronized from ModMed FHIR API';
COMMENT ON TABLE medications IS 'Comprehensive medication database with authorization requirements and clinical data';
COMMENT ON TABLE insurance_providers IS 'Insurance provider policies, requirements, and API integration settings';
COMMENT ON TABLE ai_recommendations IS 'AI-generated recommendations and analysis for authorization requests';
COMMENT ON TABLE authorization_workflow_steps IS 'Workflow tracking for authorization processing steps and assignments';
COMMENT ON TABLE authorization_communications IS 'Communication log with insurance providers and external parties';
COMMENT ON TABLE authorization_analytics IS 'Performance analytics and metrics for authorization processing';
COMMENT ON TABLE authorization_audit_logs IS 'HIPAA-compliant audit trail for all system access and changes';

-- ================================================
-- MIGRATION COMPLETE
-- ================================================


-- Migration: 012_create_medication_authorization_rls.sql
-- ==========================================

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


-- Migration: 014_create_database_monitoring.sql
-- ==========================================

-- Database Monitoring and Performance Functions
-- Migration: 014_create_database_monitoring.sql
-- Created: January 8, 2025

-- =============================================
-- Database Statistics Function
-- =============================================

CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'numbackends', numbackends,
        'xact_commit', xact_commit,
        'xact_rollback', xact_rollback,
        'blks_read', blks_read,
        'blks_hit', blks_hit,
        'tup_returned', tup_returned,
        'tup_fetched', tup_fetched,
        'tup_inserted', tup_inserted,
        'tup_updated', tup_updated,
        'tup_deleted', tup_deleted,
        'conflicts', conflicts,
        'temp_files', temp_files,
        'temp_bytes', temp_bytes,
        'deadlocks', deadlocks,
        'checksum_failures', checksum_failures,
        'checksum_last_failure', checksum_last_failure,
        'blk_read_time', blk_read_time,
        'blk_write_time', blk_write_time,
        'session_time', session_time,
        'active_time', active_time,
        'idle_in_transaction_time', idle_in_transaction_time,
        'sessions', sessions,
        'sessions_abandoned', sessions_abandoned,
        'sessions_fatal', sessions_fatal,
        'sessions_killed', sessions_killed
    ) INTO stats
    FROM pg_stat_database 
    WHERE datname = current_database();
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Connection Pool Monitoring Function
-- =============================================

CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS JSON AS $$
DECLARE
    connection_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_connections', (
            SELECT count(*) 
            FROM pg_stat_activity 
            WHERE datname = current_database()
        ),
        'active_connections', (
            SELECT count(*) 
            FROM pg_stat_activity 
            WHERE datname = current_database() 
            AND state = 'active'
        ),
        'idle_connections', (
            SELECT count(*) 
            FROM pg_stat_activity 
            WHERE datname = current_database() 
            AND state = 'idle'
        ),
        'idle_in_transaction', (
            SELECT count(*) 
            FROM pg_stat_activity 
            WHERE datname = current_database() 
            AND state LIKE 'idle in transaction%'
        ),
        'waiting_connections', (
            SELECT count(*) 
            FROM pg_stat_activity 
            WHERE datname = current_database() 
            AND wait_event IS NOT NULL
        ),
        'max_connections', (
            SELECT setting::int 
            FROM pg_settings 
            WHERE name = 'max_connections'
        ),
        'current_timestamp', NOW()
    ) INTO connection_stats;
    
    RETURN connection_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Slow Query Monitoring Function
-- =============================================

CREATE OR REPLACE FUNCTION get_slow_queries(threshold_ms INTEGER DEFAULT 1000)
RETURNS JSON AS $$
DECLARE
    slow_queries JSON;
BEGIN
    -- Check if pg_stat_statements extension is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        SELECT json_agg(
            json_build_object(
                'query', query,
                'calls', calls,
                'total_time', total_exec_time,
                'mean_time', mean_exec_time,
                'rows', rows,
                'created', stats_since
            )
        ) INTO slow_queries
        FROM pg_stat_statements 
        WHERE mean_exec_time > threshold_ms
        ORDER BY mean_exec_time DESC
        LIMIT 10;
    ELSE
        -- Fallback to current activity if pg_stat_statements not available
        SELECT json_agg(
            json_build_object(
                'query', query,
                'state', state,
                'query_start', query_start,
                'duration_ms', EXTRACT(EPOCH FROM (NOW() - query_start)) * 1000,
                'wait_event', wait_event,
                'wait_event_type', wait_event_type
            )
        ) INTO slow_queries
        FROM pg_stat_activity 
        WHERE datname = current_database()
        AND state = 'active'
        AND query_start < NOW() - INTERVAL '1 second'
        ORDER BY query_start ASC;
    END IF;
    
    RETURN COALESCE(slow_queries, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Table Statistics Function
-- =============================================

CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS JSON AS $$
DECLARE
    table_stats JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'table_name', schemaname || '.' || relname,
            'seq_scan', seq_scan,
            'seq_tup_read', seq_tup_read,
            'idx_scan', idx_scan,
            'idx_tup_fetch', idx_tup_fetch,
            'n_tup_ins', n_tup_ins,
            'n_tup_upd', n_tup_upd,
            'n_tup_del', n_tup_del,
            'n_tup_hot_upd', n_tup_hot_upd,
            'n_live_tup', n_live_tup,
            'n_dead_tup', n_dead_tup,
            'last_vacuum', last_vacuum,
            'last_autovacuum', last_autovacuum,
            'last_analyze', last_analyze,
            'last_autoanalyze', last_autoanalyze
        )
    ) INTO table_stats
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY seq_scan + idx_scan DESC
    LIMIT 20;
    
    RETURN COALESCE(table_stats, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Index Usage Statistics Function
-- =============================================

CREATE OR REPLACE FUNCTION get_index_stats()
RETURNS JSON AS $$
DECLARE
    index_stats JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'table_name', schemaname || '.' || relname,
            'index_name', indexrelname,
            'idx_scan', idx_scan,
            'idx_tup_read', idx_tup_read,
            'idx_tup_fetch', idx_tup_fetch,
            'size_bytes', pg_relation_size(indexrelid),
            'size_pretty', pg_size_pretty(pg_relation_size(indexrelid))
        )
    ) INTO index_stats
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC
    LIMIT 20;
    
    RETURN COALESCE(index_stats, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Comprehensive Performance Report Function
-- =============================================

CREATE OR REPLACE FUNCTION get_performance_report()
RETURNS JSON AS $$
DECLARE
    performance_report JSON;
BEGIN
    SELECT json_build_object(
        'timestamp', NOW(),
        'database_stats', get_database_stats(),
        'connection_stats', get_connection_stats(),
        'slow_queries', get_slow_queries(1000),
        'table_stats', get_table_stats(),
        'index_stats', get_index_stats(),
        'cache_hit_ratio', (
            SELECT round(
                (sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit) + sum(blks_read), 0))::numeric, 
                2
            )
            FROM pg_stat_database
        ),
        'database_size', pg_database_size(current_database()),
        'database_size_pretty', pg_size_pretty(pg_database_size(current_database()))
    ) INTO performance_report;
    
    RETURN performance_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Health Check Function
-- =============================================

CREATE OR REPLACE FUNCTION database_health_check()
RETURNS JSON AS $$
DECLARE
    health_status JSON;
    connection_count INTEGER;
    max_connections INTEGER;
    cache_hit_ratio NUMERIC;
BEGIN
    -- Get connection metrics
    SELECT setting::integer INTO max_connections 
    FROM pg_settings WHERE name = 'max_connections';
    
    SELECT count(*) INTO connection_count 
    FROM pg_stat_activity 
    WHERE datname = current_database();
    
    -- Get cache hit ratio
    SELECT round(
        (sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit) + sum(blks_read), 0))::numeric, 
        2
    ) INTO cache_hit_ratio
    FROM pg_stat_database;
    
    SELECT json_build_object(
        'timestamp', NOW(),
        'healthy', CASE 
            WHEN connection_count < max_connections * 0.9 
            AND cache_hit_ratio > 90 
            THEN true 
            ELSE false 
        END,
        'connection_utilization', round((connection_count * 100.0 / max_connections)::numeric, 2),
        'cache_hit_ratio', cache_hit_ratio,
        'total_connections', connection_count,
        'max_connections', max_connections,
        'warnings', CASE 
            WHEN connection_count > max_connections * 0.8 
            THEN json_build_array('High connection utilization')
            ELSE json_build_array()
        END
    ) INTO health_status;
    
    RETURN health_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Grant Permissions
-- =============================================

-- Grant execute permissions to authenticated users for monitoring functions
GRANT EXECUTE ON FUNCTION get_database_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_connection_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_slow_queries(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_index_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_report() TO authenticated;
GRANT EXECUTE ON FUNCTION database_health_check() TO authenticated;

-- =============================================
-- Comments for Documentation
-- =============================================

COMMENT ON FUNCTION get_database_stats() IS 'Returns comprehensive database statistics for monitoring';
COMMENT ON FUNCTION get_connection_stats() IS 'Returns current connection pool statistics';
COMMENT ON FUNCTION get_slow_queries(INTEGER) IS 'Returns slow queries above specified threshold in milliseconds';
COMMENT ON FUNCTION get_table_stats() IS 'Returns table usage statistics for performance monitoring';
COMMENT ON FUNCTION get_index_stats() IS 'Returns index usage statistics';
COMMENT ON FUNCTION get_performance_report() IS 'Returns comprehensive performance report';
COMMENT ON FUNCTION database_health_check() IS 'Returns overall database health status';

-- Migration complete
SELECT 'Database monitoring functions created successfully' as status;


-- Migration: 015_optimize_rls_performance.sql
-- ==========================================

-- RLS Policy Performance Optimization
-- Migration: 015_optimize_rls_performance.sql
-- Created: January 8, 2025

-- =============================================
-- Enhanced Partial Indexes for RLS Performance
-- =============================================

-- Performance note: These indexes are specifically designed to optimize
-- the WHERE clauses in our RLS policies for faster query execution

-- User Authentication Optimization
-- Optimizes: auth.uid() = id checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_auth_uid_active 
    ON users(id) 
    WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_auth_uid 
    ON user_sessions(user_id, expires_at) 
    WHERE expires_at > NOW();

-- Location-based Access Optimization
-- Optimizes: user_can_access_location() function calls
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_locations_gin 
    ON users USING GIN(locations);

-- Inventory RLS Optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_items_location_active 
    ON inventory_items(location_id, is_active) 
    WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_location 
    ON inventory_transactions(item_id, transaction_type, created_at)
    WHERE created_at > NOW() - INTERVAL '1 year';

-- Handouts RLS Optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_handout_templates_location_active 
    ON handout_templates(location_id, is_active) 
    WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_handout_generations_created_by 
    ON handout_generations(generated_by, patient_id, created_at);

-- Communication RLS Optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communication_logs_patient_staff 
    ON communication_logs(patient_id, staff_id, created_at)
    WHERE created_at > NOW() - INTERVAL '2 years';

-- Appointment RLS Optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_location_status 
