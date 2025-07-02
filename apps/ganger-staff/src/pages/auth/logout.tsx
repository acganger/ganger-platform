import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@ganger/auth';

export default function LogoutPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    async function handleLogout() {
      try {
        await signOut();
        router.push('/auth/login');
      } catch {
        // Logout failed, redirect anyway
        router.push('/');
      }
    }

    handleLogout();
  }, [signOut, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Signing out...</p>
      </div>
    </div>
  );
}