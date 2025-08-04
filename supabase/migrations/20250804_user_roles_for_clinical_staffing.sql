-- Create user_roles table for clinical staffing permissions
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_department ON public.user_roles(role_name, department) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all roles" ON public.user_roles
  FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample roles for testing (replace with actual user IDs)
-- OS Managers can schedule
-- OU Managers can resolve conflicts
-- Both types can approve within their scope

-- Example (commented out - add real user IDs):
-- INSERT INTO public.user_roles (user_id, role_name, department) VALUES
-- ('user-uuid-1', 'manager', 'OS'), -- Can schedule
-- ('user-uuid-2', 'manager', 'OU'), -- Can resolve conflicts
-- ('user-uuid-3', 'manager', 'OS'), -- Another OS manager
-- ('user-uuid-4', 'staff', NULL);   -- Regular staff