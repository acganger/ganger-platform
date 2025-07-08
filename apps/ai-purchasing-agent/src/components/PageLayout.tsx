import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { AuthUser } from '@ganger/auth'

interface Breadcrumb {
  label: string
  href: string
}

interface PageLayoutProps {
  title: string
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
  children: React.ReactNode
  user?: AuthUser | null
}

export function PageLayout({ 
  title, 
  breadcrumbs = [], 
  actions, 
  children 
}: PageLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={breadcrumb.href} className="inline-flex items-center">
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                  )}
                  <Link
                    href={breadcrumb.href}
                    className={`text-sm ${
                      index === breadcrumbs.length - 1
                        ? 'text-gray-500 cursor-default'
                        : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    {breadcrumb.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Title and Actions */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {actions && <div>{actions}</div>}
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  )
}