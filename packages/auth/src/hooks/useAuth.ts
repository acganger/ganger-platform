import { useEffect, useState, useCallback } from 'react';
import { createSupabaseBrowserClient } from '../utils/supabase';
import { hasPermission, hasRole, hasLocationAccess } from '../utils/permissions';
import type { User, AuthSession, AuthError, LoginCredentials, SignUpData, UserRole } from '../types';

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const supabase = createSupabaseBrowserClient();

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
          await loadUserProfile(session.user.id);
          setSession({
            user: user,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || null,
          });
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
        if (event === 'SIGNED_IN' && session) {
          await loadUserProfile(session.user.id);
          setSession({
            user: user,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || null,
          });
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
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
        return;
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

        setUser(userProfile);
      }
    } catch (err) {
      console.error('Error in loadUserProfile:', err);
      setError({ message: 'Failed to load user profile' });
    }
  };

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        setError({ message: error.message, code: error.name });
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      const error = { message: 'Sign in failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (signUpData: SignUpData) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            name: signUpData.name,
            role: signUpData.role || 'staff',
          },
        },
      });

      if (error) {
        setError({ message: error.message, code: error.name });
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      const error = { message: 'Sign up failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            hd: 'gangerdermatology.com', // Restrict to domain
          },
        },
      });

      if (error) {
        setError({ message: error.message, code: error.name });
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      const error = { message: 'Google sign in failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError({ message: error.message, code: error.name });
        return { success: false, error };
      }

      setSession(null);
      setUser(null);
      return { success: true };
    } catch (err) {
      const error = { message: 'Sign out failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError({ message: error.message, code: error.name });
        return { success: false, error };
      }

      return { success: true };
    } catch (err) {
      const error = { message: 'Password reset failed' };
      setError(error);
      return { success: false, error };
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError({ message: error.message, code: error.name });
        return { success: false, error };
      }

      return { success: true };
    } catch (err) {
      const error = { message: 'Password update failed' };
      setError(error);
      return { success: false, error };
    }
  }, []);

  // Permission helpers
  const checkPermission = useCallback((permission: string, resource?: string) => {
    return hasPermission(user, permission, resource);
  }, [user]);

  const checkRole = useCallback((roles: UserRole | UserRole[]) => {
    return hasRole(user, roles);
  }, [user]);

  const checkLocationAccess = useCallback((locationId: string) => {
    return hasLocationAccess(user, locationId);
  }, [user]);

  return {
    // State
    user,
    session,
    loading,
    isLoading: loading, // Alias for compatibility
    error,
    isAuthenticated: !!session,

    // Actions
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updatePassword,

    // Permission helpers
    hasPermission: checkPermission,
    hasRole: checkRole,
    hasLocationAccess: checkLocationAccess,
  };
}