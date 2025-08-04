import React from 'react'
import { cn } from '../utils/cn'

/**
 * Props for the Alert component
 */
export interface AlertProps {
  /**
   * Content to display in the alert
   */
  children: React.ReactNode
  
  /**
   * Visual style variant of the alert
   * @default 'default'
   * - default: Gray background for general messages
   * - info: Blue background for informational messages
   * - success: Green background for success messages
   * - warning: Yellow background for warning messages
   * - error/destructive: Red background for error messages
   */
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'destructive'
  
  /**
   * Additional CSS classes to apply
   */
  className?: string
}

const variantStyles = {
  default: 'bg-gray-50 text-gray-900 border-gray-200',
  info: 'bg-blue-50 text-blue-900 border-blue-200',
  success: 'bg-green-50 text-green-900 border-green-200',
  warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
  error: 'bg-red-50 text-red-900 border-red-200',
  destructive: 'bg-red-50 text-red-900 border-red-200',
}

/**
 * Alert component for displaying messages
 * 
 * @description
 * A simple alert component for displaying informational, success, warning,
 * or error messages. Includes appropriate ARIA role for accessibility.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Alert>This is a default alert message</Alert>
 * 
 * // Different variants
 * <Alert variant="info">New feature available!</Alert>
 * <Alert variant="success">Operation completed successfully</Alert>
 * <Alert variant="warning">Please review your changes</Alert>
 * <Alert variant="error">Something went wrong</Alert>
 * 
 * // With custom content
 * <Alert variant="info">
 *   <div className="flex items-center gap-2">
 *     <InfoIcon className="w-4 h-4" />
 *     <span>Click here to learn more</span>
 *   </div>
 * </Alert>
 * ```
 * 
 * @component
 */
export function Alert({ children, variant = 'default', className }: AlertProps) {
  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 text-sm',
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      {children}
    </div>
  )
}