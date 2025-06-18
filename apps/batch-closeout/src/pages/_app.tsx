import type { AppProps } from 'next/app';
import { AuthProvider } from '@ganger/auth';
import { FinancialLayout } from '@/components/FinancialLayout';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <FinancialLayout>
        <Component {...pageProps} />
      </FinancialLayout>
    </AuthProvider>
  );
}