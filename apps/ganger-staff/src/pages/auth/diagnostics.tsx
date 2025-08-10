import { useEffect, useState } from 'react';
import { supabase } from '@ganger/auth';

export default function AuthDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  
  useEffect(() => {
    // Check Supabase client configuration
    const checkConfig = async () => {
      const config: any = {
        // @ts-ignore - accessing internal config
        storageKey: supabase.auth?.storage?.storageKey || 'not found',
        // @ts-ignore
        storageType: supabase.auth?.storage?.constructor?.name || 'unknown',
        // @ts-ignore
        flowType: supabase.auth?.flowType || 'not set',
        // @ts-ignore
        detectSessionInUrl: supabase.auth?.detectSessionInUrl,
        // Check localStorage for any auth keys
        localStorageKeys: Object.keys(localStorage).filter(k => 
          k.includes('sb-') || k.includes('auth') || k.includes('supabase')
        ),
        // Check current session
        session: null,
        sessionError: null
      };
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        config.session = session ? {
          user: session.user.email,
          expires_at: session.expires_at
        } : null;
        config.sessionError = error?.message || null;
      } catch (e) {
        config.sessionError = e instanceof Error ? e.message : 'Unknown error';
      }
      
      setDiagnostics(config);
    };
    
    checkConfig();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Auth Diagnostics</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Supabase Client Configuration</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Expected Values:</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>storageKey should be: 'sb-supa-auth-token'</li>
            <li>storageType should be: 'Storage' (localStorage)</li>
            <li>flowType should be: 'pkce'</li>
            <li>detectSessionInUrl should be: true</li>
          </ul>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Deployment info:</p>
          <p>Build time: {process.env.NEXT_PUBLIC_BUILD_TIME || 'not set'}</p>
          <p>Commit: {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'not set'}</p>
        </div>
      </div>
    </div>
  );
}