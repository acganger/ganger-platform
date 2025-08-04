import React from 'react';
import { cn } from '../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const badgeVariants = {
  primary: 'bg-blue-600 text-white border-blue-600',
  secondary: 'bg-gray-100 text-gray-900 border-gray-200',
  success: 'bg-green-600 text-white border-green-600',
  warning: 'bg-yellow-600 text-white border-yellow-600',
  destructive: 'bg-red-600 text-white border-red-600',
  outline: 'bg-transparent text-gray-700 border-gray-300'
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base'
};

/**
 * Badge component for status indicators and labels
 * 
 * @description
 * A versatile badge component used to display status, labels, or counts.
 * Supports multiple color variants and sizes for different use cases.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Badge>New</Badge>
 * 
 * // Different variants
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="destructive">Error</Badge>
 * <Badge variant="outline">Draft</Badge>
 * 
 * // Different sizes
 * <Badge size="sm">Small</Badge>
 * <Badge size="md">Medium</Badge>
 * <Badge size="lg">Large</Badge>
 * 
 * // In a list or table
 * <div className="flex gap-2">
 *   <Badge variant="primary">Primary</Badge>
 *   <Badge variant="secondary">Secondary</Badge>
 *   <Badge variant="success">Published</Badge>
 * </div>
 * ```
 * 
 * @component
 */
export function Badge({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium leading-none',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}