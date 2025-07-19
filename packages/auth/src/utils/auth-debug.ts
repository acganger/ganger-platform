/**
 * Authentication debugging utilities
 * Only active in development or when explicitly enabled
 */

export function debugAuth(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development' || 
      (typeof window !== 'undefined' && window.localStorage.getItem('debug_auth') === 'true')) {
    console.log(`[Auth Debug] ${message}`, data || '');
  }
}

export function enableAuthDebugging() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('debug_auth', 'true');
    console.log('[Auth Debug] Debugging enabled. Refresh the page to see auth logs.');
  }
}

export function disableAuthDebugging() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('debug_auth');
    console.log('[Auth Debug] Debugging disabled.');
  }
}

/**
 * Check current auth state and log diagnostic information
 */
export async function diagnoseAuth(supabase: any) {
  console.group('[Auth Diagnosis]');
  
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session:', session ? {
      user: session.user.email,
      expires_at: new Date(session.expires_at! * 1000).toLocaleString(),
      provider: session.user.app_metadata?.provider
    } : 'No session');
    
    if (sessionError) {
      console.error('Session error:', sessionError);
    }
    
    // Check cookies
    if (typeof window !== 'undefined') {
      console.log('Cookies:', document.cookie);
      
      // Check for Supabase auth cookies
      const cookies = document.cookie.split(';').map(c => c.trim());
      const authCookies = cookies.filter(c => c.startsWith('sb-'));
      console.log('Auth cookies found:', authCookies.length > 0 ? authCookies : 'None');
    }
    
    // Check localStorage
    if (typeof window !== 'undefined') {
      const storageKeys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'));
      console.log('Auth storage keys:', storageKeys.length > 0 ? storageKeys : 'None');
    }
    
    // Check URL for auth params
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const hasCode = url.searchParams.has('code');
      const hasError = url.searchParams.has('error');
      const hasHash = url.hash.includes('access_token');
      
      console.log('URL auth params:', {
        hasCode,
        hasError,
        hasHash,
        error: url.searchParams.get('error_description')
      });
    }
    
  } catch (error) {
    console.error('Diagnosis error:', error);
  }
  
  console.groupEnd();
}

// Make debugging functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).authDebug = {
    enable: enableAuthDebugging,
    disable: disableAuthDebugging,
    diagnose: () => {
      // This will be called from browser console
      console.log('Run this in your app: diagnoseAuth(supabase)');
    }
  };
}