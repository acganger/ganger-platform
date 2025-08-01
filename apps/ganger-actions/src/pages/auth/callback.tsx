// Auth callback page for ganger-actions app
import React from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@ganger/auth';
import { sessionManager } from '@ganger/auth';

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Get the current URL parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Handle both hash and search params (Supabase can use either)
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const error_code = hashParams.get('error') || searchParams.get('error');
        const error_description = hashParams.get('error_description') || searchParams.get('error_description');
        
        if (error_code) {
          throw new Error(error_description || `Authentication error: ${error_code}`);
        }
        
        if (accessToken) {
          // Set the session with the tokens
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          if (sessionError) {
            throw sessionError;
          }
          
          if (session?.user) {
            // Notify other apps of successful sign in
            sessionManager.notifyAuthChange('signin');
            
            // Determine redirect URL
            const redirectTo = searchParams.get('redirect_to') || 
                              sessionStorage.getItem('auth_redirect') ||
                              '/';
            
            // Clear stored redirect
            sessionStorage.removeItem('auth_redirect');
            
            // Redirect to the appropriate page
            if (redirectTo.startsWith('http')) {
              // External redirect (cross-app)
              window.location.href = redirectTo;
            } else {
              // Internal redirect
              router.push(redirectTo);
            }
            
            return;
          }
        }
        
        // If no tokens in URL, try to get existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is already authenticated, redirect
          const redirectTo = searchParams.get('redirect_to') || '/';
          
          if (redirectTo.startsWith('http')) {
            window.location.href = redirectTo;
          } else {
            router.push(redirectTo);
          }
        } else {
          // No valid session, redirect to login
          router.push('/auth/signin');
        }
        
      } catch (err) {
        console.error('Auth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        
        // Redirect to login with error
        setTimeout(() => {
          router.push(`/auth/signin?error=${encodeURIComponent(errorMessage)}`);
        }, 3000);
      } finally {
        setLoading(false);
      }
    };
    
    handleAuthCallback();
  }, [router]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h3 className="text-lg font-medium text-gray-900">
            Completing Authentication...
          </h3>
          <p className="text-sm text-gray-500">
            Please wait while we sign you in.
          </p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Authentication Failed
          </h3>
          <p className="text-sm text-gray-500">
            {error}
          </p>
          <p className="text-xs text-gray-400">
            Redirecting to login page in a few seconds...
          </p>
        </div>
      </div>
    );
  }
  
  return null;
}
