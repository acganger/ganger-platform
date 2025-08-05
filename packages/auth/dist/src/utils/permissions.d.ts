export interface UserPermission {
    action: string;
    resource: string;
    conditions?: Record<string, any>;
}
export interface UserRole {
    name: string;
    permissions: string[];
    level: number;
}
export declare const ROLE_PERMISSIONS: Record<string, UserRole>;
/**
 * Check if user has a specific permission.
 * Supports role-based and explicit user permissions.
 *
 * @param {string} userRole - User's role (e.g., 'staff', 'admin')
 * @param {string} permission - Permission to check (e.g., 'read:patient_records')
 * @param {UserPermission[]} [userPermissions] - Optional explicit user permissions
 * @returns {boolean} True if user has the permission
 *
 * @example
 * // Check role-based permission
 * hasPermission('staff', 'read:inventory'); // true
 * hasPermission('patient', 'delete:appointments'); // false
 *
 * @example
 * // Check with explicit permissions
 * const customPerms = [{ action: 'manage:special_feature', resource: 'app' }];
 * hasPermission('staff', 'manage:special_feature', customPerms); // true
 */
export declare function hasPermission(userRole: string, permission: string, userPermissions?: UserPermission[]): boolean;
/**
 * Check if user has required role or higher in the role hierarchy.
 * Role levels: patient(1) < staff(2) < manager(3) < superadmin(4)
 *
 * @param {string} userRole - User's current role
 * @param {string} requiredRole - Required role to check against
 * @returns {boolean} True if user role level meets or exceeds required level
 *
 * @example
 * hasRole('manager', 'staff'); // true (manager > staff)
 * hasRole('staff', 'manager'); // false (staff < manager)
 * hasRole('superadmin', 'manager'); // true (superadmin > manager)
 */
export declare function hasRole(userRole: string, requiredRole: string): boolean;
/**
 * Check if user has access to a specific location.
 * Supports wildcard '*' for access to all locations.
 *
 * @param {string[]} userLocations - Array of locations user has access to
 * @param {string} requiredLocation - Location to check access for
 * @returns {boolean} True if user has access to the location
 *
 * @example
 * hasLocationAccess(['main-office', 'satellite-1'], 'main-office'); // true
 * hasLocationAccess(['*'], 'any-location'); // true (wildcard access)
 * hasLocationAccess(['main-office'], 'satellite-2'); // false
 */
export declare function hasLocationAccess(userLocations: string[], requiredLocation: string): boolean;
/**
 * Check if user can access a specific route based on role.
 * Routes have predefined role requirements.
 *
 * @param {string} userRole - User's role
 * @param {string} route - Route path to check (e.g., '/admin', '/staff')
 * @param {UserPermission[]} [userPermissions] - Optional explicit permissions
 * @returns {boolean} True if user can access the route
 *
 * @example
 * canAccessRoute('admin', '/admin'); // true
 * canAccessRoute('staff', '/admin'); // false
 * canAccessRoute('patient', '/patient'); // true
 * canAccessRoute('anyone', '/public'); // true (no restrictions)
 */
export declare function canAccessRoute(userRole: string, route: string, _userPermissions?: UserPermission[]): boolean;
/**
 * Middleware helper that creates a permission check function.
 * Throws an error if the user doesn't have the required permission.
 *
 * @param {string} permission - Required permission
 * @returns {Function} Middleware function that checks permission
 * @throws {Error} If user doesn't have required permission
 *
 * @example
 * // Create permission middleware
 * const requireInventoryWrite = requirePermission('update:inventory');
 *
 * // Use in route handler
 * function updateInventory(userRole, userPerms) {
 *   requireInventoryWrite(userRole, userPerms); // Throws if no permission
 *   // ... update logic
 * }
 */
export declare function requirePermission(permission: string): (userRole: string, userPermissions?: UserPermission[]) => void;
/**
 * Middleware helper that creates a role check function.
 * Throws an error if the user doesn't have the required role level.
 *
 * @param {string} requiredRole - Required role level
 * @returns {Function} Middleware function that checks role
 * @throws {Error} If user doesn't have required role level
 *
 * @example
 * // Create role middleware
 * const requireManager = requireRole('manager');
 *
 * // Use in route handler
 * function accessReports(userRole) {
 *   requireManager(userRole); // Throws if not manager or higher
 *   // ... show reports
 * }
 */
export declare function requireRole(requiredRole: string): (userRole: string) => void;
