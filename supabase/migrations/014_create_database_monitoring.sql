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