import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Universal Auth Callback Component for Ganger Platform
// Handles OAuth redirects consistently across all applications
// Note: This component is for Pages Router apps only. App Router apps should implement their own callback page.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getTypedSupabaseClient } from './supabase';
import { sessionManager, getCurrentApp, APP_URLS } from './cross-app';
export function AuthCallback({ appName, defaultRedirect = '/dashboard', onSuccess, onError }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                const supabase = getTypedSupabaseClient();
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
                        // Call success callback if provided
                        if (onSuccess) {
                            onSuccess(session.user);
                        }
                        // Determine redirect URL
                        const redirectTo = searchParams.get('redirect_to') ||
                            sessionStorage.getItem('auth_redirect') ||
                            defaultRedirect;
                        // Clear stored redirect
                        sessionStorage.removeItem('auth_redirect');
                        // Redirect to the appropriate page
                        if (redirectTo.startsWith('http')) {
                            // External redirect (cross-app)
                            window.location.href = redirectTo;
                        }
                        else {
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
                    const redirectTo = searchParams.get('redirect_to') || defaultRedirect;
                    if (redirectTo.startsWith('http')) {
                        window.location.href = redirectTo;
                    }
                    else {
                        router.push(redirectTo);
                    }
                }
                else {
                    // No valid session, redirect to login
                    const currentApp = getCurrentApp() || appName;
                    const loginUrl = currentApp && currentApp in APP_URLS ? `${APP_URLS[currentApp]}/auth/login` : '/auth/login';
                    router.push(loginUrl);
                }
            }
            catch (err) {
                console.error('Auth callback error:', err);
                const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
                setError(errorMessage);
                if (onError) {
                    onError(err instanceof Error ? err : new Error(errorMessage));
                }
                // Redirect to login with error
                setTimeout(() => {
                    const currentApp = getCurrentApp() || appName;
                    const loginUrl = currentApp && currentApp in APP_URLS ? `${APP_URLS[currentApp]}/auth/login?error=${encodeURIComponent(errorMessage)}` : '/auth/login';
                    router.push(loginUrl);
                }, 3000);
            }
            finally {
                setLoading(false);
            }
        };
        handleAuthCallback();
    }, [router, appName, defaultRedirect, onSuccess, onError]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Completing Authentication..." }), _jsx("p", { className: "text-sm text-gray-500", children: "Please wait while we sign you in." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center space-y-4 max-w-md", children: [_jsx("div", { className: "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto", children: _jsx("svg", { className: "w-8 h-8 text-red-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Authentication Failed" }), _jsx("p", { className: "text-sm text-gray-500", children: error }), _jsx("p", { className: "text-xs text-gray-400", children: "Redirecting to login page in a few seconds..." })] }) }));
    }
    return null;
}
// Higher-order component for easy integration
export function withAuthCallback(Component, callbackProps) {
    return function AuthCallbackWrapper(props) {
        const router = useRouter();
        // Check if this is an auth callback URL
        const isCallback = router.asPath.includes('/auth/callback') ||
            window.location.hash.includes('access_token') ||
            window.location.search.includes('access_token');
        if (isCallback) {
            return _jsx(AuthCallback, { ...callbackProps });
        }
        return _jsx(Component, { ...props });
    };
}
export default AuthCallback;
