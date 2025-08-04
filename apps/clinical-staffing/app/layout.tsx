// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
export const dynamic = 'force-dynamic';

import { StaffPortalLayout } from '@ganger/ui';
import { AuthProvider } from '@ganger/auth';
import { PWAProvider } from '../src/components/pwa/PWAProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clinical Staffing - Ganger Platform',
  description: 'Clinical support staffing optimization and scheduling for Ganger Dermatology',
  manifest: '/clinical-staffing/manifest.json',
  themeColor: '#0ea5e9',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Clinical Staffing',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/clinical-staffing/manifest.json" />
        <link rel="apple-touch-icon" href="/clinical-staffing/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Clinical Staffing" />
      </head>
      <body>
        <AuthProvider>
          <StaffPortalLayout currentApp="staffing">
            <PWAProvider>
              {children}
            </PWAProvider>
          </StaffPortalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}