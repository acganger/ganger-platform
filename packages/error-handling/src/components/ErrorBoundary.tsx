'use client';

import React, { Component, ReactNode } from 'react';
import { SerializedError } from '../types';
import { serializeError } from '../utils/error-serializer';
import { errorLogger } from '../utils/error-logger';
import { ErrorFallback } from './ErrorFallback';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: SerializedError; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isolate?: boolean; // If true, only shows error UI for this component
  showDetails?: boolean; // Show error details in development
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: SerializedError | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const serialized = serializeError(error);
    return { hasError: true, error: serialized };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with component stack
    errorLogger.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      
      if (this.props.isolate) {
        // For isolated errors, show a minimal error state
        return (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <p className="text-sm text-red-800">
              This component encountered an error and cannot be displayed.
            </p>
            <button
              onClick={this.resetError}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        );
      }

      return (
        <FallbackComponent 
          error={this.state.error} 
          resetError={this.resetError}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}