import React from 'react';
import { cn } from '../utils/cn';
import { ButtonProps } from '../types';

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading, 
    fullWidth = false,
    leftIcon,
    rightIcon,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const variants = {
      primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 active:bg-primary-800',
      secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white focus:ring-secondary-500 active:bg-secondary-800',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 active:bg-gray-100',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
      destructive: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 active:bg-red-800',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 active:bg-red-800', // Alias for destructive
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm rounded-md min-h-[44px]',
      md: 'px-4 py-3 text-sm rounded-lg min-h-[44px]',
      lg: 'px-6 py-4 text-base rounded-lg min-h-[48px]',
    };

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        aria-describedby={loading ? `${props['aria-describedby'] || ''} loading-indicator`.trim() : props['aria-describedby']}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg 
            className={cn(
              iconSizes[size],
              'animate-spin',
              (leftIcon || children) && 'mr-2'
            )} 
            viewBox="0 0 24 24"
            aria-hidden="true"
            role="presentation"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        
        {!loading && leftIcon && (
          <span className={cn(iconSizes[size], children && 'mr-2')} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {children}
        
        {!loading && rightIcon && (
          <span className={cn(iconSizes[size], children && 'ml-2')} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };