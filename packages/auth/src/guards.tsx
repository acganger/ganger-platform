// Authentication Guards for Ganger Platform

'use client';

import React from 'react';
import { useAuth } from './context';
import { AuthGuardProps, AuthGuardLevel } from './types';

/**
 * Default loading component
 */
function DefaultLoadingComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

/**
 * Default unauthorized component
 */
function DefaultUnauthorizedComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}

/**
 * Login prompt component
 */
function LoginPromptComponent({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h1>
        <p className="text-gray-600 mb-6">
          Please sign in with your Ganger Dermatology account to continue.
        </p>
        <button
          onClick={onSignIn}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

/**
 * Authentication guard component that controls access based on user permissions.
 * Renders children only if the user meets the specified authentication requirements.
 * 
 * @param {AuthGuardProps} props - The guard configuration
 * @param {AuthGuardLevel} props.level - Required authentication level
 * @param {string} [props.appName] - Optional app name for app-specific permission checks
 * @param {string} [props.teamId] - Optional team ID for team-based permission checks
 * @param {React.ComponentType} [props.fallback] - Custom component to render when access is denied
 * @param {React.ReactNode} props.children - Content to render when access is granted
 * @returns {JSX.Element} Protected content or fallback component
 * 
 * @example
 * // Basic authentication check
 * <AuthGuard level="authenticated">
 *   <ProtectedContent />
 * </AuthGuard>
 * 
 * @example
 * // Admin-only access with custom fallback
 * <AuthGuard level="admin" fallback={CustomUnauthorized}>
 *   <AdminPanel />
 * </AuthGuard>
 * 
 * @example
 * // App-specific permission check
 * <AuthGuard level="staff" appName="inventory">
 *   <InventoryManager />
 * </AuthGuard>
 */
export function AuthGuard({ 
  level, 
  appName, 
  teamId, 
  fallback: FallbackComponent, 
  children 
}: AuthGuardProps) {
  const { 
    user, 
    profile, 
    loading, 
    signIn, 
    hasAppAccess, 
    isTeamMember, 
    isTeamLeader, 
    isAdmin 
  } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return FallbackComponent ? <FallbackComponent /> : <DefaultLoadingComponent />;
  }

  // Check authentication requirements based on level
  switch (level) {
    case 'public':
      // Public access - no authentication required
      return <>{children}</>;

    case 'authenticated':
      // Requires any authenticated user
      if (!user) {
        return <LoginPromptComponent onSignIn={() => signIn()} />;
      }
      return <>{children}</>;

    case 'staff':
      // Requires staff-level access
      if (!user) {
        return <LoginPromptComponent onSignIn={() => signIn()} />;
      }
      if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
        return FallbackComponent ? <FallbackComponent /> : <DefaultUnauthorizedComponent />;
      }
      // Additional app-specific check
      if (appName && !hasAppAccess(appName, 'read')) {
        return FallbackComponent ? <FallbackComponent /> : <DefaultUnauthorizedComponent />;
      }
      return <>{children}</>;

    case 'admin':
      // Requires admin access
      if (!user) {
        return <LoginPromptComponent onSignIn={() => signIn()} />;
      }
      if (!isAdmin()) {
        return FallbackComponent ? <FallbackComponent /> : <DefaultUnauthorizedComponent />;
      }
      return <>{children}</>;

    case 'team-member':
      // Requires team membership
      if (!user) {
        return <LoginPromptComponent onSignIn={() => signIn()} />;
      }
      if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
        return FallbackComponent ? <FallbackComponent /> : <DefaultUnauthorizedComponent />;
      }
      if (teamId && !isTeamMember(teamId)) {
        return FallbackComponent ? <FallbackComponent /> : <DefaultUnauthorizedComponent />;
      }
      return <>{children}</>;

    case 'team-leader':
      // Requires team leadership
      if (!user) {
        return <LoginPromptComponent onSignIn={() => signIn()} />;
      }
      if (!isAdmin() && (!teamId || !isTeamLeader(teamId))) {
        return FallbackComponent ? <FallbackComponent /> : <DefaultUnauthorizedComponent />;
      }
      return <>{children}</>;

    default:
      console.warn(`Unknown auth guard level: ${level}`);
      return <>{children}</>;
  }
}

