'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Team, TeamMember } from '@/types/eos';

interface EOSAuthContextType {
  user: User | null;
  session: Session | null;
  userTeams: Team[];
  activeTeam: Team | null;
  userRole: TeamMember['role'] | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setActiveTeam: (team: Team) => void;
  refreshUserTeams: () => Promise<void>;
}

const EOSAuthContext = createContext<EOSAuthContextType | undefined>(undefined);

export function EOSAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [userRole, setUserRole] = useState<TeamMember['role'] | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if we're in demo mode for user testing
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // Get initial session
  useEffect(() => {
    const getSession = async () => {
      if (isDemoMode) {
        // Demo mode: Create mock user and team data for testing
        const mockUser = {
          id: 'demo-user-123',
          email: 'demo@gangerdermatology.com',
          user_metadata: {
            full_name: 'Demo User',
            avatar_url: null
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as User;
        
        const mockTeam: Team = {
          id: 'demo-team-123',
          name: 'Ganger Dermatology Demo Team',
          description: 'Demo team for testing L10 functionality',
          owner_id: 'demo-user-123',
          settings: {
            meeting_day: 'monday',
            meeting_time: '09:00',
            timezone: 'America/New_York',
            meeting_duration: 90,
            scorecard_frequency: 'weekly',
            rock_quarters: ['Q2 2025', 'Q3 2025']
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        setUser(mockUser);
        setSession({ user: mockUser } as Session);
        setUserTeams([mockTeam]);
        setActiveTeam(mockTeam);
        setUserRole('leader');
        setLoading(false);
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await refreshUserTeams();
        } else if (event === 'SIGNED_OUT') {
          setUserTeams([]);
          setActiveTeam(null);
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load user teams when user changes
  useEffect(() => {
    if (user) {
      refreshUserTeams();
    } else {
      setUserTeams([]);
      setActiveTeam(null);
      setUserRole(null);
    }
  }, [user]);


  // Update user role when active team changes
  useEffect(() => {
    if (activeTeam && user) {
      const getUserRole = async () => {
        const { data: member } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', activeTeam.id as any)
          .eq('user_id', user.id as any)
          .single();
        
        setUserRole((member as any)?.role || null);
      };
      
      getUserRole();
    }
  }, [activeTeam, user]);

  const refreshUserTeams = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: memberships } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          teams (*)
        `)
        .eq('user_id', user.id as any)
        .eq('active', true as any);

      const teams = memberships?.map((m: any) => m.teams).filter(Boolean) || [];
      setUserTeams(teams as Team[]);

      // Set active team from localStorage or first team
      const savedTeamId = localStorage.getItem('eos-active-team');
      if (savedTeamId) {
        const savedTeam = teams.find(t => t.id === savedTeamId);
        if (savedTeam) {
          setActiveTeam(savedTeam);
          return;
        }
      }

      // Default to first team
      if (teams.length > 0) {
        setActiveTeam(teams[0]);
      }
    } catch (error) {
      console.error('Error loading user teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          hd: 'gangerdermatology.com' // Restrict to Ganger Dermatology domain
        }
      }
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    
    // Clear local storage
    localStorage.removeItem('eos-active-team');
    localStorage.removeItem('eos-offline-data');
  };

  const handleSetActiveTeam = (team: Team) => {
    setActiveTeam(team);
    localStorage.setItem('eos-active-team', team.id);
  };

  const value = {
    user,
    session,
    userTeams,
    activeTeam,
    userRole,
    loading,
    signIn,
    signOut,
    setActiveTeam: handleSetActiveTeam,
    refreshUserTeams
  };

  return (
    <EOSAuthContext.Provider value={value}>
      {children}
    </EOSAuthContext.Provider>
  );
}

export function useEOSAuth() {
  const context = useContext(EOSAuthContext);
  if (context === undefined) {
    throw new Error('useEOSAuth must be used within an EOSAuthProvider');
  }
  return context;
}

// Main auth hook that combines everything
export function useAuth() {
  return useEOSAuth();
}

// Main AuthProvider
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <EOSAuthProvider>
      {children}
    </EOSAuthProvider>
  );
}

// Auth guard component
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eos-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">EOS L10 Platform</h1>
            <p className="mt-2 text-gray-600">
              Sign in with your Ganger Dermatology account
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => useAuth().signIn()}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-eos-600 hover:bg-eos-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eos-500"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Team guard component
export function TeamGuard({ children }: { children: ReactNode }) {
  const { userTeams, activeTeam, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eos-600"></div>
      </div>
    );
  }

  if (userTeams.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">No Teams Found</h1>
          <p className="text-gray-600">
            You're not a member of any EOS teams yet. Contact your team leader to get added.
          </p>
        </div>
      </div>
    );
  }

  if (!activeTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eos-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}