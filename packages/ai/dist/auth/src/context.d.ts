import React, { ReactNode } from 'react';
import { AuthContextType, UserProfile, Team, TeamMember, AppPermission, AuthConfig, AuthUser, AuthSession } from './types';
declare const AuthContext: React.Context<AuthContextType | undefined>;
interface AuthProviderProps {
    children: ReactNode;
    config?: Partial<AuthConfig>;
    appName?: string;
}
export declare function AuthProvider({ children, config, appName }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * Hook to use authentication context
 */
export declare function useAuth(): AuthContextType;
/**
 * Hook to use authentication with specific app context
 */
export declare function useAppAuth(appName: string): {
    hasAccess: (level?: AppPermission["permission_level"]) => boolean;
    logAction: (action: string, resourceType?: string, resourceId?: string, details?: Record<string, any>) => Promise<void>;
    user: AuthUser | null;
    session: AuthSession | null;
    profile: UserProfile | null;
    loading: boolean;
    userTeams: Team[];
    activeTeam: Team | null;
    teamRole: TeamMember["role"] | null;
    appPermissions: Record<string, AppPermission["permission_level"]>;
    signIn: (redirectTo?: string) => Promise<void>;
    signOut: () => Promise<void>;
    setActiveTeam: (team: Team) => void;
    refreshProfile: () => Promise<void>;
    hasAppAccess: (appName: string, level?: AppPermission["permission_level"]) => boolean;
    isTeamMember: (teamId: string) => boolean;
    isTeamLeader: (teamId: string) => boolean;
    isAdmin: () => boolean;
    logAuditEvent: (action: string, resourceType?: string, resourceId?: string, details?: Record<string, any>) => Promise<void>;
};
export { AuthContext };
//# sourceMappingURL=context.d.ts.map