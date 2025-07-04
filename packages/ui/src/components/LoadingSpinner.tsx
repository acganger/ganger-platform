import React from 'react';
import { cn } from '../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  center?: boolean;
}

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