/**
 * Higher-order component that wraps a component with authentication guards.
 * Creates a new component that only renders the wrapped component if auth requirements are met.
 * 
 * @template P - Props type of the wrapped component
 * @param {React.ComponentType<P>} Component - Component to protect with auth guard
 * @param {Omit<AuthGuardProps, 'children'>} guardProps - Authentication requirements
 * @returns {React.ComponentType<P>} New component with authentication protection
 * 
 * @example
 * // Protect a component with staff-level access
 * const ProtectedDashboard = withAuthGuard(Dashboard, { 
 *   level: 'staff',
 *   appName: 'inventory' 
 * });
 * 
 * @example
 * // Use the protected component
 * function App() {
 *   return <ProtectedDashboard someProp="value" />;
 * }
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<AuthGuardProps, 'children'>
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...guardProps}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Hook for checking authentication permissions programmatically.
 * Provides a canAccess method for conditional logic based on auth levels.
 * 
 * @returns {object} Auth guard utilities
 * @returns {Function} returns.canAccess - Function to check if user has required access level
 * @returns {AuthContextType} returns...auth - All auth context properties and methods
 * 
 * @example
 * // Conditional rendering based on permissions
 * function FeatureToggle() {
 *   const { canAccess } = useAuthGuard();
 *   
 *   return (
 *     <div>
 *       {canAccess('staff') && <StaffFeatures />}
 *       {canAccess('admin') && <AdminFeatures />}
 *       {canAccess('team-member', undefined, teamId) && <TeamFeatures />}
 *     </div>
 *   );
 * }
 * 
 * @example
 * // Conditional logic in event handlers
 * function ActionButton() {
 *   const { canAccess } = useAuthGuard();
 *   
 *   const handleClick = () => {
 *     if (!canAccess('admin')) {
 *       alert('Admin access required');
 *       return;
 *     }
 *     // Perform admin action
 *   };
 * }
 */
export function useAuthGuard() {
  const auth = useAuth();
  
  return {
    canAccess: (level: AuthGuardLevel, appName?: string, teamId?: string) => {
      switch (level) {
        case 'public':
          return true;
        case 'authenticated':
          return !!auth.user;
        case 'staff':
          return !!auth.user && !!auth.profile && 
                 (auth.profile.role === 'admin' || auth.profile.role === 'staff') &&
                 (!appName || auth.hasAppAccess(appName, 'read'));
        case 'admin':
          return auth.isAdmin();
        case 'team-member':
          return !!auth.user && !!auth.profile && 
                 (auth.profile.role === 'admin' || auth.profile.role === 'staff') &&
                 (!teamId || auth.isTeamMember(teamId));
        case 'team-leader':
          return auth.isAdmin() || (!!teamId && auth.isTeamLeader(teamId));
        default:
          return false;
      }
    },
    ...auth
  };
}

/**
 * Component for conditional rendering based on authentication permissions.
 * Shows children when conditions are met, otherwise shows fallback.
 * 
 * @param {ConditionalRenderProps} props - The component props
 * @param {AuthGuardLevel} props.condition - Required authentication level
 * @param {string} [props.appName] - Optional app name for permission checks
 * @param {string} [props.teamId] - Optional team ID for team-based checks
 * @param {React.ReactNode} [props.fallback] - Content to show when condition not met
 * @param {React.ReactNode} props.children - Content to show when condition is met
 * @returns {JSX.Element} Either children or fallback based on auth condition
 * 
 * @example
 * // Show/hide based on auth level
 * <ConditionalRender condition="staff">
 *   <StaffOnlyFeature />
 * </ConditionalRender>
 * 
 * @example
 * // With custom fallback
 * <ConditionalRender 
 *   condition="admin" 
 *   fallback={<p>Admin access required</p>}
 * >
 *   <AdminControls />
 * </ConditionalRender>
 */
interface ConditionalRenderProps {
  condition: AuthGuardLevel;
  appName?: string;
  teamId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function ConditionalRender({ 
  condition, 
  appName, 
  teamId, 
  fallback, 
  children 
}: ConditionalRenderProps) {
  const { canAccess } = useAuthGuard();
  
  if (canAccess(condition, appName, teamId)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

/**
 * Component that only renders children for staff-level users and above.
 * Convenience wrapper around ConditionalRender with staff-level access.
 * 
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Content to show for staff users
 * @param {React.ReactNode} [props.fallback] - Optional content for non-staff users
 * @returns {JSX.Element} Protected content
 * 
 * @example
 * <StaffOnly>
 *   <StaffDashboard />
 * </StaffOnly>
 * 
 * @example
 * // With custom fallback
 * <StaffOnly fallback={<GuestView />}>
 *   <StaffView />
 * </StaffOnly>
 */
export function StaffOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ConditionalRender condition="staff" fallback={fallback}>
      {children}
    </ConditionalRender>
  );
}

/**
 * Component that only renders children for admin users.
 * Convenience wrapper around ConditionalRender with admin-level access.
 * 
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Content to show for admin users
 * @param {React.ReactNode} [props.fallback] - Optional content for non-admin users
 * @returns {JSX.Element} Protected content
 * 
 * @example
 * <AdminOnly>
 *   <SystemSettings />
 * </AdminOnly>
 */
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ConditionalRender condition="admin" fallback={fallback}>
      {children}
    </ConditionalRender>
  );
}

/**
 * Component that only renders children for members of a specific team.
 * 
 * @param {object} props - Component props
 * @param {string} props.teamId - ID of the team to check membership for
 * @param {React.ReactNode} props.children - Content to show for team members
 * @param {React.ReactNode} [props.fallback] - Optional content for non-members
 * @returns {JSX.Element} Protected content
 * 
 * @example
 * <TeamMemberOnly teamId="team-123">
 *   <TeamDashboard />
 * </TeamMemberOnly>
 */
