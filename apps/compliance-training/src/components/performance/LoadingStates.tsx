'use client'

import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '@ganger/ui';
import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';

// Skeleton loading components with enhanced accessibility
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animation?: 'pulse' | 'wave' | 'none';
  'aria-label'?: string;
}

export function Skeleton({ 
  className = '', 
  width = '100%', 
  height = '1rem',
  rounded = false,
  animation = 'pulse',
  'aria-label': ariaLabel = 'Loading content'
}: SkeletonProps) {
  return (
    <div
      className={`
        bg-gray-200 
        ${animation === 'pulse' && 'animate-pulse'}
        ${animation === 'wave' && 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer'}
        ${rounded ? 'rounded-full' : 'rounded'} 
        ${className}
      `}
      style={{ width, height }}
      role="status"
      aria-label={ariaLabel}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Matrix skeleton for loading compliance matrix with accessibility
export function MatrixSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading compliance matrix">
      {/* Header skeleton */}
      <div className="flex space-x-3" role="row">
        <Skeleton width="200px" height="32px" aria-label="Loading employee column header" />
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width="80px" height="32px" aria-label={`Loading training ${i + 1} column header`} />
        ))}
      </div>
      
      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-3" role="row">
          <Skeleton width="200px" height="40px" aria-label={`Loading employee ${rowIndex + 1} name`} />
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              width="80px" 
              height="40px" 
              rounded 
              aria-label={`Loading training status for employee ${rowIndex + 1}, training ${colIndex + 1}`}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading compliance matrix data...</span>
    </div>
  );
}

// Dashboard stats skeleton
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton width="80px" height="14px" className="mb-2" />
              <Skeleton width="60px" height="24px" />
            </div>
            <Skeleton width="40px" height="40px" rounded />
          </div>
        </div>
      ))}
    </div>
  );
}

// Progressive loading component
interface ProgressiveLoadingProps {
  isLoading: boolean;
  hasError: boolean;
  isEmpty: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  errorMessage?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRetry?: () => void;
}

export function ProgressiveLoading({
  isLoading,
  hasError,
  isEmpty,
  children,
  skeleton,
  errorMessage = 'Something went wrong',
  emptyMessage = 'No data available',
  emptyIcon,
  onRetry
}: ProgressiveLoadingProps) {
  if (isLoading) {
    return (
      <div className="w-full">
        {skeleton || (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          {emptyIcon || <Wifi className="h-12 w-12 mx-auto text-gray-300 mb-4" />}
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Lazy loading with intersection observer
interface LazyLoadProps {
  children: React.ReactNode;
  height?: number;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  onLoad?: () => void;
}

export function LazyLoad({
  children,
  height = 200,
  placeholder,
  rootMargin = '100px',
  threshold = 0.1,
  onLoad
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoaded) {
          setIsVisible(true);
          setIsLoaded(true);
          onLoad?.();
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [rootMargin, threshold, isLoaded, onLoad]);

  if (!isVisible) {
    return (
      <div ref={ref} style={{ height: `${height}px` }}>
        {placeholder || (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        )}
      </div>
    );
  }

  return <div ref={ref}>{children}</div>;
}

// Connection status indicator
export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-sm z-50">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="h-4 w-4" />
        <span>You&apos;re offline. Some features may not work properly.</span>
      </div>
    </div>
  );
}

// Performance monitoring component
interface PerformanceMonitorProps {
  children: React.ReactNode;
  name: string;
  onMetrics?: (metrics: { name: string; duration: number; timestamp: number }) => void;
}

export function PerformanceMonitor({ children, name, onMetrics }: PerformanceMonitorProps) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      onMetrics?.({
        name,
        duration,
        timestamp: Date.now()
      });

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
      }
    };
  }, [name, onMetrics]);

  return <>{children}</>;
}

// Add shimmer animation styles
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