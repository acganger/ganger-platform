'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { Popover, Transition } from '@headlessui/react'
import clsx from 'clsx'
import { GangerLogo } from '@ganger/ui'

import { Button } from '@/components/salient/Button'
import { Container } from '@/components/salient/Container'

function MobileNavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Popover.Button as={Link} href={href} className="block w-full p-2">
      {children}
    </Popover.Button>
  )
}

function MobileNavIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 overflow-visible stroke-slate-700"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path
        d="M0 1H14M0 7H14M0 13H14"
        className={clsx(
          'origin-center transition',
          open && 'scale-90 opacity-0',
        )}
      />
      <path
        d="M2 2L12 12M12 2L2 12"
        className={clsx(
          'origin-center transition',
          !open && 'scale-90 opacity-0',
        )}
      />
    </svg>
  )
}

function MobileNavigation() {
  return (
    <Popover>
      <Popover.Button
        className="relative z-10 flex h-8 w-8 items-center justify-center ui-not-focus-visible:outline-none"
        aria-label="Toggle navigation"
      >
        {({ open }) => <MobileNavIcon open={open} />}
      </Popover.Button>
      <Transition.Root>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-150 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Popover.Overlay className="fixed inset-0 bg-slate-300/50" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-100 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Popover.Panel className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-white p-4 text-lg tracking-tight text-slate-900 shadow-xl ring-1 ring-slate-900/5">
            <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
            <MobileNavLink href="/create">New Authorization</MobileNavLink>
            <MobileNavLink href="/track">Track Status</MobileNavLink>
            <MobileNavLink href="/analytics">Analytics</MobileNavLink>
          </Popover.Panel>
        </Transition.Child>
      </Transition.Root>
    </Popover>
  )
}

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-block rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </Link>
  )
}

function Header() {
  return (
    <header className="py-10">
      <Container>
        <nav className="relative z-50 flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <Link href="/" aria-label="Home">
              <GangerLogo size="lg" />
            </Link>
            <div className="hidden md:flex md:gap-x-6">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/create">New Authorization</NavLink>
              <NavLink href="/track">Track Status</NavLink>
              <NavLink href="/analytics">Analytics</NavLink>
            </div>
          </div>
          <div className="flex items-center gap-x-5 md:gap-x-8">
            <div className="hidden md:block">
              <NavLink href="/auth/login">Sign in</NavLink>
            </div>
            <Button href="/create" color="primary">
              <span>
                Create Authorization <span className="hidden lg:inline">Request</span>
              </span>
            </Button>
            <div className="-mr-1 md:hidden">
              <MobileNavigation />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-50">
      <Container>
        <div className="py-16">
          <div className="flex flex-col items-center border-t border-slate-400/10 pt-8 sm:flex-row-reverse sm:justify-between">
            <div className="flex gap-x-6">
              <Link
                href="/privacy"
                className="group inline-flex items-center justify-center rounded-full py-2 px-3 text-sm outline-offset-2 transition hover:bg-slate-100"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="group inline-flex items-center justify-center rounded-full py-2 px-3 text-sm outline-offset-2 transition hover:bg-slate-100"
              >
                Terms of Service
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-500 sm:mt-0">
              Copyright &copy; {new Date().getFullYear()} Ganger Dermatology. All rights reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}

export function MedicationAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="flex-auto">{children}</main>
      <Footer />
    </>
  )
}