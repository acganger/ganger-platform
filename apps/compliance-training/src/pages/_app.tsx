'use client'

import { AppProps } from 'next/app';
import { AuthProvider } from '@ganger/auth';
import { ComplianceProvider } from '@/lib/compliance-context';
import { RealtimeProvider } from '@/providers/RealtimeProvider';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { ErrorToastProvider, ConnectionStatusToast } from '@/components/errors/ErrorToast';
import { useGlobalErrorHandler } from '@/hooks/useErrorHandler';
import '@/styles/globals.css';

function AppWrapper({ Component, pageProps }: AppProps) {
  // Initialize global error handling
  useGlobalErrorHandler();

  return (
    <ErrorToastProvider>
      <ErrorBoundary>
        <AuthProvider>
          <ComplianceProvider>
            <RealtimeProvider enableNotifications={true}>
              <Component {...pageProps} />
              <ConnectionStatusToast />
            </RealtimeProvider>
          </ComplianceProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ErrorToastProvider>
  );
}

export default function App(props: AppProps) {
  return <AppWrapper {...props} />;
}