import React, { forwardRef } from 'react'
import { clsx } from '../utils/clsx'

// Card container styles
const cardStyles = {
  base: [
    // Base layout and typography
    'relative overflow-hidden',
    'bg-white dark:bg-zinc-900',
    'text-zinc-950 dark:text-white',
    // Border
    'ring-1 ring-zinc-950/5 dark:ring-white/10',
    // Shadow
    'shadow-sm',
  ],
  interactive: [
    // Hover state
    'transition-all duration-200',
    'hover:shadow-md hover:ring-zinc-950/10 dark:hover:ring-white/20',
    'cursor-pointer',
  ],
  disabled: [
    'opacity-50 cursor-not-allowed',
  ],
  padding: {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
  rounded: {
    none: 'rounded-none',
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
  },
}

// Header styles
const headerStyles = {
  base: [
    'flex flex-col space-y-1.5',
  ],
  withBorder: 'pb-6 mb-6 border-b border-zinc-200 dark:border-zinc-800',
  noBorder: 'pb-4 mb-4',
}

// Title styles
const titleStyles = {
  base: [
    'font-semibold leading-none tracking-tight',
    'text-zinc-900 dark:text-zinc-100',
  ],
  size: {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  },
}

// Description styles
const descriptionStyles = [
  'text-sm text-zinc-600 dark:text-zinc-400',
  'mt-1',
]

// Content styles
const contentStyles = [
  'text-zinc-700 dark:text-zinc-300',
]

// Footer styles
const footerStyles = {
  base: [
    'flex items-center',
  ],
  withBorder: 'pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800',
  noBorder: 'pt-4 mt-4',
}

// Card Component
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  /** Whether the card is disabled */
  disabled?: boolean
  /** Whether the card is interactive (clickable) */
  interactive?: boolean
  /** Additional CSS classes */
  className?: string
  /** Card content */
  children: React.ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({
    padding = 'md',
    rounded = 'md',
    disabled = false,
    interactive = false,
    className,
    children,
    onClick,
    ...props
  }, ref) {
    const isClickable = interactive || !!onClick
    
    return (
      <div
        ref={ref}
        className={clsx(
          cardStyles.base,
          cardStyles.padding[padding],
          cardStyles.rounded[rounded],
          isClickable && !disabled && cardStyles.interactive,
          disabled && cardStyles.disabled,
          className
        )}
        onClick={isClickable && !disabled ? onClick : undefined}
        {...props}
      >
        {children}
      </div>
    )
  }
)

// CardHeader Component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show a border below the header */
  border?: boolean
  /** Additional CSS classes */
  className?: string
  /** Header content */
  children: React.ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({
    border = false,
    className,
    children,
    ...props
  }, ref) {
    return (
      <div
        ref={ref}
        className={clsx(
          headerStyles.base,
          border ? headerStyles.withBorder : headerStyles.noBorder,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

// CardTitle Component
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Title size */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Title text */
  children: React.ReactNode
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  function CardTitle({
    size = 'md',
    className,
    children,
    ...props
  }, ref) {
    return (
      <h3
        ref={ref}
        className={clsx(
          titleStyles.base,
          titleStyles.size[size],
          className
        )}
        {...props}
      >
        {children}
      </h3>
    )
  }
)

// CardDescription Component
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Additional CSS classes */
  className?: string
  /** Description text */
  children: React.ReactNode
}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  function CardDescription({
    className,
    children,
    ...props
  }, ref) {
    return (
      <p
        ref={ref}
        className={clsx(descriptionStyles, className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)

// CardContent Component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string
  /** Content */
  children: React.ReactNode
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  function CardContent({
    className,
    children,
    ...props
  }, ref) {
    return (
      <div
        ref={ref}
        className={clsx(contentStyles, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

// CardFooter Component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show a border above the footer */
  border?: boolean
  /** Additional CSS classes */
  className?: string
  /** Footer content */
  children: React.ReactNode
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter({
    border = false,
    className,
    children,
    ...props
  }, ref) {
    return (
      <div
        ref={ref}
        className={clsx(
          footerStyles.base,
          border ? footerStyles.withBorder : footerStyles.noBorder,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

// Legacy API compatibility
export interface CardLegacyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
  rounded?: 'none' | 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export const CardLegacy = forwardRef<HTMLDivElement, CardLegacyProps>(
  function CardLegacy({
    padding = 'md',
    shadow = 'sm', // Ignored in Catalyst design
    border = true, // Ignored - always has subtle border
    rounded = 'md',
    disabled = false,
    onClick,
    ...props
  }, ref) {
    return (
      <Card
        ref={ref}
        padding={padding}
        rounded={rounded}
        disabled={disabled}
        interactive={!!onClick}
        onClick={onClick}
        {...props}
      />
    )
  }
)

// Legacy header with automatic border detection
export const CardHeaderLegacy = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeaderLegacy(props, ref) {
    // In legacy API, headers with CardFooter siblings typically had borders
    return <CardHeader ref={ref} border={true} {...props} />
  }
)

// Legacy footer with automatic border detection
export const CardFooterLegacy = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooterLegacy(props, ref) {
    // In legacy API, footers typically had borders
    return <CardFooter ref={ref} border={true} {...props} />
  }
)

// Re-export other components for legacy compatibility
export { CardTitle as CardTitleLegacy } from './card'
export { CardDescription as CardDescriptionLegacy } from './card'
export { CardContent as CardContentLegacy } from './card'