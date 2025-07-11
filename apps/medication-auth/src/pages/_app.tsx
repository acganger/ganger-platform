import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Optional dependency
import { useState } from 'react';
import { AuthProvider } from '@ganger/auth';
import { ToastProvider } from '@ganger/ui';
// import { EnhancedCommunicationHub, EnhancedPaymentHub } from '@ganger/integrations'; // Service classes, not components
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error && typeof error === 'object' && 'status' in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              return failureCount < 3;
            },
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Component {...pageProps} />
        </ToastProvider>
        {/* {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />} */}
      </QueryClientProvider>
    </AuthProvider>
  );
}