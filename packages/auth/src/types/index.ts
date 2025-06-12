export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: UserRole;
  permissions: Permission[];
  locations: string[];
  created_at: string;
  updated_at: string;
  active: boolean;
  mfaEnabled: boolean;
}

export type UserRole = 'staff' | 'clinical_staff' | 'manager' | 'superadmin' | 'pharma_rep' | 'patient' | 'vinya_tech';

export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

export interface AuthSession {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
}

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends LoginCredentials {
  name?: string;
  role?: UserRole;
}

export interface AuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  redirectTo?: string;
  autoRefreshToken?: boolean;
  persistSession?: boolean;
  detectSessionInUrl?: boolean;
}

export interface RolePermissions {
  [role: string]: {
    permissions: string[];
    inherits?: string[];
  };
}