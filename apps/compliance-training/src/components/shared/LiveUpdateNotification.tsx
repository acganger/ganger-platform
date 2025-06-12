'use client'

import React, { useEffect, useState } from 'react';
import { Card, Button } from '../ui/ComponentWrappers';
import { CheckCircle, X, RefreshCw } from 'lucide-react';
import { cn } from '@ganger/ui';

interface LiveUpdateNotificationProps {
  isVisible: boolean;
  updateCount: number;
  onDismiss: () => void;
  onRefresh: () => void;
  className?: string;
}

export function LiveUpdateNotification({
  isVisible,
  updateCount,
  onDismiss,
  onRefresh,
  className
}: LiveUpdateNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-dismiss after 5 seconds
      const timeout = setTimeout(() => {
        onDismiss();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 transition-all duration-300 transform',
      isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
      className
    )}>
      <Card className="p-4 bg-green-50 border-green-200 shadow-lg max-w-sm">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-green-900">
                Live Update Received
              </h4>
              <button
                onClick={onDismiss}
                className="text-green-600 hover:text-green-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-sm text-green-700 mt-1">
              {updateCount === 1 
                ? 'Compliance data has been updated in real-time.'
                : `${updateCount} updates received. Data is automatically synchronized.`
              }
            </p>
            
            <div className="flex items-center space-x-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                leftIcon={<RefreshCw className="h-3 w-3" />}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                Refresh Now
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-green-600 hover:text-green-800"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Toast-style notification for quick updates
interface LiveUpdateToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export function LiveUpdateToast({
  message,
  type = 'success',
  duration = 3000,
  onClose
}: LiveUpdateToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 150); // Allow fade animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  const iconMap = {
    success: <CheckCircle className="h-4 w-4" />,
    info: <RefreshCw className="h-4 w-4" />,
    warning: <CheckCircle className="h-4 w-4" />
  };

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 transition-all duration-150',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    )}>
      <div className={cn(
        'flex items-center space-x-2 px-4 py-3 rounded-lg border shadow-sm',
        typeStyles[type]
      )}>
        {iconMap[type]}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}