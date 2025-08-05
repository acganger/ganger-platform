// Permission and role utilities
// Role hierarchy with permission levels
export const ROLE_PERMISSIONS = {
    patient: {
        name: 'patient',
        permissions: ['read:own_records', 'update:own_profile'],
        level: 1
    },
    staff: {
        name: 'staff',
        permissions: [
            'read:patient_records',
            'create:appointments',
            'update:appointments',
            'read:inventory',
            'update:inventory'
        ],
        level: 2
    },
    manager: {
        name: 'manager',
        permissions: [
            'read:patient_records',
            'create:appointments',
            'update:appointments',
            'delete:appointments',
            'read:inventory',
            'update:inventory',
            'create:inventory',
            'read:staff_schedules',
            'update:staff_schedules',
            'read:reports'
        ],
        level: 3
    },
    superadmin: {
        name: 'superadmin',
        permissions: ['*'], // All permissions
        level: 4
    }
};
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
export function hasPermission(userRole, permission, userPermissions) {
    // Superadmin has all permissions
    if (userRole === 'superadmin') {
        return true;
    }
    // Check role-based permissions
    const rolePerms = ROLE_PERMISSIONS[userRole];
    if (rolePerms && rolePerms.permissions.includes(permission)) {
        return true;
    }
    // Check explicit user permissions
    if (userPermissions) {
        return userPermissions.some(perm => perm.action === permission || perm.action === '*');
    }
    return false;
}
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
export function hasRole(userRole, requiredRole) {
    const userLevel = ROLE_PERMISSIONS[userRole]?.level || 0;
    const requiredLevel = ROLE_PERMISSIONS[requiredRole]?.level || 0;
    return userLevel >= requiredLevel;
}
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
export function hasLocationAccess(userLocations, requiredLocation) {
    if (!userLocations || userLocations.length === 0) {
        return false;
    }
    return userLocations.includes(requiredLocation) || userLocations.includes('*');
}
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
export function canAccessRoute(userRole, route, _userPermissions) {
    // Define route permissions
    const routePermissions = {
        '/admin': ['superadmin'],
        '/manager': ['manager', 'superadmin'],
        '/staff': ['staff', 'manager', 'superadmin'],
        '/patient': ['patient', 'staff', 'manager', 'superadmin']
    };
    const allowedRoles = routePermissions[route];
    if (!allowedRoles) {
        return true; // Public route
    }
    return allowedRoles.includes(userRole);
}
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
export function requirePermission(permission) {
    return (userRole, userPermissions) => {
        if (!hasPermission(userRole, permission, userPermissions)) {
            throw new Error(`Permission '${permission}' required`);
        }
    };
}
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
export function requireRole(requiredRole) {
    return (userRole) => {
        if (!hasRole(userRole, requiredRole)) {
            throw new Error(`Role '${requiredRole}' or higher required`);
        }
    };
}
