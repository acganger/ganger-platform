'use client';

import { SerializedError } from '../types';

export interface ErrorDisplayProps {
  error: SerializedError | Error | string | null;
  variant?: 'inline' | 'toast' | 'banner';
  onDismiss?: () => void;
  className?: string;
}

export function ErrorDisplay({ 
  error, 
  variant = 'inline', 
  onDismiss,
  className = ''
}: ErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof Error 
    ? error.message 
    : error.userMessage;

  const severity = typeof error === 'object' && 'severity' in error 
    ? error.severity 
    : 'medium';

  const getSeverityStyles = () => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-400 text-red-700';
      case 'high':
        return 'bg-orange-100 border-orange-400 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'low':
        return 'bg-blue-100 border-blue-400 text-blue-700';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-700';
    }
  };

  if (variant === 'toast') {
    return (
      <div className={`fixed bottom-4 right-4 max-w-sm z-50 animate-slide-up ${className}`}>
        <div className={`border px-4 py-3 rounded shadow-lg ${getSeverityStyles()}`}>
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-4 flex-shrink-0"
                aria-label="Dismiss"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`w-full ${className}`}>
        <div className={`border-l-4 p-4 ${getSeverityStyles()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 ml-4"
                aria-label="Dismiss"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={`rounded-md p-4 ${getSeverityStyles()} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
        {onDismiss && (
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2"
              aria-label="Dismiss"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}