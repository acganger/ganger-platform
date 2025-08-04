'use client'

import { useAuth } from '../context';

/**
 * Hook specifically for staff portal authentication.
 * Provides a simplified interface to commonly used auth properties.
 * 
 * @returns {object} Staff auth state and methods
 * @returns {AuthUser | null} returns.user - Current authenticated user
 * @returns {boolean} returns.isAuthenticated - Whether user is authenticated
 * @returns {boolean} returns.isLoading - Whether auth state is loading
 * @returns {UserProfile | null} returns.profile - User profile data
 * @returns {Function} returns.signIn - Sign in function
 * @returns {Function} returns.signOut - Sign out function
 * @returns {Record<string, AppPermission['permission_level']>} returns.permissions - App permissions
 * @returns {Team | null} returns.activeTeam - Currently active team
 * @returns {TeamMember['role'] | null} returns.teamRole - User's role in active team
 * 
 * @example
 * function StaffDashboard() {
 *   const { user, isAuthenticated, signIn, profile } = useStaffAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <button onClick={() => signIn()}>Sign In</button>;
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {profile?.full_name}</h1>
 *       <p>Department: {profile?.department}</p>
 *     </div>
 *   );
 * }
 */
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