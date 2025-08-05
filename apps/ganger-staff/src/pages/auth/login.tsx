export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@ganger/auth';

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, loading } = useAuth();
  const returnUrl = router.query.returnUrl as string || '/';
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    console.log('[LoginPage] Component mounted', {
      hasUser: !!user,
      userEmail: user?.email,
      loading,
      returnUrl
    });
    
    if (user) {
      setStatus('User authenticated, redirecting...');
      router.push(returnUrl);
    }
  }, [user, router, returnUrl, loading]);

  const handleSignIn = async () => {
    console.log('[LoginPage] Sign in button clicked');
    setError('');
    setStatus('Starting authentication...');
    setIsSigningIn(true);
    
    try {
      setStatus('Connecting to authentication service...');
      await signIn();
      setStatus('Redirecting to Google...');
    } catch (err) {
      console.error('[LoginPage] Sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Authentication failed: ${errorMessage}`);
      setStatus('');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Ganger Platform</h1>
          <p className="mt-2 text-gray-600">Sign in to access your applications</p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-6 shadow rounded-lg">
          {/* Debug Information */}
          {(status || error || loading) && (
            <div className="mb-6 space-y-2">
              {loading && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <span className="font-semibold">Loading:</span> Checking authentication state...
                </div>
              )}
              
              {status && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                  <span className="font-semibold">Status:</span> {status}
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                  <span className="font-semibold">Error:</span> {error}
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleSignIn}
            disabled={isSigningIn || loading}
            className={`w-full flex items-center justify-center gap-3 px-4 py-2 rounded-lg transition ${
              isSigningIn || loading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSigningIn ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Authenticating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
          
          <p className="mt-4 text-center text-sm text-gray-600">
            By signing in, you agree to our terms and conditions
          </p>
          
          {/* Debug Panel */}
          <details className="mt-6 text-xs text-gray-500">
            <summary className="cursor-pointer font-semibold">Debug Information</summary>
            <div className="mt-2 bg-gray-50 p-3 rounded font-mono overflow-x-auto">
              <div>Auth Loading: {String(loading)}</div>
              <div>User: {user?.email || 'null'}</div>
              <div>Signing In: {String(isSigningIn)}</div>
              <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
              <div>Browser Online: {typeof window !== 'undefined' ? String(window.navigator.onLine) : 'SSR'}</div>
              <div>Cookies Enabled: {typeof window !== 'undefined' ? String(window.navigator.cookieEnabled) : 'SSR'}</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}