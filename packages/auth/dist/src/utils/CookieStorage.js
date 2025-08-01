import { getCookie, setCookie, deleteCookie } from './cookies';
export class CookieStorage {
    constructor(options) {
        this.options = {
            path: '/',
            ...options
        };
    }
    getItem(key) {
        // Return null for server-side rendering
        if (typeof window === 'undefined') {
            return null;
        }
        try {
            const value = getCookie(key);
            // Supabase expects null, not empty string
            return value || null;
        }
        catch (error) {
            console.error(`Error getting cookie ${key}:`, error);
            return null;
        }
    }
    setItem(key, value) {
        // Skip for server-side rendering
        if (typeof window === 'undefined') {
            return;
        }
        try {
            setCookie(key, value, this.options);
        }
        catch (error) {
            console.error(`Error setting cookie ${key}:`, error);
        }
    }
    removeItem(key) {
        // Skip for server-side rendering
        if (typeof window === 'undefined') {
            return;
        }
        try {
            deleteCookie(key, {
                ...this.options,
                maxAge: 0
            });
        }
        catch (error) {
            console.error(`Error removing cookie ${key}:`, error);
        }
    }
}
/**
 * Pre-configured cookie storage for Ganger Platform
 * Uses .gangerdermatology.com domain for cross-subdomain access
 */
export const gangerCookieStorage = new CookieStorage({
    domain: '.gangerdermatology.com',
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 86400 // 24 hours
});
