'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

import { Button } from '@/components/pocket/Button'
import { Container } from '@/components/pocket/Container'
import { GangerLogo } from '@ganger/ui'
import { NavLinks } from '@/components/pocket/NavLinks'

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      className="block text-base/7 tracking-tight text-gray-700"
      onClick={onClick}
    >
      {children}
    </Link>
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header>
      <nav>
        <Container className="relative z-50 flex justify-between py-8">
          <div className="relative z-10 flex items-center gap-16">
            <Link href="/" aria-label="Home" className="flex items-center gap-2">
              <GangerLogo className="h-10 w-10" />
              <span className="text-xl font-bold text-slate-900">Check-In Kiosk</span>
            </Link>
            <div className="hidden lg:flex lg:gap-10">
              <NavLinks />
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Mobile menu button */}
            <button
              className="lg:hidden relative z-10 -m-2 inline-flex items-center rounded-lg stroke-gray-900 p-2 hover:bg-gray-200/50 hover:stroke-gray-600 active:stroke-gray-900"
              aria-label="Toggle site navigation"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Mobile menu */}
            <AnimatePresence initial={false}>
              {mobileMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-0 bg-gray-300/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -32 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      y: -32,
                      transition: { duration: 0.2 },
                    }}
                    className="absolute inset-x-0 top-0 z-0 origin-top rounded-b-2xl bg-gray-50 px-6 pt-32 pb-6 shadow-2xl shadow-gray-900/20 lg:hidden"
                  >
                    <div className="space-y-4">
                      <MobileNavLink 
                        href="/checkin" 
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Check In
                      </MobileNavLink>
                      <MobileNavLink 
                        href="/insurance" 
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Insurance
                      </MobileNavLink>
                      <MobileNavLink 
                        href="/payment" 
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Payment
                      </MobileNavLink>
                      <MobileNavLink 
                        href="/forms" 
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Forms
                      </MobileNavLink>
                      <MobileNavLink 
                        href="/help" 
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Help
                      </MobileNavLink>
                    </div>
                    <div className="mt-8 flex flex-col gap-4">
                      <Button href="/checkin" variant="outline">
                        Start Check-In
                      </Button>
                      <Button href="/emergency">Emergency</Button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-6 max-lg:hidden">
              <Button href="/checkin" variant="outline">
                Start Check-In
              </Button>
              <Button href="/emergency">Emergency</Button>
            </div>
          </div>
        </Container>
      </nav>
    </header>
  )
}