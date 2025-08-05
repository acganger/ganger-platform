// Universal Authentication Package for Ganger Platform
// Provides unified authentication across all applications
// Core exports
export { AuthProvider, useAuth, useAppAuth } from './context';
export { AuthGuard, withAuthGuard, withAuthComponent, useAuthGuard, ConditionalRender, StaffOnly, AdminOnly, TeamMemberOnly, TeamLeaderOnly } from './guards';
// AuthCallback component is for Pages Router only
// App Router apps should implement their own auth/callback/page.tsx
// export { AuthCallback, withAuthCallback } from './callback';
export { getSupabaseClient, createAppSupabaseClient, getTypedSupabaseClient, supabase } from './supabase';
export { navigateToApp, getCurrentApp, isSSONavigation, sessionManager, universalLogout, getAppNavigationMenu, getAppAuthCallbackUrl, APP_URLS, CrossAppSessionManager } from './cross-app';
// Utility functions
export * from './utils';
// Cookie utilities for session management
export { getCookie, setCookie, deleteCookie, getAllCookies, clearAllCookies } from './utils/cookies';
export { CookieStorage, gangerCookieStorage } from './utils/CookieStorage';
export { CookieStorageAdapter, createGangerCookieStorage } from './utils/CookieStorageAdapter';
// Debugging utilities (use only in development)
export { debugAuth, diagnoseAuth, enableAuthDebugging, disableAuthDebugging } from './utils/auth-debug';
// Staff portal authentication
export * from './staff';
// App Router API authentication middleware
// NOTE: These exports are for server-side use only (API routes)
// Do not import @ganger/auth in client components if you need these
// Instead, import from @ganger/auth/middleware directly in API routes
// SSR-compatible Supabase clients with cross-domain cookies
// These are only available in App Router environments
// For Pages Router, use @supabase/auth-helpers-nextjs instead
// export {
//   createBrowserSupabaseClient,
//   createServerSupabaseClient,
//   createApiRouteSupabaseClient,
//   getCookiesToSet
// } from './utils/supabase-ssr';
// Pages Router API route Supabase client
// This replaces createServerSupabaseClient from @supabase/auth-helpers-nextjs
export { createPagesRouterSupabaseClient, createServerSupabaseClient } from './utils/pages-router-supabase';
// Default configuration
export const DEFAULT_AUTH_CONFIG = {
    supabaseUrl: 'https://supa.gangerdermatology.com',
    supabaseAnonKey: 'sb_publishable_q-yj56RH8zrMVH-4cRazWA_PI2pBoeh',
    redirectUrl: 'https://staff.gangerdermatology.com/auth/callback',
    enableAuditLogging: true,
    sessionTimeout: 86400
};
