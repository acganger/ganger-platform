'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  Target, 
  Users, 
  TrendingUp,
  Menu,
  X,
  Shield,
  Award,
  FileText,
  AlertTriangle
} from 'lucide-react'

import { Container } from '@/components/compass/Container'
import { Button } from '@/components/compass/Button'
import { GangerLogo } from '@ganger/ui'

const navigation = [
  { name: 'Training Modules', href: '/modules', icon: BookOpen },
  { name: 'Compliance Tracking', href: '/tracking', icon: Target },
  { name: 'Certifications', href: '/certifications', icon: Award },
  { name: 'Assessments', href: '/assessments', icon: CheckSquare },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Audits', href: '/audits', icon: Shield },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
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
              <div className="flex items-center gap-2">
                <GangerLogo className="h-6 w-6" />
                <h1 className="text-lg font-semibold text-gray-900">Compliance Training</h1>
              </div>
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
          <div className="flex h-16 shrink-0 items-center gap-2">
            <GangerLogo className="h-8 w-8" />
            <h1 className="text-xl font-semibold text-gray-900">Compliance Training</h1>
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
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="flex items-center gap-x-3">
                    <Shield className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Compliance Status</h3>
                      <p className="text-xs text-gray-600">94% organization compliance</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button variant="primary" className="w-full">
                      View Dashboard
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
            Compliance Training Management
          </h2>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Q1 2024 Training Cycle</span>
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-green-600">On Schedule</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ComplianceCompassLayout({
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