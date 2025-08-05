/**
 * Cookie-based storage adapter that matches Supabase v2 expectations.
 * This adapter stores the entire session as a single JSON string in a cookie.
 * Handles both custom domain and standard Supabase project storage keys.
 *
 * @class CookieStorageAdapter
 *
 * @example
 * // Create adapter with custom options
 * const adapter = new CookieStorageAdapter({
 *   domain: '.myapp.com',
 *   secure: true,
 *   maxAge: 3600 // 1 hour
 * });
 */
export declare class CookieStorageAdapter {
    private cookieOptions;
    /**
     * Creates a new CookieStorageAdapter instance.
     *
     * @param {object} options - Configuration options
     * @param {string} [options.storageKey='sb-auth-token'] - Storage key for the session
     * @param {string} [options.domain='.gangerdermatology.com'] - Cookie domain
     * @param {boolean} [options.secure] - HTTPS only (defaults to true in production)
     * @param {'strict'|'lax'|'none'} [options.sameSite='lax'] - SameSite policy
     * @param {string} [options.path='/'] - Cookie path
     * @param {number} [options.maxAge=604800] - Max age in seconds (default 7 days)
     */
    constructor(options?: {
        storageKey?: string;
        domain?: string;
        secure?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
        path?: string;
        maxAge?: number;
    });
    /**
     * Get item from storage - Supabase expects the full session JSON.
     * Includes fallback logic for project-specific keys.
     *
     * @param {string} key - Storage key to retrieve
     * @returns {Promise<string | null>} Session JSON string or null
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Set item in storage - stores the session JSON.
     * Also sets project-specific key for compatibility.
     *
     * @param {string} key - Storage key
     * @param {string} value - Session JSON string to store
     * @returns {Promise<void>}
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Remove item from storage.
     * Also removes project-specific key for compatibility.
     *
     * @param {string} key - Storage key to remove
     * @returns {Promise<void>}
     */
    removeItem(key: string): Promise<void>;
}
/**
 * Create a properly configured storage adapter for Ganger Platform.
 * Automatically detects custom domain vs standard Supabase URLs.
 *
 * @returns {CookieStorageAdapter} Configured storage adapter
 *
 * @example
 * // Use with Supabase client
 * const supabase = createClient(url, key, {
 *   auth: {
 *     storage: createGangerCookieStorage()
 *   }
 * });
 */
export declare function createGangerCookieStorage(): CookieStorageAdapter;
