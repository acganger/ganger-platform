import type { AppProps } from 'next/app';
import { AuthProvider } from '@ganger/auth';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

export default function ConfigDashboardApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider appName="config-dashboard">
      <div className="min-h-screen bg-gray-50">
        <Component {...pageProps} />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </AuthProvider>
  );
}