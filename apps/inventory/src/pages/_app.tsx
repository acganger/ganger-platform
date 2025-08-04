import { AppProps } from 'next/app';
import { useEffect } from 'react';
import { AuthProvider } from '@ganger/auth';
import { ThemeProvider, ToastProvider } from '@ganger/ui';
import { analytics } from '@ganger/utils';
import { registerServiceWorker } from '../lib/pwa';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { InstallPrompt } from '../components/InstallPrompt';
import '../styles/globals.css';

function InventoryApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <Component {...pageProps} />
          <OfflineIndicator />
          <InstallPrompt />
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