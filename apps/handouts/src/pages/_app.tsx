/**
 * App Component
 * Main application wrapper for handouts generator system
 */

import React from 'react';
import type { NextPage } from 'next';
import { AuthProvider } from '@ganger/auth';
import { HandoutProvider } from '@/lib/handout-context';
import '../styles/globals.css';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
};

interface AppProps {
  Component: NextPageWithLayout;
  pageProps: Record<string, unknown>;
}

function HandoutsApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <HandoutProvider>
        <Component {...pageProps} />
      </HandoutProvider>
    </AuthProvider>
  );
}

export default HandoutsApp;