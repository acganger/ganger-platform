import type { User, Permission, UserRole } from '../types';

// Role-based permission definitions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  superadmin: [
    'users:*',
    'applications:*',
    'system:*',
    'audit:*',
    'locations:*',
  ],
  manager: [
    'users:read',
    'users:update',
    'staff:*',
    'schedules:*',
    'reports:*',
    'locations:read',
    'approvals:*',
  ],
  staff: [
    'profile:read',
    'profile:update',
    'schedules:read',
    'tasks:*',
    'patients:read',
    'appointments:read',
  ],
  clinical_staff: [
    'profile:read',
    'profile:update',
    'schedules:read',
    'tasks:*',
    'patients:*',
    'appointments:*',
    'handouts:*',
    'templates:*',
    'medical_records:read',
  ],
  pharma_rep: [
    'profile:read',
    'profile:update',
    'appointments:create',
    'appointments:read',
    'appointments:cancel',
    'schedules:read',
  ],
  patient: [
    'profile:read',
    'profile:update',
    'appointments:read',
    'appointments:create',
    'documents:read',
  ],
  vinya_tech: [
    'profile:read',
    'profile:update',
    'construction:*',
    'maintenance:*',
    'schedules:read',
  ],
};

// Permission checking utilities
export function hasPermission(
  user: User | null,
  permission: string,
  resource?: string
): boolean {
  if (!user) return false;

  // Superadmin has all permissions
  if (user.role === 'superadmin') return true;

  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  
  // Check for exact match
  const fullPermission = resource ? `${resource}:${permission}` : permission;
  if (rolePermissions.includes(fullPermission)) return true;

  // Check for wildcard permissions
  const wildcardPermission = resource ? `${resource}:*` : `${permission.split(':')[0]}:*`;
  if (rolePermissions.includes(wildcardPermission)) return true;

  // Check user-specific permissions
  if (user.permissions) {
    return user.permissions.some(p => {
      const userPermission = resource ? `${p.resource}:${p.action}` : p.action;
      return userPermission === fullPermission || userPermission === wildcardPermission;
    });
  }

  return false;
}

export function hasRole(user: User | null, roles: UserRole | UserRole[]): boolean {
  if (!user) return false;
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(user.role);
}

export function hasLocationAccess(user: User | null, locationId: string): boolean {
  if (!user) return false;
  
  // Superadmin has access to all locations
  if (user.role === 'superadmin') return true;
  
  // Check if user has access to specific location
  return user.locations.includes(locationId);
}

export function canAccessRoute(user: User | null, route: string): boolean {
  if (!user) return false;

  // Define route permissions
  const routePermissions: Record<string, string[]> = {
    '/admin': ['system:admin'],
    '/staff': ['staff:read', 'users:read'],
    '/patients': ['patients:read'],
    '/appointments': ['appointments:read'],
    '/reports': ['reports:read'],
    '/settings': ['system:settings'],
  };

  const requiredPermissions = routePermissions[route];
  if (!requiredPermissions) return true; // Public route

  return requiredPermissions.some(permission => {
    const [resource, action] = permission.split(':');
    return hasPermission(user, action, resource);
  });
}

// Authorization middleware helper
export function requirePermission(permission: string, resource?: string) {
  return (user: User | null) => {
    if (!hasPermission(user, permission, resource)) {
      throw new Error(`Insufficient permissions: ${resource}:${permission}`);
    }
  };
}

export function requireRole(roles: UserRole | UserRole[]) {
  return (user: User | null) => {
    if (!hasRole(user, roles)) {
      const roleList = Array.isArray(roles) ? roles.join(', ') : roles;
      throw new Error(`Insufficient role: requires ${roleList}`);
    }
  };
}