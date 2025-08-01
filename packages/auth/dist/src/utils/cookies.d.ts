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
 * Set a cookie with the specified options
 */
export declare function setCookie(name: string, value: string, options?: CookieOptions): void;
/**
 * Get a cookie value by name
 */
export declare function getCookie(name: string): string | null;
/**
 * Delete a cookie by name
 */
export declare function deleteCookie(name: string, options?: CookieOptions): void;
/**
 * Get all cookies as an object
 */
export declare function getAllCookies(): Record<string, string>;
/**
 * Clear all cookies for a specific domain
 */
export declare function clearAllCookies(domain?: string): void;
export {};
