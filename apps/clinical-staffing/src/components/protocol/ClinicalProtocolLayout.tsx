'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Bell, Search, Users } from 'lucide-react'

import { GangerLogo } from '@ganger/ui'
import { Navigation } from '@/components/protocol/Navigation'
import { Container } from '@/components/protocol/Container'

function Header({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
            placeholder="Search staff, schedules, assignments..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          <div className="flex items-center gap-x-3">
            <span className="text-sm font-semibold leading-6 text-gray-900">Clinical Staffing</span>
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-600">System Online</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Sidebar({ 
  sidebarOpen, 
  setSidebarOpen 
}: { 
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void 
}) {
  return (
    <>
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <GangerLogo className="h-8 w-auto" />
              <span className="ml-2 text-lg font-semibold text-gray-900">Clinical Staffing</span>
              <button
                type="button"
                className="ml-auto -m-2.5 p-2.5 text-gray-700"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <nav className="mt-8">
              <Navigation />
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <GangerLogo className="h-8 w-auto" />
            <span className="ml-2 text-lg font-semibold text-gray-900">Clinical Staffing</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <Navigation />
            
            {/* Bottom section */}
            <div className="mt-auto">
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Staff on Duty</p>
                    <p className="text-sm text-gray-600">24 active • 3 on break</p>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}

export function ClinicalProtocolLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="lg:pl-72">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="py-10">
          <Container>{children}</Container>
        </main>
      </div>
    </div>
  )
}