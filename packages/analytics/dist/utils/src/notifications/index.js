// Notification system for user feedback across applications
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.listeners = [];
        this.idCounter = 0;
    }
    show(options) {
        const id = `notification_${++this.idCounter}_${Date.now()}`;
        const notification = {
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
    dismiss(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.notifyListeners();
    }
    dismissAll() {
        this.notifications = [];
        this.notifyListeners();
    }
    getAll() {
        return [...this.notifications];
    }
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    notifyListeners() {
        this.listeners.forEach(listener => {
            listener([...this.notifications]);
        });
    }
    // Convenience methods
    success(title, message, options) {
        return this.show({
            title,
            message,
            type: 'success',
            ...options,
        });
    }
    error(title, message, options) {
        return this.show({
            title,
            message,
            type: 'error',
            duration: 0, // Don't auto-dismiss errors
            ...options,
        });
    }
    warning(title, message, options) {
        return this.show({
            title,
            message,
            type: 'warning',
            ...options,
        });
    }
    info(title, message, options) {
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
    const [notificationList, setNotificationList] = React.useState([]);
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
