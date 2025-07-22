import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@ganger/auth';
import { ToastProvider } from '@ganger/ui-catalyst';
import { ErrorBoundary } from '@ganger/ui';
import { initSentry } from '@ganger/monitoring/sentry';
import '@/styles/globals.css';

// Create a QueryClient instance
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: (failureCount, error: unknown) => {
          // Don't retry on 404s or auth errors
          const errorWithStatus = error as { status?: number };
          if (errorWithStatus?.status === 404 || errorWithStatus?.status === 401) {
            return false;
          }
          return failureCount < 3;
        },
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

// Initialize Sentry
if (typeof window !== 'undefined') {
  initSentry({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    environment: process.env.NEXT_PUBLIC_ENV || 'development',
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 0.1,
  });
}

export default function App({ 
  Component, 
  pageProps 
}: AppProps) {
  // Create QueryClient instance with useState to ensure it's stable
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ErrorBoundary>
      <AuthProvider appName="ganger-actions">
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <div className="min-h-screen bg-gray-50">
              <Component {...pageProps} />
            </div>
          </ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
