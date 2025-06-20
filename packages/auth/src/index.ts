// Universal Authentication Package for Ganger Platform
// Provides unified authentication across all applications

// Core exports
export { AuthProvider, useAuth, useAppAuth } from './context';
export { 
  AuthGuard, 
  withAuthGuard, 
  withAuthComponent,
  useAuthGuard, 
  ConditionalRender,
  StaffOnly,
  AdminOnly,
  TeamMemberOnly,
  TeamLeaderOnly
} from './guards';
export { AuthCallback, withAuthCallback } from './callback';
export { getSupabaseClient, createAppSupabaseClient, getTypedSupabaseClient, supabase } from './supabase';
export { 
  navigateToApp, 
  getCurrentApp, 
  isSSONavigation, 
  sessionManager, 
  universalLogout, 
  getAppNavigationMenu,
  getAppAuthCallbackUrl,
  APP_URLS,
  CrossAppSessionManager
} from './cross-app';

// Re-export types
export type { AuthConfig, UserProfile, Team, TeamSettings, TeamMember, AppPermission, AuthUser, AuthSession, AuthContextType, AuditLogEvent, AuthGuardLevel, AuthGuardProps, AppName, AppMenuItem } from './types';
export type { Database, TypedSupabaseClient } from './supabase';

// Utility functions
export * from './utils';

// Staff portal authentication
export * from './staff';

// Default configuration
export const DEFAULT_AUTH_CONFIG = {
  supabaseUrl: 'https://pfqtzmxxxhhsxmlddrta.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s',
  redirectUrl: 'https://staff.gangerdermatology.com/auth/callback',
  enableAuditLogging: true,
  sessionTimeout: 86400
};