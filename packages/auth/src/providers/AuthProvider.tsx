import React, { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../utils/supabase';
import { hasPermission, hasRole, hasLocationAccess } from '../utils/permissions';
import type { User, AuthSession, AuthError, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refetchUser: () => Promise<void>;
  hasPermission: (permission: string, resource?: string) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasLocationAccess: (locationId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const supabase = createSupabaseBrowserClient();

  const loadUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_permissions (
            permission,
            resource,
            conditions
          )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        setError({ message: 'Failed to load user profile' });
        return null;
      }

      if (data) {
        const userProfile: User = {
          id: data.id,
          email: data.email,
          name: data.name,
          avatar_url: data.avatar_url,
          role: data.role as UserRole,
          permissions: data.user_permissions || [],
          locations: data.locations || [],
          created_at: data.created_at,
          updated_at: data.updated_at,
          active: data.is_active || true,
          mfaEnabled: data.mfa_enabled || false,
        };

        return userProfile;
      }
    } catch (err) {
      console.error('Error in loadUserProfile:', err);
      setError({ message: 'Failed to load user profile' });
    }

    return null;
  };

  const refetchUser = async () => {
    if (session?.user?.id) {
      const userProfile = await loadUserProfile(session.user.id);
      setUser(userProfile);
    }
  };

  // Load initial session
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError({ message: error.message, code: error.name });
        } else if (session && mounted) {
          const userProfile = await loadUserProfile(session.user.id);
          
          if (userProfile) {
            setUser(userProfile);
            setSession({
              user: userProfile,
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at || null,
            });
          }
        }
      } catch (err) {
        console.error('Error in getInitialSession:', err);
        setError({ message: 'Failed to load session' });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    getInitialSession();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        setLoading(true);
        
        if (event === 'SIGNED_IN' && session) {
          const userProfile = await loadUserProfile(session.user.id);
          
          if (userProfile) {
            setUser(userProfile);
            setSession({
              user: userProfile,
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at || null,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setSession(prev => prev ? {
            ...prev,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || null,
          } : null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        setError({ message: error.message, code: error.name });
      }
    } catch (err) {
      console.error('Sign out error:', err);
      setError({ message: 'Failed to sign out' });
    }
  };

  // Permission helpers
  const checkPermission = (permission: string, resource?: string) => {
    return hasPermission(user, permission, resource);
  };

  const checkRole = (roles: UserRole | UserRole[]) => {
    return hasRole(user, roles);
  };

  const checkLocationAccess = (locationId: string) => {
    return hasLocationAccess(user, locationId);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!session,
    signOut,
    refetchUser,
    hasPermission: checkPermission,
    hasRole: checkRole,
    hasLocationAccess: checkLocationAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}