import { AppProps } from 'next/app';
import { AuthProvider } from '@ganger/auth';
import { ThemeProvider, ToastProvider } from '@ganger/ui';
import { analytics } from '@ganger/utils';
import { initSentry } from '@ganger/monitoring';
import '../styles/globals.css';

function InventoryApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <Component {...pageProps} />
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

// Initialize analytics and Sentry
if (typeof window !== 'undefined') {
  analytics.init({
    app: 'inventory',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  });
  
  initSentry({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    environment: process.env.NEXT_PUBLIC_ENV || 'development',
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 0.1,
  });
}

export default InventoryApp;