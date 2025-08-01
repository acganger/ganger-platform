import type { AppProps } from 'next/app';
import { AuthProvider } from '@ganger/auth';
import { initSentry } from '@ganger/monitoring';
import '../styles/globals.css';

// Initialize Sentry
if (typeof window !== 'undefined') {
  initSentry({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    environment: process.env.NEXT_PUBLIC_ENV || 'development',
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 0.1,
  });
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}