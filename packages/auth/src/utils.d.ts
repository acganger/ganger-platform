import { UserProfile, AppPermission } from './types';
/**
 * Check if email belongs to Ganger Dermatology domain.
 * Used to validate staff email addresses.
 *
 * @param {string} email - Email address to check
 * @returns {boolean} True if email ends with @gangerdermatology.com
 *
 * @example
 * isGangerEmail('john@gangerdermatology.com'); // true
 * isGangerEmail('external@gmail.com'); // false
 */
export declare function isGangerEmail(email: string): boolean;
/**
 * Determine user role based on email address.
 * Admin role for specific email, staff for Ganger domain, viewer for others.
 *
 * @param {string} email - User's email address
 * @returns {'admin' | 'staff' | 'viewer'} User role based on email
 *
 * @example
 * getUserRoleFromEmail('anand@gangerdermatology.com'); // 'admin'
 * getUserRoleFromEmail('nurse@gangerdermatology.com'); // 'staff'
 * getUserRoleFromEmail('patient@gmail.com'); // 'viewer'
 */
export declare function getUserRoleFromEmail(email: string): UserProfile['role'];
/**
 * Format user display name from profile data.
 * Uses full name if available, otherwise formats email prefix.
 *
 * @param {UserProfile} profile - User profile object
 * @returns {string} Formatted display name
 *
 * @example
 * // With full name
 * formatUserDisplayName({ full_name: 'John Doe', email: 'john@example.com' });
 * // Returns: 'John Doe'
 *
 * @example
 * // Without full name
 * formatUserDisplayName({ email: 'john.doe@example.com' });
 * // Returns: 'John Doe'
 */
export declare function formatUserDisplayName(profile: UserProfile): string;
/**
 * Get user initials for avatar display.
 * Extracts first and last initials from name or email.
 *
 * @param {UserProfile} profile - User profile object
 * @returns {string} Two-character initials in uppercase
 *
 * @example
 * getUserInitials({ full_name: 'John Doe' }); // 'JD'
 * getUserInitials({ email: 'jane.smith@example.com' }); // 'JS'
 * getUserInitials({ email: 'admin@example.com' }); // 'AD'
 */
export declare function getUserInitials(profile: UserProfile): string;
/**
 * Check if user's permission level meets or exceeds required level.
 * Permission hierarchy: none < read < write < admin
 *
 * @param {AppPermission['permission_level']} userLevel - User's current permission level
 * @param {AppPermission['permission_level']} requiredLevel - Required permission level
 * @returns {boolean} True if user level is sufficient
 *
 * @example
 * hasPermissionLevel('write', 'read'); // true
 * hasPermissionLevel('read', 'write'); // false
 * hasPermissionLevel('admin', 'write'); // true
 */
export declare function hasPermissionLevel(userLevel: AppPermission['permission_level'], requiredLevel: AppPermission['permission_level']): boolean;
/**
 * Get human-readable display text for permission level.
 *
 * @param {AppPermission['permission_level']} level - Permission level
 * @returns {string} Display text for the permission level
 *
 * @example
 * getPermissionLevelText('admin'); // 'Administrator'
 * getPermissionLevelText('write'); // 'Full Access'
 * getPermissionLevelText('read'); // 'Read Only'
 */
export declare function getPermissionLevelText(level: AppPermission['permission_level']): string;
/**
 * Get human-readable display text for user role.
 *
 * @param {UserProfile['role']} role - User role
 * @returns {string} Display text for the role
 *
 * @example
 * getRoleDisplayText('admin'); // 'Administrator'
 * getRoleDisplayText('staff'); // 'Staff Member'
 * getRoleDisplayText('viewer'); // 'Viewer'
 */
export declare function getRoleDisplayText(role: UserProfile['role']): string;
/**
 * Get Tailwind CSS classes for role badge/chip display.
 *
 * @param {UserProfile['role']} role - User role
 * @returns {string} Tailwind CSS classes for role display
 *
 * @example
 * // In a React component
 * <span className={getRoleColor(user.role)}>
 *   {getRoleDisplayText(user.role)}
 * </span>
 */
