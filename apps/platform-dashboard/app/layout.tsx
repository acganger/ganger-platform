// Cloudflare Workers Edge Runtime  
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { StaffPortalLayout } from '@ganger/ui';
import { AuthProvider } from '@ganger/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform Dashboard - Ganger Platform',
  description: 'Central platform dashboard for Ganger Dermatology operations and analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <StaffPortalLayout currentApp="dashboard">
            {children}
          </StaffPortalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}