-- Migration: Secure materialized views
-- Issue: Materialized views are accessible to anon/authenticated roles via API
-- Solution: Revoke public access and implement proper access controls

-- Revoke SELECT permissions from anon role on materialized views
REVOKE SELECT ON public.review_stats FROM anon;
REVOKE SELECT ON public.integration_health_summary FROM anon;
REVOKE SELECT ON public.api_performance_summary FROM anon;

-- Also revoke from authenticated role and grant back with RLS
REVOKE SELECT ON public.review_stats FROM authenticated;
REVOKE SELECT ON public.integration_health_summary FROM authenticated;
REVOKE SELECT ON public.api_performance_summary FROM authenticated;

-- Grant access only to authenticated users with @gangerdermatology.com email
-- Note: Materialized views don't support RLS, so we use column-level security via views

-- Create secure views that wrap the materialized views with access control
CREATE OR REPLACE VIEW public.secure_review_stats AS
SELECT * FROM public.review_stats
WHERE (auth.jwt() ->> 'email') LIKE '%@gangerdermatology.com';

CREATE OR REPLACE VIEW public.secure_integration_health_summary AS
SELECT * FROM public.integration_health_summary
WHERE (auth.jwt() ->> 'email') LIKE '%@gangerdermatology.com';

CREATE OR REPLACE VIEW public.secure_api_performance_summary AS
SELECT * FROM public.api_performance_summary
WHERE (auth.jwt() ->> 'email') LIKE '%@gangerdermatology.com';

-- Grant access to the secure views
GRANT SELECT ON public.secure_review_stats TO authenticated;
GRANT SELECT ON public.secure_integration_health_summary TO authenticated;
GRANT SELECT ON public.secure_api_performance_summary TO authenticated;

-- Add comments explaining the security model
COMMENT ON VIEW public.secure_review_stats IS 
'Secure wrapper for review_stats materialized view. Only accessible to @gangerdermatology.com users.';

COMMENT ON VIEW public.secure_integration_health_summary IS 
'Secure wrapper for integration_health_summary materialized view. Only accessible to @gangerdermatology.com users.';

COMMENT ON VIEW public.secure_api_performance_summary IS 
'Secure wrapper for api_performance_summary materialized view. Only accessible to @gangerdermatology.com users.';

-- Verify permissions are correctly set
SELECT 
    table_schema,
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name IN (
    'review_stats',
    'integration_health_summary', 
    'api_performance_summary',
    'secure_review_stats',
    'secure_integration_health_summary',
    'secure_api_performance_summary'
)
AND table_schema = 'public'
ORDER BY table_name, grantee;