-- Materialized views for Ganger Platform reporting
-- Based on expert review recommendations
-- Date: 2025-07-22

-- =====================================================
-- SOCIAL REVIEWS STATISTICS
-- =====================================================

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS review_stats CASCADE;

-- Create materialized view for review statistics by location
CREATE MATERIALIZED VIEW review_stats AS
SELECT 
    location_id,
    COUNT(*) as total_reviews,
    AVG(rating)::numeric(3,2) as avg_rating,
    COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_reviews,
    COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_reviews,
    COUNT(CASE WHEN response_status = 'responded' THEN 1 END) as responded_count,
    COUNT(CASE WHEN response_status = 'pending' THEN 1 END) as pending_response_count,
    MAX(created_at) as latest_review_date,
    DATE_TRUNC('day', NOW()) as last_refreshed
FROM social_reviews
WHERE deleted_at IS NULL
GROUP BY location_id;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_review_stats_location ON review_stats(location_id);

-- =====================================================
-- INTEGRATION HEALTH SUMMARY
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS integration_health_summary CASCADE;

CREATE MATERIALIZED VIEW integration_health_summary AS
WITH latest_metrics AS (
    SELECT DISTINCT ON (integration_id)
        integration_id,
        status,
        uptime_percentage,
        avg_response_time_ms,
        error_rate,
        created_at
    FROM integration_metrics
    ORDER BY integration_id, created_at DESC
)
SELECT 
    i.id as integration_id,
    i.name as integration_name,
    i.type as integration_type,
    i.status as config_status,
    i.is_active,
    lm.status as health_status,
    lm.uptime_percentage,
    lm.avg_response_time_ms,
    lm.error_rate,
    lm.created_at as last_checked,
    DATE_TRUNC('day', NOW()) as last_refreshed
FROM integrations i
LEFT JOIN latest_metrics lm ON i.id = lm.integration_id
WHERE i.deleted_at IS NULL;

CREATE UNIQUE INDEX idx_integration_health_summary_id ON integration_health_summary(integration_id);

-- =====================================================
-- STAFF SCHEDULING ANALYTICS
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS staff_scheduling_analytics CASCADE;

CREATE MATERIALIZED VIEW staff_scheduling_analytics AS
SELECT 
    location_id,
    DATE_TRUNC('week', schedule_date) as week_start,
    COUNT(DISTINCT staff_member_id) as unique_staff_scheduled,
    COUNT(*) as total_shifts,
    SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600)::numeric(10,2) as total_hours_scheduled,
    AVG(EXTRACT(EPOCH FROM (end_time - start_time))/3600)::numeric(4,2) as avg_shift_duration,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_shifts,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_shifts,
    COUNT(CASE WHEN schedule_type = 'overtime' THEN 1 END) as overtime_shifts,
    DATE_TRUNC('day', NOW()) as last_refreshed
FROM staff_schedules
WHERE deleted_at IS NULL
GROUP BY location_id, DATE_TRUNC('week', schedule_date);

CREATE INDEX idx_staff_scheduling_analytics_location_week 
ON staff_scheduling_analytics(location_id, week_start DESC);

-- =====================================================
-- TRAINING COMPLIANCE SUMMARY
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS training_compliance_summary CASCADE;

