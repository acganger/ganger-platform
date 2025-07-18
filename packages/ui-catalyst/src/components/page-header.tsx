'use client'

import React, { forwardRef } from 'react'
import { clsx } from '../utils/clsx'

// PageHeader styles
const pageHeaderStyles = {
  container: [
    'border-b border-zinc-950/5 dark:border-white/10',
    'bg-white dark:bg-zinc-900',
    'pb-6 mb-8',
  ],
  content: [
    'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
  ],
  header: [
    'flex flex-col sm:flex-row sm:items-center sm:justify-between',
    'gap-4',
  ],
  titleSection: [
    'min-w-0 flex-1',
  ],
  title: [
    'text-2xl font-bold leading-7',
    'text-zinc-900 dark:text-zinc-100',
    'sm:truncate sm:text-3xl sm:tracking-tight',
  ],
  subtitle: [
    'mt-1 text-sm leading-5',
    'text-zinc-500 dark:text-zinc-400',
  ],
  actions: [
    'flex items-center gap-3',
    'flex-shrink-0',
  ],
  breadcrumbs: [
    'mb-4',
    'flex items-center space-x-2 text-sm',
    'text-zinc-500 dark:text-zinc-400',
  ],
  breadcrumbLink: [
    'hover:text-zinc-700 dark:hover:text-zinc-200',
    'transition-colors duration-200',
  ],
  breadcrumbSeparator: [
    'text-zinc-300 dark:text-zinc-600',
  ],
  badges: [
    'mt-2 flex flex-wrap gap-2',
  ],
  stats: [
    'mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4',
  ],
  variants: {
    default: {
      container: '',
      header: '',
      titleSection: '',
    },
    minimal: {
      container: 'border-b-0 pb-4 mb-4',
      header: '',
      titleSection: '',
    },
    centered: {
      container: '',
      header: 'flex-col items-center text-center',
      titleSection: 'text-center',
    },
  }
}

// Breadcrumb item interface
export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

// Stat item interface
export interface StatItem {
  label: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
}

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Page title */
  title: string
  /** Optional subtitle/description */
  subtitle?: string
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[]
  /** Action buttons/elements in the header */
  actions?: React.ReactNode
  /** Badge elements */
  badges?: React.ReactNode
  /** Statistics to display */
  stats?: StatItem[]
  /** Visual variant */
  variant?: 'default' | 'minimal' | 'centered'
  /** Additional CSS classes */
  className?: string
  /** Loading state */
  loading?: boolean
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  function PageHeader({
    title,
    subtitle,
    breadcrumbs,
    actions,
    badges,
    stats,
    variant = 'default',
    className,
    loading = false,
    ...props
  }, ref) {
    
    const variantStyles = pageHeaderStyles.variants[variant]
    
    if (loading) {
      return (
        <div
          ref={ref}
          className={clsx(
            pageHeaderStyles.container,
            variantStyles.container,
            'animate-pulse',
            className
          )}
          {...props}
        >
          <div className={clsx(pageHeaderStyles.content)}>
            {breadcrumbs && (
              <div className={clsx(pageHeaderStyles.breadcrumbs)}>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
              </div>
            )}
            
            <div className={clsx(pageHeaderStyles.header, variantStyles.header)}>
              <div className={clsx(pageHeaderStyles.titleSection, variantStyles.titleSection)}>
                <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-48 mb-2" />
                {subtitle && (
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-64" />
                )}
              </div>
              
              {actions && (
                <div className={clsx(pageHeaderStyles.actions)}>
                  <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded w-24" />
                </div>
              )}
            </div>
            
            {stats && (
              <div className={clsx(pageHeaderStyles.stats)}>
                {Array.from({ length: Math.min(4, stats.length) }, (_, i) => (
                  <div key={i} className="h-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }
    
    return (
      <div
        ref={ref}
        className={clsx(
          pageHeaderStyles.container,
          variantStyles.container,
          className
        )}
        {...props}
      >
        <div className={clsx(pageHeaderStyles.content)}>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className={clsx(pageHeaderStyles.breadcrumbs)} aria-label="Breadcrumb">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <span className={clsx(pageHeaderStyles.breadcrumbSeparator)} aria-hidden="true">
                      /
                    </span>
                  )}
                  {item.href || item.onClick ? (
                    <button
                      className={clsx(pageHeaderStyles.breadcrumbLink)}
                      onClick={item.onClick}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          
          <div className={clsx(pageHeaderStyles.header, variantStyles.header)}>
            <div className={clsx(pageHeaderStyles.titleSection, variantStyles.titleSection)}>
              <h1 className={clsx(pageHeaderStyles.title)}>
                {title}
              </h1>
              {subtitle && (
                <p className={clsx(pageHeaderStyles.subtitle)}>
                  {subtitle}
                </p>
              )}
              {badges && (
                <div className={clsx(pageHeaderStyles.badges)}>
                  {badges}
                </div>
              )}
            </div>
            
            {actions && (
              <div className={clsx(pageHeaderStyles.actions)}>
                {actions}
              </div>
            )}
          </div>
          
          {stats && stats.length > 0 && (
            <div className={clsx(pageHeaderStyles.stats)}>
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4"
                >
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 flex items-baseline">
                    <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {stat.value}
                    </span>
                    {stat.trend && (
                      <span className={clsx(
                        'ml-2 flex items-baseline text-sm font-medium',
                        stat.trend.direction === 'up' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      )}>
                        {stat.trend.direction === 'up' ? (
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {stat.trend.value}%
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
)

// Legacy API compatibility
export interface PageHeaderLegacyProps {
  title: string
  subtitle?: string
  breadcrumbs?: { label: string; href?: string }[]
  actions?: React.ReactNode
  className?: string
}

export const PageHeaderLegacy = forwardRef<HTMLDivElement, PageHeaderLegacyProps>(
  function PageHeaderLegacy({
    breadcrumbs,
    ...props
  }, ref) {
    // Convert legacy breadcrumbs format
    const convertedBreadcrumbs = breadcrumbs?.map(item => ({
      label: item.label,
      href: item.href,
    }))
    
    return (
      <PageHeader
        ref={ref}
        breadcrumbs={convertedBreadcrumbs}
        {...props}
      />
    )
  }
)