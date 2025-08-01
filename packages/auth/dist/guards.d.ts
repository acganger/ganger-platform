import React from 'react';
import { AuthGuardProps, AuthGuardLevel } from './types';
/**
 * Main authentication guard component
 */
export declare function AuthGuard({ level, appName, teamId, fallback: FallbackComponent, children }: AuthGuardProps): import("react/jsx-runtime").JSX.Element;
/**
 * Higher-order component for authentication guards
 */
export declare function withAuthGuard<P extends object>(Component: React.ComponentType<P>, guardProps: Omit<AuthGuardProps, 'children'>): (props: P) => import("react/jsx-runtime").JSX.Element;
/**
 * Hook for conditional rendering based on permissions
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
 * Component for conditional rendering based on permissions
 */
interface ConditionalRenderProps {
    condition: AuthGuardLevel;
    appName?: string;
    teamId?: string;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}
export declare function ConditionalRender({ condition, appName, teamId, fallback, children }: ConditionalRenderProps): import("react/jsx-runtime").JSX.Element;
export declare function StaffOnly({ children, fallback }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function AdminOnly({ children, fallback }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function TeamMemberOnly({ teamId, children, fallback }: {
    teamId: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function TeamLeaderOnly({ teamId, children, fallback }: {
    teamId: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Higher-order component for auth protection with role-based access
 * Alternative API to withAuthGuard with simplified role checking
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
//# sourceMappingURL=guards.d.ts.map