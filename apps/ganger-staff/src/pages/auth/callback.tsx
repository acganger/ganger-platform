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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const addDebug = (message: string) => {
    console.log(`[Callback] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  useEffect(() => {
    const handleCallback = async () => {
      addDebug('🔄 Callback handler started');
      addDebug(`URL: ${window.location.href}`);
      addDebug(`Query params: ${JSON.stringify(router.query)}`);
      
      try {
        // Check for OAuth errors first
        const urlError = router.query.error || router.query.error_description;
        if (urlError) {
          addDebug(`❌ OAuth error in URL: ${urlError}`);
          setError(typeof urlError === 'string' ? urlError : 'Authentication failed');
          setIsProcessing(false);
          return;
        }

        // Wait for router to be ready
        if (!router.isReady) {
          addDebug('⏳ Waiting for router to be ready...');
          return;
        }
        
        addDebug('✅ Router is ready');

        // Get the current session first
        addDebug('🔍 Checking for existing session...');
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          addDebug(`❌ Error getting session: ${sessionError.message}`);
        }
        
        if (currentSession) {
          addDebug(`✅ Session already exists: ${currentSession.user.email}`);
          addDebug('🚀 Redirecting to home page...');
          // Give the auth context a moment to update
          setTimeout(() => {
            router.push('/');
          }, 100);
          return;
        }
        
        addDebug('❓ No existing session found');

        // Handle OAuth code exchange
        const { code } = router.query;
        if (code && typeof code === 'string') {
          addDebug(`🔐 OAuth code found: ${code.substring(0, 10)}...`);
          addDebug('🔄 Exchanging OAuth code for session...');
          
          // Use the URL for PKCE flow
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
          
          if (exchangeError) {
            addDebug(`❌ Code exchange error: ${exchangeError.message}`);
            addDebug(`Error details: ${JSON.stringify(exchangeError)}`);
            setError(exchangeError.message);
            setIsProcessing(false);
            return;
          }

          if (data.session) {
            console.log('[Callback] Session established:', data.session.user.email);
            // Immediately replace the URL to remove auth params
            window.history.replaceState({}, document.title, '/auth/callback');
            // The auth context will pick up the new session via onAuthStateChange
            // Wait a moment for the context to update, then redirect
            setTimeout(() => {
              router.replace('/');
            }, 100);
            return;
          }
        }

        // If no code and no session, check for hash params (magic links)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log('[Callback] Hash params detected, processing...');
          
          // Actively process the hash tokens
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            console.log('[Callback] Setting session from hash params...');
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (sessionError) {
              console.error('[Callback] Error setting session from hash:', sessionError);
              setError(sessionError.message);
              setIsProcessing(false);
              return;
            }
            
            if (data.session) {
              console.log('[Callback] Session set successfully from hash params');
              setTimeout(() => {
                router.push('/');
              }, 100);
              return;
            }
          }
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
    // Check if it's a network error
    const isNetworkError = error.toLowerCase().includes('fetch') || 
                          error.toLowerCase().includes('network') ||
                          error.toLowerCase().includes('failed to fetch');
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
          <div className="text-red-600 text-xl font-semibold mb-4">
            {isNetworkError ? 'Connection Error' : 'Authentication Failed'}
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          
          {isNetworkError && (
            <div className="text-left bg-yellow-50 p-4 rounded mb-6">
              <p className="font-semibold mb-2">Troubleshooting steps:</p>
              <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
                <li>Disable ad blockers or privacy extensions</li>
                <li>Try using an incognito/private window</li>
                <li>Check your internet connection</li>
                <li>Clear browser cache and cookies</li>
                <li>Try a different browser (Chrome recommended)</li>
              </ul>
              <p className="mt-3 text-xs text-gray-600">
                If the issue persists, contact IT support with error: "SUPABASE_FETCH_ERROR"
              </p>
            </div>
          )}
          
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

  // Show loading state with debug info
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing sign in...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we authenticate you...</p>
        </div>
        
        {/* Debug Panel */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Authentication Debug Log</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {debugInfo.map((info, index) => (
              <div key={index} className="text-xs font-mono text-gray-600 p-2 bg-gray-50 rounded">
                {info}
              </div>
            ))}
            {debugInfo.length === 0 && (
              <div className="text-xs text-gray-500">Waiting for debug information...</div>
            )}
          </div>
          
          <details className="mt-4 text-xs text-gray-500">
            <summary className="cursor-pointer font-semibold">Environment Information</summary>
            <div className="mt-2 bg-gray-50 p-3 rounded font-mono overflow-x-auto">
              <div>Auth Loading: {String(authLoading)}</div>
              <div>User: {user?.email || 'null'}</div>
              <div>Processing: {String(isProcessing)}</div>
              <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
              <div>Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</div>
              <div>Has Code: {router.query.code ? 'Yes' : 'No'}</div>
              <div>Has Error: {router.query.error ? 'Yes' : 'No'}</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}