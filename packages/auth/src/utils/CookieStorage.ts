import { getCookie, setCookie, deleteCookie } from './cookies';

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

export class CookieStorage implements StorageAdapter {
  private options: CookieOptions;

  constructor(options: CookieOptions) {
    this.options = {
      path: '/',
      ...options
    };
  }

  getItem(key: string): string | null {
    // Return null for server-side rendering
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const value = getCookie(key);
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Cookie Storage] Getting ${key}:`, value ? 'found' : 'not found');
      }
      // Supabase expects null, not empty string
      return value || null;
    } catch (error) {
      console.error(`Error getting cookie ${key}:`, error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    // Skip for server-side rendering
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Cookie Storage] Setting ${key} with options:`, this.options);
      }
      setCookie(key, value, this.options);
    } catch (error) {
      console.error(`Error setting cookie ${key}:`, error);
    }
  }

  removeItem(key: string): void {
    // Skip for server-side rendering
    if (typeof window === 'undefined') {
      return;
    }

    try {
      deleteCookie(key, { 
        ...this.options, 
        maxAge: 0 
      });
    } catch (error) {
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
  secure: process.env.NODE_ENV === 'production', // Only secure in production
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7 days to match JWT expiry in Supabase
});