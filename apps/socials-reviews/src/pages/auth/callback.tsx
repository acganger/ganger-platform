'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/MockComponents';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/?error=auth_failed');
          return;
        }

        if (data.session) {
          // Successfully authenticated, redirect to main page
          router.push('/');
        } else {
          // No session found, redirect to login
          router.push('/?error=no_session');
        }
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        router.push('/?error=unexpected');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}