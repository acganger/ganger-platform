import { getCookie, setCookie, deleteCookie, getAllCookies } from './cookies';

/**
 * Cookie-based storage adapter that matches Supabase v2 expectations.
 * This adapter stores the entire session as a single JSON string in a cookie.
 * Handles both custom domain and standard Supabase project storage keys.
 * 
 * IMPORTANT: Supabase v2 uses the following storage keys:
 * - For custom domains: Uses the key as-is (e.g., 'sb-auth-token')
 * - For standard domains: Adds project ID (e.g., 'sb-{projectId}-auth-token')
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
  private cookieOptions: {
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
    maxAge?: number;
  };

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
  constructor(options: {
    storageKey?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
    maxAge?: number;
  } = {}) {
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
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      // Debug: log all cookies to understand what's available
      if (process.env.NODE_ENV === 'development') {
        const allCookies = getAllCookies();
        const authCookies = Object.keys(allCookies).filter(k => k.includes('sb-') || k.includes('auth'));
        console.log(`[CookieStorageAdapter] Available auth-related cookies:`, authCookies);
      }
      
      // Try to get the value directly
      let value = getCookie(key);
      
      // Supabase v2 with custom domains might store under different keys
      // Try multiple fallback patterns
      if (!value) {
        const fallbackKeys = [
          'sb-pfqtzmxxxhhsxmlddrta-auth-token', // Our project ID
          'sb-auth-token',
          'supabase-auth-token',
          `${key}-session` // Sometimes adds -session suffix
        ];
        
        for (const fallbackKey of fallbackKeys) {
          value = getCookie(fallbackKey);
          if (value) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[CookieStorageAdapter] Found session under fallback key: ${fallbackKey}`);
            }
            break;
          }
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[CookieStorageAdapter] Getting ${key}:`, value ? `found (${value.length} chars)` : 'not found');
      }
      
      return value || null;
    } catch (error) {
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
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[CookieStorageAdapter] Setting ${key}`, {
          valueLength: value.length,
          valuePreview: value.substring(0, 100) + '...',
          options: this.cookieOptions
        });
      }

      // Set the primary key
      setCookie(key, value, this.cookieOptions);
      
      // For custom domains, we need to set multiple keys for compatibility
      const additionalKeys = [];
      
      // If this looks like a generic key, also set project-specific version
      if (key === 'sb-auth-token' || key === 'supabase-auth-token') {
        additionalKeys.push('sb-pfqtzmxxxhhsxmlddrta-auth-token');
      }
      
      // If this is project-specific, also set generic version
      if (key.includes('pfqtzmxxxhhsxmlddrta')) {
        additionalKeys.push('sb-auth-token');
      }
      
      // Set all additional keys
      for (const additionalKey of additionalKeys) {
        setCookie(additionalKey, value, this.cookieOptions);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[CookieStorageAdapter] Also set ${additionalKey} for compatibility`);
        }
      }
    } catch (error) {
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
    } catch (error) {
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
  // Supabase v2 expects the storage adapter to handle the key internally
  let storageKey = 'sb-auth-token';
  
  // If it's a standard Supabase URL, extract the project ID
  if (supabaseUrl.includes('.supabase.co')) {
    const urlParts = supabaseUrl.split('.');
    const protocolParts = urlParts[0]?.split('://');
    const projectId = protocolParts?.[1];
    if (projectId) {
      storageKey = `sb-${projectId}-auth-token`;
    }
  } else {
    // For custom domains, log which key we're using
    if (process.env.NODE_ENV === 'development') {
      console.log('[CookieStorageAdapter] Using custom domain configuration:', {
        url: supabaseUrl,
        storageKey: storageKey,
        projectKey: 'sb-pfqtzmxxxhhsxmlddrta-auth-token'
      });
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