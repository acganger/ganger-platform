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
declare class NotificationManager {
    private notifications;
    private listeners;
    private idCounter;
    show(options: NotificationOptions): string;
    dismiss(id: string): void;
    dismissAll(): void;
    getAll(): NotificationInstance[];
    subscribe(listener: (notifications: NotificationInstance[]) => void): () => void;
    private notifyListeners;
    success(title: string, message?: string, options?: Partial<NotificationOptions>): string;
    error(title: string, message?: string, options?: Partial<NotificationOptions>): string;
    warning(title: string, message?: string, options?: Partial<NotificationOptions>): string;
    info(title: string, message?: string, options?: Partial<NotificationOptions>): string;
}
export declare const notifications: NotificationManager;
export declare function useNotifications(): {
    notifications: NotificationInstance[];
    show: (options: NotificationOptions) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
    success: (title: string, message?: string, options?: Partial<NotificationOptions>) => string;
    error: (title: string, message?: string, options?: Partial<NotificationOptions>) => string;
    warning: (title: string, message?: string, options?: Partial<NotificationOptions>) => string;
    info: (title: string, message?: string, options?: Partial<NotificationOptions>) => string;
};
export {};
