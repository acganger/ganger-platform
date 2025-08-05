import React, { forwardRef, useCallback, useMemo, useState, useEffect, createContext, useContext } from 'react'
import { clsx } from '../utils/clsx'

// Toast interface
export interface ToastProps {
  id: string
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  onClose: (id: string) => void
}

// Toast context type
interface ToastContextType {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
  removeToast: (id: string) => void
}

// Toast context
const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Hook to use toast context
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast styles
const toastStyles = {
  container: [
    'pointer-events-auto w-full max-w-sm',
    'overflow-hidden rounded-lg',
    'shadow-xl ring-1 ring-black ring-opacity-5',
    'transition-all duration-300 ease-in-out',
    'transform translate-x-0',
  ],
  content: [
    'p-4',
  ],
  header: [
    'flex items-start',
  ],
  iconContainer: [
    'flex-shrink-0',
  ],
  textContainer: [
    'ml-3 w-0 flex-1',
  ],
  title: [
    'text-sm font-medium',
  ],
  message: [
    'text-sm',
  ],
  closeButton: [
    'ml-4 flex flex-shrink-0',
    'inline-flex rounded-md p-1.5',
    'min-h-[44px] min-w-[44px]',
    'items-center justify-center',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'hover:bg-black/5 dark:hover:bg-white/5',
    'transition-colors duration-200',
  ],
  variants: {
    success: {
      container: 'bg-green-50 dark:bg-green-950/20 ring-green-200 dark:ring-green-800',
      icon: 'text-green-400 dark:text-green-300',
      title: 'text-green-800 dark:text-green-200',
      message: 'text-green-700 dark:text-green-300',
      closeButton: 'text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 focus:ring-green-500',
    },
    error: {
      container: 'bg-red-50 dark:bg-red-950/20 ring-red-200 dark:ring-red-800',
      icon: 'text-red-400 dark:text-red-300',
      title: 'text-red-800 dark:text-red-200',
      message: 'text-red-700 dark:text-red-300',
      closeButton: 'text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 focus:ring-red-500',
    },
    warning: {
      container: 'bg-yellow-50 dark:bg-yellow-950/20 ring-yellow-200 dark:ring-yellow-800',
      icon: 'text-yellow-400 dark:text-yellow-300',
      title: 'text-yellow-800 dark:text-yellow-200',
      message: 'text-yellow-700 dark:text-yellow-300',
      closeButton: 'text-yellow-500 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 focus:ring-yellow-500',
    },
    info: {
      container: 'bg-blue-50 dark:bg-blue-950/20 ring-blue-200 dark:ring-blue-800',
      icon: 'text-blue-400 dark:text-blue-300',
      title: 'text-blue-800 dark:text-blue-200',
      message: 'text-blue-700 dark:text-blue-300',
      closeButton: 'text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 focus:ring-blue-500',
    },
  }
}

// Toast icons
const getToastIcon = (type: ToastProps['type']) => {
  switch (type) {
    case 'success':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    case 'error':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    case 'warning':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    default:
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
  }
}

// Toast component
export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  function Toast({
    id,
    type = 'info',
    title,
    message,
    duration = 5000,
    onClose,
  }, ref) {
    
    useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          onClose(id)
        }, duration)
        return () => clearTimeout(timer)
      }
      return undefined
    }, [duration, id, onClose])

    const variantStyles = toastStyles.variants[type]

    return (
      <div
        ref={ref}
        className={clsx(
          toastStyles.container,
          variantStyles.container
        )}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className={clsx(toastStyles.content)}>
          <div className={clsx(toastStyles.header)}>
            <div className={clsx(toastStyles.iconContainer, variantStyles.icon)}>
              {getToastIcon(type)}
            </div>
            
            <div className={clsx(toastStyles.textContainer)}>
              {title && (
                <p className={clsx(toastStyles.title, variantStyles.title)}>
                  {title}
                </p>
              )}
              <p className={clsx(
                toastStyles.message,
                variantStyles.message,
                title ? 'mt-1' : ''
              )}>
                {message}
              </p>
            </div>
            
            <div className={clsx(toastStyles.closeButton)}>
              <button
                className={clsx(variantStyles.closeButton)}
                onClick={() => onClose(id)}
                aria-label="Close notification"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

// Toast container component
export interface ToastContainerProps {
  toasts: ToastProps[]
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ 
  toasts, 
  position = 'top-right' 
}) => {
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50',
  }

  return (
    <div
      className={clsx(positionClasses[position], 'space-y-2')}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}

// Toast provider component
export interface ToastProviderProps {
  children: React.ReactNode
  position?: ToastContainerProps['position']
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  position = 'top-right' 
}) => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: (toastId) => removeToast(toastId),
    }
    setToasts((prev) => [...prev, newToast])
  }, [removeToast])

  const contextValue = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
    }),
    [toasts, addToast, removeToast]
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} position={position} />
    </ToastContext.Provider>
  )
}

// Legacy API compatibility
export interface ToastLegacyProps {
  id: string
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  onClose: (id: string) => void
}

export const ToastLegacy = forwardRef<HTMLDivElement, ToastLegacyProps>(
  function ToastLegacy(props, ref) {
    return <Toast ref={ref} {...props} />
  }
)

export const ToastProviderLegacy = ToastProvider
export const ToastContainerLegacy = ToastContainer