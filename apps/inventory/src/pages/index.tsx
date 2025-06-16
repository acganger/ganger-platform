import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, AuthGuard } from '@ganger/auth';
import { LoadingSpinner } from '@ganger/ui';
import { analytics } from '@ganger/utils';

function InventoryHomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      analytics.track('page_view', 'navigation', {
        page: 'inventory_home',
        user_role: profile?.role
      });

      // Redirect to dashboard after authentication
      if (user) {
        router.push('/dashboard');
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 to-primary-50">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-lg text-gray-600">
            Ganger Platform Medical Supply Tracking
          </p>
        </div>
        
        <div className="text-sm text-gray-500">
          Please wait while we redirect you to the dashboard...
        </div>
      </div>
    </div>
  );
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedInventoryHomePage() {
  return (
    <AuthGuard level="staff" appName="inventory">
      <InventoryHomePage />
    </AuthGuard>
  );
}