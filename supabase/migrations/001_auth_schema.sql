-- Ganger Platform Authentication Schema
-- Creates comprehensive user management, teams, and role-based access control

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles Table
-- Extends Supabase auth.users with additional metadata
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'viewer')),
    department TEXT,
    position TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teams Table (for L10 EOS management)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Team Members Table
-- Links users to teams with specific roles
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member', 'viewer')),
    seat TEXT, -- EOS seat/role in the company
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(team_id, user_id)
);

-- 4. Application Access Table
-- Controls which apps users can access
CREATE TABLE IF NOT EXISTS public.app_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    app_name TEXT NOT NULL, -- 'l10', 'handouts', 'inventory', etc.
    permission_level TEXT NOT NULL DEFAULT 'read' CHECK (permission_level IN ('admin', 'write', 'read', 'none')),
    granted_by UUID REFERENCES public.profiles(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, app_name)
);

-- 5. Audit Log Table (HIPAA compliance)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'login', 'logout', 'access_app', 'modify_data', etc.
    resource_type TEXT, -- 'patient_handout', 'inventory_item', 'team_data', etc.
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_app_permissions_user_id ON public.app_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_app_permissions_app_name ON public.app_permissions(app_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 7. Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Teams policies
CREATE POLICY "Team members can view their teams" ON public.teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members 
            WHERE team_id = id AND user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Team leaders can update their teams" ON public.teams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.team_members 
            WHERE team_id = id AND user_id = auth.uid() AND role = 'leader'
        )
    );

CREATE POLICY "Admins can manage all teams" ON public.teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Team members policies
CREATE POLICY "Users can view team memberships" ON public.team_members
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.team_members tm2 
            WHERE tm2.team_id = team_id AND tm2.user_id = auth.uid()
        )
    );

-- App permissions policies
CREATE POLICY "Users can view own app permissions" ON public.app_permissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all app permissions" ON public.app_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Audit logs policies
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 8. Functions for common operations

-- Function to check if user is team member
CREATE OR REPLACE FUNCTION public.is_team_member(user_uuid UUID, team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE user_id = user_uuid AND team_id = team_uuid AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role for app
CREATE OR REPLACE FUNCTION public.get_app_permission(user_uuid UUID, app_name_param TEXT)
RETURNS TEXT AS $$
DECLARE
    permission TEXT;
BEGIN
    SELECT permission_level INTO permission
    FROM public.app_permissions 
    WHERE user_id = user_uuid AND app_name = app_name_param 
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Default permissions based on user role if no specific permission
    IF permission IS NULL THEN
        SELECT CASE 
            WHEN role = 'admin' THEN 'admin'
            WHEN role = 'staff' THEN 'write'
            WHEN role = 'viewer' THEN 'read'
            ELSE 'none'
        END INTO permission
        FROM public.profiles 
        WHERE id = user_uuid;
    END IF;
    
    RETURN COALESCE(permission, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
    action_param TEXT,
    resource_type_param TEXT DEFAULT NULL,
    resource_id_param TEXT DEFAULT NULL,
    details_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (auth.uid(), action_param, resource_type_param, resource_id_param, details_param)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Triggers for automatic updates

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT DEFAULT 'staff';
BEGIN
    -- Determine role based on email domain
    IF NEW.email LIKE '%@gangerdermatology.com' THEN
        user_role := 'staff';
        -- Special case for admin
        IF NEW.email = 'anand@gangerdermatology.com' THEN
            user_role := 'admin';
        END IF;
    ELSE
        user_role := 'viewer';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        user_role
    );

    -- Log signup event
    INSERT INTO public.audit_logs (user_id, action, details)
    VALUES (
        NEW.id,
        'user_signup',
        jsonb_build_object('email', NEW.email, 'role', user_role)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Initial data setup

-- Create default admin user profile (if not exists)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email),
    'admin'
FROM auth.users u
WHERE u.email = 'anand@gangerdermatology.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Create default team for Ganger Dermatology
INSERT INTO public.teams (id, name, description, settings)
VALUES (
    uuid_generate_v4(),
    'Ganger Dermatology Leadership Team',
    'Main leadership team for EOS Level 10 meetings',
    '{"meeting_day": "monday", "meeting_time": "09:00", "timezone": "America/New_York", "meeting_duration": 90, "scorecard_frequency": "weekly", "rock_quarters": ["Q2 2025", "Q3 2025"]}'
)
ON CONFLICT DO NOTHING;

-- Grant default app permissions for staff
INSERT INTO public.app_permissions (user_id, app_name, permission_level)
SELECT 
    p.id,
    app.name,
    CASE 
        WHEN p.role = 'admin' THEN 'admin'
        WHEN p.role = 'staff' THEN 'write'
        ELSE 'read'
    END
FROM public.profiles p
CROSS JOIN (
    VALUES 
    ('l10'),
    ('handouts'),
    ('inventory'),
    ('medication-auth'),
    ('checkin-kiosk'),
    ('call-center-ops')
) AS app(name)
WHERE p.email LIKE '%@gangerdermatology.com'
ON CONFLICT (user_id, app_name) DO UPDATE SET
    permission_level = EXCLUDED.permission_level,
    granted_at = NOW();

COMMENT ON TABLE public.profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE public.teams IS 'Teams for EOS L10 management and collaboration';
COMMENT ON TABLE public.team_members IS 'Team membership with specific roles';
COMMENT ON TABLE public.app_permissions IS 'Application-level permissions for users';
COMMENT ON TABLE public.audit_logs IS 'HIPAA-compliant audit trail for all user actions';