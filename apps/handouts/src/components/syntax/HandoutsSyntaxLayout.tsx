'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Search, Github, FileText } from 'lucide-react'

import { GangerLogo } from '@ganger/ui'
import { MobileNavigation } from '@/components/syntax/MobileNavigation'
import { Navigation } from '@/components/syntax/Navigation'

function Header() {
  let [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 flex flex-none flex-wrap items-center justify-between bg-white px-4 py-5 shadow-md shadow-slate-900/5 transition duration-500 sm:px-6 lg:px-8 dark:shadow-none',
        isScrolled
          ? 'dark:bg-slate-900/95 dark:backdrop-blur-sm dark:[@supports(backdrop-filter:blur(0))]:bg-slate-900/75'
          : 'dark:bg-transparent',
      )}
    >
      <div className="mr-6 flex lg:hidden">
        <MobileNavigation />
      </div>
      <div className="relative flex grow basis-0 items-center">
        <Link href="/" aria-label="Home page" className="flex items-center gap-2">
          <GangerLogo className="h-8 w-8" />
          <span className="hidden text-xl font-bold text-slate-900 lg:block dark:text-white">
            Patient Handouts
          </span>
        </Link>
      </div>
      <div className="-my-5 mr-6 sm:mr-8 md:mr-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 fill-slate-400" />
          <input
            type="text"
            placeholder="Search handouts..."
            className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder-slate-500 focus:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-300/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400 dark:focus:border-sky-400"
          />
        </div>
      </div>
      <div className="relative flex basis-0 justify-end gap-6 sm:gap-8 md:grow">
        <Link href="https://docs.gangerdermatology.com" className="group" aria-label="Documentation">
          <FileText className="h-6 w-6 fill-slate-400 group-hover:fill-slate-500 dark:group-hover:fill-slate-300" />
        </Link>
      </div>
    </header>
  )
}

export function HandoutsSyntaxLayout({ children }: { children: React.ReactNode }) {
  let pathname = usePathname()
  let isHomePage = pathname === '/'

  return (
    <div className="flex w-full flex-col">
      <Header />

      <div className="relative mx-auto flex w-full max-w-8xl flex-auto justify-center sm:px-2 lg:px-8 xl:px-12">
        <div className="hidden lg:relative lg:block lg:flex-none">
          <div className="absolute inset-y-0 right-0 w-[50vw] bg-slate-50 dark:hidden" />
          <div className="absolute top-16 right-0 bottom-0 hidden h-12 w-px bg-gradient-to-t from-slate-800 dark:block" />
          <div className="absolute top-28 right-0 bottom-0 hidden w-px bg-slate-800 dark:block" />
          <div className="sticky top-[4.75rem] -ml-0.5 h-[calc(100vh-4.75rem)] w-64 overflow-x-hidden overflow-y-auto py-16 pr-8 pl-0.5 xl:w-72 xl:pr-16">
            <Navigation />
          </div>
        </div>
        <div className="min-w-0 max-w-2xl flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
          <article>
            {children}
          </article>
        </div>
      </div>
    </div>
  )
}