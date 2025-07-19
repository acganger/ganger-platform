export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@ganger/auth';
import { supabase } from '@ganger/auth';

export default function CallbackPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // First check if there's an error in the URL (from OAuth provider)
        const urlError = router.query.error || router.query.error_description;
        if (urlError) {
          console.error('OAuth error:', urlError);
          setError(typeof urlError === 'string' ? urlError : 'Authentication failed');
          setIsProcessing(false);
          return;
        }

        // Expert 2's approach: If user is already available (via auth context), redirect immediately
        if (user) {
          console.log('[Callback] User already authenticated, redirecting...');
          router.push('/');
          return;
        }

        // Expert 1's approach: Check for OAuth code and exchange it
        const { code } = router.query;
        if (code && typeof code === 'string') {
          console.log('[Callback] OAuth code found, exchanging for session...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            setError(exchangeError.message);
            setIsProcessing(false);
            return;
          }

          console.log('[Callback] Session established:', data.session?.user?.email);
          // Let the auth context pick up the new session
        }

        // If we have hash params (from magic links or other flows), Supabase will handle via detectSessionInUrl
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log('[Callback] Hash params detected, letting Supabase handle...');
        }

        setIsProcessing(false);
      } catch (err) {
        console.error('Callback error:', err);
        setError('An unexpected error occurred during sign in');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [router, user]);

  // Expert 2's approach: Wait for auth context update
  useEffect(() => {
    if (!isProcessing && user) {
      console.log('[Callback] User authenticated, redirecting to home...');
      router.push('/');
    }
  }, [user, router, isProcessing]);

  // Handle errors
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
          <div className="text-red-600 text-xl font-semibold mb-4">Authentication Failed</div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}