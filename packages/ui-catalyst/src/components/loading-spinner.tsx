import { clsx } from '../utils/clsx'

const styles = {
  base: [
    // Base spinner styling
    'animate-spin',
    // Accessibility
    'inline-block',
  ],
  sizes: {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  },
  colors: {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-zinc-600 dark:text-zinc-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
    white: 'text-white',
    current: 'text-current',
  },
}

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: keyof typeof styles.sizes
  /** Color variant following Catalyst design system */
  color?: keyof typeof styles.colors
  /** Additional CSS classes */
  className?: string
  /** Optional text to display next to spinner */
  text?: string
  /** Whether to center the spinner */
  center?: boolean
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className, 
  text,
  center = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div 
      className={clsx(
        className,
        styles.base,
        styles.sizes[size],
        styles.colors[color]
      )}
      role="status"
      aria-label={text || "Loading"}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {/* Screen reader only text */}
      <span className="sr-only">{text || "Loading..."}</span>
    </div>
  )

  if (text) {
    return (
      <div className={clsx(
        'flex items-center gap-x-2',
        center && 'justify-center'
      )}>
        {spinner}
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{text}</span>
      </div>
    )
  }

  return (
    <div className={clsx(center && 'flex justify-center')}>
      {spinner}
    </div>
  )
}

// Legacy API compatibility - maps old sizes to new sizes
export interface LoadingSpinnerLegacyProps {
  /** @deprecated Use 'size' prop instead */
  size?: 'sm' | 'md' | 'lg'
  /** @deprecated Use 'color' prop instead */
  className?: string
  text?: string
  center?: boolean
}

export function LoadingSpinnerLegacy({ 
  size = 'md', 
  className, 
  text,
  center = false 
}: LoadingSpinnerLegacyProps) {
  // Map legacy sizes to Catalyst sizes
  const sizeMap = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
  }

  return (
    <LoadingSpinner
      size={sizeMap[size]}
      color="primary"
      className={className}
      text={text}
      center={center}
    />
  )
}