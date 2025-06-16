import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@ganger/auth';
import { Button, LoadingSpinner } from '@ganger/ui';
import { analytics } from '@ganger/utils';

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      analytics.track('login_attempt', 'authentication', { method: 'google' });
      
      await signIn('/dashboard');
      
      analytics.track('login_success', 'authentication', { method: 'google' });
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      analytics.track('login_error', 'authentication', { 
        method: 'google', 
        error: errorMessage 
      });
    }
  };

  // Redirect if already authenticated
  if (user) {
    router.push('/dashboard');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 to-primary-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Sign in to Inventory
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access the Ganger Platform Inventory Management System
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Sign in with Google'
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Access restricted to @gangerdermatology.com accounts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}