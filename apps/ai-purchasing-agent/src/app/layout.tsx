import { Inter } from 'next/font/google'
import { AuthProvider } from '@ganger/auth'
import { StaffPortalLayout } from '@ganger/ui'
import { CartProvider } from '@/contexts/CartContext'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'AI Purchasing Agent | Ganger Platform',
  description: 'AI-powered medical supply procurement optimization',
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
          <CartProvider>
            <StaffPortalLayout 
              currentApp="AI Purchasing Agent"
              appDescription="AI-powered medical supply procurement optimization"
            >
              {children}
            </StaffPortalLayout>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}