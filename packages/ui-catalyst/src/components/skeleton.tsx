import React from 'react';
import { clsx } from '../utils/clsx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Shape variant */
  variant?: 'text' | 'circular' | 'rectangular';
  /** Animation type */
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({
    width,
    height,
    variant = 'text',
    animation = 'pulse',
    className,
    style,
    ...props
  }, ref) {
    const baseStyles = {
      width: width || (variant === 'text' ? '100%' : undefined),
      height: height || (variant === 'text' ? '1em' : undefined),
      ...style
    };

    const classes = clsx(
      // Base styles
      'bg-gray-200 dark:bg-gray-700',
      
      // Shape variants
      variant === 'circular' && 'rounded-full',
      variant === 'rectangular' && 'rounded',
      variant === 'text' && 'rounded mb-2',
      
      // Animation
      animation === 'pulse' && 'animate-pulse',
      animation === 'wave' && 'relative overflow-hidden',
      
      className
    );

    return (
      <>
        <div
          ref={ref}
          className={classes}
          style={baseStyles}
          aria-busy="true"
          aria-label="Loading..."
          {...props}
        >
          {animation === 'wave' && (
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          )}
        </div>
        {animation === 'wave' && (
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes shimmer {
                100% {
                  transform: translateX(100%);
                }
              }
              .animate-shimmer {
                animation: shimmer 1.5s infinite;
              }
            `
          }} />
        )}
      </>
    );
  }
);

// Table skeleton component
export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true
}) => {
  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        {showHeader && (
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <Skeleton height={16} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton height={20} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Card skeleton component
export interface CardSkeletonProps {
  showImage?: boolean;
  lines?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showImage = false,
  lines = 3
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {showImage && (
        <Skeleton variant="rectangular" height={200} className="mb-4" />
      )}
      <Skeleton variant="text" height={24} width="60%" className="mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" height={16} width={i === lines - 1 ? "40%" : "100%"} />
      ))}
    </div>
  );
};

// Legacy support
export const SkeletonLegacy = Skeleton;
export const TableSkeletonLegacy = TableSkeleton;
export const CardSkeletonLegacy = CardSkeleton;