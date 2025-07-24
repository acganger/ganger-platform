-- Migration: Create missing staff_* tables for Ganger Actions app
-- Issue: Tables referenced in code but don't exist in database
-- Solution: Create tables based on TypeScript definitions and usage

-- Create staff_user_profiles table
CREATE TABLE IF NOT EXISTS public.staff_user_profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id text,
    department text,
    position text,
    phone text,
    location text,
    emergency_contact jsonb,
    start_date date,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Create staff_ticket_comments table (depends on staff_tickets existing)
CREATE TABLE IF NOT EXISTS public.staff_ticket_comments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id uuid REFERENCES public.staff_tickets(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    content text NOT NULL,
    is_internal boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Create staff_attachments table (depends on staff_tickets existing)
CREATE TABLE IF NOT EXISTS public.staff_attachments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id uuid REFERENCES public.staff_tickets(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_size integer,
    file_type text,
    storage_path text NOT NULL,
    uploaded_by uuid REFERENCES auth.users(id),
    uploaded_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_user_profiles_user_id ON public.staff_user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_profiles_active ON public.staff_user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_ticket_comments_ticket_id ON public.staff_ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_staff_ticket_comments_user_id ON public.staff_ticket_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_attachments_ticket_id ON public.staff_attachments(ticket_id);

-- Create updated_at trigger for staff_user_profiles
CREATE TRIGGER update_staff_user_profiles_updated_at 
    BEFORE UPDATE ON public.staff_user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.staff_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Staff can view all profiles
CREATE POLICY "Staff can view all profiles" ON public.staff_user_profiles
    FOR SELECT USING (auth.jwt() ->> 'email' LIKE '%@gangerdermatology.com');

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.staff_user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Staff can view all comments
CREATE POLICY "Staff can view all comments" ON public.staff_ticket_comments
    FOR SELECT USING (auth.jwt() ->> 'email' LIKE '%@gangerdermatology.com');

-- Staff can create comments
CREATE POLICY "Staff can create comments" ON public.staff_ticket_comments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' LIKE '%@gangerdermatology.com');

-- Staff can view all attachments
CREATE POLICY "Staff can view all attachments" ON public.staff_attachments
    FOR SELECT USING (auth.jwt() ->> 'email' LIKE '%@gangerdermatology.com');

-- Staff can upload attachments
CREATE POLICY "Staff can upload attachments" ON public.staff_attachments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' LIKE '%@gangerdermatology.com');

-- Verify tables were created
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'Created successfully'
        ELSE 'Failed to create'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('staff_user_profiles', 'staff_ticket_comments', 'staff_attachments');