export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Since Supabase has detectSessionInUrl: true, it will automatically
    // handle the OAuth callback. We just need to redirect to home
    // where the auth context will pick up the session.
    const timer = setTimeout(() => {
      router.push('/');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}