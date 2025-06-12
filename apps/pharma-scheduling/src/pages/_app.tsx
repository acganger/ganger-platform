/**
 * App Component
 * Main application wrapper for pharmaceutical scheduling system
 */

import React from 'react';
import type { AppProps } from 'next/app';
// import { ToastProvider } from '@ganger/ui'; // Replaced with basic alert functionality
import '@/styles/globals.css';

function PharmaSchedulingApp({ Component, pageProps }: AppProps) {
  // Workaround for React 19 type compatibility with Next.js
  const SafeComponent = Component as any;
  
  return (
    // <ToastProvider> // Replaced with basic alert functionality
      <SafeComponent {...pageProps} />
    // </ToastProvider>
  );
}

export default PharmaSchedulingApp;