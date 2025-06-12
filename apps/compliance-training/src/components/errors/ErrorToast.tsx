'use client'

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../ui/ComponentWrappers';

interface ToastMessage {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  duration?: number;
  canRetry?: boolean;
  onRetry?: () => void;
  persistent?: boolean;
}

interface ErrorToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  defaultDuration?: number;
}

// Toast context for managing global toasts
const ToastContext = React.createContext<{
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
} | null>(null);

export function ErrorToastProvider({ 
  children, 
  maxToasts = 5, 
  defaultDuration = 5000 
}: ErrorToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const hideToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = React.useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration: toast.duration ?? defaultDuration
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit number of toasts
      return updated.slice(0, maxToasts);
    });

    // Auto-remove non-persistent toasts
    if (!toast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }
  }, [maxToasts, defaultDuration, hideToast]);

  const clearAllToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  // Listen for global error events
  useEffect(() => {
    const handleErrorToast = (event: CustomEvent) => {
      showToast({
        message: event.detail.message,
        type: 'error',
        canRetry: event.detail.canRetry,
        onRetry: event.detail.onRetry
      });
    };

    window.addEventListener('errorToast', handleErrorToast as EventListener);
    return () => window.removeEventListener('errorToast', handleErrorToast as EventListener);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast context
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast container component
function ToastContainer({ 
  toasts, 
  onHide 
}: { 
  toasts: ToastMessage[]; 
  onHide: (id: string) => void; 
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </div>
  );
}

// Individual toast component
function Toast({ 
  toast, 
  onHide 
}: { 
  toast: ToastMessage; 
  onHide: (id: string) => void; 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleHide = () => {
    setIsLeaving(true);
    setTimeout(() => onHide(toast.id), 150); // Wait for exit animation
  };

  const getToastStyles = () => {
    const baseStyles = "transform transition-all duration-150 ease-in-out";
    
    if (isLeaving) {
      return `${baseStyles} translate-x-full opacity-0`;
    }
    
    if (isVisible) {
      return `${baseStyles} translate-x-0 opacity-100`;
    }
    
    return `${baseStyles} translate-x-full opacity-0`;
  };

  const getToastColors = () => {
    switch (toast.type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <RefreshCw className="h-5 w-5 text-green-500" />;
      case 'info':
      default:
        return <Wifi className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className={`${getToastStyles()}`}>
      <div className={`border rounded-lg shadow-lg p-4 ${getToastColors()}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-5">
              {toast.message}
            </p>
            
            {toast.canRetry && toast.onRetry && (
              <div className="mt-2">
                <Button
                  onClick={toast.onRetry}
                  size="sm"
                  variant="outline"
                  leftIcon={<RefreshCw className="h-3 w-3" />}
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={handleHide}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Connection status toast
export function ConnectionStatusToast() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineToast(false);
      showToast({
        message: 'Connection restored',
        type: 'success',
        duration: 3000
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
      showToast({
        message: 'You are currently offline. Some features may not work properly.',
        type: 'warning',
        persistent: true
      });
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Don't render anything - status is handled by toast provider
  return null;
}

// Retry toast for failed operations
export function RetryToast({ 
  message, 
  onRetry, 
  maxRetries = 3, 
  currentAttempt = 0 
}: {
  message: string;
  onRetry: () => Promise<void>;
  maxRetries?: number;
  currentAttempt?: number;
}) {
  const { showToast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = React.useCallback(async () => {
    setIsRetrying(true);
    
    try {
      await onRetry();
      showToast({
        message: 'Operation completed successfully',
        type: 'success',
        duration: 3000
      });
    } catch (error) {
      if (currentAttempt < maxRetries - 1) {
        showToast({
          message: `Retry failed. ${maxRetries - currentAttempt - 1} attempts remaining.`,
          type: 'error',
          canRetry: true,
          onRetry: handleRetry
        });
      } else {
        showToast({
          message: 'All retry attempts failed. Please try again later.',
          type: 'error',
          duration: 0, // Persistent
        });
      }
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, showToast, currentAttempt, maxRetries]);

  useEffect(() => {
    showToast({
      message,
      type: 'error',
      canRetry: currentAttempt < maxRetries,
      onRetry: isRetrying ? undefined : handleRetry
    });
  }, [message, currentAttempt, maxRetries, isRetrying, showToast, handleRetry]);

  return null;
}

// Batch operation error toast
export function BatchErrorToast({ 
  totalOperations, 
  failedOperations, 
  onRetryFailed 
}: {
  totalOperations: number;
  failedOperations: number;
  onRetryFailed?: () => void;
}) {
  const { showToast } = useToast();

  useEffect(() => {
    if (failedOperations > 0) {
      const successCount = totalOperations - failedOperations;
      showToast({
        message: `${successCount}/${totalOperations} operations completed successfully. ${failedOperations} failed.`,
        type: failedOperations === totalOperations ? 'error' : 'warning',
        canRetry: !!onRetryFailed,
        onRetry: onRetryFailed,
        duration: 7000
      });
    }
  }, [totalOperations, failedOperations, onRetryFailed, showToast]);

  return null;
}