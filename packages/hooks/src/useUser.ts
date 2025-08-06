import { useAuth } from './useAuth';
import { useSupabaseQuery } from './useSupabaseQuery';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  department?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface UseUserReturn {
  user: UserProfile | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isManager: boolean;
  hasRole: (role: string) => boolean;
}

export function useUser(): UseUserReturn {
  const { user: authUser, loading: authLoading } = useAuth();
  
  const { data: userProfile, isLoading, error } = useSupabaseQuery<UserProfile>(
    ['user_profile', authUser?.id || 'none'],
    {
      table: 'user_profiles',
      filters: { user_id: authUser?.id },
      single: true,
      enabled: !!authUser?.id
    }
  );

  const hasRole = (role: string): boolean => {
    if (!userProfile) return false;
    return (userProfile as any).role === role;
  };

  return {
    user: (userProfile as UserProfile) || null,
    loading: authLoading || isLoading,
    error: error as Error | null,
    isAdmin: hasRole('admin'),
    isManager: hasRole('manager') || hasRole('admin'),
    hasRole
  };
}