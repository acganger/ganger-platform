-- =====================================================
-- Actual Production Schema Documentation
-- Migration: 002_actual_production_schema.sql
-- Created: August 5, 2025
-- 
-- IMPORTANT: This file documents the ACTUAL production schema
-- as it exists in the database, not what the migration files claim.
-- The source of truth is supabase/dump.json
-- =====================================================

-- NOTE: The production database uses 'profiles' table instead of 'users'
-- Many apps are looking for non-existent tables like:
-- - users (should be profiles)
-- - applications (doesn't exist)
-- - api_usage_logs (doesn't exist)
-- - application_health (doesn't exist)
-- - user_sessions (doesn't exist)
-- - app_config_permissions (doesn't exist)
-- - platform_applications (doesn't exist)

-- =====================================================
-- ACTUAL PROFILES TABLE (not users!)
-- =====================================================
-- This is what actually exists in production:
/*
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'staff',
    department TEXT,
    position TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- =====================================================
-- ACTUAL TABLES IN PUBLIC SCHEMA (from dump.json)
-- =====================================================
-- The following tables actually exist:
-- - ai_conversations
-- - api_metrics
-- - app_configurations
-- - app_permissions
-- - audit_logs
-- - batch_reports
-- - call_metrics
-- - dashboard_widgets
-- - generated_handouts
-- - handout_templates
-- - integration_metrics
-- - integrations
-- - inventory_items
-- - inventory_transactions
-- - kiosk_sessions
-- - l10_meetings
-- - locations
-- - medication_authorizations
-- - patients
-- - pharma_appointments
-- - profiles (NOT users!)
-- - purchase_requests
-- - social_posts
-- - social_reviews
-- - staff_attachments
-- - staff_schedules
-- - staff_ticket_comments
-- - staff_tickets
-- - staff_user_profiles
-- - team_members
-- - teams
-- - ticket_comments
-- - time_off_requests
-- - training_completions
-- - training_modules
-- - ui_components
-- - user_dashboards
-- - user_profiles

-- =====================================================
-- MISSING TABLES THAT APPS ARE LOOKING FOR
-- =====================================================
-- The following tables are referenced in code but DON'T EXIST:
-- 1. users - Apps should use 'profiles' instead
-- 2. applications - Used by platform-dashboard
-- 3. api_usage_logs - Used by platform-dashboard
-- 4. application_health - Used by platform-dashboard
-- 5. user_sessions - Used by platform-dashboard
-- 6. app_config_permissions - Used by config-dashboard
-- 7. platform_applications - Used by config-dashboard

-- =====================================================
-- RECOMMENDATION: Quick fixes for missing tables
-- =====================================================
-- Option 1: Update all queries to use existing tables:
--   - Change 'users' to 'profiles'
--   - Remove features that need non-existent tables
--   - Or create mock responses for missing data

-- Option 2: Create the missing tables (if features are needed):
--   - Define schema based on app expectations
--   - Add appropriate RLS policies
--   - Populate with initial data

-- =====================================================
-- CRITICAL FIXES NEEDED
-- =====================================================
-- 1. All references to 'users' table should be changed to 'profiles'
-- 2. The profiles table is missing columns that some apps expect:
--    - expires_at (referenced in auth queries)
--    - is_active (exists but some queries expect it on permissions)
-- 3. RPC functions may not exist - need to verify:
--    - check_user_app_permission
--    - log_audit_event
--    - get_app_permission
--    - is_team_member

-- This migration file is for documentation only.
-- Actual fixes should be implemented in separate migration files.