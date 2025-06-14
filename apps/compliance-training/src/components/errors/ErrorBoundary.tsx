'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from '../ui/ComponentWrappers';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error?: Error; resetError?: () => void }) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
    }

    // Report error to external service (e.g., Sentry, LogRocket)
    this.reportError(error, errorInfo, errorId);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    try {
      // In a real app, you'd send this to an error reporting service
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId') || 'anonymous'
      };

      // Log to local storage for debugging
      const existingErrors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingErrors.push(errorReport);
      
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(existingErrors));

      // In production, send to error reporting service
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorReport)
        });
      }
    } catch (reportingError) {
      // Fail silently for error reporting errors
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private copyErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorDetails = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => alert('Error details copied to clipboard'))
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({ 
            error: this.state.error || undefined, 
            resetError: this.handleRetry 
          });
        }
        return this.props.fallback;
      }

      const { error, errorId, errorInfo } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We apologize for the inconvenience. The application encountered an unexpected error.
              </p>

              {/* Error ID for support */}
              <div className="bg-gray-100 rounded p-3 mb-6">
                <p className="text-xs text-gray-600 mb-1">Error ID:</p>
                <code className="text-xs font-mono text-gray-800">{errorId}</code>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                  leftIcon={<Home className="h-4 w-4" />}
                >
                  Reload Page
                </Button>

                <Button
                  onClick={() => window.location.href = '/'}
                  variant="ghost"
                  className="w-full"
                  leftIcon={<Home className="h-4 w-4" />}
                >
                  Go to Dashboard
                </Button>
              </div>

              {/* Development details */}
              {(isDevelopment || this.props.showDetails) && error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Error Details (Development)
                  </summary>
                  <div className="mt-3 p-3 bg-red-50 rounded border text-xs">
                    <div className="mb-2">
                      <strong>Message:</strong>
                      <div className="font-mono text-red-800">{error.message}</div>
                    </div>
                    
                    {error.stack && (
                      <div className="mb-2">
                        <strong>Stack Trace:</strong>
                        <pre className="font-mono text-red-800 whitespace-pre-wrap text-xs overflow-x-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {errorInfo?.componentStack && (
                      <div className="mb-2">
                        <strong>Component Stack:</strong>
                        <pre className="font-mono text-red-800 whitespace-pre-wrap text-xs overflow-x-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                    
                    <Button
                      onClick={this.copyErrorDetails}
                      size="sm"
                      variant="outline"
                      className="mt-2"
                    >
                      Copy Error Details
                    </Button>
                  </div>
                </details>
              )}

              {/* Support contact */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">
                  If this problem persists, please contact support:
                </p>
                <Button
                  onClick={() => window.location.href = 'mailto:support@gangerdermatology.com?subject=Application Error&body=Error ID: ' + errorId}
                  size="sm"
                  variant="ghost"
                  leftIcon={<Mail className="h-4 w-4" />}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for manual error reporting
export function useErrorReporting() {
  const reportError = (error: Error, context?: string) => {
    const errorId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous'
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
    }

    // Store locally
    try {
      const existingErrors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingErrors.push(errorReport);
      localStorage.setItem('errorLogs', JSON.stringify(existingErrors.slice(-10)));
    } catch (storageError) {
    }

    // Send to server in production
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      }).catch(() => {
        // Silent fail for error reporting
      });
    }

    return errorId;
  };

  return { reportError };
}

// Async error boundary wrapper
interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

export function AsyncErrorBoundary({ children, fallback }: AsyncErrorBoundaryProps) {
  const [asyncError, setAsyncError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      setAsyncError(error);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  if (asyncError) {
    return fallback ? fallback(asyncError) : (
      <ErrorBoundary>
        <div>Async error occurred</div>
      </ErrorBoundary>
    );
  }

  return <>{children}</>;
}