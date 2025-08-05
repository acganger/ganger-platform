// Authentication Utilities for Ganger Platform

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
export function isGangerEmail(email: string): boolean {
  return email.endsWith('@gangerdermatology.com');
}

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
export function getUserRoleFromEmail(email: string): UserProfile['role'] {
  if (email === 'anand@gangerdermatology.com') {
    return 'admin';
  }
  
  if (isGangerEmail(email)) {
    return 'staff';
  }
  
  return 'viewer';
}

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
export function formatUserDisplayName(profile: UserProfile): string {
  if (profile.full_name) {
    return profile.full_name;
  }
  
  // Extract name from email
  const emailPart = profile.email.split('@')[0];
  if (!emailPart) return 'User';
  
  return emailPart
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

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
export function getUserInitials(profile: UserProfile): string {
  const displayName = formatUserDisplayName(profile);
  const names = displayName.split(' ');
  
  if (names.length >= 2) {
    const first = names[0]?.charAt(0) || '';
    const last = names[names.length - 1]?.charAt(0) || '';
    if (first && last) {
      return (first + last).toUpperCase();
    }
  }
  
  return displayName.substring(0, 2).toUpperCase();
}

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
export function hasPermissionLevel(
  userLevel: AppPermission['permission_level'],
  requiredLevel: AppPermission['permission_level']
): boolean {
  const levels = ['none', 'read', 'write', 'admin'];
  const userIndex = levels.indexOf(userLevel);
  const requiredIndex = levels.indexOf(requiredLevel);
  
  return userIndex >= requiredIndex;
}

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
export function getPermissionLevelText(level: AppPermission['permission_level']): string {
  switch (level) {
    case 'admin':
      return 'Administrator';
    case 'write':
      return 'Full Access';
    case 'read':
      return 'Read Only';
    case 'none':
      return 'No Access';
    default:
      return 'Unknown';
  }
}

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
export function getRoleDisplayText(role: UserProfile['role']): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'staff':
      return 'Staff Member';
    case 'viewer':
      return 'Viewer';
    default:
      return 'Unknown';
  }
}

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
export function getRoleColor(role: UserProfile['role']): string {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'staff':
      return 'bg-blue-100 text-blue-800';
    case 'viewer':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

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
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  if (diffInHours < 24 * 7) {
    const days = Math.floor(diffInHours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString();
}

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
export function isSessionExpired(expiresAt: number): boolean {
  return Date.now() / 1000 > expiresAt;
}

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
export function getSessionWarningTime(expiresAt: number): number {
  return expiresAt - (15 * 60); // 15 minutes before expiry
}

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
export function generateSecureRedirectUrl(baseUrl: string, path?: string): string {
  const url = new URL(baseUrl);
  
  // Ensure HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    url.protocol = 'https:';
  }
  
  if (path) {
    url.pathname = path;
  }
  
  return url.toString();
}

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
export function sanitizeForLog(input: any): any {
  if (typeof input === 'string') {
    // Remove potential sensitive information
    return input.replace(/password|token|key|secret/gi, '[REDACTED]');
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('secret')) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLog(value);
      }
    }
    return sanitized;
  }
  
  return input;
}

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
export function getBrowserInfo(): { userAgent: string; browser: string; os: string } {
  if (typeof window === 'undefined') {
    return { userAgent: '', browser: 'Server', os: 'Server' };
  }
  
  const userAgent = window.navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  // Detect OS
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('iOS')) os = 'iOS';
  else if (userAgent.includes('Android')) os = 'Android';
  
  return { userAgent, browser, os };
}

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
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred';
  
  const message = error.message || error.error_description || error.toString();
  
  // Common authentication error messages
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  
  if (message.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link.';
  }
  
  if (message.includes('Too many requests')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }
  
  if (message.includes('User not found')) {
    return 'No account found with this email address.';
  }
  
  if (message.includes('Invalid OAuth')) {
    return 'Authentication failed. Please try signing in again.';
  }
  
  // Default to original message for debugging
  return message;
}

/**
 * Constants for permission levels and roles
 */
export const PERMISSION_LEVELS = {
  NONE: 'none' as const,
  READ: 'read' as const,
  WRITE: 'write' as const,
  ADMIN: 'admin' as const
};

export const USER_ROLES = {
  ADMIN: 'admin' as const,
  STAFF: 'staff' as const,
  VIEWER: 'viewer' as const
};

export const TEAM_ROLES = {
  LEADER: 'leader' as const,
  MEMBER: 'member' as const,
  VIEWER: 'viewer' as const
};

/**
 * Default application permissions by user role
 */
export const DEFAULT_APP_PERMISSIONS: Record<UserProfile['role'], AppPermission['permission_level']> = {
  admin: 'admin',
  staff: 'write',
  viewer: 'read'
};