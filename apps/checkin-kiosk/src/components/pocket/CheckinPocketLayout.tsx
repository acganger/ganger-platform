import { Footer } from '@/components/pocket/Footer'
import { Header } from '@/components/pocket/Header'

export function CheckinPocketLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-auto">{children}</main>
      <Footer />
    </>
  )
}