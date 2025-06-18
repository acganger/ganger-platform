import type { AppProps } from 'next/app';
import { AuthProvider } from '@ganger/auth';
import { CallCenterLayout } from '@/components/CallCenterLayout';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <CallCenterLayout>
        <Component {...pageProps} />
      </CallCenterLayout>
    </AuthProvider>
  );
}