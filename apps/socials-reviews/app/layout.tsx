// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { StaffPortalLayout } from '@ganger/ui';
import { AuthProvider } from '@ganger/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Socials & Reviews - Ganger Platform',
  description: 'Social media monitoring and review management for Ganger Dermatology',
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
          <StaffPortalLayout currentApp="socials">
            {children}
          </StaffPortalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}