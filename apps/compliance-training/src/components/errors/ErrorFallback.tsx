'use client'

import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug, Wifi } from 'lucide-react';
import { Button } from '../ui/ComponentWrappers';

export interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
  showDetails?: boolean;
  showRetry?: boolean;
  showGoHome?: boolean;
  showGoBack?: boolean;
  showReload?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ErrorFallback({
  error,
  resetError,
  title = 'Something went wrong',
  message,
  showDetails = false,
  showRetry = true,
  showGoHome = true,
  showGoBack = false,
  showReload = false,
  className = '',
  size = 'md'
}: ErrorFallbackProps) {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-4 max-w-sm',
          icon: 'h-8 w-8',
          title: 'text-lg',
          message: 'text-sm',
          button: 'text-sm'
        };
      case 'lg':
        return {
          container: 'p-8 max-w-2xl',
          icon: 'h-20 w-20',
          title: 'text-2xl',
          message: 'text-base',
          button: 'text-base'
        };
      case 'md':
      default:
        return {
          container: 'p-6 max-w-md',
          icon: 'h-12 w-12',
          title: 'text-xl',
          message: 'text-sm',
          button: 'text-sm'
        };
    }
  };

  const classes = getSizeClasses();
  const defaultMessage = error?.message || 'An unexpected error occurred. Please try again.';
  const displayMessage = message || getErrorMessage(error) || defaultMessage;

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleCopyError = () => {
    if (error) {
      const errorInfo = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2))
        .then(() => alert('Error details copied to clipboard'))
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <div className={`bg-white rounded-lg shadow-lg border ${classes.container} w-full text-center`}>
        {/* Error Icon */}
        <div className="mb-4">
          <AlertTriangle className={`${classes.icon} mx-auto text-red-500`} />
        </div>

        {/* Title */}
        <h1 className={`${classes.title} font-semibold text-gray-900 mb-3`}>
          {title}
        </h1>

        {/* Message */}
        <p className={`${classes.message} text-gray-600 mb-6 leading-relaxed`}>
          {displayMessage}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showRetry && resetError && (
              <Button
                onClick={resetError}
                variant="primary"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                className={classes.button}
              >
                Try Again
              </Button>
            )}
            
            {showReload && (
              <Button
                onClick={handleReload}
                variant="primary"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                className={classes.button}
              >
                Reload Page
              </Button>
            )}
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {showGoBack && (
              <Button
                onClick={handleGoBack}
                variant="outline"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                className={classes.button}
              >
                Go Back
              </Button>
            )}
            
            {showGoHome && (
              <Button
                onClick={handleGoHome}
                variant="outline"
                leftIcon={<Home className="h-4 w-4" />}
                className={classes.button}
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>

        {/* Error Details */}
        {(showDetails || process.env.NODE_ENV === 'development') && error && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className={`${classes.button} text-gray-600 hover:text-gray-800 font-medium flex items-center justify-center mx-auto`}
            >
              <Bug className="h-4 w-4 mr-2" />
              {showErrorDetails ? 'Hide' : 'Show'} Error Details
            </button>
            
            {showErrorDetails && (
              <div className="mt-4 p-4 bg-gray-50 rounded border text-left">
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Error Message:
                  </label>
                  <code className="block text-xs bg-red-50 text-red-800 p-2 rounded border">
                    {error.message}
                  </code>
                </div>
                
                {error.stack && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Stack Trace:
                    </label>
                    <pre className="text-xs bg-gray-100 text-gray-800 p-2 rounded border overflow-x-auto whitespace-pre-wrap max-h-40">
                      {error.stack}
                    </pre>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <Button
                    onClick={handleCopyError}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Copy Error Details
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If this problem persists, please contact{' '}
            <a 
              href="mailto:support@gangerdermatology.com"
              className="text-blue-600 hover:text-blue-800"
            >
              support@gangerdermatology.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Specialized error fallbacks
export function NetworkErrorFallback(props: Omit<ErrorFallbackProps, 'title' | 'message'>) {
  return (
    <ErrorFallback
      {...props}
      title="Connection Problem"
      message="Unable to connect to the server. Please check your internet connection and try again."
    />
  );
}

export function NotFoundErrorFallback(props: Omit<ErrorFallbackProps, 'title' | 'message'>) {
  return (
    <ErrorFallback
      {...props}
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved."
      showRetry={false}
      showGoBack={true}
    />
  );
}

export function UnauthorizedErrorFallback(props: Omit<ErrorFallbackProps, 'title' | 'message'>) {
  return (
    <ErrorFallback
      {...props}
      title="Access Denied"
      message="You don't have permission to access this resource. Please contact your administrator."
      showRetry={false}
      showGoHome={true}
    />
  );
}

export function ServerErrorFallback(props: Omit<ErrorFallbackProps, 'title' | 'message'>) {
  return (
    <ErrorFallback
      {...props}
      title="Server Error"
      message="The server encountered an error. Please try again in a few moments."
      showReload={true}
    />
  );
}

// Inline error fallback for smaller components
export function InlineErrorFallback({ 
  error, 
  resetError, 
  size = 'sm' 
}: {
  error?: Error;
  resetError?: () => void;
  size?: 'xs' | 'sm';
}) {
  const message = getErrorMessage(error) || 'Something went wrong';
  
  if (size === 'xs') {
    return (
      <div className="flex items-center justify-center p-4 text-center">
        <div className="text-red-600">
          <AlertTriangle className="h-4 w-4 mx-auto mb-2" />
          <p className="text-xs text-gray-600">{message}</p>
          {resetError && (
            <button 
              onClick={resetError}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-6 text-center">
      <div>
        <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
        <p className="text-sm text-gray-600 mb-3">{message}</p>
        {resetError && (
          <Button
            onClick={resetError}
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw className="h-3 w-3" />}
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper function to get user-friendly error messages
function getErrorMessage(error?: Error): string | null {
  if (!error) return null;
  
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network connection error. Please check your internet connection.';
  }
  
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  if (message.includes('401') || message.includes('unauthorized')) {
    return 'You need to log in to access this feature.';
  }
  
  if (message.includes('403') || message.includes('forbidden')) {
    return 'You don\'t have permission to perform this action.';
  }
  
  if (message.includes('404') || message.includes('not found')) {
    return 'The requested resource was not found.';
  }
  
  if (message.includes('429') || message.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (message.includes('500') || message.includes('internal server error')) {
    return 'Server error. Please try again later.';
  }
  
  if (message.includes('503') || message.includes('service unavailable')) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  
  return null;
}