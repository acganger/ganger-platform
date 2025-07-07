-- Create user profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  department VARCHAR(100),
  position VARCHAR(100),
  role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'intern')),
  location VARCHAR(50) CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth', 'Remote', 'All')),
  manager_id UUID REFERENCES public.user_profiles(id),
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  profile_picture_url TEXT,
  google_user_data JSONB,
  skills TEXT[],
  emergency_contact JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_manager_id ON public.user_profiles(manager_id);
CREATE INDEX idx_user_profiles_location ON public.user_profiles(location);
CREATE INDEX idx_user_profiles_department ON public.user_profiles(department);
CREATE INDEX idx_user_profiles_is_active ON public.user_profiles(is_active);

-- User permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  granted_by UUID REFERENCES public.user_profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, permission)
);

-- Create index for permission lookups
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON public.user_permissions(permission);

-- Manager relationships history
CREATE TABLE IF NOT EXISTS public.manager_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.user_profiles(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  reason VARCHAR(255),
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for manager assignment lookups
CREATE INDEX idx_manager_assignments_employee_id ON public.manager_assignments(employee_id);
CREATE INDEX idx_manager_assignments_manager_id ON public.manager_assignments(manager_id);
CREATE INDEX idx_manager_assignments_dates ON public.manager_assignments(start_date, end_date);

-- Department definitions
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  head_id UUID REFERENCES public.user_profiles(id),
  parent_department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity log for audit trail
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for activity log lookups
CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_action ON public.user_activity_log(action);
CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- User profiles policies
-- Everyone can view active user profiles
CREATE POLICY "Users can view active profiles" ON public.user_profiles
  FOR SELECT USING (is_active = true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins and managers can update any profile
CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- User permissions policies
-- Users can view their own permissions
CREATE POLICY "Users can view own permissions" ON public.user_permissions
  FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all permissions
CREATE POLICY "Admins can manage permissions" ON public.user_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Manager assignments policies
-- Everyone can view manager assignments
CREATE POLICY "View manager assignments" ON public.manager_assignments
  FOR SELECT USING (true);

-- Admins and managers can manage assignments
CREATE POLICY "Manage manager assignments" ON public.manager_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Department policies
-- Everyone can view departments
CREATE POLICY "View departments" ON public.departments
  FOR SELECT USING (true);

-- Admins can manage departments
CREATE POLICY "Admins can manage departments" ON public.departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Activity log policies
-- Users can view their own activity
CREATE POLICY "Users can view own activity" ON public.user_activity_log
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view all activity
CREATE POLICY "Admins can view all activity" ON public.user_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically create user profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'staff'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user's team members (for managers)
CREATE OR REPLACE FUNCTION public.get_team_members(manager_uuid UUID)
RETURNS TABLE(
  id UUID,
  full_name VARCHAR(255),
  email VARCHAR(255),
  position VARCHAR(100),
  department VARCHAR(100),
  location VARCHAR(50),
  hire_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.full_name,
    up.email,
    up.position,
    up.department,
    up.location,
    up.hire_date
  FROM public.user_profiles up
  WHERE up.manager_id = manager_uuid
    AND up.is_active = true
  ORDER BY up.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid UUID, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check direct permission
  IF EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = user_uuid 
      AND permission = permission_name
      AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    RETURN true;
  END IF;
  
  -- Check role-based permissions
  -- Admins have all permissions
  IF EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_uuid AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;
  
  -- Managers have specific permissions
  IF permission_name IN ('view_team', 'manage_team', 'approve_time_off', 'approve_expenses') THEN
    IF EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = user_uuid AND role = 'manager'
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default departments
INSERT INTO public.departments (name, description) VALUES
  ('Administration', 'Administrative and support staff'),
  ('Clinical', 'Medical providers and clinical staff'),
  ('Operations', 'Operations and facility management'),
  ('IT', 'Information Technology'),
  ('Finance', 'Finance and accounting'),
  ('Marketing', 'Marketing and communications')
ON CONFLICT (name) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_permissions TO authenticated;
GRANT ALL ON public.manager_assignments TO authenticated;
GRANT ALL ON public.departments TO authenticated;
GRANT ALL ON public.user_activity_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission TO authenticated;