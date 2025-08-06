import React from 'react'
import { clsx } from '../utils/clsx'

const styles = {
  base: [
    // Base progress container
    'relative h-2 w-full overflow-hidden rounded-full bg-zinc-200',
    // Dark mode
    'dark:bg-zinc-800',
  ],
  bar: [
    // Base progress bar
    'h-full transition-all duration-300 ease-in-out',
    // Smooth animations
    'transition-[width]',
  ],
  colors: {
    zinc: [
      'bg-zinc-600',
      'dark:bg-zinc-400',
    ],
    indigo: [
      'bg-indigo-600',
      'dark:bg-indigo-500',
    ],
    cyan: [
      'bg-cyan-500',
      'dark:bg-cyan-400',
    ],
    red: [
      'bg-red-600',
      'dark:bg-red-500',
    ],
    orange: [
      'bg-orange-500',
      'dark:bg-orange-400',
    ],
    amber: [
      'bg-amber-500',
      'dark:bg-amber-400',
    ],
    yellow: [
      'bg-yellow-500',
      'dark:bg-yellow-400',
    ],
    lime: [
      'bg-lime-500',
      'dark:bg-lime-400',
    ],
    green: [
      'bg-green-600',
      'dark:bg-green-500',
    ],
    emerald: [
      'bg-emerald-600',
      'dark:bg-emerald-500',
    ],
    teal: [
      'bg-teal-600',
      'dark:bg-teal-500',
    ],
    sky: [
      'bg-sky-500',
      'dark:bg-sky-400',
    ],
    blue: [
      'bg-blue-600',
      'dark:bg-blue-500',
    ],
    violet: [
      'bg-violet-500',
      'dark:bg-violet-400',
    ],
    purple: [
      'bg-purple-500',
      'dark:bg-purple-400',
    ],
    fuchsia: [
      'bg-fuchsia-500',
      'dark:bg-fuchsia-400',
    ],
    pink: [
      'bg-pink-500',
      'dark:bg-pink-400',
    ],
    rose: [
      'bg-rose-500',
      'dark:bg-rose-400',
    ],
  },
}

export interface ProgressProps {
  /** The progress value (0-100) */
  value: number
  /** Maximum value (defaults to 100) */
  max?: number
  /** Additional CSS classes */
  className?: string
  /** Color variant following Catalyst design system */
  color?: keyof typeof styles.colors
}

export function Progress({ 
  value, 
  max = 100, 
  className, 
  color = 'blue' 
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      className={clsx(className, styles.base)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`Progress: ${Math.round(percentage)}%`}
    >
      <div
        className={clsx(styles.bar, styles.colors[color])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// Legacy API compatibility - maps old variants to new colors
export interface ProgressLegacyProps {
  value: number
  max?: number
  className?: string
  /** @deprecated Use 'color' prop instead */
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function ProgressLegacy({ 
  value, 
  max = 100, 
  className, 
  variant = 'default' 
}: ProgressLegacyProps) {
  // Map legacy variants to Catalyst colors
  const colorMap = {
    default: 'blue' as const,
    success: 'green' as const,
    warning: 'yellow' as const,
    danger: 'red' as const,
  }

  return (
    <Progress
      value={value}
      max={max}
      className={className}
      color={colorMap[variant]}
    />
  )
}