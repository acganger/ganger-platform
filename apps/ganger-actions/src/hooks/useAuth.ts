import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  role?: 'admin' | 'manager' | 'staff';
  location?: string;
  manager?: string;
}

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [requireAuth, status, router]);

  const authUser: AuthUser | null = session?.user ? {
    id: (session as any).user?.id || session.user.email || '',
    email: session.user.email || '',
    name: session.user.name || '',
    image: session.user.image || undefined,
    role: (session as any).user?.role || 'staff',
    location: (session as any).user?.location,
    manager: (session as any).user?.manager
  } : null;

  const hasRole = (requiredRole: string | string[]) => {
    if (!authUser) return false;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(authUser.role || '');
  };

  const signInWithGoogle = async () => {
    // This is handled by NextAuth - redirect to sign in page
    router.push('/auth/signin');
  };

  return {
    authUser,
    user: authUser, // Alias for compatibility
    session,
    isLoading: status === 'loading',
    loading: status === 'loading', // Alias for compatibility
    isAuthenticated: status === 'authenticated',
    hasRole,
    signOut,
    signInWithGoogle
  };
}