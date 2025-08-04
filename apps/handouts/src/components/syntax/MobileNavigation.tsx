'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Navigation } from './Navigation'

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative z-10 flex h-8 w-8 items-center justify-center ui-not-focus-visible:outline-none"
        aria-label="Toggle navigation"
      >
        <Menu className="h-6 w-6 stroke-slate-500" />
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start overflow-y-auto bg-slate-900/50 pr-10 backdrop-blur lg:hidden"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="min-h-full w-full max-w-xs bg-white px-4 pt-5 pb-12 dark:bg-slate-900 sm:px-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="relative z-10 flex h-8 w-8 items-center justify-center ui-not-focus-visible:outline-none"
                aria-label="Close navigation"
              >
                <X className="h-6 w-6 stroke-slate-500" />
              </button>
              <Link href="/" className="ml-4" onClick={() => setIsOpen(false)}>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  Handouts
                </span>
              </Link>
            </div>
            <div className="mt-8">
              <Navigation />
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}