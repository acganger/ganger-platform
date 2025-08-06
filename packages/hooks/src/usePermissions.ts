import { useUser } from './useUser';
import { useSupabaseQuery } from './useSupabaseQuery';

interface Permission {
  id: string;
  resource: string;
  action: string;
  role?: string;
  user_id?: string;
}

interface UsePermissionsReturn {
  can: (resource: string, action: string) => boolean;
  permissions: Permission[];
  loading: boolean;
  error: Error | null;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, isAdmin } = useUser();
  
  const { data, isLoading, error } = useSupabaseQuery<Permission[]>(
    ['permissions', user?.id || 'none'],
    {
      table: 'permissions',
      filters: {
        user_id: user?.id
      },
      enabled: !!user?.id
    }
  );

  const permissions: Permission[] = Array.isArray(data) ? data : [];

  const can = (resource: string, action: string): boolean => {
    // Admins can do everything
    if (isAdmin) return true;
    
    // Check specific permissions
    return permissions.some(
      p => p.resource === resource && p.action === action
    );
  };

  return {
    can,
    permissions,
    loading: isLoading,
    error: error as Error | null
  };
}