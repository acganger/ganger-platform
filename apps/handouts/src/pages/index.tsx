// Cloudflare Workers Edge Runtime
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthGuard } from '@ganger/auth/staff';

function HandoutsHomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to generator immediately
    router.push('/generate');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#eff6ff'}}>
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Handouts Generator
          </h1>
          <p className="text-lg text-gray-600">
            Rapid Custom Patient Education Materials
          </p>
        </div>
        
        <div className="text-sm text-gray-500">
          Redirecting to generator...
        </div>
      </div>
    </div>
  );
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedHandoutsHomePage() {
  return (
    <AuthGuard level="staff" appName="handouts">
      <HandoutsHomePage />
    </AuthGuard>
  );
}