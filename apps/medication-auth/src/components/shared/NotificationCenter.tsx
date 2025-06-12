import { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@/components/icons';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  autoHide?: boolean;
  duration?: number;
  authorization_id?: string;
}

// Global notification state (in a real app, this would be in a state management solution)
let notifications: Notification[] = [];
let listeners: ((notifications: Notification[]) => void)[] = [];

export const addNotification = (notification: Omit<Notification, 'id'>) => {
  const newNotification: Notification = {
    ...notification,
    id: Math.random().toString(36).substr(2, 9),
    autoHide: notification.autoHide ?? true,
    duration: notification.duration ?? 5000,
  };
  
  notifications = [newNotification, ...notifications];
  listeners.forEach(listener => listener([...notifications]));
  
  if (newNotification.autoHide) {
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, newNotification.duration);
  }
};

export const removeNotification = (id: string) => {
  notifications = notifications.filter(n => n.id !== id);
  listeners.forEach(listener => listener([...notifications]));
};

export function NotificationCenter() {
  const [notificationList, setNotificationList] = useState<Notification[]>([]);

  useEffect(() => {
    const listener = (newNotifications: Notification[]) => {
      setNotificationList(newNotifications);
    };
    
    listeners.push(listener);
    
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />;
      default:
        return <InformationCircleIcon className="w-6 h-6 text-blue-400" />;
    }
  };

  const getBackgroundClass = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (notificationList.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notificationList.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-lg border p-4 shadow-lg transform transition-all duration-300 ease-in-out ${getBackgroundClass(notification.type)}`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-gray-800">
                {notification.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {notification.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                type="button"
                className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => removeNotification(notification.id)}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}