import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { User } from '@supabase/auth-helpers-nextjs';
import { supabase } from '@/lib/supabase/client';
import { AuthUser } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setAuthUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('staff_user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setAuthUser({
          id: data.id,
          email: data.email,
          name: data.full_name,
          role: data.role,
          department: data.department,
          location: data.location,
          avatar_url: data.avatar_url,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          hd: 'gangerdermatology.com', // Domain restriction
        },
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    
    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    } else {
      setAuthUser(null);
      router.push('/auth/login');
    }
  };

  const hasRole = (requiredRole: AuthUser['role']): boolean => {
    if (!authUser) return false;
    
    const roleHierarchy = {
      'staff': 1,
      'manager': 2,
      'admin': 3,
    };
    
    return roleHierarchy[authUser.role] >= roleHierarchy[requiredRole];
  };

  const canAccessTicket = (ticket: any): boolean => {
    if (!authUser) return false;
    
    // Admins can access all tickets
    if (authUser.role === 'admin') return true;
    
    // Managers can access tickets from their location
    if (authUser.role === 'manager') {
      return ticket.location === authUser.location;
    }
    
    // Staff can only access their own tickets
    return ticket.submitter.id === authUser.id;
  };

  return {
    user,
    authUser,
    loading,
    signInWithGoogle,
    signOut,
    hasRole,
    canAccessTicket,
    isAuthenticated: !!user,
  };
};