-- Migration: Fix function search path security vulnerabilities
-- Issue: Functions have mutable search_path which could allow SQL injection
-- Solution: Set explicit search_path for all affected functions

-- Fix handle_new_user function
ALTER FUNCTION public.handle_new_user() 
SET search_path = public, pg_catalog;

-- Fix update_updated_at_column function  
ALTER FUNCTION public.update_updated_at_column() 
SET search_path = public, pg_catalog;

-- Fix refresh_materialized_views function
ALTER FUNCTION public.refresh_materialized_views() 
SET search_path = public, pg_catalog;

-- Fix get_current_user_role function
ALTER FUNCTION public.get_current_user_role() 
SET search_path = public, pg_catalog;

-- Verify the changes
SELECT 
    proname as function_name,
    CASE 
        WHEN proconfig::text LIKE '%search_path%' THEN 'SECURED'
        ELSE 'NOT SECURED'
    END as security_status
FROM pg_proc 
WHERE proname IN (
    'handle_new_user', 
    'update_updated_at_column', 
    'refresh_materialized_views', 
    'get_current_user_role'
)
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');