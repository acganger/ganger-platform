// Cloudflare Workers Edge Runtime
export const runtime = 'edge';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

/**
 * Batch Closeout - Root redirect page
 * Redirects to protocol page for static export compatibility
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/protocol');
  }, [router]);

  return (
    <>
      <Head>
        <title>Batch Closeout | Ganger Dermatology</title>
        <meta name="description" content="Medical batch processing and closeout management" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Batch Closeout System...
          </h1>
          <p className="text-gray-600">
            Redirecting to batch processing dashboard
          </p>
        </div>
      </div>
    </>
  );
}