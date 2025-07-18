-- Ganger Platform Legacy Data Migration Script
-- Migrates data from MySQL dump to PostgreSQL/Supabase
-- Run this AFTER clean-schema-final.sql and remaining-apps-schema.sql

BEGIN;

-- Create temporary tables for data migration
CREATE TEMP TABLE IF NOT EXISTS legacy_ticket_mapping (
    old_id INTEGER,
    new_id UUID DEFAULT uuid_generate_v4(),
    PRIMARY KEY (old_id)
);

CREATE TEMP TABLE IF NOT EXISTS legacy_user_mapping (
    email TEXT,
    user_id UUID,
    PRIMARY KEY (email)
);

-- First, create users from legacy ticket data
-- Extract unique emails and create profile entries
INSERT INTO auth.users (id, email, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    DISTINCT email,
    NOW(),
    NOW()
FROM (
    -- Get unique emails from various legacy tables
    SELECT DISTINCT submitter_email as email FROM legacy_staff_tickets WHERE submitter_email IS NOT NULL
    UNION
    SELECT DISTINCT assigned_to_email as email FROM legacy_staff_tickets WHERE assigned_to_email IS NOT NULL
    UNION
    SELECT DISTINCT completed_by as email FROM legacy_staff_tickets WHERE completed_by IS NOT NULL
    UNION
    SELECT DISTINCT approver_email as email FROM legacy_staff_approvals WHERE approver_email IS NOT NULL
    UNION
    SELECT DISTINCT email FROM legacy_staff_login_attempts WHERE email IS NOT NULL
) unique_emails
WHERE email LIKE '%@gangerdermatology.com'
ON CONFLICT (email) DO NOTHING;

-- Create profiles for these users
INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
SELECT 
    id,
    email,
    SPLIT_PART(email, '@', 1) as full_name, -- Extract name from email
    'staff' as role,
    true as is_active,
    created_at,
    updated_at
FROM auth.users
WHERE email LIKE '%@gangerdermatology.com'
ON CONFLICT (email) DO NOTHING;

-- Populate user mapping table
INSERT INTO legacy_user_mapping (email, user_id)
SELECT email, id FROM public.profiles;

-- ============================================
-- MIGRATE STAFF TICKETS TO TICKETS TABLE
-- ============================================

-- First, create ticket ID mappings
INSERT INTO legacy_ticket_mapping (old_id)
SELECT DISTINCT id FROM legacy_staff_tickets;

-- Migrate tickets
INSERT INTO public.tickets (
    id, 
    user_id, 
    title, 
    description, 
    type, 
    status, 
    priority, 
    assigned_to,
    form_data,
    created_at, 
    updated_at
)
SELECT 
    m.new_id as id,
    u.user_id,
    COALESCE(payload->>'request_type', form_type) as title,
    payload->>'details' as description,
    form_type as type,
    CASE status
        WHEN 'Pending Approval' THEN 'open'
        WHEN 'Open' THEN 'open'
        WHEN 'In Progress' THEN 'in-progress'
        WHEN 'Stalled' THEN 'in-progress'
        WHEN 'Approved' THEN 'resolved'
        WHEN 'Denied' THEN 'closed'
        WHEN 'Completed' THEN 'resolved'
        ELSE 'open'
    END as status,
    CASE 
        WHEN priority = 'Urgent + Important' THEN 'urgent'
        WHEN priority = 'Not Urgent + Important' THEN 'high'
        WHEN priority = 'Urgent + Not Important' THEN 'medium'
        ELSE 'medium'
    END as priority,
    a.user_id as assigned_to,
    payload::jsonb as form_data,
    created_at,
    updated_at
FROM legacy_staff_tickets t
JOIN legacy_ticket_mapping m ON t.id = m.old_id
LEFT JOIN legacy_user_mapping u ON t.submitter_email = u.email
LEFT JOIN legacy_user_mapping a ON t.assigned_to_email = a.email;

-- ============================================
-- MIGRATE LOGIN ATTEMPTS TO AUDIT LOGS
-- ============================================

INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    details,
    ip_address,
    user_agent,
    created_at
)
SELECT 
    u.user_id,
    CASE WHEN success = 1 THEN 'login_success' ELSE 'login_failed' END as action,
    'authentication' as resource_type,
    jsonb_build_object('email', l.email, 'success', l.success) as details,
    l.ip_address::inet,
    l.user_agent,
    l.created_at
FROM legacy_staff_login_attempts l
LEFT JOIN legacy_user_mapping u ON l.email = u.email
WHERE l.email IS NOT NULL;

-- ============================================
-- MIGRATE FILE UPLOADS
-- ============================================

-- Create a file uploads table if needed
CREATE TABLE IF NOT EXISTS public.file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    upload_path TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.file_uploads (
    ticket_id,
    filename,
    original_filename,
    file_size,
    mime_type,
    upload_path,
    uploaded_by,
    created_at
)
SELECT 
    m.new_id as ticket_id,
    f.filename,
    f.original_filename,
    f.file_size,
    f.mime_type,
    f.upload_path,
    u.user_id as uploaded_by,
    f.created_at
FROM legacy_staff_file_uploads f
JOIN legacy_ticket_mapping m ON f.ticket_id = m.old_id
LEFT JOIN legacy_user_mapping u ON f.uploaded_by = u.email
WHERE f.status = 'active';

-- ============================================
-- MIGRATE APPROVALS TO TICKET COMMENTS
-- ============================================

INSERT INTO public.ticket_comments (
    ticket_id,
    user_id,
    content,
    is_internal,
    created_at
)
SELECT 
    m.new_id as ticket_id,
    u.user_id,
    CONCAT(a.action, ': ', COALESCE(a.comments, 'No comments')) as content,
    true as is_internal,
    a.created_at
FROM legacy_staff_approvals a
JOIN legacy_ticket_mapping m ON a.ticket_id = m.old_id
LEFT JOIN legacy_user_mapping u ON a.approver_email = u.email;

-- ============================================
-- CLEANUP AND SUMMARY
-- ============================================

-- Enable RLS on new table
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for file uploads
DROP POLICY IF EXISTS "Authenticated users can access file_uploads" ON public.file_uploads;
CREATE POLICY "Authenticated users can access file_uploads" ON public.file_uploads
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Summary of migration
SELECT 
    'Migration Summary' as report,
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.tickets) as total_tickets,
    (SELECT COUNT(*) FROM public.ticket_comments) as total_comments,
    (SELECT COUNT(*) FROM public.file_uploads) as total_files,
    (SELECT COUNT(*) FROM public.audit_logs WHERE action LIKE 'login%') as total_login_attempts;

COMMIT;

-- Important Notes:
-- 1. This script assumes the legacy tables exist. You'll need to first import the MySQL dump.
-- 2. The script creates users in auth.users - ensure Supabase auth is configured properly.
-- 3. File paths in upload_path may need adjustment based on your storage setup.
-- 4. Additional legacy tables can be migrated following similar patterns.