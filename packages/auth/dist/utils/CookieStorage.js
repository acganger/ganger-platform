"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gangerCookieStorage = exports.CookieStorage = void 0;
const cookies_1 = require("./cookies");
class CookieStorage {
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
            const value = (0, cookies_1.getCookie)(key);
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
            (0, cookies_1.setCookie)(key, value, this.options);
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
            (0, cookies_1.deleteCookie)(key, {
                ...this.options,
                maxAge: 0
            });
        }
        catch (error) {
            console.error(`Error removing cookie ${key}:`, error);
        }
    }
}
exports.CookieStorage = CookieStorage;
/**
 * Pre-configured cookie storage for Ganger Platform
 * Uses .gangerdermatology.com domain for cross-subdomain access
 */
exports.gangerCookieStorage = new CookieStorage({
    domain: '.gangerdermatology.com',
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 86400 // 24 hours
});
