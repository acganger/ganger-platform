import React from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@ganger/auth';
// ErrorBoundary not available yet, implement locally
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
import '@ganger/ui/styles';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ErrorBoundary>
  );
}