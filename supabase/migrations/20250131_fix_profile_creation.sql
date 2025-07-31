-- Fix profile creation for auth users
-- This migration ensures profiles are created automatically when users sign up

-- First, create any missing profiles for existing users
INSERT INTO public.profiles (id, email, full_name, role, department, is_active, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email),
    CASE 
        WHEN u.email = 'anand@gangerdermatology.com' THEN 'admin'
        ELSE 'staff'
    END as role,
    'Unknown' as department,
    true as is_active,
    u.created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
  AND u.email LIKE '%@gangerdermatology.com';

-- Create or replace the handle_new_user function to insert into profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger AS $$
BEGIN
  -- Only create profile for gangerdermatology.com emails
  IF NEW.email LIKE '%@gangerdermatology.com' THEN
    INSERT INTO public.profiles (
      id, 
      email, 
      full_name, 
      avatar_url,
      role,
      department,
      is_active
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.raw_user_meta_data->>'avatar_url',
      CASE 
        WHEN NEW.email = 'anand@gangerdermatology.com' THEN 'admin'
        ELSE 'staff'
      END,
      'Unknown',
      true
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Create new trigger for profile creation
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Also update profile when user metadata changes (e.g., name or avatar from Google)
CREATE OR REPLACE FUNCTION public.handle_user_metadata_update()
RETURNS trigger AS $$
BEGIN
  -- Update profile with latest metadata
  UPDATE public.profiles
  SET 
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_updated_profile ON auth.users;

-- Create trigger for metadata updates
CREATE TRIGGER on_auth_user_updated_profile
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_metadata_update();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Verify the fix by showing existing users without profiles
SELECT 
    u.email,
    u.created_at,
    p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE '%@gangerdermatology.com'
ORDER BY u.created_at DESC;