'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Cloudflare Workers Edge Runtime
export const runtime = 'edge';

/**
 * AI Receptionist - Root redirect page
 * Redirects to dashboard for static export compatibility
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <>
      <Head>
        <title>AI Receptionist | Ganger Dermatology</title>
        <meta name="description" content="AI-powered call handling and patient communication" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Loading AI Receptionist Dashboard...
          </h1>
          <p className="text-gray-600">
            Redirecting to the AI Receptionist control panel
          </p>
        </div>
      </div>
    </>
  );
}