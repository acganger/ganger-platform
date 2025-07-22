-- Additional database optimizations for Ganger Platform
-- Date: 2025-07-22

-- =====================================================
-- ENUM TYPES FOR BETTER PERFORMANCE AND VALIDATION
-- =====================================================

-- Create enum types for frequently used status fields
DO $$ 
BEGIN
    -- Integration status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_status') THEN
        CREATE TYPE integration_status AS ENUM (
            'active', 'inactive', 'error', 'maintenance', 'pending'
        );
    END IF;

    -- Schedule status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_status') THEN
        CREATE TYPE schedule_status AS ENUM (
            'draft', 'pending', 'approved', 'published', 'cancelled'
        );
    END IF;

    -- Training status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'training_status') THEN
        CREATE TYPE training_status AS ENUM (
            'not_started', 'in_progress', 'completed', 'expired'
        );
    END IF;

    -- Review response status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_response_status') THEN
        CREATE TYPE review_response_status AS ENUM (
            'pending', 'drafted', 'responded', 'ignored'
        );
    END IF;
END $$;

-- =====================================================
-- PARTITIONING FOR LARGE TABLES
-- =====================================================

-- Partition audit_logs by month for better performance
-- Note: This requires recreating the table, so it's commented out
-- to avoid data loss. Run manually after backing up data.

/*
-- Create partitioned audit_logs table
CREATE TABLE audit_logs_partitioned (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for the last 6 months and next 3 months
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
    
CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
    
-- ... continue for other months

-- Create indexes on partitions
CREATE INDEX idx_audit_logs_2025_01_user_id ON audit_logs_2025_01(user_id);
CREATE INDEX idx_audit_logs_2025_01_created_at ON audit_logs_2025_01(created_at DESC);
-- ... continue for other partitions
*/

-- =====================================================
-- FUNCTION-BASED INDEXES
-- =====================================================

-- Index for case-insensitive email searches
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
ON users(LOWER(email));

-- Index for case-insensitive name searches
CREATE INDEX IF NOT EXISTS idx_users_name_lower 
ON users(LOWER(first_name), LOWER(last_name));

-- Index for JSON field queries in integrations config
CREATE INDEX IF NOT EXISTS idx_integrations_config_api_key 
ON integrations((config->>'api_key')) 
WHERE config->>'api_key' IS NOT NULL;

-- =====================================================
-- QUERY OPTIMIZATION VIEWS
-- =====================================================

-- Create a view for commonly joined user data
CREATE OR REPLACE VIEW user_details AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.location_id,
    l.name as location_name,
    u.is_active,
    u.created_at,
    u.last_login_at
FROM users u
LEFT JOIN locations l ON u.location_id = l.id
WHERE u.deleted_at IS NULL;

-- Create index on the underlying tables for the view
CREATE INDEX IF NOT EXISTS idx_users_location_id 
ON users(location_id) 
WHERE deleted_at IS NULL;

-- =====================================================
-- STORED PROCEDURES FOR COMPLEX OPERATIONS
-- =====================================================

-- Procedure to update integration metrics efficiently
CREATE OR REPLACE FUNCTION update_integration_metrics(
    p_integration_id UUID,
    p_status VARCHAR,
    p_response_time_ms INTEGER,
    p_error_count INTEGER DEFAULT 0
) RETURNS void AS $$
DECLARE
    v_uptime_percentage NUMERIC;
    v_avg_response_time NUMERIC;
    v_error_rate NUMERIC;
BEGIN
    -- Calculate rolling metrics (last 24 hours)
    WITH recent_metrics AS (
        SELECT 
            COUNT(*) as total_checks,
            COUNT(CASE WHEN status IN ('healthy', 'degraded') THEN 1 END) as successful_checks,
            AVG(response_time_ms) as avg_response,
            SUM(error_count) as total_errors
        FROM integration_metrics
        WHERE integration_id = p_integration_id
        AND created_at >= NOW() - INTERVAL '24 hours'
    )
    SELECT 
        CASE 
            WHEN total_checks > 0 
            THEN (successful_checks::numeric / total_checks::numeric * 100)
            ELSE 100 
        END,
        COALESCE(avg_response, 0),
        CASE 
            WHEN total_checks > 0 
            THEN (total_errors::numeric / total_checks::numeric)
            ELSE 0 
        END
    INTO v_uptime_percentage, v_avg_response_time, v_error_rate
    FROM recent_metrics;

    -- Insert new metric record
    INSERT INTO integration_metrics (
        integration_id,
        status,
        response_time_ms,
        error_count,
        uptime_percentage,
        avg_response_time_ms,
        error_rate,
        created_at
    ) VALUES (
        p_integration_id,
        p_status,
        p_response_time_ms,
        p_error_count,
        v_uptime_percentage,
        v_avg_response_time,
        v_error_rate,
        NOW()
    );

    -- Update integration status if needed
    UPDATE integrations
    SET 
        status = CASE 
            WHEN p_status = 'down' THEN 'error'
            WHEN p_status = 'healthy' THEN 'active'
            ELSE status
        END,
        last_check_at = NOW()
    WHERE id = p_integration_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER FUNCTIONS FOR DATA INTEGRITY
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
        AND table_name NOT LIKE '%_view%'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t.table_name, t.table_name);
    END LOOP;
END $$;

-- =====================================================
-- VACUUM AND ANALYZE SETTINGS
-- =====================================================

-- Set more aggressive autovacuum for high-traffic tables
ALTER TABLE integration_metrics SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE api_metrics SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE audit_logs SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

-- =====================================================
-- MONITORING QUERIES
-- =====================================================

-- Create a function to check index usage
CREATE OR REPLACE FUNCTION check_index_usage()
RETURNS TABLE (
    schema_name text,
    table_name text,
    index_name text,
    index_size text,
    index_scans bigint,
    last_scan timestamp
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::text,
        tablename::text,
        indexname::text,
        pg_size_pretty(pg_relation_size(indexrelid))::text as index_size,
        idx_scan as index_scans,
        CASE 
            WHEN idx_scan = 0 THEN NULL
            ELSE pg_stat_get_last_scan_time(indexrelid)
        END as last_scan
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan, pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_index_usage() TO authenticated;