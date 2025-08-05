'use client'

import { useEffect } from 'react';
import { useAuth } from '@ganger/auth';
import { LoadingSpinner } from '@ganger/ui';

export default function AuthCallback() {
  const { user } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setTimeout(() => {
          if (user) {
            window.location.href = '/';
          } else {
            window.location.href = '/?error=no_session';
          }
        }, 1000);
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        window.location.href = '/?error=unexpected';
      }
    };

    handleAuthCallback();
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}