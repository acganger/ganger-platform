import { SupabaseClient } from '@supabase/supabase-js';
import type { AuthConfig } from './types';
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
export declare function getSupabaseClient(config?: Partial<AuthConfig>): SupabaseClient;
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
export declare const supabase: SupabaseClient<any, "public", any>;
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
export declare function createAppSupabaseClient(appName: string, config?: Partial<AuthConfig>): SupabaseClient<any, "public", any>;
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
                    settings: any;
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
                    details: any;
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
                Args: {
                    user_uuid: string;
                    team_uuid: string;
                };
                Returns: boolean;
            };
            get_app_permission: {
                Args: {
                    user_uuid: string;
                    app_name_param: string;
                };
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
export declare function getTypedSupabaseClient(config?: Partial<AuthConfig>): TypedSupabaseClient;
