import { StaffPortalLayout } from "@ganger/ui/staff";
import { AuthProvider } from "@ganger/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "[APP_NAME] - Ganger Platform",
  description: "[APP_DESCRIPTION]",
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
          <StaffPortalLayout currentApp="[APP_SLUG]">
            {children}
          </StaffPortalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
