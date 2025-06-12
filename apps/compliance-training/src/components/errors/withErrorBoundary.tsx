'use client'

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorFallback, InlineErrorFallback } from './ErrorFallback';

export interface WithErrorBoundaryOptions {
  fallback?: React.ComponentType<{ error?: Error; resetError?: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
  inline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// HOC to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const {
    fallback,
    onError,
    showDetails = false,
    inline = false,
    size = 'md'
  } = options;

  const WithErrorBoundaryComponent = React.forwardRef<any, P>((props, ref) => {
    const renderFallback = React.useCallback((fallbackProps: { error?: Error; resetError?: () => void }) => {
      if (fallback) {
        return React.createElement(fallback, fallbackProps);
      }
      
      if (inline) {
        return <InlineErrorFallback error={fallbackProps.error} resetError={fallbackProps.resetError} size="sm" />;
      }
      
      return (
        <ErrorFallback 
          error={fallbackProps.error} 
          resetError={fallbackProps.resetError}
          showDetails={showDetails}
          size={size}
        />
      );
    }, []);

    return (
      <ErrorBoundary
        fallback={renderFallback}
        onError={onError}
        showDetails={showDetails}
      >
        <WrappedComponent {...(props as P)} />
      </ErrorBoundary>
    );
  });

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

// Hook to create error boundary wrapper
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    captureError,
    resetError
  };
}

// Specialized error boundaries for different scenarios
export const withAsyncErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => withErrorBoundary(WrappedComponent, {
  onError: (error, errorInfo) => {
  },
  showDetails: process.env.NODE_ENV === 'development'
});

export const withInlineErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => withErrorBoundary(WrappedComponent, {
  inline: true,
  size: 'sm'
});

export const withTableErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const TableErrorFallback: React.ComponentType<{ error?: Error; resetError?: () => void }> = ({ error, resetError }) => (
    <tr>
      <td colSpan={999} className="px-4 py-8">
        <InlineErrorFallback error={error} resetError={resetError} />
      </td>
    </tr>
  );

  return withErrorBoundary(WrappedComponent, {
    fallback: TableErrorFallback
  });
};

export const withCardErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const CardErrorFallback: React.ComponentType<{ error?: Error; resetError?: () => void }> = ({ error, resetError }) => (
    <div className="border border-red-200 bg-red-50 rounded-lg p-4">
      <InlineErrorFallback error={error} resetError={resetError} />
    </div>
  );

  return withErrorBoundary(WrappedComponent, {
    fallback: CardErrorFallback
  });
};

// Error boundary provider for granular error handling
interface ErrorBoundaryProviderProps {
  children: React.ReactNode;
  level: 'page' | 'section' | 'component';
  name?: string;
}

export function ErrorBoundaryProvider({ 
  children, 
  level, 
  name 
}: ErrorBoundaryProviderProps) {
  const getErrorBoundaryConfig = () => {
    switch (level) {
      case 'page':
        return {
          showDetails: process.env.NODE_ENV === 'development',
          onError: (error: Error, errorInfo: React.ErrorInfo) => {
            // Report to analytics/monitoring service
          }
        };
      
      case 'section':
        return {
          inline: false,
          size: 'md' as const,
          onError: (error: Error, errorInfo: React.ErrorInfo) => {
          }
        };
      
      case 'component':
        return {
          inline: true,
          size: 'sm' as const,
          onError: (error: Error, errorInfo: React.ErrorInfo) => {
          }
        };
      
      default:
        return {};
    }
  };

  const config = getErrorBoundaryConfig();

  const renderProviderFallback = React.useCallback((fallbackProps: { error?: Error; resetError?: () => void }) => {
    if (config.inline) {
      return <InlineErrorFallback error={fallbackProps.error} resetError={fallbackProps.resetError} size="sm" />;
    }
    
    return (
      <ErrorFallback 
        error={fallbackProps.error} 
        resetError={fallbackProps.resetError}
        showDetails={config.showDetails}
        size="md"
      />
    );
  }, [config.inline, config.showDetails]);

  return (
    <ErrorBoundary
      fallback={renderProviderFallback}
      onError={config.onError}
      showDetails={config.showDetails}
    >
      {children}
    </ErrorBoundary>
  );
}