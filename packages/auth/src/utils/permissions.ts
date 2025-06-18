// Permission and role utilities

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

// Role hierarchy with permission levels
export const ROLE_PERMISSIONS: Record<string, UserRole> = {
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
export function hasPermission(
  userRole: string, 
  permission: string, 
  userPermissions?: UserPermission[]
): boolean {
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
    return userPermissions.some(perm => 
      perm.action === permission || perm.action === '*'
    );
  }

  return false;
}

// Check if user has required role or higher
export function hasRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_PERMISSIONS[userRole]?.level || 0;
  const requiredLevel = ROLE_PERMISSIONS[requiredRole]?.level || 0;
  
  return userLevel >= requiredLevel;
}

// Check if user has access to specific location
export function hasLocationAccess(
  userLocations: string[], 
  requiredLocation: string
): boolean {
  if (!userLocations || userLocations.length === 0) {
    return false;
  }
  
  return userLocations.includes(requiredLocation) || userLocations.includes('*');
}

// Check if user can access a specific route
export function canAccessRoute(
  userRole: string,
  route: string,
  userPermissions?: UserPermission[]
): boolean {
  // Define route permissions
  const routePermissions: Record<string, string[]> = {
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
export function requirePermission(permission: string) {
  return (userRole: string, userPermissions?: UserPermission[]) => {
    if (!hasPermission(userRole, permission, userPermissions)) {
      throw new Error(`Permission '${permission}' required`);
    }
  };
}

// Middleware helper to require specific role
export function requireRole(requiredRole: string) {
  return (userRole: string) => {
    if (!hasRole(userRole, requiredRole)) {
      throw new Error(`Role '${requiredRole}' or higher required`);
    }
  };
}