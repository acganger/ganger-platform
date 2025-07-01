/**
 * App Component
 * Main application wrapper for pharmaceutical scheduling system
 */

import React from 'react';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { ToastProvider } from '@ganger/ui';
import '@/styles/globals.css';

// Dynamically import AuthProvider and StaffInterface to avoid SSR issues
const AuthProvider = dynamic(
  () => import('@ganger/auth').then(mod => mod.AuthProvider),
  { ssr: false }
);

const StaffInterface = dynamic(
  () => import('@/components/StaffInterface').then(mod => mod.StaffInterface),
  { ssr: false }
);

function PharmaSchedulingApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isStaffRoute = router.pathname.startsWith('/staff');
  
  // Workaround for React 19 type compatibility with Next.js
  const SafeComponent = Component as any;
  
  // For public pages, don't wrap with auth
  if (!isStaffRoute) {
    return (
      <ToastProvider>
        <SafeComponent {...pageProps} />
      </ToastProvider>
    );
  }
  
  // For staff pages, use auth wrapper
  return (
    <AuthProvider appName="pharma-scheduling">
      <StaffInterface>
        <ToastProvider>
          <SafeComponent {...pageProps} />
        </ToastProvider>
      </StaffInterface>
    </AuthProvider>
  );
}

export default PharmaSchedulingApp;