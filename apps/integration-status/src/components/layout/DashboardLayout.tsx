'use client'

import { ReactNode } from 'react'
import { ErrorBoundary } from '@/components/errors/ErrorBoundary'

interface DashboardLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  showSidebar?: boolean
}

export function DashboardLayout({ 
  children, 
  sidebar, 
  showSidebar = false 
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        {showSidebar && sidebar && (
          <div className="hidden lg:flex lg:flex-shrink-0">
            <div className="flex flex-col w-64 bg-white border-r border-gray-200">
              <ErrorBoundary
                fallback={
                  <div className="p-4 text-center text-gray-500">
                    <p>Sidebar failed to load</p>
                  </div>
                }
              >
                {sidebar}
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  )
}