// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
export const dynamic = 'force-dynamic';

import { StaffPortalLayout } from '@ganger/ui';
import { AuthProvider } from '@ganger/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clinical Staffing - Ganger Platform',
  description: 'Clinical support staffing optimization and scheduling for Ganger Dermatology',
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
          <StaffPortalLayout currentApp="staffing">
            {children}
          </StaffPortalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}