import React from 'react';
import { AuthGuardProps, AuthGuardLevel } from './types';
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
export declare function AuthGuard({ level, appName, teamId, fallback: FallbackComponent, children }: AuthGuardProps): import("react/jsx-runtime").JSX.Element;
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
export declare function withAuthGuard<P extends object>(Component: React.ComponentType<P>, guardProps: Omit<AuthGuardProps, 'children'>): (props: P) => import("react/jsx-runtime").JSX.Element;
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
export declare function useAuthGuard(): {
    user: import("./types").AuthUser | null;
    session: import("./types").AuthSession | null;
    profile: import("./types").UserProfile | null;
    loading: boolean;
    userTeams: import("./types").Team[];
    activeTeam: import("./types").Team | null;
    teamRole: import("./types").TeamMember["role"] | null;
    appPermissions: Record<string, import("./types").AppPermission["permission_level"]>;
    signIn: (redirectTo?: string) => Promise<void>;
    signOut: () => Promise<void>;
    setActiveTeam: (team: import("./types").Team) => void;
    refreshProfile: () => Promise<void>;
    hasAppAccess: (appName: string, level?: import("./types").AppPermission["permission_level"]) => boolean;
    isTeamMember: (teamId: string) => boolean;
    isTeamLeader: (teamId: string) => boolean;
    isAdmin: () => boolean;
    logAuditEvent: (action: string, resourceType?: string, resourceId?: string, details?: Record<string, any>) => Promise<void>;
    canAccess: (level: AuthGuardLevel, appName?: string, teamId?: string) => boolean;
};
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
export declare function ConditionalRender({ condition, appName, teamId, fallback, children }: ConditionalRenderProps): import("react/jsx-runtime").JSX.Element;
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
export declare function StaffOnly({ children, fallback }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
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
export declare function AdminOnly({ children, fallback }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
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
export declare function TeamMemberOnly({ teamId, children, fallback }: {
    teamId: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
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
export declare function TeamLeaderOnly({ teamId, children, fallback }: {
    teamId: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
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
export declare function withAuthComponent<P extends object>(Component: React.ComponentType<P>, options?: WithAuthComponentOptions): (props: P) => import("react/jsx-runtime").JSX.Element;
export {};
