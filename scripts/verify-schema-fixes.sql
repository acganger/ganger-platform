-- =====================================================
-- Schema Fixes Verification Script
-- Run this after applying all migrations to verify success
-- =====================================================

\echo 'Starting schema verification...\n'

-- 1. Verify staff_tickets table exists (not tickets)
\echo '1. Checking staff_tickets table...'
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_tickets' AND table_schema = 'public')
        THEN '✓ SUCCESS: staff_tickets table exists'
        ELSE '✗ FAILED: staff_tickets table does not exist'
    END as status;

-- 2. Verify inventory columns are correct
\echo '\n2. Checking inventory_items columns...'
WITH required_columns AS (
    SELECT unnest(ARRAY['current_stock', 'minimum_stock', 'cost_per_unit', 'maximum_stock', 'unit_of_measure', 'status']) as column_name
),
existing_columns AS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'inventory_items' 
    AND table_schema = 'public'
)
SELECT 
    rc.column_name,
    CASE 
        WHEN ec.column_name IS NOT NULL THEN '✓ Exists'
        ELSE '✗ Missing'
    END as status
FROM required_columns rc
LEFT JOIN existing_columns ec ON rc.column_name = ec.column_name;

-- 3. Verify function search paths are secured
\echo '\n3. Checking function security...'
SELECT 
    proname as function_name,
    CASE 
        WHEN proconfig::text LIKE '%search_path%' THEN '✓ Secured'
        ELSE '✗ Not secured'
    END as security_status
FROM pg_proc 
WHERE proname IN ('handle_new_user', 'update_updated_at_column', 'refresh_materialized_views', 'get_current_user_role')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Verify staff tables exist
\echo '\n4. Checking staff_* tables...'
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✓ Exists'
        ELSE '✗ Missing'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('staff_user_profiles', 'staff_ticket_comments', 'staff_attachments');

-- 5. Verify medication authorization tables exist
\echo '\n5. Checking medication authorization tables...'
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✓ Exists'
        ELSE '✗ Missing'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('medication_authorizations', 'medications', 'ai_recommendations', 'insurance_providers');

-- 6. Verify obsolete tables are dropped
\echo '\n6. Checking obsolete tables are removed...'
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ SUCCESS: All obsolete tables removed'
        ELSE '✗ FAILED: ' || COUNT(*) || ' obsolete tables still exist'
    END as status,
    string_agg(table_name, ', ') as remaining_tables
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('call_logs', 'company_rocks', 'integration_connections', 'integration_logs', 'pharma_visits');

-- 7. Verify future tables have documentation
\echo '\n7. Checking future table documentation...'
SELECT 
    c.relname as table_name,
    CASE 
        WHEN obj_description(c.oid) IS NOT NULL THEN '✓ Documented'
        ELSE '✗ Not documented'
    END as status,
    LEFT(obj_description(c.oid), 50) || '...' as comment_preview
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname IN ('ai_conversations', 'dashboard_widgets', 'kiosk_sessions', 'ui_components', 'user_dashboards')
AND c.relkind = 'r';

-- 8. Verify materialized view security
\echo '\n8. Checking materialized view security...'
WITH mv_permissions AS (
    SELECT 
        tablename,
        grantee,
        privilege_type
    FROM information_schema.table_privileges
    WHERE tablename IN ('review_stats', 'integration_health_summary', 'api_performance_summary')
    AND schemaname = 'public'
    AND grantee IN ('anon', 'authenticated')
    AND privilege_type = 'SELECT'
)
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ SUCCESS: Materialized views secured (no public access)'
        ELSE '✗ FAILED: ' || COUNT(*) || ' materialized views still have public access'
    END as status,
    string_agg(tablename || ' (' || grantee || ')', ', ') as public_access_views
FROM mv_permissions;

-- 9. Summary
\echo '\n========== VERIFICATION SUMMARY ==========\n'
WITH checks AS (
    SELECT 'staff_tickets table' as check_name, 
           EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_tickets') as passed
    UNION ALL
    SELECT 'inventory columns', 
           (SELECT COUNT(*) = 6 FROM information_schema.columns 
            WHERE table_name = 'inventory_items' 
            AND column_name IN ('current_stock', 'minimum_stock', 'cost_per_unit', 'maximum_stock', 'unit_of_measure', 'status'))
    UNION ALL
    SELECT 'function security',
           (SELECT COUNT(*) = 4 FROM pg_proc 
            WHERE proname IN ('handle_new_user', 'update_updated_at_column', 'refresh_materialized_views', 'get_current_user_role')
            AND proconfig::text LIKE '%search_path%')
    UNION ALL
    SELECT 'staff tables',
           (SELECT COUNT(*) = 3 FROM information_schema.tables 
            WHERE table_name IN ('staff_user_profiles', 'staff_ticket_comments', 'staff_attachments'))
    UNION ALL
    SELECT 'obsolete tables removed',
           (SELECT COUNT(*) = 0 FROM information_schema.tables 
            WHERE table_name IN ('call_logs', 'company_rocks', 'integration_connections', 'integration_logs', 'pharma_visits'))
)
SELECT 
    COUNT(*) FILTER (WHERE passed) as passed_checks,
    COUNT(*) FILTER (WHERE NOT passed) as failed_checks,
    COUNT(*) as total_checks,
    CASE 
        WHEN COUNT(*) FILTER (WHERE NOT passed) = 0 THEN '✓ ALL CHECKS PASSED!'
        ELSE '✗ ' || COUNT(*) FILTER (WHERE NOT passed) || ' CHECKS FAILED'
    END as overall_status
FROM checks;

\echo '\n=========================================='