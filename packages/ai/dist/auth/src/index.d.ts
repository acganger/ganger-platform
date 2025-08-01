export { AuthProvider, useAuth, useAppAuth } from './context';
export { AuthGuard, withAuthGuard, withAuthComponent, useAuthGuard, ConditionalRender, StaffOnly, AdminOnly, TeamMemberOnly, TeamLeaderOnly } from './guards';
export { AuthCallback, withAuthCallback } from './callback';
export { getSupabaseClient, createAppSupabaseClient, getTypedSupabaseClient, supabase } from './supabase';
export { navigateToApp, getCurrentApp, isSSONavigation, sessionManager, universalLogout, getAppNavigationMenu, getAppAuthCallbackUrl, APP_URLS, CrossAppSessionManager } from './cross-app';
export type { AuthConfig, UserProfile, Team, TeamSettings, TeamMember, AppPermission, AuthUser, AuthSession, AuthContextType, AuditLogEvent, AuthGuardLevel, AuthGuardProps, AppName, AppMenuItem } from './types';
export type { Database, TypedSupabaseClient } from './supabase';
export * from './utils';
export * from './staff';
export declare const DEFAULT_AUTH_CONFIG: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    redirectUrl: string;
    enableAuditLogging: boolean;
    sessionTimeout: number;
};
//# sourceMappingURL=index.d.ts.map