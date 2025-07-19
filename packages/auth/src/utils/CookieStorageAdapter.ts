import { getCookie, setCookie, deleteCookie } from './cookies';

/**
 * Cookie-based storage adapter that matches Supabase v2 expectations
 * This adapter stores the entire session as a single JSON string in a cookie
 */
export class CookieStorageAdapter {
  private storageKey: string;
  private cookieOptions: {
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
    maxAge?: number;
  };

  constructor(options: {
    storageKey?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
    maxAge?: number;
  } = {}) {
    // Use the Supabase v2 storage key format
    this.storageKey = options.storageKey || 'sb-auth-token';
    this.cookieOptions = {
      domain: options.domain || '.gangerdermatology.com',
      secure: options.secure !== undefined ? options.secure : process.env.NODE_ENV === 'production',
      sameSite: options.sameSite || 'lax',
      path: options.path || '/',
      maxAge: options.maxAge || 60 * 60 * 24 * 7, // 7 days
    };
  }

  /**
   * Get item from storage - Supabase expects the full session JSON
   */
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      // For Supabase v2, the key format is different
      // It expects to find the session data under a specific key
      const value = getCookie(key);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[CookieStorageAdapter] Getting ${key}:`, value ? 'found' : 'not found');
      }
      
      return value || null;
    } catch (error) {
      console.error(`[CookieStorageAdapter] Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Set item in storage - stores the session JSON
   */
  async setItem(key: string, value: string): Promise<void> {
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
    } catch (error) {
      console.error(`[CookieStorageAdapter] Error setting ${key}:`, error);
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<void> {
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
    } catch (error) {
      console.error(`[CookieStorageAdapter] Error removing ${key}:`, error);
    }
  }
}

/**
 * Create a properly configured storage adapter for Ganger Platform
 */
export function createGangerCookieStorage() {
  // Get the Supabase URL to determine the storage key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supa.gangerdermatology.com';
  
  // For custom domains, we need to use a consistent storage key
  // This should match what Supabase's auth client expects
  let storageKey = 'sb-auth-token';
  
  // If it's a standard Supabase URL, extract the project ID
  if (supabaseUrl.includes('.supabase.co')) {
    const projectId = supabaseUrl.split('.')[0].split('://')[1];
    storageKey = `sb-${projectId}-auth-token`;
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