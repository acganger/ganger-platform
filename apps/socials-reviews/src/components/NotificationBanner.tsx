'use client'

import React, { useState, useEffect } from 'react';
import { Alert, Button } from '@ganger/ui';
import { Bell, X, MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react';
import type { NotificationEvent } from '@/types';

interface NotificationBannerProps {
  notifications: NotificationEvent[];
  onDismiss: (notificationId: string) => void;
  onMarkAllRead: () => void;
  className?: string;
}

export default function NotificationBanner({ 
  notifications, 
  onDismiss, 
  onMarkAllRead,
  className = '' 
}: NotificationBannerProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<NotificationEvent[]>([]);

  useEffect(() => {
    // Show only unread notifications, limit to 3 most recent
    const unreadNotifications = notifications
      .filter(n => !n.read)
      .slice(0, 3);
    
    setVisibleNotifications(unreadNotifications);
  }, [notifications]);

  if (visibleNotifications.length === 0) {
    return null;
  }

  const getNotificationIcon = (type: NotificationEvent['type']) => {
    switch (type) {
      case 'new_review':
        return MessageSquare;
      case 'high_performing_post':
        return TrendingUp;
      case 'urgent_review':
        return AlertTriangle;
      case 'content_ready':
        return Bell;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: NotificationEvent['type']) => {
    switch (type) {
      case 'new_review':
        return 'info';
      case 'high_performing_post':
        return 'success';
      case 'urgent_review':
        return 'error';
      case 'content_ready':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {visibleNotifications.map((notification) => {
        const Icon = getNotificationIcon(notification.type);
        const color = getNotificationColor(notification.type);
        
        return (
          <Alert
            key={notification.id}
            variant={color}
            className="relative animate-slide-down"
          >
            <div className="flex items-start space-x-3">
              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">{notification.title}</h4>
                <p className="text-sm opacity-90">{notification.message}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(notification.id)}
                className="flex-shrink-0 h-6 w-6 p-0"
                aria-label={`Dismiss ${notification.title}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        );
      })}
      
      {visibleNotifications.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            className="text-xs"
          >
            Mark all as read
          </Button>
        </div>
      )}
    </div>
  );
}