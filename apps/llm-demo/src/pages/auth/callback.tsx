import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@ganger/auth';

export default function AuthCallback() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // If authenticated, redirect to home
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Authenticating...</h2>
        <p className="text-gray-600">Please wait while we complete your sign in.</p>
      </div>
    </div>
  );
}