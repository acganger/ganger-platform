'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  BarChart3, 
  Calendar, 
  CheckSquare, 
  Target, 
  Users, 
  TrendingUp,
  Menu,
  X,
  Play
} from 'lucide-react'

import { Container } from '@/components/compass/Container'
import { Button } from '@/components/compass/Button'

const navigation = [
  { name: 'Scorecard', href: '/scorecard', icon: BarChart3 },
  { name: 'Rock Review', href: '/rocks', icon: Target },
  { name: 'Headlines', href: '/headlines', icon: TrendingUp },
  { name: 'To-Do List', href: '/todos', icon: CheckSquare },
  { name: 'IDS', href: '/issues', icon: Users },
  { name: 'Meetings', href: '/meetings', icon: Calendar },
]

function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) {
  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white px-6 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">EOS L10</h1>
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            <nav className="mt-6">
              <ul className="space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 ring-1 ring-gray-900/5">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-semibold text-gray-900">EOS L10 Platform</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-center gap-x-3">
                    <Play className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Weekly L10</h3>
                      <p className="text-xs text-gray-600">Next meeting in 2 days</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button variant="primary" className="w-full">
                      Start Meeting
                    </Button>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}

function Header({ setIsOpen }: { setIsOpen: (open: boolean) => void }) {
  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1 items-center">
          <h2 className="text-sm font-semibold leading-6 text-gray-900">
            Team Performance Dashboard
          </h2>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Week of Jan 15, 2024</span>
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-green-600">On Track</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EOSCompassLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="lg:pl-72">
        <Header setIsOpen={setSidebarOpen} />
        
        <main className="py-10">
          <Container>
            {children}
          </Container>
        </main>
      </div>
    </div>
  )
}