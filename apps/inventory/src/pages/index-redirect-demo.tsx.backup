import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function InventoryHomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to demo page for static export
    router.push('/demo');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
}