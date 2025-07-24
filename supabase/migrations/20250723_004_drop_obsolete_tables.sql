-- Migration: Drop obsolete tables
-- Issue: Several tables were replaced by newer implementations
-- Solution: Drop tables that are no longer used

-- Drop obsolete tables with CASCADE to handle any dependencies
-- Using IF EXISTS to make migration idempotent

-- Table replaced by call_center_records
DROP TABLE IF EXISTS public.call_logs CASCADE;

-- Table replaced by l10_rocks in EOS L10 app
DROP TABLE IF EXISTS public.company_rocks CASCADE;

-- Table replaced by integrations table
DROP TABLE IF EXISTS public.integration_connections CASCADE;

-- Table replaced by integration_events  
DROP TABLE IF EXISTS public.integration_logs CASCADE;

-- Table replaced by pharma_appointments
DROP TABLE IF EXISTS public.pharma_visits CASCADE;

-- Log what was dropped for audit trail
DO $$
DECLARE
    dropped_tables text[] := ARRAY[
        'call_logs',
        'company_rocks', 
        'integration_connections',
        'integration_logs',
        'pharma_visits'
    ];
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY dropped_tables
    LOOP
        RAISE NOTICE 'Dropped obsolete table if existed: %', table_name;
    END LOOP;
END $$;

-- Verify tables were dropped
SELECT 
    'Tables successfully dropped' as status,
    COUNT(*) as remaining_obsolete_tables
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN (
    'call_logs',
    'company_rocks',
    'integration_connections', 
    'integration_logs',
    'pharma_visits'
);