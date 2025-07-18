import React, { forwardRef } from 'react'
import { clsx } from '../utils/clsx'

const styles = {
  base: [
    // Base layout and typography
    'relative isolate inline-flex items-center justify-center gap-x-2 rounded-lg border text-base/6 font-semibold',
    // Sizing
    'px-[calc(0.875rem-1px)] py-[calc(0.625rem-1px)] sm:px-[calc(0.75rem-1px)] sm:py-[calc(0.375rem-1px)] sm:text-sm/6',
    // Focus
    'focus:outline-hidden focus:outline-2 focus:outline-offset-2 focus:outline-blue-500',
    // Disabled
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Icon sizing
    '[&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:self-center sm:[&>svg]:size-4',
  ],
  solid: [
    // Optical border as background
    'border-transparent',
    // Button background
    'before:absolute before:inset-0 before:-z-10 before:rounded-[calc(0.5rem-1px)] before:shadow-sm',
    // Dark mode border
    'dark:border-white/5',
    // Hover/active overlay
    'after:absolute after:inset-0 after:-z-10 after:rounded-[calc(0.5rem-1px)]',
    'after:shadow-[inset_0_1px_theme(colors.white/15%)]',
    'hover:after:bg-white/10 active:after:bg-white/10',
    'dark:after:-inset-px dark:after:rounded-lg',
    // Disabled
    'disabled:before:shadow-none disabled:after:shadow-none',
  ],
  outline: [
    'border-zinc-950/10 text-zinc-950 hover:bg-zinc-950/2.5 active:bg-zinc-950/2.5',
    'dark:border-white/15 dark:text-white dark:hover:bg-white/5 dark:active:bg-white/5',
  ],
  plain: [
    'border-transparent text-zinc-950 hover:bg-zinc-950/5 active:bg-zinc-950/5',
    'dark:text-white dark:hover:bg-white/10 dark:active:bg-white/10',
  ],
  sizes: {
    sm: 'px-[calc(0.75rem-1px)] py-[calc(0.5rem-1px)] text-sm sm:px-[calc(0.625rem-1px)] sm:py-[calc(0.25rem-1px)] sm:text-xs',
    md: 'px-[calc(0.875rem-1px)] py-[calc(0.625rem-1px)] text-base/6 sm:px-[calc(0.75rem-1px)] sm:py-[calc(0.375rem-1px)] sm:text-sm/6',
    lg: 'px-[calc(1rem-1px)] py-[calc(0.75rem-1px)] text-lg sm:px-[calc(0.875rem-1px)] sm:py-[calc(0.5rem-1px)] sm:text-base/6',
  },
  colors: {
    zinc: [
      'text-white before:bg-zinc-600 border-zinc-700/90',
      'dark:before:bg-zinc-600 dark:border-zinc-700/90',
    ],
    red: [
      'text-white before:bg-red-600 border-red-700/90',
      'dark:before:bg-red-600 dark:border-red-700/90',
    ],
    orange: [
      'text-white before:bg-orange-500 border-orange-600/90',
      'dark:before:bg-orange-500 dark:border-orange-600/90',
    ],
    amber: [
      'text-amber-950 before:bg-amber-400 border-amber-500/80',
      'dark:text-amber-100 dark:before:bg-amber-500 dark:border-amber-600/80',
    ],
    yellow: [
      'text-yellow-950 before:bg-yellow-300 border-yellow-400/80',
      'dark:text-yellow-100 dark:before:bg-yellow-400 dark:border-yellow-500/80',
    ],
    lime: [
      'text-lime-950 before:bg-lime-300 border-lime-400/80',
      'dark:text-lime-100 dark:before:bg-lime-400 dark:border-lime-500/80',
    ],
    green: [
      'text-white before:bg-green-600 border-green-700/90',
      'dark:before:bg-green-600 dark:border-green-700/90',
    ],
    emerald: [
      'text-white before:bg-emerald-600 border-emerald-700/90',
      'dark:before:bg-emerald-600 dark:border-emerald-700/90',
    ],
    teal: [
      'text-white before:bg-teal-600 border-teal-700/90',
      'dark:before:bg-teal-600 dark:border-teal-700/90',
    ],
    cyan: [
      'text-cyan-950 before:bg-cyan-300 border-cyan-400/80',
      'dark:text-cyan-100 dark:before:bg-cyan-400 dark:border-cyan-500/80',
    ],
    sky: [
      'text-white before:bg-sky-500 border-sky-600/80',
      'dark:before:bg-sky-500 dark:border-sky-600/80',
    ],
    blue: [
      'text-white before:bg-blue-600 border-blue-700/90',
      'dark:before:bg-blue-600 dark:border-blue-700/90',
    ],
    indigo: [
      'text-white before:bg-indigo-500 border-indigo-600/90',
      'dark:before:bg-indigo-500 dark:border-indigo-600/90',
    ],
    violet: [
      'text-white before:bg-violet-500 border-violet-600/90',
      'dark:before:bg-violet-500 dark:border-violet-600/90',
    ],
    purple: [
      'text-white before:bg-purple-500 border-purple-600/90',
      'dark:before:bg-purple-500 dark:border-purple-600/90',
    ],
    fuchsia: [
      'text-white before:bg-fuchsia-500 border-fuchsia-600/90',
      'dark:before:bg-fuchsia-500 dark:border-fuchsia-600/90',
    ],
    pink: [
      'text-white before:bg-pink-500 border-pink-600/90',
      'dark:before:bg-pink-500 dark:border-pink-600/90',
    ],
    rose: [
      'text-white before:bg-rose-500 border-rose-600/90',
      'dark:before:bg-rose-500 dark:border-rose-600/90',
    ],
  }
}

