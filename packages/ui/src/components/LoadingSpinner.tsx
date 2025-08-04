import React from 'react';
import { cn } from '../utils/cn';

/**
 * Props for the LoadingSpinner component
 */
interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default 'md'
   * - sm: 16x16px
   * - md: 24x24px
   * - lg: 32x32px
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  
  /**
   * Optional text to display next to the spinner
   */
  text?: string;
  
  /**
   * Whether to center the spinner in its container
   * @default false
   */
  center?: boolean;
}

/**
 * LoadingSpinner component for loading states
 * 
 * @description
 * An animated spinning indicator used to show loading states. Can be displayed
 * alone or with accompanying text. Supports multiple sizes and centering options.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingSpinner />
 * 
 * // Different sizes
 * <LoadingSpinner size="sm" />
 * <LoadingSpinner size="lg" />
 * 
 * // With text
 * <LoadingSpinner text="Loading..." />
 * <LoadingSpinner size="lg" text="Processing your request" />
 * 
 * // Centered in container
 * <div className="h-64">
 *   <LoadingSpinner center text="Loading data..." />
 * </div>
 * 
 * // In a button
 * <Button disabled>
 *   <LoadingSpinner size="sm" className="mr-2" />
 *   Saving...
 * </Button>
 * 
 * // Full page loader
 * <div className="fixed inset-0 bg-white/80 z-50">
 *   <LoadingSpinner center size="lg" text="Please wait..." />
 * </div>
 * ```
 * 
 * @component
 */
export function LoadingSpinner({ 
  size = 'md', 
  className, 
  text,
  center = false 
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const spinner = (
    <div className={cn('animate-spin', sizes[size])}>
      <svg viewBox="0 0 24 24" fill="none">
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
    </div>
  );

  if (text) {
    return (
      <div className={cn(
        'flex items-center space-x-2',
        center && 'justify-center',
        className
      )}>
        {spinner}
        <span className="text-gray-600">{text}</span>
      </div>
    );
  }

  return (
    <div className={cn(center && 'flex justify-center', className)}>
      {spinner}
    </div>
  );
}