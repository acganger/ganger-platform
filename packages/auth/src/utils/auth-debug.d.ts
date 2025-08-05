/**
 * Authentication debugging utilities.
 * Only active in development or when explicitly enabled via localStorage.
 */
/**
 * Log authentication debug messages.
 * Only logs in development mode or when debug_auth is enabled in localStorage.
 *
 * @param {string} message - Debug message to log
 * @param {any} [data] - Optional data to log with the message
 *
 * @example
 * debugAuth('User signed in', { email: user.email });
 * debugAuth('Session expired');
 */
export declare function debugAuth(message: string, data?: any): void;
/**
 * Enable authentication debugging in the browser.
 * Sets a flag in localStorage to enable debug logging.
 *
 * @example
 * // In browser console
 * enableAuthDebugging();
 * // Now refresh the page to see auth debug logs
 */
export declare function enableAuthDebugging(): void;
/**
 * Disable authentication debugging in the browser.
 * Removes the debug flag from localStorage.
 *
 * @example
 * // In browser console
 * disableAuthDebugging();
 */
export declare function disableAuthDebugging(): void;
/**
 * Check current auth state and log comprehensive diagnostic information.
 * Inspects session, cookies, localStorage, and URL parameters.
 * Useful for troubleshooting authentication issues.
 *
 * @param {any} supabase - Supabase client instance
 * @returns {Promise<void>}
 *
 * @example
 * // Diagnose auth issues
 * import { supabase } from '@ganger/auth';
 * import { diagnoseAuth } from '@ganger/auth';
 *
 * await diagnoseAuth(supabase);
 * // Logs detailed auth state information to console
 */
export declare function diagnoseAuth(supabase: any): Promise<void>;
