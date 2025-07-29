import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ResetCookiesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'clearing' | 'done'>('idle');
  const [cookies, setCookies] = useState<string[]>([]);

  useEffect(() => {
    // List all cookies
    if (typeof window !== 'undefined') {
      const allCookies = document.cookie.split(';').map(c => c.trim());
      setCookies(allCookies);
    }
  }, []);

  const clearAllCookies = () => {
    setStatus('clearing');

    // Clear all cookies for gangerdermatology.com domain
    const domains = [
      '.gangerdermatology.com',
      'gangerdermatology.com',
      'staff.gangerdermatology.com',
      'supa.gangerdermatology.com',
      'localhost'
    ];

    const paths = ['/', '/auth', '/auth/callback'];

    // Cookie names to clear
    const cookieNames = [
      'sb-auth-token',
      'sb-pfqtzmxxxhhsxmlddrta-auth-token',
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      '__cf_bm' // Cloudflare cookie
    ];

    // Clear specific cookies
    cookieNames.forEach(name => {
      domains.forEach(domain => {
        paths.forEach(path => {
          // Try different combinations
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
        });
      });
    });

    // Clear any cookie that starts with sb- or supabase
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (name.startsWith('sb-') || name.includes('supabase')) {
        domains.forEach(domain => {
          paths.forEach(path => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
          });
        });
      }
    });

    // Clear localStorage
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    }

    setTimeout(() => {
      setStatus('done');
    }, 1000);
  };

  const clearAndRedirect = () => {
    clearAllCookies();
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  return (
    <>
      <Head>
        <title>Reset Authentication - Ganger Platform</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Reset Authentication</h1>
            
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Current Cookies</h2>
              <div className="bg-gray-50 rounded p-4 max-h-64 overflow-y-auto">
                {cookies.length > 0 ? (
                  <ul className="space-y-1 text-sm font-mono">
                    {cookies.map((cookie, i) => (
                      <li key={i} className="text-gray-600 break-all">
                        {cookie}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No cookies found</p>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Actions</h2>
              
              <div className="space-y-4">
                <button
                  onClick={clearAllCookies}
                  disabled={status === 'clearing'}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'clearing' ? 'Clearing...' : 'Clear All Auth Data'}
                </button>

                <button
                  onClick={clearAndRedirect}
                  disabled={status === 'clearing'}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                >
                  Clear & Return to Login
                </button>
              </div>

              {status === 'done' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-700">✅ All authentication data has been cleared</p>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Troubleshooting Guide</h2>
              
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h3 className="font-semibold text-gray-700">If you're having login issues:</h3>
                  <ol className="list-decimal ml-5 mt-2 space-y-1">
                    <li>Click "Clear All Auth Data" above</li>
                    <li>Close all browser tabs for gangerdermatology.com</li>
                    <li>Clear your browser cache (Ctrl+Shift+Delete)</li>
                    <li>Try logging in again</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Ad Blocker Users:</h3>
                  <p className="mt-2">Our platform is designed to work with ad blockers. However, if you're experiencing issues:</p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Add *.gangerdermatology.com to your ad blocker's allowlist</li>
                    <li>Add supa.gangerdermatology.com specifically</li>
                    <li>Try disabling "Strict" or "Advanced" tracking protection</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Still having issues?</h3>
                  <p className="mt-2">Contact IT support with:</p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Your browser and version</li>
                    <li>Any error messages you see</li>
                    <li>Which ad blocker you're using</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}