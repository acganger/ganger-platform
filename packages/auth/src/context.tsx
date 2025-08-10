// Universal Authentication Context for Ganger Platform

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { getTypedSupabaseClient } from './supabase';
import { 
  AuthContextType, 
  UserProfile, 
  Team, 
  TeamMember, 
  AppPermission,
  AuthConfig,
  AuthUser,
  AuthSession
} from './types';
import { sessionManager } from './cross-app';

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
export function AuthProvider({ children, config, appName = 'platform' }: AuthProviderProps) {
  // Core auth state
  const [ready, setReady] = useState(false);
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
    console.log('[AuthContext] Component mounted, initializing auth...');
    
    // Don't initialize twice
    let mounted = true;
    
    const init = async () => {
      if (!mounted) return;
      await initializeAuth();
    };
    
    init();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', {
          event,
          user: session?.user?.email,
          hasSession: !!session,
          timestamp: new Date().toISOString()
        });
        
        // Handle SIGNED_IN event specifically
        if (event === 'SIGNED_IN' && session?.user) {
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
      mounted = false;
      subscription.unsubscribe();
      unsubscribeCrossApp();
    };
  }, []);

  /**
   * Initialize authentication state on component mount.
   * Checks for existing session and loads user data if authenticated.
   * @private
   */
  async function initializeAuth() {
    console.log('[AuthContext] Starting auth initialization...');
    try {
      console.log('[AuthContext] Getting session from Supabase...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AuthContext] ❌ Error getting session:', {
          error,
          message: error.message,
          status: error.status,
          timestamp: new Date().toISOString()
        });
        setLoading(false);
        setReady(true);
        return;
      }

      console.log('[AuthContext] Session check result:', {
        hasSession: !!session,
        user: session?.user?.email,
        expiresAt: session?.expires_at,
        timestamp: new Date().toISOString()
      });

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
      setReady(true);
    }
  }

  /**
   * Load user profile, teams, and permissions from database.
   * Creates profile if it doesn't exist for Ganger domain users.
   * 
   * @private
   * @param {User} authUser - Authenticated user from Supabase
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
        // If profile doesn't exist and user is authenticated, create it
        if (profileError.code === 'PGRST116' && authUser.email?.endsWith('@gangerdermatology.com')) {
          console.log('Creating profile for new user:', authUser.email);
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.email,
              avatar_url: authUser.user_metadata?.avatar_url,
              role: authUser.email === 'anand@gangerdermatology.com' ? 'admin' : 'staff',
              department: 'Unknown',
              is_active: true
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating profile:', createError);
            return;
          }
          
          setProfile(newProfile);
          return;
        }
        return;
      }

      setProfile(profileData);

      // Load user teams - TEMPORARILY DISABLED
      // The team_members table doesn't exist with the expected structure
      // TODO: Fix when proper teams table is created
      /*
      const { data: teamsData, error: teamsError } = await supabase
        .from('team_members')
        .select(`
          role,
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
        .eq('user_id', authUser.id);

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
      */
      
      // For now, set empty teams
      setUserTeams([]);
      setActiveTeamState(null);
      setTeamRole(null);

      // Load app permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('app_permissions')
        .select('app_name, permission_level')
        .eq('user_id', authUser.id);

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
   * Sign in with Google OAuth.
   * Redirects to Google for authentication, then back to callback URL.
   * 
   * @param {string} [redirectTo] - Optional URL to redirect after sign in
   * @throws {Error} If sign in fails
   * 
   * @example
   * // Sign in and redirect to current page
   * await signIn();
   * 
   * @example
   * // Sign in and redirect to specific page
   * await signIn('/dashboard');
   */
  async function signIn(redirectTo?: string) {
    console.log('[Auth] 🔐 SIGN IN PROCESS STARTED', {
      timestamp: new Date().toISOString(),
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR',
      redirectTo
    });
    
    try {
      const redirectUrl = redirectTo || 
        (typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : undefined);
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supa.gangerdermatology.com';
      
      console.log('[Auth] 📋 Sign in configuration:', {
        redirectUrl,
        supabaseUrl,
        isCustomDomain: supabaseUrl.includes('gangerdermatology.com'),
        browserInfo: typeof window !== 'undefined' ? {
          userAgent: window.navigator.userAgent,
          cookiesEnabled: window.navigator.cookieEnabled,
          onLine: window.navigator.onLine
        } : 'SSR'
      });
      
      console.log('[Auth] 🚀 Calling Supabase signInWithOAuth...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
            hd: 'gangerdermatology.com', // Restrict to Ganger domain
          },
          // Skip browser redirect to handle it manually (helps with ad blockers)
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('[Auth] ❌ OAuth error:', {
          error,
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack
        });
        
        // Check if it's a network error
        if (error.message?.toLowerCase().includes('fetch')) {
          console.error('[Auth] 🌐 Network error detected. Debugging info:');
          console.error('- Supabase URL:', supabaseUrl);
          console.error('- Browser extensions may be blocking');
          console.error('- Check DevTools Network tab for failed requests');
          console.error('- Alternative URL: https://pfqtzmxxxhhsxmlddrta.supabase.co');
        }
        throw error;
      }
      
      console.log('[Auth] ✅ OAuth initiated successfully', {
        hasData: !!data,
        dataUrl: data?.url,
        timestamp: new Date().toISOString()
      });
      
      // Don't return data - the interface expects Promise<void>
      // The browser will redirect automatically
    } catch (error) {
      console.error('[Auth] 💥 Sign in failed with exception:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Sign out the current user.
   * Clears session, notifies other apps, and resets local state.
   * 
   * @throws {Error} If sign out fails
   * 
   * @example
   * await signOut();
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
   * Set the active team for the current user.
   * Updates team role and persists selection to localStorage.
   * 
   * @param {Team} team - Team to set as active
   * 
   * @example
   * const team = userTeams[0];
   * setActiveTeam(team);
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
   * Refresh user profile and permissions from database.
   * Useful after permission changes or profile updates.
   * 
   * @example
   * // After updating user permissions
   * await refreshProfile();
   */
  async function refreshProfile() {
    if (user) {
      await loadUserData(user);
    }
  }

  /**
   * Check if user has access to a specific app with required permission level.
   * Admins always have full access. Staff defaults to write access.
   * 
   * @param {string} appName - Name of the application
   * @param {AppPermission['permission_level']} [level='read'] - Required permission level
   * @returns {boolean} True if user has sufficient access
   * 
   * @example
   * if (hasAppAccess('inventory', 'write')) {
   *   // User can modify inventory
   * }
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
   * Check if user is a member of a specific team.
   * 
   * @param {string} teamId - ID of the team to check
   * @returns {boolean} True if user is a team member
   * 
   * @example
   * if (isTeamMember('team-123')) {
   *   // Show team-specific content
   * }
   */
  function isTeamMember(teamId: string): boolean {
    return userTeams.some(team => team.id === teamId);
  }

  /**
   * Check if user is a leader of a specific team.
   * 
   * @param {string} teamId - ID of the team to check
   * @returns {boolean} True if user is a team leader
   * 
   * @example
   * if (isTeamLeader('team-123')) {
   *   // Show team management controls
   * }
   */
  function isTeamLeader(teamId: string): boolean {
    const team = userTeams.find(t => t.id === teamId) as (Team & { userRole: TeamMember['role'] });
    return team?.userRole === 'leader';
  }

  /**
   * Check if user has admin role.
   * 
   * @returns {boolean} True if user is an admin
   * 
   * @example
   * if (isAdmin()) {
   *   // Show admin controls
   * }
   */
  function isAdmin(): boolean {
    return profile?.role === 'admin';
  }

  /**
   * Log an audit event for compliance and tracking.
   * Only logs if audit logging is enabled in config.
   * 
   * @param {string} action - Action being performed
   * @param {string} [resourceType] - Type of resource being acted upon
   * @param {string} [resourceId] - ID of the specific resource
   * @param {Record<string, any>} [details] - Additional event details
   * 
   * @example
   * // Log a simple action
   * await logAuditEvent('view_patient_list');
   * 
   * @example
   * // Log action on specific resource
   * await logAuditEvent('update_inventory', 'inventory_item', 'item-123', {
   *   old_quantity: 10,
   *   new_quantity: 15
   * });
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

  // Block render until ready to prevent hydration mismatch
  if (!ready) {
    return null; // Or a loading skeleton
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

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
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

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