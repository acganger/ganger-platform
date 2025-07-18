import React, { forwardRef } from 'react'
import { clsx } from '../utils/clsx'

// Trend interface
export interface TrendData {
  value: number
  direction: 'up' | 'down'
  label?: string
}

// StatCard styles
const statCardStyles = {
  container: [
    'relative overflow-hidden',
    'bg-white dark:bg-zinc-900',
    'ring-1 ring-zinc-950/5 dark:ring-white/10',
    'shadow-sm',
    'p-6',
  ],
  header: [
    'flex items-center justify-between',
  ],
  content: [
    'flex-1',
  ],
  title: [
    'text-sm font-medium',
    'text-zinc-600 dark:text-zinc-400',
    'mb-1',
  ],
  value: [
    'text-2xl font-semibold',
    'text-zinc-900 dark:text-zinc-100',
  ],
  iconContainer: [
    'flex-shrink-0',
    'w-12 h-12',
    'rounded-lg',
    'flex items-center justify-center',
  ],
  trendContainer: [
    'mt-4',
    'flex items-center text-sm',
  ],
  trendIcon: [
    'flex items-center',
    'font-medium',
  ],
  trendLabel: [
    'ml-2 text-zinc-500 dark:text-zinc-400',
  ],
  rounded: {
    none: 'rounded-none',
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
  },
  variants: {
    default: {
      container: '',
      icon: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
    },
    success: {
      container: 'bg-green-50 dark:bg-green-950/20 ring-green-200 dark:ring-green-800',
      icon: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
    },
    warning: {
      container: 'bg-yellow-50 dark:bg-yellow-950/20 ring-yellow-200 dark:ring-yellow-800',
      icon: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400',
    },
    danger: {
      container: 'bg-red-50 dark:bg-red-950/20 ring-red-200 dark:ring-red-800',
      icon: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
    },
    info: {
      container: 'bg-blue-50 dark:bg-blue-950/20 ring-blue-200 dark:ring-blue-800',
      icon: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    },
  },
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card title */
  title: string
  /** Main value to display */
  value: string | number
  /** Optional icon element */
  icon?: React.ReactNode
  /** Trend data */
  trend?: TrendData
  /** Visual variant */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Loading state */
  loading?: boolean
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  function StatCard({
    title,
    value,
    icon,
    trend,
    variant = 'default',
    rounded = 'lg',
    className,
    loading = false,
    ...props
  }, ref) {
    
    const variantStyles = statCardStyles.variants[variant]
    
    const getTrendColor = (direction: 'up' | 'down') => {
      return direction === 'up' 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-red-600 dark:text-red-400'
    }
    
    const getTrendIcon = (direction: 'up' | 'down') => {
      return direction === 'up' ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    }
    
    if (loading) {
      return (
        <div
          ref={ref}
          className={clsx(
            statCardStyles.container,
            statCardStyles.rounded[rounded],
            'animate-pulse',
            className
          )}
          {...props}
        >
          <div className={clsx(statCardStyles.header)}>
            <div className={clsx(statCardStyles.content)}>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24 mb-2" />
              <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-16" />
            </div>
            {icon && (
              <div className={clsx(statCardStyles.iconContainer, 'bg-zinc-200 dark:bg-zinc-700')} />
            )}
          </div>
          {trend && (
            <div className={clsx(statCardStyles.trendContainer)}>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
            </div>
          )}
        </div>
      )
    }
    
    return (
      <div
        ref={ref}
        className={clsx(
          statCardStyles.container,
          statCardStyles.rounded[rounded],
          variantStyles.container,
          className
        )}
        {...props}
      >
        <div className={clsx(statCardStyles.header)}>
          <div className={clsx(statCardStyles.content)}>
            <p className={clsx(statCardStyles.title)}>
              {title}
            </p>
            <p className={clsx(statCardStyles.value)}>
              {value}
            </p>
          </div>
          
          {icon && (
            <div className={clsx(
              statCardStyles.iconContainer,
              variantStyles.icon
            )}>
              {icon}
            </div>
          )}
        </div>
        
        {trend && (
          <div className={clsx(statCardStyles.trendContainer)}>
            <span className={clsx(
              statCardStyles.trendIcon,
              getTrendColor(trend.direction)
            )}>
              {getTrendIcon(trend.direction)}
              <span className="ml-1">
                {trend.value}%
              </span>
            </span>
            <span className={clsx(statCardStyles.trendLabel)}>
              {trend.label || 'from last month'}
            </span>
          </div>
        )}
      </div>
    )
  }
)

// Legacy API compatibility
export interface StatCardLegacyProps {
  title: string
  value: string | number
  icon?: string
  trend?: TrendData
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

export const StatCardLegacy = forwardRef<HTMLDivElement, StatCardLegacyProps>(
  function StatCardLegacy({
    icon,
    variant = 'default',
    ...props
  }, ref) {
    // Map legacy variant names
    const variantMap = {
      default: 'default' as const,
      success: 'success' as const,
      warning: 'warning' as const,
      danger: 'danger' as const,
    }
    
    // Convert legacy string icon to placeholder
    const iconElement = icon ? (
      <div className="w-6 h-6 rounded-full bg-current opacity-20" />
    ) : undefined
    
    return (
      <StatCard
        ref={ref}
        icon={iconElement}
        variant={variantMap[variant]}
        {...props}
      />
    )
  }
)