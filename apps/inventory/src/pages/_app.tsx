import { AppProps } from 'next/app';
import { AuthProvider } from '@ganger/auth';
import { ThemeProvider, ToastProvider } from '@ganger/ui';
import { analytics } from '@ganger/utils';
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

// Initialize analytics
if (typeof window !== 'undefined') {
  analytics.init({
    app: 'inventory',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  });
}

export default InventoryApp;