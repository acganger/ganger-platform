import React from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../providers/AuthProvider';
import type { UserRole } from '../types';

interface WithAuthOptions {
  requiredRoles?: UserRole[];
  requiredPermissions?: Array<{ permission: string; resource?: string }>;
  redirectTo?: string;
  loading?: React.ComponentType;
  unauthorized?: React.ComponentType;
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    requiredRoles,
    requiredPermissions,
    redirectTo = '/auth/login',
    loading: LoadingComponent,
    unauthorized: UnauthorizedComponent,
  } = options;

  const WithAuthComponent = (props: P) => {
    const { user, loading, isAuthenticated, hasRole, hasPermission } = useAuthContext();
    const router = useRouter();

    React.useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push(redirectTo);
      }
    }, [loading, isAuthenticated, router]);

    // Show loading state
    if (loading) {
      if (LoadingComponent) {
        return <LoadingComponent />;
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    // Not authenticated
    if (!isAuthenticated || !user) {
      return null; // Will redirect via useEffect
    }

    // Check role requirements
    if (requiredRoles && !hasRole(requiredRoles)) {
      if (UnauthorizedComponent) {
        return <UnauthorizedComponent />;
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    // Check permission requirements
    if (requiredPermissions) {
      const hasAllPermissions = requiredPermissions.every(({ permission, resource }) =>
        hasPermission(permission, resource)
      );

      if (!hasAllPermissions) {
        if (UnauthorizedComponent) {
          return <UnauthorizedComponent />;
        }
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to access this page.</p>
            </div>
          </div>
        );
      }
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithAuthComponent;
}

// Higher-order component for route protection with specific roles
export function withRoles<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  roles: UserRole[]
) {
  return withAuth(WrappedComponent, { requiredRoles: roles });
}

// Higher-order component for route protection with specific permissions
export function withPermissions<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permissions: Array<{ permission: string; resource?: string }>
) {
  return withAuth(WrappedComponent, { requiredPermissions: permissions });
}

// Convenience HOCs for common roles
export function withManagerAccess<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return withRoles(WrappedComponent, ['manager', 'superadmin']);
}

export function withAdminAccess<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return withRoles(WrappedComponent, ['superadmin']);
}

export function withStaffAccess<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return withRoles(WrappedComponent, ['staff', 'manager', 'superadmin']);
}