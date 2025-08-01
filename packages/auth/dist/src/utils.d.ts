import { UserProfile, AppPermission } from './types';
/**
 * Check if email belongs to Ganger Dermatology domain
 */
export declare function isGangerEmail(email: string): boolean;
/**
 * Determine user role based on email
 */
export declare function getUserRoleFromEmail(email: string): UserProfile['role'];
/**
 * Format user display name
 */
export declare function formatUserDisplayName(profile: UserProfile): string;
/**
 * Get user initials for avatar
 */
export declare function getUserInitials(profile: UserProfile): string;
/**
 * Check if permission level is sufficient
 */
export declare function hasPermissionLevel(userLevel: AppPermission['permission_level'], requiredLevel: AppPermission['permission_level']): boolean;
/**
 * Get permission level display text
 */
export declare function getPermissionLevelText(level: AppPermission['permission_level']): string;
/**
 * Get role display text
 */
export declare function getRoleDisplayText(role: UserProfile['role']): string;
/**
 * Get role color for UI display
 */
export declare function getRoleColor(role: UserProfile['role']): string;
/**
 * Format timestamp for display
 */
export declare function formatTimestamp(timestamp: string): string;
/**
 * Validate session expiry
 */
export declare function isSessionExpired(expiresAt: number): boolean;
/**
 * Get session expiry warning time (15 minutes before expiry)
 */
export declare function getSessionWarningTime(expiresAt: number): number;
/**
 * Generate secure redirect URL
 */
export declare function generateSecureRedirectUrl(baseUrl: string, path?: string): string;
/**
 * Sanitize user input for logging
 */
export declare function sanitizeForLog(input: any): any;
/**
 * Get user's browser and OS info for audit logs
 */
export declare function getBrowserInfo(): {
    userAgent: string;
    browser: string;
    os: string;
};
/**
 * Generate user-friendly error messages
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
