'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@ganger/ui';
import { useAccessibility } from '@/utils/accessibility';

// Loading state types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type LoadingPriority = 'low' | 'medium' | 'high' | 'critical';

// Loading context for managing global loading states
interface LoadingContextValue {
  states: Record<string, LoadingState>;
  setLoadingState: (key: string, state: LoadingState, priority?: LoadingPriority) => void;
  removeLoadingState: (key: string) => void;
  isLoading: (key?: string) => boolean;
  getGlobalLoadingState: () => LoadingState;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}

// Loading provider
interface LoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const { announce } = useAccessibility();
  const [states, setStates] = useState<Record<string, LoadingState>>({});
  const [priorities, setPriorities] = useState<Record<string, LoadingPriority>>({});

  const setLoadingState = useCallback((
    key: string, 
    state: LoadingState, 
    priority: LoadingPriority = 'medium'
  ) => {
    setStates(prev => ({ ...prev, [key]: state }));
    setPriorities(prev => ({ ...prev, [key]: priority }));

    // Announce critical loading states
    if (priority === 'critical') {
      if (state === 'loading') {
        announce('Loading critical data...', 'assertive');
      } else if (state === 'success') {
        announce('Critical data loaded successfully', 'polite');
      } else if (state === 'error') {
        announce('Critical data failed to load', 'assertive');
      }
    }
  }, [announce]);

  const removeLoadingState = useCallback((key: string) => {
    setStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      return newStates;
    });
    setPriorities(prev => {
      const newPriorities = { ...prev };
      delete newPriorities[key];
      return newPriorities;
    });
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return states[key] === 'loading';
    }
    return Object.values(states).some(state => state === 'loading');
  }, [states]);

  const getGlobalLoadingState = useCallback((): LoadingState => {
    const stateValues = Object.values(states);
    if (stateValues.some(state => state === 'loading')) return 'loading';
    if (stateValues.some(state => state === 'error')) return 'error';
    if (stateValues.length > 0 && stateValues.every(state => state === 'success')) return 'success';
    return 'idle';
  }, [states]);

  const contextValue: LoadingContextValue = {
    states,
    setLoadingState,
    removeLoadingState,
    isLoading,
    getGlobalLoadingState
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
}

// Skeleton component with animation
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number;
}

export function Skeleton({
  width,
  height = '1rem',
  className,
  variant = 'text',
  animation = 'pulse',
  lines = 1
}: SkeletonProps) {
  const baseClasses = cn(
    'bg-gray-200',
    animation === 'pulse' && 'animate-pulse',
    animation === 'wave' && 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer',
    variant === 'circular' && 'rounded-full',
    variant === 'rounded' && 'rounded-md',
    variant === 'rectangular' && 'rounded-none',
    variant === 'text' && 'rounded-sm',
    className
  );

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (lines > 1) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading content">
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              index === lines - 1 && 'w-3/4' // Last line is shorter
            )}
            style={index === lines - 1 ? { ...style, width: '75%' } : style}
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div 
      className={baseClasses} 
      style={style}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Table skeleton for data tables
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className
}: TableSkeletonProps) {
  return (
    <div className={cn('w-full', className)} role="status" aria-label="Loading table data">
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        {showHeader && (
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }, (_, index) => (
                <Skeleton key={index} height="1.25rem" className="bg-gray-300" />
              ))}
            </div>
          </div>
        )}
        
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="p-4">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }, (_, colIndex) => (
                  <Skeleton key={colIndex} height="1rem" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading table data...</span>
    </div>
  );
}

