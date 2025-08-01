import React from 'react';
interface ToastProps {
    id: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}
interface ToastContextType {
    toasts: ToastProps[];
    addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
    removeToast: (id: string) => void;
}
export declare const useToast: () => ToastContextType;
declare const Toast: React.FC<ToastProps>;
declare const ToastContainer: React.FC<{
    toasts: ToastProps[];
}>;
declare const ToastProvider: React.FC<{
    children: React.ReactNode;
}>;
export { Toast, ToastProvider, ToastContainer };
