import React from 'react'
import { clsx } from '../utils/clsx'

const styles = {
  base: [
    // Base alert container
    'rounded-lg border px-4 py-3 text-sm',
    // Typography
    'leading-relaxed',
    // Accessibility
    'focus:outline-none',
  ],
  colors: {
    zinc: [
      'bg-zinc-50 text-zinc-900 border-zinc-200',
      'dark:bg-zinc-900/50 dark:text-zinc-100 dark:border-zinc-700',
    ],
    indigo: [
      'bg-indigo-50 text-indigo-900 border-indigo-200',
      'dark:bg-indigo-950/50 dark:text-indigo-100 dark:border-indigo-800',
    ],
    cyan: [
      'bg-cyan-50 text-cyan-900 border-cyan-200',
      'dark:bg-cyan-950/50 dark:text-cyan-100 dark:border-cyan-800',
    ],
    red: [
      'bg-red-50 text-red-900 border-red-200',
      'dark:bg-red-950/50 dark:text-red-100 dark:border-red-800',
    ],
    orange: [
      'bg-orange-50 text-orange-900 border-orange-200',
      'dark:bg-orange-950/50 dark:text-orange-100 dark:border-orange-800',
    ],
    amber: [
      'bg-amber-50 text-amber-900 border-amber-200',
      'dark:bg-amber-950/50 dark:text-amber-100 dark:border-amber-800',
    ],
    yellow: [
      'bg-yellow-50 text-yellow-900 border-yellow-200',
      'dark:bg-yellow-950/50 dark:text-yellow-100 dark:border-yellow-800',
    ],
    lime: [
      'bg-lime-50 text-lime-900 border-lime-200',
      'dark:bg-lime-950/50 dark:text-lime-100 dark:border-lime-800',
    ],
    green: [
      'bg-green-50 text-green-900 border-green-200',
      'dark:bg-green-950/50 dark:text-green-100 dark:border-green-800',
    ],
    emerald: [
      'bg-emerald-50 text-emerald-900 border-emerald-200',
      'dark:bg-emerald-950/50 dark:text-emerald-100 dark:border-emerald-800',
    ],
    teal: [
      'bg-teal-50 text-teal-900 border-teal-200',
      'dark:bg-teal-950/50 dark:text-teal-100 dark:border-teal-800',
    ],
    sky: [
      'bg-sky-50 text-sky-900 border-sky-200',
      'dark:bg-sky-950/50 dark:text-sky-100 dark:border-sky-800',
    ],
    blue: [
      'bg-blue-50 text-blue-900 border-blue-200',
      'dark:bg-blue-950/50 dark:text-blue-100 dark:border-blue-800',
    ],
    violet: [
      'bg-violet-50 text-violet-900 border-violet-200',
      'dark:bg-violet-950/50 dark:text-violet-100 dark:border-violet-800',
    ],
    purple: [
      'bg-purple-50 text-purple-900 border-purple-200',
      'dark:bg-purple-950/50 dark:text-purple-100 dark:border-purple-800',
    ],
    fuchsia: [
      'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200',
      'dark:bg-fuchsia-950/50 dark:text-fuchsia-100 dark:border-fuchsia-800',
    ],
    pink: [
      'bg-pink-50 text-pink-900 border-pink-200',
      'dark:bg-pink-950/50 dark:text-pink-100 dark:border-pink-800',
    ],
    rose: [
      'bg-rose-50 text-rose-900 border-rose-200',
      'dark:bg-rose-950/50 dark:text-rose-100 dark:border-rose-800',
    ],
  },
}

export interface AlertProps {
  /** The alert content */
  children: React.ReactNode
  /** Color variant following Catalyst design system */
  color?: keyof typeof styles.colors
  /** Additional CSS classes */
  className?: string
}

export function Alert({ 
  children, 
  color = 'zinc', 
  className 
}: AlertProps) {
  return (
    <div
      className={clsx(className, styles.base, styles.colors[color])}
      role="alert"
      aria-live="polite"
    >
      {children}
    </div>
  )
}

// Legacy API compatibility - maps old variants to new colors
export interface AlertLegacyProps {
  children: React.ReactNode
  className?: string
  /** @deprecated Use 'color' prop instead */
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'destructive'
}

export function AlertLegacy({ 
  children, 
  className, 
  variant = 'default' 
}: AlertLegacyProps) {
  // Map legacy variants to Catalyst colors
  const colorMap = {
    default: 'zinc' as const,
    info: 'blue' as const,
    success: 'green' as const,
    warning: 'yellow' as const,
    error: 'red' as const,
    destructive: 'red' as const,
  }

  return (
    <Alert
      color={colorMap[variant]}
      className={className}
    >
      {children}
    </Alert>
  )
}