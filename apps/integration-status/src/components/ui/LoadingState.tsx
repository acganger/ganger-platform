'use client'

interface LoadingStateProps {
  message?: string
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({ 
  message = 'Loading...', 
  showProgress = false,
  size = 'md'
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {/* Spinner */}
      <div className={`${sizeClasses[size]} mb-4`}>
        <svg 
          className="animate-spin text-blue-600" 
          fill="none" 
          viewBox="0 0 24 24"
        >
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

      {/* Message */}
      <p className="text-gray-600 text-sm">
        {message}
      </p>

      {/* Progress bar (optional) */}
      {showProgress && (
        <div className="w-48 mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// Skeleton loading component for cards
export function LoadingSkeleton({ 
  className = '',
  lines = 3
}: { 
  className?: string
  lines?: number 
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded h-4 w-3/4 mb-3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className="bg-gray-200 rounded h-3 w-full mb-2" />
      ))}
      <div className="bg-gray-200 rounded h-3 w-1/2" />
    </div>
  )
}

// Grid skeleton for multiple cards
export function LoadingGrid({ 
  count = 6,
  columns = 3
}: { 
  count?: number
  columns?: number
}) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
  }

  return (
    <div className={`grid ${gridClasses[columns as keyof typeof gridClasses] || gridClasses[3]} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
          <LoadingSkeleton lines={4} />
        </div>
      ))}
    </div>
  )
}