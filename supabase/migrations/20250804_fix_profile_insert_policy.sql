-- Fix profile creation by adding INSERT policy
-- This allows authenticated users to create their own profile

-- Drop the existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Also ensure the user can only insert a profile for themselves with their email
CREATE POLICY "Users can only insert profile with matching email" ON public.profiles
    FOR INSERT 
    WITH CHECK (
        auth.uid() = id 
        AND email = auth.jwt()->>'email'
    );

-- Fix any existing users who don't have profiles
-- This will create profiles for any authenticated users from gangerdermatology.com
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE p.id IS NULL 
        AND u.email LIKE '%@gangerdermatology.com'
    LOOP
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
            user_record.id,
            user_record.email,
            COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.email),
            user_record.raw_user_meta_data->>'avatar_url',
            CASE 
                WHEN user_record.email = 'anand@gangerdermatology.com' THEN 'admin'
                ELSE 'staff'
            END,
            'Unknown',
            true
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;

-- Verify the policies are working
-- This should show all policies on the profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;