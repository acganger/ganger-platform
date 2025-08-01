"use strict";
// Permission and role utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = void 0;
exports.hasPermission = hasPermission;
exports.hasRole = hasRole;
exports.hasLocationAccess = hasLocationAccess;
exports.canAccessRoute = canAccessRoute;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
// Role hierarchy with permission levels
exports.ROLE_PERMISSIONS = {
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
// Check if user has specific permission
function hasPermission(userRole, permission, userPermissions) {
    // Superadmin has all permissions
    if (userRole === 'superadmin') {
        return true;
    }
    // Check role-based permissions
    const rolePerms = exports.ROLE_PERMISSIONS[userRole];
    if (rolePerms && rolePerms.permissions.includes(permission)) {
        return true;
    }
    // Check explicit user permissions
    if (userPermissions) {
        return userPermissions.some(perm => perm.action === permission || perm.action === '*');
    }
    return false;
}
// Check if user has required role or higher
function hasRole(userRole, requiredRole) {
    const userLevel = exports.ROLE_PERMISSIONS[userRole]?.level || 0;
    const requiredLevel = exports.ROLE_PERMISSIONS[requiredRole]?.level || 0;
    return userLevel >= requiredLevel;
}
// Check if user has access to specific location
function hasLocationAccess(userLocations, requiredLocation) {
    if (!userLocations || userLocations.length === 0) {
        return false;
    }
    return userLocations.includes(requiredLocation) || userLocations.includes('*');
}
// Check if user can access a specific route
function canAccessRoute(userRole, route, userPermissions) {
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
// Middleware helper to require specific permission
function requirePermission(permission) {
    return (userRole, userPermissions) => {
        if (!hasPermission(userRole, permission, userPermissions)) {
            throw new Error(`Permission '${permission}' required`);
        }
    };
}
// Middleware helper to require specific role
function requireRole(requiredRole) {
    return (userRole) => {
        if (!hasRole(userRole, requiredRole)) {
            throw new Error(`Role '${requiredRole}' or higher required`);
        }
    };
}
