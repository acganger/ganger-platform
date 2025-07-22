import React from 'react';
import { Button, ButtonProps } from './button';
import { LoadingSpinner } from './loading-spinner';
import { clsx } from '../utils/clsx';

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton({
    loading = false,
    loadingText,
    children,
    disabled,
    leftIcon,
    rightIcon,
    className,
    ...props
  }, ref) {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        leftIcon={loading ? <LoadingSpinner className="h-4 w-4" /> : leftIcon}
        rightIcon={!loading ? rightIcon : undefined}
        className={clsx(
          className,
          loading && 'cursor-wait'
        )}
        {...props}
      >
        {loading ? (loadingText || children) : children}
      </Button>
    );
  }
);

// Legacy support
export const LoadingButtonLegacy = LoadingButton;