/**
 * Cookie utility functions for cross-domain session management
 */

interface CookieOptions {
  domain?: string;
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
  maxAge?: number; // in seconds
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
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;

  const {
    domain,
    path = '/',
    secure = true,
    sameSite = 'lax',
    maxAge,
    expires
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (domain) {
    cookieString += `; Domain=${domain}`;
  }

  if (path) {
    cookieString += `; Path=${path}`;
  }

  if (secure && typeof window !== 'undefined' && window.location.protocol === 'https:') {
    cookieString += '; Secure';
  }

  if (sameSite) {
    cookieString += `; SameSite=${sameSite}`;
  }

  if (maxAge !== undefined) {
    cookieString += `; Max-Age=${maxAge}`;
  } else if (expires) {
    cookieString += `; Expires=${expires.toUTCString()}`;
  }

  // Note: httpOnly cannot be set from JavaScript
  document.cookie = cookieString;
}

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
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i]?.trim();
    if (cookie && cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

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
export function deleteCookie(name: string, options: CookieOptions = {}): void {
  // To delete a cookie, set it with an expired date
  setCookie(name, '', {
    ...options,
    maxAge: 0,
    expires: new Date(0)
  });
}

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
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};

  const cookies: Record<string, string> = {};
  const cookieArray = document.cookie.split(';');

  for (let i = 0; i < cookieArray.length; i++) {
    const cookie = cookieArray[i]?.trim();
    if (cookie) {
      const [name, value] = cookie.split('=');
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    }
  }

  return cookies;
}

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
export function clearAllCookies(domain?: string): void {
  const cookies = getAllCookies();
  
  Object.keys(cookies).forEach(name => {
    // Try deleting with different path combinations
    deleteCookie(name, { domain, path: '/' });
    deleteCookie(name, { domain, path: '' });
    deleteCookie(name, { path: '/' });
    deleteCookie(name, { path: '' });
    
    // Also try with the current path
    if (typeof window !== 'undefined') {
      deleteCookie(name, { domain, path: window.location.pathname });
    }
  });
}