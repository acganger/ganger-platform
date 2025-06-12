import type { AppProps } from 'next/app';
import { AuthProvider } from '@ganger/auth';
import { ThemeProvider, ToastProvider } from '@ganger/ui';
import { CommunicationProvider, PaymentProvider } from '@ganger/integrations';
import '@ganger/ui/styles';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <CommunicationProvider>
            <PaymentProvider>
              <Component {...pageProps} />
            </PaymentProvider>
          </CommunicationProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}