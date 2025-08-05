import { ReactNode } from 'react';
import { AuthContextType, UserProfile, Team, TeamMember, AppPermission, AuthConfig, AuthUser, AuthSession } from './types';
declare const AuthContext: import("react").Context<AuthContextType | undefined>;
interface AuthProviderProps {
    children: ReactNode;
    config?: Partial<AuthConfig>;
    appName?: string;
}
/**
 * AuthProvider component that provides authentication context to the entire application.
 * Manages user authentication state, profile data, team memberships, and app permissions.
 *
 * @param {AuthProviderProps} props - The provider props
 * @param {ReactNode} props.children - Child components that will have access to auth context
 * @param {Partial<AuthConfig>} [props.config] - Optional authentication configuration overrides
 * @param {string} [props.appName='platform'] - Name of the application for app-specific features
 * @returns {JSX.Element} Provider component wrapping children with auth context
 *
 * @example
 * // Basic usage
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 *
 * @example
 * // With custom config and app name
 * <AuthProvider
 *   appName="inventory"
 *   config={{ enableAuditLogging: true }}
 * >
 *   <InventoryApp />
 * </AuthProvider>
 */
export declare function AuthProvider({ children, config, appName }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * Hook to access the authentication context.
 * Must be used within an AuthProvider component.
 *
 * @returns {AuthContextType} The authentication context containing user data and auth methods
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * // Access user data and auth methods
 * function MyComponent() {
 *   const { user, profile, signIn, signOut } = useAuth();
 *
 *   if (!user) {
 *     return <button onClick={() => signIn()}>Sign In</button>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Welcome, {profile?.full_name}!</p>
 *       <button onClick={() => signOut()}>Sign Out</button>
 *     </div>
 *   );
 * }
 */
export declare function useAuth(): AuthContextType;
/**
 * Hook to use authentication with app-specific context.
 * Provides additional helper methods for app-level permissions and logging.
 *
 * @param {string} appName - The name of the application
 * @returns {object} Extended auth context with app-specific helpers
 * @returns {Function} returns.hasAccess - Check if user has access to this app with optional permission level
 * @returns {Function} returns.logAction - Log an audit event with app context automatically included
 *
 * @example
 * // Use in an app-specific component
 * function InventoryDashboard() {
 *   const auth = useAppAuth('inventory');
 *
 *   // Check app-specific permissions
 *   if (!auth.hasAccess('write')) {
 *     return <div>Read-only access</div>;
 *   }
 *
 *   // Log app-specific actions
 *   const handleDelete = async (itemId: string) => {
 *     await auth.logAction('delete_item', 'inventory_item', itemId);
 *     // ... delete logic
 *   };
 * }
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
