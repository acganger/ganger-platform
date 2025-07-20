import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }));
    
    // Auto-remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }));
      }, toast.duration || 5000);
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  },
  clearToasts: () => {
    set({ toasts: [] });
  }
}));

export function useToast() {
  const { toasts, addToast, removeToast, clearToasts } = useToastStore();
  
  const toast = {
    success: (title: string, description?: string) => {
      addToast({ title, description, type: 'success' });
    },
    error: (title: string, description?: string) => {
      addToast({ title, description, type: 'error' });
    },
    warning: (title: string, description?: string) => {
      addToast({ title, description, type: 'warning' });
    },
    info: (title: string, description?: string) => {
      addToast({ title, description, type: 'info' });
    },
    custom: (toast: Omit<Toast, 'id'>) => {
      addToast(toast);
    }
  };
  
  return {
    toasts,
    toast,
    removeToast,
    clearToasts
  };
}