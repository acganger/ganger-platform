import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@ganger/ui';
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

export default function App({ 
  Component, 
  pageProps: { session, ...pageProps } 
}: AppProps) {
  // Create QueryClient instance with useState to ensure it's stable
  const [queryClient] = useState(() => createQueryClient());

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <div className="min-h-screen bg-gray-50">
            <Component {...pageProps} />
          </div>
        </ToastProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}