'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase client configuration
let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
}

// Create a proxy object that lazily initializes the client
const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseClient();
    return client[prop as keyof typeof client];
  }
});

// Real user interface
interface User {
  id: string
  email: string
  name: string
  picture?: string
  role: 'staff' | 'manager' | 'superadmin' | 'clinical_staff' | 'vinya_tech'
  permissions: string[]
  locations: string[]
}

// Auth context interface
interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => Promise<{ error?: string }>
  loginWithEmail: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  getSession: () => Promise<any>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({}),
  loginWithEmail: async () => ({}),
  logout: async () => {},
  getSession: async () => null
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          await setUserFromSession(session.user);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Session initialization error:', error);
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          await setUserFromSession(session.user);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const setUserFromSession = async (authUser: any) => {
    try {
      // Get user profile from database
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Create basic user object from auth data
        setUser({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email.split('@')[0],
          picture: authUser.user_metadata?.avatar_url,
          role: 'staff', // Default role
          permissions: [],
          locations: ['unknown']
        });
        return;
      }

      // Set full user profile
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: userProfile.name || authUser.user_metadata?.name || authUser.email.split('@')[0],
        picture: userProfile.avatar_url || authUser.user_metadata?.avatar_url,
        role: userProfile.role || 'staff',
        permissions: userProfile.permissions || [],
        locations: userProfile.locations || ['unknown']
      });

    } catch (error) {
      console.error('Error setting user from session:', error);
      // Fallback to basic user object
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email.split('@')[0],
        picture: authUser.user_metadata?.avatar_url,
        role: 'staff',
        permissions: [],
        locations: ['unknown']
      });
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            hd: 'gangerdermatology.com' // Restrict to Ganger domain
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithEmail,
    logout,
    getSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Export the supabase client for use in API routes
export { supabase }