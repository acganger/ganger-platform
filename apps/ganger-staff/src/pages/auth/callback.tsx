import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@ganger/auth';

export default function CallbackPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Redirect to intended destination or home
      const returnUrl = router.query.returnUrl as string || '/';
      router.push(returnUrl);
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}