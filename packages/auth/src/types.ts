// Universal Authentication Types for Ganger Platform

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'staff' | 'viewer';
  department?: string;
  position?: string;
  location?: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id?: string;
  settings: TeamSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamSettings {
  meeting_day: string;
  meeting_time: string;
  timezone: string;
  meeting_duration: number;
  scorecard_frequency: 'weekly' | 'monthly';
  rock_quarters: string[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'leader' | 'member' | 'viewer';
  seat?: string;
  joined_at: string;
}

export interface AppPermission {
  id: string;
  user_id: string;
  app_name: string;
  permission_level: 'admin' | 'write' | 'read' | 'none';
  granted_by?: string;
  granted_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
  app_metadata: Record<string, any>;
  aud: string;
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

export interface AuthContextType {
  // Core auth state
  user: AuthUser | null;
  session: AuthSession | null;
  profile: UserProfile | null;
  loading: boolean;
  
  // Team management
  userTeams: Team[];
  activeTeam: Team | null;
  teamRole: TeamMember['role'] | null;
  
  // App permissions
  appPermissions: Record<string, AppPermission['permission_level']>;
  
  // Auth actions
  signIn: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setActiveTeam: (team: Team) => void;
  refreshProfile: () => Promise<void>;
  
  // Permission checks
  hasAppAccess: (appName: string, level?: AppPermission['permission_level']) => boolean;
  isTeamMember: (teamId: string) => boolean;
  isTeamLeader: (teamId: string) => boolean;
  isAdmin: () => boolean;
  
  // Audit logging
  logAuditEvent: (action: string, resourceType?: string, resourceId?: string, details?: Record<string, any>) => Promise<void>;
}

export interface AuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  redirectUrl?: string;
  enableAuditLogging?: boolean;
  sessionTimeout?: number; // in seconds
}

export interface AuditLogEvent {
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
}

export type AuthGuardLevel = 'public' | 'authenticated' | 'staff' | 'admin' | 'team-member' | 'team-leader';

export interface AuthGuardProps {
  level: AuthGuardLevel;
  appName?: string;
  teamId?: string;
  fallback?: React.ComponentType;
  children: React.ReactNode;
}

// Cross-app types
export type AppName = 'eos-l10' | 'handouts' | 'inventory' | 'checkin-kiosk' | 'medication-auth' | 'staff' | 'lunch' | 'pharma-scheduling';

export interface AppMenuItem {
  name: string;
  displayName: string;
  url: string;
  icon?: string;
  description?: string;
}