import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, withAuthComponent } from '@ganger/auth';
import { LoadingSpinner } from '@ganger/ui';
import { analytics } from '@ganger/utils';

function HandoutsHomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      analytics.track('page_view', 'navigation', {
        page: 'handouts_home',
        user_role: user?.role
      });

      // Redirect to generator after authentication
      if (user) {
        router.push('/generate');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-handouts-primary/5 to-handouts-secondary/5">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Handouts Generator
          </h1>
          <p className="text-lg text-gray-600">
            Rapid Custom Patient Education Materials
          </p>
        </div>
        
        <div className="text-sm text-gray-500">
          Please wait while we redirect you to the generator...
        </div>
      </div>
    </div>
  );
}

export default withAuthComponent(HandoutsHomePage, {
  requiredRoles: ['staff', 'clinical_staff', 'manager', 'superadmin'],
  redirectTo: '/auth/login'
});