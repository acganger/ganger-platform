import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          router.push('/auth/error?message=' + encodeURIComponent(error.message));
          return;
        }

        if (data.session) {
          // Check if user is from allowed domain
          const email = data.session.user.email;
          if (!email?.endsWith('@gangerdermatology.com')) {
            await supabase.auth.signOut();
            router.push('/auth/error?message=' + encodeURIComponent('Access restricted to Ganger Dermatology domain'));
            return;
          }

          // Successful authentication, redirect to dashboard
          router.push('/');
        } else {
          // No session, redirect to home
          router.push('/');
        }
      } catch (error) {
        router.push('/auth/error?message=' + encodeURIComponent('Authentication failed'));
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eos-600 mx-auto"></div>
        <h2 className="text-lg font-medium text-gray-900">
          Completing sign in...
        </h2>
        <p className="text-sm text-gray-600">
          Please wait while we verify your account.
        </p>
      </div>
    </div>
  );
}