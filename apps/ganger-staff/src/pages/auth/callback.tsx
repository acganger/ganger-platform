export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@ganger/auth';
import { supabase } from '@ganger/auth';

export default function CallbackPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for OAuth errors first
        const urlError = router.query.error || router.query.error_description;
        if (urlError) {
          console.error('[Callback] OAuth error:', urlError);
          setError(typeof urlError === 'string' ? urlError : 'Authentication failed');
          setIsProcessing(false);
          return;
        }

        // Wait for router to be ready
        if (!router.isReady) {
          return;
        }

        // Get the current session first
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          console.log('[Callback] Session already exists:', currentSession.user.email);
          // Give the auth context a moment to update
          setTimeout(() => {
            router.push('/');
          }, 100);
          return;
        }

        // Handle OAuth code exchange
        const { code } = router.query;
        if (code && typeof code === 'string') {
          console.log('[Callback] Exchanging OAuth code for session...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('[Callback] Code exchange error:', exchangeError);
            setError(exchangeError.message);
            setIsProcessing(false);
            return;
          }

          if (data.session) {
            console.log('[Callback] Session established:', data.session.user.email);
            // The auth context will pick up the new session via onAuthStateChange
            // Wait a moment for the context to update, then redirect
            setTimeout(() => {
              router.push('/');
            }, 100);
            return;
          }
        }

        // If no code and no session, check for hash params (magic links)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log('[Callback] Hash params detected, processing...');
          // Supabase will handle this via detectSessionInUrl
          // Wait for auth state to update
        } else if (!code && !hash) {
          // No auth data in URL, redirect to sign in
          console.log('[Callback] No auth data found, redirecting to sign in...');
          setError('No authentication data found');
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }

        setIsProcessing(false);
      } catch (err) {
        console.error('[Callback] Unexpected error:', err);
        setError('An unexpected error occurred during sign in');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [router, router.isReady]);

  // Watch for user updates from auth context
  useEffect(() => {
    if (!authLoading && user && !isProcessing) {
      console.log('[Callback] User authenticated via context, redirecting...');
      router.push('/');
    }
  }, [user, authLoading, isProcessing, router]);

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
          <div className="text-red-600 text-xl font-semibold mb-4">Authentication Failed</div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
        <p className="mt-2 text-sm text-gray-500">Please wait while we authenticate you...</p>
      </div>
    </div>
  );
}