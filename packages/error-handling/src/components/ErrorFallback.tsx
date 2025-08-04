'use client';

import { SerializedError } from '../types';

export interface ErrorFallbackProps {
  error: SerializedError;
  resetError: () => void;
  showDetails?: boolean;
}

export function ErrorFallback({ error, resetError, showDetails }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const shouldShowDetails = showDetails ?? isDevelopment;

  const handleReload = () => {
    window.location.reload();
  };

  const getRecoveryActions = () => {
    switch (error.metadata?.recoveryStrategy || 'none') {
      case 'retry':
        return (
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        );
      case 'reload':
        return (
          <button
            onClick={handleReload}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reload Page
          </button>
        );
      case 'redirect':
        return (
          <a
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 inline-block"
          >
            Sign In
          </a>
        );
      case 'contact-support':
        return (
          <a
            href="mailto:support@gangerdermatology.com"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 inline-block"
          >
            Contact Support
          </a>
        );
      default:
        return (
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Go Back
          </button>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mx-auto">
            <svg
              className="h-6 w-6 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <div className="mt-4 text-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {error.severity === 'critical' ? 'System Error' : 'Something went wrong'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {error.userMessage}
            </p>
          </div>

          {shouldShowDetails && error.code !== 'UNKNOWN_ERROR' && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
              <p className="font-semibold text-gray-700">Error Details:</p>
              <p className="mt-1 text-gray-600">Code: {error.code}</p>
              {error.metadata?.statusCode && (
                <p className="mt-1 text-gray-600">Status: {error.metadata.statusCode}</p>
              )}
              {isDevelopment && error.message && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-gray-700 hover:text-gray-900">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto p-2 bg-white rounded">
                    {error.message}
                  </pre>
                  {error.metadata?.stack && (
                    <pre className="mt-2 text-xs overflow-auto p-2 bg-white rounded max-h-40">
                      {error.metadata.stack}
                    </pre>
                  )}
                </details>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-center space-x-4">
            {getRecoveryActions()}
          </div>

          {error.severity === 'critical' && (
            <p className="mt-4 text-xs text-center text-gray-500">
              Error ID: {error.metadata?.timestamp}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}