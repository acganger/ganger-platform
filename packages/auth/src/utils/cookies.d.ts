/**
 * Cookie utility functions for cross-domain session management
 */
interface CookieOptions {
    domain?: string;
    path?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    httpOnly?: boolean;
    maxAge?: number;
    expires?: Date;
}
/**
 * Set a cookie with the specified options.
 * Supports cross-domain cookies for Ganger Platform SSO.
 *
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {CookieOptions} [options={}] - Cookie configuration options
 * @param {string} [options.domain] - Domain for the cookie
 * @param {string} [options.path='/'] - Path for the cookie
 * @param {boolean} [options.secure=true] - HTTPS only flag
 * @param {'strict'|'lax'|'none'} [options.sameSite='lax'] - SameSite policy
 * @param {number} [options.maxAge] - Max age in seconds
 * @param {Date} [options.expires] - Expiry date
 *
 * @example
 * // Set session cookie
 * setCookie('session', 'abc123', {
 *   domain: '.gangerdermatology.com',
 *   secure: true,
 *   sameSite: 'lax',
 *   maxAge: 86400 // 24 hours
 * });
 */
export declare function setCookie(name: string, value: string, options?: CookieOptions): void;
/**
 * Get a cookie value by name.
 *
 * @param {string} name - Cookie name to retrieve
 * @returns {string | null} Cookie value or null if not found
 *
 * @example
 * const sessionId = getCookie('session');
 * if (!sessionId) {
 *   // No session cookie found
 * }
 */
export declare function getCookie(name: string): string | null;
/**
 * Delete a cookie by name.
 * Sets the cookie with an expired date to remove it.
 *
 * @param {string} name - Cookie name to delete
 * @param {CookieOptions} [options={}] - Cookie options (domain, path must match original)
 *
 * @example
 * // Delete session cookie
 * deleteCookie('session', {
 *   domain: '.gangerdermatology.com',
 *   path: '/'
 * });
 */
export declare function deleteCookie(name: string, options?: CookieOptions): void;
/**
 * Get all cookies as a key-value object.
 *
 * @returns {Record<string, string>} Object with cookie names as keys and values
 *
 * @example
 * const cookies = getAllCookies();
 * console.log(cookies);
 * // { session: 'abc123', theme: 'dark', lang: 'en' }
 */
export declare function getAllCookies(): Record<string, string>;
/**
 * Clear all cookies for a specific domain.
 * Attempts to delete cookies with various path combinations.
 *
 * @param {string} [domain] - Optional domain to clear cookies for
 *
 * @example
 * // Clear all cookies for current domain
 * clearAllCookies();
 *
 * @example
 * // Clear all cookies for Ganger domain
 * clearAllCookies('.gangerdermatology.com');
 */
export declare function clearAllCookies(domain?: string): void;
export {};
