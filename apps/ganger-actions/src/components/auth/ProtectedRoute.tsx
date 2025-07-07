import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@ganger/ui';
import { AuthUser } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AuthUser['role'];
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, authUser, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not authenticated - redirect to login
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // User profile not loaded yet
      if (!authUser) {
        return;
      }

      // Check role requirements
      if (requiredRole && !hasRole(requiredRole)) {
        // Redirect to unauthorized page or dashboard
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, authUser, loading, requiredRole, hasRole, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading..." center />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Redirecting to login..." center />
        </div>
      </div>
    );
  }

  // User profile not loaded
  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading user profile..." center />
        </div>
      </div>
    );
  }

  // Insufficient role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Access Denied
            </h2>
            <p className="text-red-700">
              You don&apos;t have permission to access this page. 
              Required role: <span className="font-medium">{requiredRole}</span>
            </p>
            <p className="text-red-600 text-sm mt-2">
              Your role: <span className="font-medium">{authUser.role}</span>
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
};