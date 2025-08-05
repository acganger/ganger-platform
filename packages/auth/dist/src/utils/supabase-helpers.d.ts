/**
 * Supabase helper utilities
 */
/**
 * Extract project ID from Supabase URL
 * Handles both standard and custom domain URLs
 */
export declare function getSupabaseProjectId(url: string): string;
/**
 * Get cookie names for Supabase auth tokens
 */
export declare function getSupabaseCookieNames(supabaseUrl: string): {
    accessToken: string;
    refreshToken: string;
    providerToken: string;
};
/**
 * Get storage key for Supabase auth
 */
export declare function getSupabaseStorageKey(supabaseUrl: string): string;