export function TeamMemberOnly({ 
  teamId, 
  children, 
  fallback 
}: { 
  teamId: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return (
    <ConditionalRender condition="team-member" teamId={teamId} fallback={fallback}>
      {children}
    </ConditionalRender>
  );
}

/**
 * Component that only renders children for leaders of a specific team.
 * Admins always have access regardless of team leadership.
 * 
 * @param {object} props - Component props
 * @param {string} props.teamId - ID of the team to check leadership for
 * @param {React.ReactNode} props.children - Content to show for team leaders
 * @param {React.ReactNode} [props.fallback] - Optional content for non-leaders
 * @returns {JSX.Element} Protected content
 * 
 * @example
 * <TeamLeaderOnly teamId="team-123">
 *   <TeamManagementTools />
 * </TeamLeaderOnly>
 */
export function TeamLeaderOnly({ 
  teamId, 
  children, 
  fallback 
}: { 
  teamId: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return (
    <ConditionalRender condition="team-leader" teamId={teamId} fallback={fallback}>
      {children}
    </ConditionalRender>
  );
}

/**
 * Higher-order component for auth protection with flexible role-based access control.
 * Alternative to withAuthGuard with support for multiple roles and custom fallbacks.
 * 
 * @template P - Props type of the wrapped component
 * @param {React.ComponentType<P>} Component - Component to protect
 * @param {WithAuthComponentOptions} options - Authentication options
 * @param {string[]} [options.requiredRoles] - Array of roles that can access (OR logic)
 * @param {AuthGuardLevel} [options.requiredLevel] - Required auth level
 * @param {string} [options.appName] - App name for permission checks
 * @param {string} [options.teamId] - Team ID for team-based checks
 * @param {React.ComponentType} [options.fallback] - Custom unauthorized component
 * @returns {React.ComponentType<P>} Protected component
 * 
 * @example
 * // Multiple role support
 * const ProtectedReport = withAuthComponent(ReportView, {
 *   requiredRoles: ['admin', 'manager'],
 *   fallback: CustomUnauthorized
 * });
 * 
 * @example
 * // App-specific protection
 * const ProtectedInventory = withAuthComponent(InventoryManager, {
 *   requiredRoles: ['staff'],
 *   appName: 'inventory'
 * });
 */
interface WithAuthComponentOptions {
  requiredRoles?: string[];
  requiredLevel?: AuthGuardLevel;
  appName?: string;
  teamId?: string;
  fallback?: React.ComponentType<any>;
}

export function withAuthComponent<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthComponentOptions = {}
) {
  return function AuthProtectedComponent(props: P) {
    const { user, profile, loading, signIn, hasAppAccess, isTeamMember, isTeamLeader, isAdmin } = useAuth();
    
    // Show loading while checking authentication
    if (loading) {
      return options.fallback ? <options.fallback /> : <DefaultLoadingComponent />;
    }
    
    // Check if user is authenticated
    if (!user) {
      return <LoginPromptComponent onSignIn={() => signIn()} />;
    }
    
    // Check role-based access if requiredRoles is specified
    if (options.requiredRoles && options.requiredRoles.length > 0) {
      const userRole = profile?.role;
      const hasRequiredRole = options.requiredRoles.some(role => {
        switch (role) {
          case 'admin':
          case 'superadmin':
            return isAdmin();
          case 'staff':
            return userRole === 'admin' || userRole === 'staff';
          case 'manager':
            // Manager role maps to staff or admin in our system
            return userRole === 'admin' || userRole === 'staff';
          case 'team-leader':
            return isAdmin() || (options.teamId && isTeamLeader(options.teamId));
          case 'team-member':
            return userRole === 'admin' || userRole === 'staff' || 
                   (options.teamId && isTeamMember(options.teamId));
          case 'viewer':
            return userRole === 'admin' || userRole === 'staff' || userRole === 'viewer';
          default:
            // For any other role, check if it exactly matches the user's role
            return userRole === role;
        }
      });
      
      if (!hasRequiredRole) {
        return options.fallback ? <options.fallback /> : <DefaultUnauthorizedComponent />;
      }
    }
    
    // Check level-based access if requiredLevel is specified
    if (options.requiredLevel) {
      const guard = (
        <AuthGuard 
          level={options.requiredLevel}
          appName={options.appName}
          teamId={options.teamId}
          fallback={options.fallback}
        >
          <Component {...props} />
        </AuthGuard>
      );
      return guard;
    }
    
    // Check app-specific access
    if (options.appName && !hasAppAccess(options.appName, 'read')) {
      return options.fallback ? <options.fallback /> : <DefaultUnauthorizedComponent />;
    }
    
    // All checks passed, render the component
    return <Component {...props} />;
  };
}