CREATE MATERIALIZED VIEW training_compliance_summary AS
WITH user_compliance AS (
    SELECT 
        u.id as user_id,
        u.location_id,
        COUNT(DISTINCT tc.course_id) as courses_completed,
        COUNT(CASE WHEN tc.status = 'completed' AND tc.expires_at > NOW() THEN 1 END) as valid_certifications,
        COUNT(CASE WHEN tc.status = 'completed' AND tc.expires_at <= NOW() THEN 1 END) as expired_certifications,
        COUNT(CASE WHEN tc.status IN ('in_progress', 'not_started') THEN 1 END) as pending_courses,
        MIN(CASE WHEN tc.expires_at > NOW() THEN tc.expires_at END) as next_expiration
    FROM users u
    LEFT JOIN training_completions tc ON u.id = tc.user_id
    WHERE u.deleted_at IS NULL
    GROUP BY u.id, u.location_id
)
SELECT 
    location_id,
    COUNT(DISTINCT user_id) as total_staff,
    COUNT(CASE WHEN valid_certifications > 0 THEN 1 END) as compliant_staff,
    COUNT(CASE WHEN expired_certifications > 0 AND valid_certifications = 0 THEN 1 END) as non_compliant_staff,
    AVG(courses_completed)::numeric(4,2) as avg_courses_per_staff,
    COUNT(CASE WHEN next_expiration <= NOW() + INTERVAL '30 days' THEN 1 END) as expiring_soon_count,
    DATE_TRUNC('day', NOW()) as last_refreshed
FROM user_compliance
GROUP BY location_id;

CREATE UNIQUE INDEX idx_training_compliance_summary_location 
ON training_compliance_summary(location_id);

-- =====================================================
-- INVENTORY ANALYTICS
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS inventory_analytics CASCADE;

CREATE MATERIALIZED VIEW inventory_analytics AS
SELECT 
    location_id,
    category,
    COUNT(*) as item_count,
    SUM(quantity) as total_quantity,
    SUM(quantity * unit_cost)::numeric(12,2) as total_value,
    COUNT(CASE WHEN quantity <= reorder_point THEN 1 END) as items_needing_reorder,
    COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_items,
    AVG(CASE 
        WHEN quantity > 0 AND reorder_point > 0 
        THEN (quantity::numeric / reorder_point::numeric) 
    END)::numeric(4,2) as avg_stock_ratio,
    DATE_TRUNC('day', NOW()) as last_refreshed
FROM inventory_items
WHERE deleted_at IS NULL
GROUP BY location_id, category;

CREATE INDEX idx_inventory_analytics_location_category 
ON inventory_analytics(location_id, category);

-- =====================================================
-- PHARMA APPOINTMENT ANALYTICS
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS pharma_appointment_analytics CASCADE;

CREATE MATERIALIZED VIEW pharma_appointment_analytics AS
SELECT 
    location_id,
    DATE_TRUNC('month', appointment_date) as month,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(DISTINCT rep_name) as unique_reps,
    COUNT(DISTINCT company_name) as unique_companies,
    DATE_TRUNC('day', NOW()) as last_refreshed
FROM pharma_appointments
WHERE deleted_at IS NULL
GROUP BY location_id, DATE_TRUNC('month', appointment_date);

CREATE INDEX idx_pharma_appointment_analytics_location_month 
ON pharma_appointment_analytics(location_id, month DESC);

-- =====================================================
-- API PERFORMANCE SUMMARY
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS api_performance_summary CASCADE;

CREATE MATERIALIZED VIEW api_performance_summary AS
SELECT 
    endpoint,
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as request_count,
    AVG(response_time_ms)::numeric(8,2) as avg_response_time,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_ms)::numeric(8,2) as median_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)::numeric(8,2) as p95_response_time,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms)::numeric(8,2) as p99_response_time,
    SUM(error_count) as total_errors,
    (SUM(error_count)::numeric / COUNT(*)::numeric)::numeric(5,4) as error_rate,
    DATE_TRUNC('day', NOW()) as last_refreshed
FROM api_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY endpoint, DATE_TRUNC('hour', created_at);

CREATE INDEX idx_api_performance_summary_endpoint_hour 
ON api_performance_summary(endpoint, hour DESC);

-- =====================================================
-- REFRESH FUNCTIONS
-- =====================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY review_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY integration_health_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY staff_scheduling_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY training_compliance_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY inventory_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY pharma_appointment_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY api_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to refresh views (requires pg_cron extension)
-- This should be run by a superuser or database owner
-- SELECT cron.schedule('refresh-materialized-views', '0 */6 * * *', 'SELECT refresh_all_materialized_views();');

-- Grant permissions to application role
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_materialized_views() TO authenticated;