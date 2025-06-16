// Authentication Utilities for Ganger Platform

import { UserProfile, AppPermission } from './types';

/**
 * Check if email belongs to Ganger Dermatology domain
 */
export function isGangerEmail(email: string): boolean {
  return email.endsWith('@gangerdermatology.com');
}

/**
 * Determine user role based on email
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
 * Format user display name
 */
export function formatUserDisplayName(profile: UserProfile): string {
  if (profile.full_name) {
    return profile.full_name;
  }
  
  // Extract name from email
  const emailPart = profile.email.split('@')[0];
  return emailPart
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(profile: UserProfile): string {
  const displayName = formatUserDisplayName(profile);
  const names = displayName.split(' ');
  
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  
  return displayName.substring(0, 2).toUpperCase();
}

/**
 * Check if permission level is sufficient
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
 * Get permission level display text
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
 * Get role display text
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
 * Get role color for UI display
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
 * Format timestamp for display
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
 * Validate session expiry
 */
export function isSessionExpired(expiresAt: number): boolean {
  return Date.now() / 1000 > expiresAt;
}

/**
 * Get session expiry warning time (15 minutes before expiry)
 */
export function getSessionWarningTime(expiresAt: number): number {
  return expiresAt - (15 * 60); // 15 minutes before expiry
}

/**
 * Generate secure redirect URL
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
 * Sanitize user input for logging
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
 * Get user's browser and OS info for audit logs
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
 * Generate user-friendly error messages
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