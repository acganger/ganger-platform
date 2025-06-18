// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { StaffPortalLayout } from '@ganger/ui';
import { AuthProvider } from '@ganger/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compliance Training - Ganger Platform',
  description: 'Compliance training management and certification tracking for Ganger Dermatology',
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
          <StaffPortalLayout currentApp="compliance">
            {children}
          </StaffPortalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}