import { Inter } from 'next/font/google'
import { AuthProvider } from '@ganger/auth'
import { StaffPortalLayout } from '@ganger/ui'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Consolidated Order Form | Ganger Platform',
  description: 'Standardized medical supply ordering for clinical staff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <StaffPortalLayout 
            currentApp="Order Supplies"
            appDescription="Standardized medical supply ordering for clinical staff"
          >
            {children}
          </StaffPortalLayout>
        </AuthProvider>
      </body>
    </html>
  )
}