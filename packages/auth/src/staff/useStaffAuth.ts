'use client'

import { useAuth } from '../context';

export function useStaffAuth() {
  const auth = useAuth();
  
  return {
    user: auth.user,
    isAuthenticated: !!auth.user,
    isLoading: auth.loading,
    profile: auth.profile,
    signIn: auth.signIn,
    signOut: auth.signOut,
    permissions: auth.appPermissions,
    activeTeam: auth.activeTeam,
    teamRole: auth.teamRole
  };
}