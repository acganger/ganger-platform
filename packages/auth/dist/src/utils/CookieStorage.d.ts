/**
 * Cookie-based storage adapter for Supabase Auth
 * Enables cross-domain session sharing across *.gangerdermatology.com
 */
interface StorageAdapter {
    getItem(key: string): string | null | Promise<string | null>;
    setItem(key: string, value: string): void | Promise<void>;
    removeItem(key: string): void | Promise<void>;
}
interface CookieOptions {
    domain: string;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path?: string;
    maxAge?: number;
}
/**
 * Cookie-based storage adapter that implements the StorageAdapter interface.
 * Enables cross-domain session sharing for Supabase Auth across subdomains.
 *
 * @class CookieStorage
 * @implements {StorageAdapter}
 *
 * @example
 * // Create storage for cross-domain auth
 * const storage = new CookieStorage({
 *   domain: '.gangerdermatology.com',
 *   secure: true,
 *   sameSite: 'lax',
 *   maxAge: 86400 // 24 hours
 * });
 */
export declare class CookieStorage implements StorageAdapter {
    private options;
    /**
     * Creates a new CookieStorage instance.
     *
     * @param {CookieOptions} options - Cookie configuration options
     * @param {string} options.domain - Domain for cookies (use leading . for subdomains)
     * @param {boolean} options.secure - Whether cookies require HTTPS
     * @param {'strict'|'lax'|'none'} options.sameSite - SameSite cookie attribute
     * @param {string} [options.path='/'] - Cookie path
     * @param {number} [options.maxAge] - Cookie max age in seconds
     */
    constructor(options: CookieOptions);
    /**
     * Retrieve a value from cookie storage.
     *
     * @param {string} key - Cookie name to retrieve
     * @returns {string | null} Cookie value or null if not found
     */
    getItem(key: string): string | null;
    /**
     * Store a value in cookie storage.
     *
     * @param {string} key - Cookie name
     * @param {string} value - Value to store
     */
    setItem(key: string, value: string): void;
    /**
     * Remove a value from cookie storage.
     *
     * @param {string} key - Cookie name to remove
     */
    removeItem(key: string): void;
}
/**
 * Pre-configured cookie storage instance for Ganger Platform.
 * Uses .gangerdermatology.com domain for cross-subdomain access.
 * Configured with 7-day expiry to match Supabase JWT tokens.
 *
 * @type {CookieStorage}
 *
 * @example
 * import { gangerCookieStorage } from '@ganger/auth';
 *
 * // Use with Supabase client
 * const supabase = createClient(url, key, {
 *   auth: {
 *     storage: gangerCookieStorage
 *   }
 * });
 */
export declare const gangerCookieStorage: CookieStorage;
export {};
