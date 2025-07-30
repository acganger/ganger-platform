// Universal Authentication Context for Ganger Platform

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getTypedSupabaseClient } from './supabase';
import { 
  AuthContextType, 
  UserProfile, 
  Team, 
  TeamMember, 
  AppPermission,
  AuthConfig,
  AuditLogEvent,
  AuthUser,
  AuthSession
} from './types';
import { sessionManager, isSSONavigation } from './cross-app';
import { getCookie } from './utils/cookies';

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  config?: Partial<AuthConfig>;
  appName?: string;
}

export function AuthProvider({ children, config, appName = 'platform' }: AuthProviderProps) {
  // Core auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Team state
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeamState] = useState<Team | null>(null);
  const [teamRole, setTeamRole] = useState<TeamMember['role'] | null>(null);
  
  // App permissions
  const [appPermissions, setAppPermissions] = useState<Record<string, AppPermission['permission_level']>>({});
  
  // Get Supabase client
  const supabase = getTypedSupabaseClient(config);


  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata || {},
            app_metadata: session.user.app_metadata || {},
            aud: session.user.aud || 'authenticated',
            created_at: session.user.created_at || new Date().toISOString()
          };
          
          const authSession: AuthSession = {
            access_token: session.access_token,
            refresh_token: session.refresh_token || '',
            expires_in: session.expires_in || 3600,
            token_type: session.token_type || 'bearer',
            user: authUser
          };
          
          setUser(authUser);
          setSession(authSession);
          await loadUserData(session.user);
          await logAuditEvent('user_login', 'user', authUser.id, { app: appName });
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
          setUserTeams([]);
          setActiveTeamState(null);
          setTeamRole(null);
          setAppPermissions({});
        }
        
        setLoading(false);
      }
    );

    // Listen for cross-app authentication changes
    const unsubscribeCrossApp = sessionManager.onAuthChange((event) => {
      console.log('Cross-app auth event:', event);
      if (event === 'signout') {
        // Force refresh authentication state when another app signs out
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            setUser(null);
            setSession(null);
            setProfile(null);
            setUserTeams([]);
            setActiveTeamState(null);
            setTeamRole(null);
            setAppPermissions({});
          }
        });
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeCrossApp();
    };
  }, []);

  /**
   * Initialize authentication state
   */
  async function initializeAuth() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata || {},
          app_metadata: session.user.app_metadata || {},
          aud: session.user.aud || 'authenticated',
          created_at: session.user.created_at || new Date().toISOString()
        };
        
        const authSession: AuthSession = {
          access_token: session.access_token,
          refresh_token: session.refresh_token || '',
          expires_in: session.expires_in || 3600,
          token_type: session.token_type || 'bearer',
          user: authUser
        };
        
        setUser(authUser);
        setSession(authSession);
        await loadUserData(session.user);
      } else {
        // Session restoration is now handled by Supabase's detectSessionInUrl
        // and the cookie storage adapter we configured
        console.log('No active session found on initialization');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Load user profile, teams, and permissions
   */
  async function loadUserData(authUser: User) {
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        return;
      }

      setProfile(profileData);

      // Load user teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('team_members')
        .select(`
          role,
          is_active,
          teams:team_id (
            id,
            name,
            description,
            owner_id,
            settings,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', authUser.id)
        .eq('is_active', true);

      if (!teamsError && teamsData) {
        const teams = teamsData
          .filter(tm => tm.teams && (tm.teams as any).is_active)
          .map(tm => ({
            ...tm.teams,
            userRole: tm.role
          })) as any[] as (Team & { userRole: TeamMember['role'] })[];
        
        setUserTeams(teams);
        
        // Set active team (first team or previously selected)
        const savedTeamId = localStorage.getItem(`${appName}-active-team`);
        const activeTeam = teams.find(t => t.id === savedTeamId) || teams[0];
        
        if (activeTeam) {
          setActiveTeamState(activeTeam);
          setTeamRole(activeTeam.userRole);
        }
      }

      // Load app permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('app_permissions')
        .select('app_name, permission_level')
        .eq('user_id', authUser.id)
        .or('expires_at.is.null,expires_at.gt.now()'); // Include non-expired permissions

      if (!permissionsError && permissionsData) {
        const permissions: Record<string, AppPermission['permission_level']> = {};
        permissionsData.forEach(p => {
          permissions[p.app_name] = p.permission_level;
        });
        setAppPermissions(permissions);
      }

      // Update last login
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authUser.id);

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async function signIn(redirectTo?: string) {
    try {
      const redirectUrl = redirectTo || 
        (typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : undefined);
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supa.gangerdermatology.com';
      console.log('[Auth] Starting sign in with redirect to:', redirectUrl);
      console.log('[Auth] Using Supabase URL:', supabaseUrl);
      console.log('[Auth] Using custom domain:', supabaseUrl.includes('gangerdermatology.com'));
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          // Skip browser redirect to handle it manually (helps with ad blockers)
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('[Auth] OAuth error:', error);
        // Check if it's a network error
        if (error.message?.toLowerCase().includes('fetch')) {
          console.error('[Auth] Network error detected. Possible causes:');
          console.error('- Browser extensions blocking the request');
          console.error('- CORS issues with custom domain');
          console.error('- Network connectivity problems');
          console.error('- Try using standard Supabase URL: https://pfqtzmxxxhhsxmlddrta.supabase.co');
        }
        throw error;
      }
      
      console.log('[Auth] OAuth initiated successfully');
      // Don't return data - the interface expects Promise<void>
      // The browser will redirect automatically
    } catch (error) {
      console.error('[Auth] Sign in failed:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async function signOut() {
    try {
      await logAuditEvent('user_logout', undefined, undefined, { app: appName });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }

      // Notify other apps of sign out
      sessionManager.notifyAuthChange('signout');

      // Clear local storage
      localStorage.removeItem(`${appName}-active-team`);
      
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Set active team
   */
  function setActiveTeam(team: Team) {
    setActiveTeamState(team);
    
    // Find user's role in this team
    const teamMember = userTeams.find(t => t.id === team.id) as (Team & { userRole: TeamMember['role'] });
    setTeamRole(teamMember?.userRole || null);
    
    // Save to localStorage
    localStorage.setItem(`${appName}-active-team`, team.id);
    
    // Log team switch
    logAuditEvent('team_switch', 'team', team.id, { 
      team_name: team.name,
      app: appName 
    });
  }

  /**
   * Refresh user profile and permissions
   */
  async function refreshProfile() {
    if (user) {
      await loadUserData(user);
    }
  }

  /**
   * Check if user has access to specific app
   */
  function hasAppAccess(appName: string, level: AppPermission['permission_level'] = 'read'): boolean {
    if (!profile) return false;
    
    // Admin always has access
    if (profile.role === 'admin') return true;
    
    const userPermission = appPermissions[appName];
    
    // Check explicit permission
    if (userPermission) {
      const levels = ['none', 'read', 'write', 'admin'];
      const userLevel = levels.indexOf(userPermission);
      const requiredLevel = levels.indexOf(level);
      return userLevel >= requiredLevel;
    }
    
    // Default permissions based on user role
    if (profile.role === 'staff') {
      return level === 'read' || level === 'write';
    }
    
    if (profile.role === 'viewer') {
      return level === 'read';
    }
    
    return false;
  }

  /**
   * Check if user is member of specific team
   */
  function isTeamMember(teamId: string): boolean {
    return userTeams.some(team => team.id === teamId);
  }

  /**
   * Check if user is leader of specific team
   */
  function isTeamLeader(teamId: string): boolean {
    const team = userTeams.find(t => t.id === teamId) as (Team & { userRole: TeamMember['role'] });
    return team?.userRole === 'leader';
  }

  /**
   * Check if user is admin
   */
  function isAdmin(): boolean {
    return profile?.role === 'admin';
  }

  /**
   * Log audit event
   */
  async function logAuditEvent(
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, any>
  ) {
    if (!config?.enableAuditLogging) return;
    
    try {
      const { error } = await supabase.rpc('log_audit_event', {
        action_param: action,
        resource_type_param: resourceType,
        resource_id_param: resourceId,
        details_param: details || {}
      });

      if (error) {
        console.error('Error logging audit event:', error);
      }
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  const contextValue: AuthContextType = {
    // Core auth state
    user,
    session,
    profile,
    loading,
    
    // Team management
    userTeams,
    activeTeam,
    teamRole,
    
    // App permissions
    appPermissions,
    
    // Auth actions
    signIn,
    signOut,
    setActiveTeam,
    refreshProfile,
    
    // Permission checks
    hasAppAccess,
    isTeamMember,
    isTeamLeader,
    isAdmin,
    
    // Audit logging
    logAuditEvent,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook to use authentication with specific app context
 */
export function useAppAuth(appName: string) {
  const auth = useAuth();
  
  return {
    ...auth,
    hasAccess: (level?: AppPermission['permission_level']) => 
      auth.hasAppAccess(appName, level),
    logAction: (action: string, resourceType?: string, resourceId?: string, details?: Record<string, any>) =>
      auth.profile ? auth.logAuditEvent(action, resourceType, resourceId, { ...details, app: appName }) : Promise.resolve()
  };
}

// Re-export for convenience
export { AuthContext };