// Card skeleton for card layouts
interface CardSkeletonProps {
  showImage?: boolean;
  showActions?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({
  showImage = false,
  showActions = false,
  lines = 3,
  className
}: CardSkeletonProps) {
  return (
    <div 
      className={cn('border border-gray-200 rounded-lg p-4 space-y-3', className)}
      role="status"
      aria-label="Loading card content"
    >
      {showImage && (
        <Skeleton height="12rem" variant="rounded" className="w-full" />
      )}
      
      <div className="space-y-2">
        <Skeleton height="1.5rem" width="75%" variant="rounded" />
        <Skeleton lines={lines} height="1rem" />
      </div>
      
      {showActions && (
        <div className="flex gap-2 pt-2">
          <Skeleton height="2rem" width="5rem" variant="rounded" />
          <Skeleton height="2rem" width="4rem" variant="rounded" />
        </div>
      )}
      
      <span className="sr-only">Loading card...</span>
    </div>
  );
}

// Chart skeleton for data visualizations
interface ChartSkeletonProps {
  type?: 'bar' | 'line' | 'pie' | 'area';
  showLegend?: boolean;
  className?: string;
}

export function ChartSkeleton({
  type = 'bar',
  showLegend = true,
  className
}: ChartSkeletonProps) {
  return (
    <div 
      className={cn('w-full space-y-4', className)}
      role="status"
      aria-label="Loading chart data"
    >
      {/* Chart title */}
      <Skeleton height="1.5rem" width="40%" variant="rounded" />
      
      {/* Chart area */}
      <div className="relative h-64 bg-gray-100 rounded-lg p-4">
        {type === 'bar' && (
          <div className="flex items-end justify-between h-full gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton
                key={index}
                width="100%"
                height={`${Math.random() * 60 + 20}%`}
                variant="rectangular"
                className="bg-gray-300"
              />
            ))}
          </div>
        )}
        
        {type === 'line' && (
          <div className="h-full relative">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <defs>
                <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#e5e7eb" />
                  <stop offset="50%" stopColor="#d1d5db" />
                  <stop offset="100%" stopColor="#e5e7eb" />
                </linearGradient>
              </defs>
              <path
                d="M0,150 Q100,120 200,130 T400,110"
                stroke="url(#shimmer)"
                strokeWidth="3"
                fill="none"
                className="animate-pulse"
              />
            </svg>
          </div>
        )}
        
        {type === 'pie' && (
          <div className="flex items-center justify-center h-full">
            <Skeleton width="12rem" height="12rem" variant="circular" className="bg-gray-300" />
          </div>
        )}
        
        {type === 'area' && (
          <div className="h-full relative">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#d1d5db" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#d1d5db" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path
                d="M0,150 Q100,120 200,130 T400,110 L400,200 L0,200 Z"
                fill="url(#areaGradient)"
                className="animate-pulse"
              />
            </svg>
          </div>
        )}
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton width="1rem" height="1rem" variant="rectangular" />
              <Skeleton width="4rem" height="1rem" />
            </div>
          ))}
        </div>
      )}
      
      <span className="sr-only">Loading {type} chart...</span>
    </div>
  );
}

// List skeleton for list views
interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  variant?: 'simple' | 'detailed';
  className?: string;
}

export function ListSkeleton({
  items = 5,
  showAvatar = false,
  showActions = false,
  variant = 'simple',
  className
}: ListSkeletonProps) {
  return (
    <div 
      className={cn('space-y-3', className)}
      role="status"
      aria-label="Loading list items"
    >
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
          {showAvatar && (
            <Skeleton width="2.5rem" height="2.5rem" variant="circular" />
          )}
          
          <div className="flex-1 space-y-2">
            <Skeleton height="1.25rem" width="60%" />
            {variant === 'detailed' && (
              <>
                <Skeleton height="1rem" width="80%" />
                <Skeleton height="1rem" width="40%" />
              </>
            )}
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              <Skeleton width="2rem" height="2rem" variant="circular" />
              <Skeleton width="2rem" height="2rem" variant="circular" />
            </div>
          )}
        </div>
      ))}
      <span className="sr-only">Loading list...</span>
    </div>
  );
}

// Loading overlay for components
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
  blur?: boolean;
}

export function LoadingOverlay({
  isLoading,
  children,
  message = 'Loading...',
  className,
  blur = true
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      <div className={cn(isLoading && blur && 'filter blur-sm pointer-events-none')}>
        {children}
      </div>
      
      {isLoading && (
        <div 
          className="absolute inset-0 bg-white/80 flex items-center justify-center z-50"
          role="status"
          aria-label={message}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Progressive loading for images
interface ProgressiveImageProps {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
}

export function ProgressiveImage({
  src,
  alt,
  fallback,
  className
}: ProgressiveImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {loading && (
        <Skeleton 
          width="100%" 
          height="100%" 
          variant="rectangular" 
          className="absolute inset-0" 
        />
      )}
      
      {error && fallback ? (
        <Image
          src={fallback}
          alt={alt}
          fill
          className="object-cover"
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'object-cover transition-opacity duration-300',
            loading ? 'opacity-0' : 'opacity-100'
          )}
        />
      )}
    </div>
  );
}

// Lazy loading wrapper
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export function LazyLoad({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px'
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <Skeleton height="200px" />)}
    </div>
  );
}

// Add shimmer animation to Tailwind CSS
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite linear;
  }
`;

// Inject shimmer styles if not already present
if (typeof window !== 'undefined' && !document.getElementById('shimmer-styles')) {
  const style = document.createElement('style');
  style.id = 'shimmer-styles';
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);
}