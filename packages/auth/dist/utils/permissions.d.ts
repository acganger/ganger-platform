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
export declare function hasPermission(userRole: string, permission: string, userPermissions?: UserPermission[]): boolean;
export declare function hasRole(userRole: string, requiredRole: string): boolean;
export declare function hasLocationAccess(userLocations: string[], requiredLocation: string): boolean;
export declare function canAccessRoute(userRole: string, route: string, userPermissions?: UserPermission[]): boolean;
export declare function requirePermission(permission: string): (userRole: string, userPermissions?: UserPermission[]) => void;
export declare function requireRole(requiredRole: string): (userRole: string) => void;
//# sourceMappingURL=permissions.d.ts.map