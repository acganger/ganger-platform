import { AuthProvider } from '@ganger/auth';
import { StaffPortalLayout } from '@ganger/ui/staff';
import './globals.css';

export const metadata = {
  title: 'Checkout Slip Printing - Ganger Platform',
  description: 'Intelligent thermal checkout slip printing system',
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
          <StaffPortalLayout currentApp="checkout-slips">
            {children}
          </StaffPortalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}