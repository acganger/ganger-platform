/**
 * App Component
 * Main application wrapper for handouts generator system
 */

import React from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@ganger/auth';
import { HandoutProvider } from '@/lib/handout-context';
import '../styles/globals.css';

function HandoutsApp({ Component, pageProps }: AppProps) {
  // Workaround for React 19 type compatibility with Next.js
  const SafeComponent = Component as any;
  
  return (
    <AuthProvider>
      <HandoutProvider>
        <SafeComponent {...pageProps} />
      </HandoutProvider>
    </AuthProvider>
  );
}

export default HandoutsApp;