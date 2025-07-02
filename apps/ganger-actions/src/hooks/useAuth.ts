import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
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
    id: session.user.id || '',
    email: session.user.email || '',
    name: session.user.name || '',
    image: session.user.image || undefined
  } : null;

  return {
    authUser,
    session,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}