// Define the color type separately to avoid conflicts
type ButtonColor = 'zinc' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Color variant for solid buttons */
  color?: ButtonColor
  /** Whether to use outline style */
  outline?: boolean
  /** Whether to use plain (ghost) style */
  plain?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether button is in loading state */
  loading?: boolean
  /** Whether button should take full width */
  fullWidth?: boolean
  /** Icon to show on the left */
  leftIcon?: React.ReactNode
  /** Icon to show on the right */
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({
    color = 'zinc',
    outline = false,
    plain = false,
    size = 'md',
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    ...props
  }, ref) {
    const isDisabled = disabled || loading

    const buttonClasses = clsx(
      className,
      styles.base,
      styles.sizes[size],
      fullWidth && 'w-full',
      outline 
        ? styles.outline 
        : plain 
          ? styles.plain 
          : [styles.solid, styles.colors[color]]
    )

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={buttonClasses}
        {...props}
      >
        {/* Touch target for mobile accessibility */}
        <span
          className="absolute top-1/2 left-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 [@media(pointer:fine)]:hidden"
          aria-hidden="true"
        />
        
        {loading && (
          <svg 
            className="size-4 animate-spin sm:size-3.5" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="none" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
        )}
        
        {!loading && leftIcon && (
          <span aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {children}
        
        {!loading && rightIcon && (
          <span aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    )
  }
)

// Legacy API compatibility
export interface ButtonLegacyProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** @deprecated Use 'color' prop instead */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether button is in loading state */
  loading?: boolean
  /** Whether button should take full width */
  fullWidth?: boolean
  /** Icon to show on the left */
  leftIcon?: React.ReactNode
  /** Icon to show on the right */
  rightIcon?: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

export const ButtonLegacy = forwardRef<HTMLButtonElement, ButtonLegacyProps>(
  function ButtonLegacy({
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    ...props
  }, ref) {
    // Map legacy variants to new color system
    const getButtonProps = (): Partial<Pick<ButtonProps, 'color' | 'outline' | 'plain'>> => {
      switch (variant) {
        case 'primary':
          return { color: 'blue' }
        case 'secondary':
          return { color: 'zinc' }
        case 'outline':
          return { outline: true }
        case 'ghost':
          return { plain: true }
        case 'destructive':
        case 'danger':
          return { color: 'red' }
        default:
          return { color: 'blue' }
      }
    }

    const buttonProps = getButtonProps()
    
    // Exclude conflicting props
    const { color: _, ...restProps } = props
    
    return (
      <Button
        ref={ref}
        {...buttonProps}
        size={size}
        loading={loading}
        fullWidth={fullWidth}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        className={className}
        disabled={disabled}
        {...restProps}
      >
        {children}
      </Button>
    )
  }
)

ButtonLegacy.displayName = 'ButtonLegacy'