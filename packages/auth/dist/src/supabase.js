// Universal Supabase Client for Ganger Platform Authentication
import { createClient } from '@supabase/supabase-js';
import { createGangerCookieStorage } from './utils/CookieStorageAdapter';
// Default configuration
const defaultConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supa.gangerdermatology.com',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_q-yj56RH8zrMVH-4cRazWA_PI2pBoeh',
    redirectUrl: 'https://staff.gangerdermatology.com/auth/callback',
    enableAuditLogging: true,
    sessionTimeout: 86400 // 24 hours
};
// Global Supabase client instance
let supabaseInstance = null;
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
export function getSupabaseClient(config) {
    if (!supabaseInstance) {
        const finalConfig = { ...defaultConfig, ...config };
        console.log('[Supabase] 🚀 Creating Supabase client with config:', {
            url: finalConfig.supabaseUrl,
            hasAnonKey: !!finalConfig.supabaseAnonKey,
            anonKeyPrefix: finalConfig.supabaseAnonKey.substring(0, 20) + '...',
            redirectUrl: finalConfig.redirectUrl,
            isClientSide: typeof window !== 'undefined',
            timestamp: new Date().toISOString()
        });
        supabaseInstance = createClient(finalConfig.supabaseUrl, finalConfig.supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: typeof window !== 'undefined' ? createGangerCookieStorage() : undefined,
                debug: true, // Enable auth debug mode
            },
            global: {
                headers: {
                    'X-Application': 'ganger-platform',
                    'X-Version': '1.0.0'
                }
            }
        });
        console.log('[Supabase] ✅ Supabase client created successfully');
    }
    return supabaseInstance;
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
export function createAppSupabaseClient(appName, config) {
    const appConfig = {
        ...defaultConfig,
        ...config,
        redirectUrl: config?.redirectUrl || `https://staff.gangerdermatology.com/${appName}/auth/callback`
    };
    return createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: typeof window !== 'undefined' ? createGangerCookieStorage() : undefined,
        },
        global: {
            headers: {
                'X-Application': `ganger-platform-${appName}`,
                'X-Version': '1.0.0'
            }
        }
    });
}
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
export function getTypedSupabaseClient(config) {
    return getSupabaseClient(config);
}
