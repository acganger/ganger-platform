'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { GangerLogo } from '@ganger/ui'

import { Container } from '@/components/protocol/Container'
import { Navigation } from '@/components/protocol/Navigation'

function Header() {
  return (
    <div className="flex flex-wrap items-center justify-between px-4 py-5 shadow-md shadow-slate-900/5 transition duration-500 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
      <div className="mr-6 flex lg:hidden">
        <Link href="/" aria-label="Home">
          <GangerLogo size="sm" />
        </Link>
      </div>
      <div className="relative flex flex-grow basis-0 items-center">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-5 w-5 text-slate-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <input
          type="search"
          placeholder="Search batch processes..."
          className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
        />
      </div>
      <div className="relative flex basis-0 justify-end gap-6 sm:gap-8 md:flex-grow">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600 dark:text-slate-400">Batch Closeout System</span>
        </div>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="mx-auto max-w-2xl space-y-10 pb-16 lg:max-w-5xl">
      <div className="flex flex-col items-center justify-between gap-5 border-t border-slate-900/5 pt-8 dark:border-white/5 sm:flex-row">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Copyright &copy; {new Date().getFullYear()} Ganger Dermatology. All rights reserved.
        </p>
        <div className="flex gap-x-6">
          <Link
            href="/privacy"
            className="text-xs text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-xs text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  )
}

export function BatchProtocolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full lg:ml-72 xl:ml-80">
      <motion.header
        layoutScroll
        className="contents lg:pointer-events-none lg:fixed lg:inset-0 lg:z-40 lg:flex"
      >
        <div className="contents lg:pointer-events-auto lg:block lg:w-72 lg:overflow-y-auto lg:border-r lg:border-zinc-900/10 lg:px-6 lg:pt-4 lg:pb-8 xl:w-80 lg:dark:border-white/10">
          <div className="hidden lg:flex">
            <Link href="/" aria-label="Home">
              <GangerLogo size="md" />
            </Link>
          </div>
          <div className="mt-8">
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white">
              Batch Closeout
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Financial processing documentation
            </p>
          </div>
          <Navigation className="mt-10" />
        </div>
      </motion.header>
      <div className="relative flex h-full flex-col px-4 pt-14 sm:px-6 lg:px-8">
        <Header />
        <main className="flex-auto">
          <Container className="py-16">{children}</Container>
        </main>
        <Footer />
      </div>
    </div>
  )
}