// Universal Supabase Client for Ganger Platform Authentication

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AuthConfig } from './types';
import { gangerCookieStorage } from './utils/CookieStorage';

// Default configuration
const defaultConfig: AuthConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supa.gangerdermatology.com',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_q-yj56RH8zrMVH-4cRazWA_PI2pBoeh',
  redirectUrl: 'https://staff.gangerdermatology.com/auth/callback',
  enableAuditLogging: true,
  sessionTimeout: 86400 // 24 hours
};

// Global Supabase client instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create Supabase client instance
 */
export function getSupabaseClient(config?: Partial<AuthConfig>): SupabaseClient {
  if (!supabaseInstance) {
    const finalConfig = { ...defaultConfig, ...config };
    
    supabaseInstance = createClient(
      finalConfig.supabaseUrl,
      finalConfig.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? gangerCookieStorage : undefined,
        },
        global: {
          headers: {
            'X-Application': 'ganger-platform',
            'X-Version': '1.0.0'
          }
        }
      }
    );
  }
  
  return supabaseInstance;
}

/**
 * Default Supabase client for general use
 */
export const supabase = getSupabaseClient();

/**
 * Create app-specific Supabase client with custom configuration
 */
export function createAppSupabaseClient(appName: string, config?: Partial<AuthConfig>) {
  const appConfig = {
    ...defaultConfig,
    ...config,
    redirectUrl: config?.redirectUrl || `https://staff.gangerdermatology.com/${appName}/auth/callback`
  };
  
  return createClient(
    appConfig.supabaseUrl,
    appConfig.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? gangerCookieStorage : undefined,
      },
      global: {
        headers: {
          'X-Application': `ganger-platform-${appName}`,
          'X-Version': '1.0.0'
        }
      }
    }
  );
}

/**
 * Database type definitions for type-safe queries
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'staff' | 'viewer';
          department: string | null;
          position: string | null;
          phone: string | null;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'staff' | 'viewer';
          department?: string | null;
          position?: string | null;
          phone?: string | null;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'staff' | 'viewer';
          department?: string | null;
          position?: string | null;
          phone?: string | null;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string | null;
          settings: any; // JSON
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id?: string | null;
          settings?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string | null;
          settings?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: 'leader' | 'member' | 'viewer';
          seat: string | null;
          joined_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: 'leader' | 'member' | 'viewer';
          seat?: string | null;
          joined_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: 'leader' | 'member' | 'viewer';
          seat?: string | null;
          joined_at?: string;
          is_active?: boolean;
        };
      };
      app_permissions: {
        Row: {
          id: string;
          user_id: string;
          app_name: string;
          permission_level: 'admin' | 'write' | 'read' | 'none';
          granted_by: string | null;
          granted_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          app_name: string;
          permission_level?: 'admin' | 'write' | 'read' | 'none';
          granted_by?: string | null;
          granted_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          app_name?: string;
          permission_level?: 'admin' | 'write' | 'read' | 'none';
          granted_by?: string | null;
          granted_at?: string;
          expires_at?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          details: any; // JSON
          ip_address: string | null;
          user_agent: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          details?: any;
          ip_address?: string | null;
          user_agent?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          details?: any;
          ip_address?: string | null;
          user_agent?: string | null;
          timestamp?: string;
        };
      };
    };
    Functions: {
      is_team_member: {
        Args: { user_uuid: string; team_uuid: string };
        Returns: boolean;
      };
      get_app_permission: {
        Args: { user_uuid: string; app_name_param: string };
        Returns: string;
      };
      log_audit_event: {
        Args: {
          action_param: string;
          resource_type_param?: string;
          resource_id_param?: string;
          details_param?: any;
        };
        Returns: string;
      };
    };
  };
}

// Type-safe Supabase client
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Get type-safe Supabase client
 */
export function getTypedSupabaseClient(config?: Partial<AuthConfig>): TypedSupabaseClient {
  return getSupabaseClient(config) as TypedSupabaseClient;
}