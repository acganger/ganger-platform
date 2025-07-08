// Re-export auth utilities from @ganger/auth with ganger-actions specific adaptations
import { useAuth as useBaseAuth, useAppAuth } from '@ganger/auth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  role?: 'admin' | 'manager' | 'staff' | 'viewer';
  location?: string;
  manager?: string;
}

export function useAuth(requireAuth = true) {
  const baseAuth = useBaseAuth();
  const appAuth = useAppAuth('ganger-actions');
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && !baseAuth.loading && !baseAuth.user) {
      router.push('/auth/signin');
    }
  }, [requireAuth, baseAuth.loading, baseAuth.user, router]);

  // Transform the auth user to match legacy interface
  const authUser: AuthUser | null = baseAuth.user ? {
    id: baseAuth.user.id,
    email: baseAuth.user.email,
    name: baseAuth.profile?.full_name || baseAuth.user.user_metadata?.full_name || baseAuth.user.email.split('@')[0],
    image: baseAuth.user.user_metadata?.avatar_url,
    role: baseAuth.profile?.role === 'viewer' ? 'staff' : (baseAuth.profile?.role || 'staff') as 'admin' | 'manager' | 'staff',
    location: baseAuth.profile?.location || 'Multiple',
    manager: baseAuth.profile?.position
  } : null;

  const hasRole = (requiredRole: string | string[]) => {
    if (!authUser) return false;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(authUser.role || '');
  };

  const signInWithGoogle = async () => {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
    await baseAuth.signIn(redirectTo);
  };

  return {
    authUser,
    user: authUser, // Alias for compatibility
    session: baseAuth.session,
    isLoading: baseAuth.loading,
    loading: baseAuth.loading, // Alias for compatibility
    isAuthenticated: !!baseAuth.user,
    hasRole,
    signOut: baseAuth.signOut,
    signInWithGoogle,
    
    // Additional utilities from @ganger/auth
    profile: baseAuth.profile,
    userTeams: baseAuth.userTeams,
    activeTeam: baseAuth.activeTeam,
    teamRole: baseAuth.teamRole,
    hasAccess: appAuth.hasAccess,
    isAdmin: baseAuth.isAdmin,
    isTeamMember: baseAuth.isTeamMember,
    isTeamLeader: baseAuth.isTeamLeader,
    refreshProfile: baseAuth.refreshProfile,
    logAction: appAuth.logAction
  };
}