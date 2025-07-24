'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Modern Error Boundary using React 19 patterns
export function ErrorBoundary({ 
  children, 
  fallback,
  onError 
}: ErrorBoundaryProps) {
  const [errorState, setErrorState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null
  });
  
  const resetErrorBoundary = useCallback(() => {
    setErrorState({ hasError: false, error: null });
  }, []);

  // Handle errors caught by error boundary
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = new Error(event.message);
      error.stack = event.error?.stack;
      setErrorState({ hasError: true, error });
      
      // Call optional error handler
      if (onError) {
        onError(error, { componentStack: '' });
      }
      
      // Log to monitoring service in production
      if (typeof window !== 'undefined' && window.location.hostname.includes('gangerdermatology.com')) {
        logErrorToService(error, { componentStack: '' });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason?.message || 'Unhandled promise rejection');
      setErrorState({ hasError: true, error });
      
      if (onError) {
        onError(error, { componentStack: '' });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  if (errorState.hasError && errorState.error) {
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback(errorState.error, resetErrorBoundary)}</>;
    }

    // Default error UI
    return <DefaultErrorFallback error={errorState.error} reset={resetErrorBoundary} />;
  }

  return <>{children}</>;
}

// Log errors to monitoring service
function logErrorToService(error: Error, errorInfo: ErrorInfo) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  fetch('/api/monitoring/errors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(errorData)
  }).catch(err => {
    console.error('Failed to log error to monitoring service:', err);
  });
}

// Default error UI component
function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-6">
          We apologize for the inconvenience. The application encountered an unexpected error.
        </p>

        {/* Error details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto">
              <p className="font-semibold">{error.toString()}</p>
              {error.stack && (
                <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
              )}
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
          
          <button
            onClick={handleReload}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Page
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

// Legacy class component for backward compatibility
export class ErrorBoundaryLegacy extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    if (typeof window !== 'undefined' && window.location.hostname.includes('gangerdermatology.com')) {
      logErrorToService(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const reset = () => this.setState({ hasError: false, error: null });
      
      if (this.props.fallback) {
        return <>{this.props.fallback(this.state.error, reset)}</>;
      }

      return <DefaultErrorFallback error={this.state.error} reset={reset} />;
    }

    return this.props.children;
  }
}

// Convenience hook for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error handled by useErrorHandler:', error, errorInfo);
    
    // In production, send to monitoring
    if (typeof window !== 'undefined' && window.location.hostname.includes('gangerdermatology.com')) {
      logErrorToService(error, errorInfo || { componentStack: '' });
    }
  };
}