// Notification system for user feedback across applications

export interface NotificationOptions {
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

export interface NotificationInstance {
  id: string;
  options: NotificationOptions;
  timestamp: Date;
}

class NotificationManager {
  private notifications: NotificationInstance[] = [];
  private listeners: Array<(notifications: NotificationInstance[]) => void> = [];
  private idCounter = 0;

  show(options: NotificationOptions): string {
    const id = `notification_${++this.idCounter}_${Date.now()}`;
    const notification: NotificationInstance = {
      id,
      options: {
        type: 'info',
        duration: 5000,
        dismissible: true,
        ...options,
      },
      timestamp: new Date(),
    };

    this.notifications.push(notification);
    this.notifyListeners();

    // Auto-dismiss if duration is set
    if (notification.options.duration && notification.options.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.options.duration);
    }

    return id;
  }

  dismiss(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  dismissAll(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  getAll(): NotificationInstance[] {
    return [...this.notifications];
  }

  subscribe(listener: (notifications: NotificationInstance[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener([...this.notifications]);
    });
  }

  // Convenience methods
  success(title: string, message?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      message,
      type: 'success',
      ...options,
    });
  }

  error(title: string, message?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      message,
      type: 'error',
      duration: 0, // Don't auto-dismiss errors
      ...options,
    });
  }

  warning(title: string, message?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      message,
      type: 'warning',
      ...options,
    });
  }

  info(title: string, message?: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      title,
      message,
      type: 'info',
      ...options,
    });
  }
}

// Singleton instance
export const notifications = new NotificationManager();

// React hook for notification management
export function useNotifications() {
  const [notificationList, setNotificationList] = React.useState<NotificationInstance[]>([]);

  React.useEffect(() => {
    const unsubscribe = notifications.subscribe(setNotificationList);
    return unsubscribe;
  }, []);

  return {
    notifications: notificationList,
    show: notifications.show.bind(notifications),
    dismiss: notifications.dismiss.bind(notifications),
    dismissAll: notifications.dismissAll.bind(notifications),
    success: notifications.success.bind(notifications),
    error: notifications.error.bind(notifications),
    warning: notifications.warning.bind(notifications),
    info: notifications.info.bind(notifications),
  };
}

// For React imports
import React from 'react';