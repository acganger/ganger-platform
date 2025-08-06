import { cn } from '../utils/cn'

export interface ProgressProps {
  value: number
  max?: number
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variantStyles = {
  default: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  danger: 'bg-red-600',
}

export function Progress({ value, max = 100, className, variant = 'default' }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-gray-200', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn(
          'h-full transition-all duration-300 ease-in-out',
          variantStyles[variant]
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}