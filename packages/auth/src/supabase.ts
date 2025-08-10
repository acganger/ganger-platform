// Universal Supabase Client for Ganger Platform Authentication

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AuthConfig } from './types';

// Default configuration
const defaultConfig: AuthConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supa.gangerdermatology.com',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_q-yj56RH8zrMVH-4cRazWA_PI2pBoeh',
  redirectUrl: 'https://staff.gangerdermatology.com/auth/callback',
  enableAuditLogging: true,
  sessionTimeout: 86400 // 24 hours
};

// Global Supabase client instance - using a symbol to ensure true singleton
const SUPABASE_INSTANCE_KEY = Symbol.for('ganger.auth.supabase.instance');

// Store instance globally to survive module reloads
if (typeof globalThis !== 'undefined' && !(SUPABASE_INSTANCE_KEY in globalThis)) {
  (globalThis as any)[SUPABASE_INSTANCE_KEY] = null;
}

/**
 * Get or create singleton Supabase client instance.
 * Creates a client with Ganger Platform specific configuration.
 * 
 * @param {Partial<AuthConfig>} [config] - Optional configuration overrides
 * @returns {SupabaseClient} Configured Supabase client instance
 * 
 * @example
 * // Get default client
 * const supabase = getSupabaseClient();
 * 
 * @example
 * // Get client with custom config
 * const supabase = getSupabaseClient({
 *   sessionTimeout: 3600,
 *   enableAuditLogging: false
 * });
 */
export function getSupabaseClient(config?: Partial<AuthConfig>): SupabaseClient {
  // Get instance from global store
  const globalStore = globalThis as any;
  let instance = globalStore[SUPABASE_INSTANCE_KEY];
  
  if (!instance) {
    const finalConfig = { ...defaultConfig, ...config };
    
    console.log('[Supabase] 🚀 Creating Supabase client with config:', {
      url: finalConfig.supabaseUrl,
      hasAnonKey: !!finalConfig.supabaseAnonKey,
      anonKeyPrefix: finalConfig.supabaseAnonKey.substring(0, 20) + '...',
      redirectUrl: finalConfig.redirectUrl,
      isClientSide: typeof window !== 'undefined',
      timestamp: new Date().toISOString()
    });
    
    instance = createClient(
      finalConfig.supabaseUrl,
      finalConfig.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storageKey: 'sb-supa-auth-token', // Match the key Supabase v2 uses for custom domains
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          debug: true, // Enable auth debug mode
        },
        global: {
          headers: {
            'X-Application': 'ganger-platform',
            'X-Version': '1.0.0',
            'x-client-info': 'staff-web'
          }
        }
      }
    );
    
    // Store in global
    globalStore[SUPABASE_INSTANCE_KEY] = instance;
    
    console.log('[Supabase] ✅ Supabase client created successfully');
  } else {
    console.log('[Supabase] ♻️ Reusing existing Supabase client instance');
  }
  
  return instance;
}

/**
 * Default Supabase client instance for general use.
 * Pre-configured with Ganger Platform settings.
 * 
 * @type {SupabaseClient}
 * 
 * @example
 * import { supabase } from '@ganger/auth';
 * 
 * // Query data
 * const { data, error } = await supabase
 *   .from('profiles')
 *   .select('*');
 */
export const supabase = getSupabaseClient();

/**
 * Create app-specific Supabase client with custom configuration.
 * Useful for apps that need different auth settings or redirect URLs.
 * 
 * @param {string} appName - Name of the application
 * @param {Partial<AuthConfig>} [config] - Optional configuration overrides
 * @returns {SupabaseClient} App-specific Supabase client
 * 
 * @example
 * // Create client for inventory app
 * const inventorySupabase = createAppSupabaseClient('inventory', {
 *   redirectUrl: 'https://inventory.gangerdermatology.com/auth/callback'
 * });
 * 
 * @example
 * // Create client with custom session timeout
 * const kioskSupabase = createAppSupabaseClient('kiosk', {
 *   sessionTimeout: 1800 // 30 minutes for kiosk
 * });
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
        flowType: 'pkce',
        storageKey: 'sb-supa-auth-token', // Match the key Supabase v2 uses for custom domains
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      global: {
        headers: {
          'X-Application': `ganger-platform-${appName}`,
          'X-Version': '1.0.0',
          'x-client-info': 'staff-web'
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
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: 'leader' | 'member' | 'viewer';
          seat?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: 'leader' | 'member' | 'viewer';
          seat?: string | null;
          joined_at?: string;
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
        };
        Insert: {
          id?: string;
          user_id: string;
          app_name: string;
          permission_level?: 'admin' | 'write' | 'read' | 'none';
          granted_by?: string | null;
          granted_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          app_name?: string;
          permission_level?: 'admin' | 'write' | 'read' | 'none';
          granted_by?: string | null;
          granted_at?: string;
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
 * Get type-safe Supabase client with full database type definitions.
 * Provides TypeScript autocomplete for all database operations.
 * 
 * @param {Partial<AuthConfig>} [config] - Optional configuration overrides
 * @returns {TypedSupabaseClient} Type-safe Supabase client
 * 
 * @example
 * // Get typed client for type-safe queries
 * const supabase = getTypedSupabaseClient();
 * 
 * // TypeScript knows the shape of profiles table
 * const { data } = await supabase
 *   .from('profiles')
 *   .select('id, email, role') // Autocomplete available
 *   .eq('role', 'admin'); // Type checking on values
 */
export function getTypedSupabaseClient(config?: Partial<AuthConfig>): TypedSupabaseClient {
  return getSupabaseClient(config) as TypedSupabaseClient;
}