export declare function getRoleColor(role: UserProfile['role']): string;
/**
 * Format timestamp into human-readable relative time.
 * Shows relative time for recent timestamps, date for older ones.
 *
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted time string
 *
 * @example
 * formatTimestamp('2024-01-01T12:00:00Z'); // '5 minutes ago'
 * formatTimestamp('2024-01-01T00:00:00Z'); // '12 hours ago'
 * formatTimestamp('2023-12-25T00:00:00Z'); // '12/25/2023'
 */
export declare function formatTimestamp(timestamp: string): string;
/**
 * Check if a session has expired based on expiry timestamp.
 *
 * @param {number} expiresAt - Session expiry timestamp in seconds
 * @returns {boolean} True if session has expired
 *
 * @example
 * const session = { expires_at: 1234567890 };
 * if (isSessionExpired(session.expires_at)) {
 *   // Refresh session
 * }
 */
export declare function isSessionExpired(expiresAt: number): boolean;
/**
 * Get timestamp for when to show session expiry warning.
 * Returns 15 minutes before actual expiry time.
 *
 * @param {number} expiresAt - Session expiry timestamp in seconds
 * @returns {number} Warning timestamp in seconds
 *
 * @example
 * const warningTime = getSessionWarningTime(session.expires_at);
 * if (Date.now() / 1000 > warningTime) {
 *   showExpiryWarning();
 * }
 */
export declare function getSessionWarningTime(expiresAt: number): number;
/**
 * Generate secure redirect URL with HTTPS enforcement in production.
 *
 * @param {string} baseUrl - Base URL for redirect
 * @param {string} [path] - Optional path to append
 * @returns {string} Secure redirect URL
 *
 * @example
 * generateSecureRedirectUrl('http://example.com', '/dashboard');
 * // In production: 'https://example.com/dashboard'
 * // In development: 'http://example.com/dashboard'
 */
export declare function generateSecureRedirectUrl(baseUrl: string, path?: string): string;
/**
 * Sanitize sensitive data for safe logging.
 * Replaces passwords, tokens, keys, and secrets with [REDACTED].
 *
 * @param {any} input - Data to sanitize
 * @returns {any} Sanitized data safe for logging
 *
 * @example
 * sanitizeForLog({ username: 'john', password: 'secret123' });
 * // Returns: { username: 'john', password: '[REDACTED]' }
 *
 * @example
 * sanitizeForLog('My password is secret123');
 * // Returns: 'My [REDACTED] is [REDACTED]'
 */
export declare function sanitizeForLog(input: any): any;
/**
 * Get user's browser and operating system information for audit logs.
 * Detects common browsers and operating systems from user agent.
 *
 * @returns {object} Browser information
 * @returns {string} returns.userAgent - Full user agent string
 * @returns {string} returns.browser - Detected browser name
 * @returns {string} returns.os - Detected operating system
 *
 * @example
 * const info = getBrowserInfo();
 * // {
 * //   userAgent: 'Mozilla/5.0...',
 * //   browser: 'Chrome',
 * //   os: 'Windows'
 * // }
 */
export declare function getBrowserInfo(): {
    userAgent: string;
    browser: string;
    os: string;
};
/**
 * Convert authentication errors into user-friendly messages.
 * Maps technical error messages to helpful user instructions.
 *
 * @param {any} error - Error object from authentication operation
 * @returns {string} User-friendly error message
 *
 * @example
 * try {
 *   await signIn(email, password);
 * } catch (error) {
 *   const message = getAuthErrorMessage(error);
 *   showToast(message); // 'Invalid email or password. Please try again.'
 * }
 */
export declare function getAuthErrorMessage(error: any): string;
/**
 * Constants for permission levels and roles
 */
export declare const PERMISSION_LEVELS: {
    NONE: "none";
    READ: "read";
    WRITE: "write";
    ADMIN: "admin";
};
export declare const USER_ROLES: {
    ADMIN: "admin";
    STAFF: "staff";
    VIEWER: "viewer";
};
export declare const TEAM_ROLES: {
    LEADER: "leader";
    MEMBER: "member";
    VIEWER: "viewer";
};
/**
 * Default application permissions by user role
 */
export declare const DEFAULT_APP_PERMISSIONS: Record<UserProfile['role'], AppPermission['permission_level']>;
