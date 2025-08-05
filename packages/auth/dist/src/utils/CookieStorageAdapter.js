import { getCookie, setCookie, deleteCookie } from './cookies';
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
export class CookieStorageAdapter {
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
    constructor(options = {}) {
        // Use the Supabase v2 storage key format
        this.cookieOptions = {
            domain: options.domain || '.gangerdermatology.com',
            secure: options.secure !== undefined ? options.secure : process.env.NODE_ENV === 'production',
            sameSite: options.sameSite || 'lax',
            path: options.path || '/',
            maxAge: options.maxAge || 60 * 60 * 24 * 7, // 7 days
        };
    }
    /**
     * Get item from storage - Supabase expects the full session JSON.
     * Includes fallback logic for project-specific keys.
     *
     * @param {string} key - Storage key to retrieve
     * @returns {Promise<string | null>} Session JSON string or null
     */
    async getItem(key) {
        if (typeof window === 'undefined') {
            return null;
        }
        try {
            // For Supabase v2, the key format is different
            // It expects to find the session data under a specific key
            let value = getCookie(key);
            // Fallback: If using custom domain, also check the project-specific key
            if (!value && key === 'sb-auth-token') {
                value = getCookie('sb-pfqtzmxxxhhsxmlddrta-auth-token');
                if (value && process.env.NODE_ENV === 'development') {
                    console.log(`[CookieStorageAdapter] Found session under project-specific key`);
                }
            }
            if (process.env.NODE_ENV === 'development') {
                console.log(`[CookieStorageAdapter] Getting ${key}:`, value ? 'found' : 'not found');
            }
            return value || null;
        }
        catch (error) {
            console.error(`[CookieStorageAdapter] Error getting ${key}:`, error);
            return null;
        }
    }
    /**
     * Set item in storage - stores the session JSON.
     * Also sets project-specific key for compatibility.
     *
     * @param {string} key - Storage key
     * @param {string} value - Session JSON string to store
     * @returns {Promise<void>}
     */
    async setItem(key, value) {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[CookieStorageAdapter] Setting ${key}`, {
                    valueLength: value.length,
                    options: this.cookieOptions
                });
            }
            setCookie(key, value, this.cookieOptions);
            // Also set the project-specific key for compatibility
            if (key === 'sb-auth-token') {
                setCookie('sb-pfqtzmxxxhhsxmlddrta-auth-token', value, this.cookieOptions);
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[CookieStorageAdapter] Also set project-specific key for compatibility`);
                }
            }
        }
        catch (error) {
            console.error(`[CookieStorageAdapter] Error setting ${key}:`, error);
        }
    }
    /**
     * Remove item from storage.
     * Also removes project-specific key for compatibility.
     *
     * @param {string} key - Storage key to remove
     * @returns {Promise<void>}
     */
    async removeItem(key) {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[CookieStorageAdapter] Removing ${key}`);
            }
            deleteCookie(key, {
                ...this.cookieOptions,
                maxAge: 0
            });
            // Also remove the project-specific key
            if (key === 'sb-auth-token') {
                deleteCookie('sb-pfqtzmxxxhhsxmlddrta-auth-token', {
                    ...this.cookieOptions,
                    maxAge: 0
                });
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[CookieStorageAdapter] Also removed project-specific key`);
                }
            }
        }
        catch (error) {
            console.error(`[CookieStorageAdapter] Error removing ${key}:`, error);
        }
    }
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
export function createGangerCookieStorage() {
    // Get the Supabase URL to determine the storage key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supa.gangerdermatology.com';
    // For custom domains, we need to use a consistent storage key
    // This should match what Supabase's auth client expects
    let storageKey = 'sb-auth-token';
    // If it's a standard Supabase URL, extract the project ID
    if (supabaseUrl.includes('.supabase.co')) {
        const urlParts = supabaseUrl.split('.');
        const protocolParts = urlParts[0]?.split('://');
        const projectId = protocolParts?.[1];
        if (projectId) {
            storageKey = `sb-${projectId}-auth-token`;
        }
    }
    return new CookieStorageAdapter({
        storageKey,
        domain: '.gangerdermatology.com',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
    });
}
