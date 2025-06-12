import { AppProps } from 'next/app';
import { AuthProvider } from '@ganger/auth';
import { ThemeProvider, ToastProvider } from '@ganger/ui';
import { analytics } from '@ganger/utils';
import { supabase } from '@/lib/supabase';
import { HandoutProvider } from '@/lib/handout-context';
import '../styles/globals.css';

function HandoutsApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <HandoutProvider>
            <Component {...pageProps} />
          </HandoutProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

// Initialize analytics
if (typeof window !== 'undefined') {
  analytics.init({
    app: 'handouts',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  });
}

export default HandoutsApp;