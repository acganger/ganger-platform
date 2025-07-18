import React, { forwardRef, useEffect } from 'react'
import { clsx } from '../utils/clsx'

// Modal container styles
const modalStyles = {
  overlay: [
    // Position and z-index
    'fixed inset-0 z-50',
    'flex items-center justify-center',
    'p-4 sm:p-6 md:p-20',
    // Background overlay
    'bg-zinc-950/25 backdrop-blur-sm',
    // Animation support
    'transition-opacity duration-200',
  ],
  container: [
    // Layout
    'relative w-full overflow-hidden',
    // Background and border
    'bg-white dark:bg-zinc-900',
    'ring-1 ring-zinc-950/5 dark:ring-white/10',
    // Shadow
    'shadow-2xl',
    // Animation support  
    'transition-all duration-200',
  ],
  sizes: {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-[95vw]',
  },
  rounded: {
    none: 'rounded-none',
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
  },
}

// Header styles
const headerStyles = {
  base: [
    'flex items-center justify-between',
    'px-6 py-4',
    'border-b border-zinc-200 dark:border-zinc-800',
  ],
  title: [
    'text-lg font-semibold leading-6',
    'text-zinc-900 dark:text-zinc-100',
  ],
  closeButton: [
    'rounded-md p-1',
    'text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-400',
    'hover:bg-zinc-100 dark:hover:bg-zinc-800',
    'focus:outline-none focus:ring-2 focus:ring-blue-500',
    'transition-colors duration-200',
  ],
}

// Content styles
const contentStyles = [
  'px-6 py-4',
  'text-zinc-700 dark:text-zinc-300',
  'overflow-y-auto',
]

// Footer styles
const footerStyles = [
  'flex items-center justify-end gap-3',
  'px-6 py-4',
  'border-t border-zinc-200 dark:border-zinc-800',
  'bg-zinc-50 dark:bg-zinc-800/50',
]

// Main Modal Component
export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the modal is open */
  isOpen: boolean
  /** Function to call when modal should close */
  onClose: () => void
  /** Modal title (optional) */
  title?: string
  /** Size of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  /** Whether to show the close button */
  showCloseButton?: boolean
  /** Whether clicking overlay closes modal */
  closeOnOverlayClick?: boolean
  /** Whether ESC key closes modal */
  closeOnEscape?: boolean
  /** Additional CSS classes */
  className?: string
  /** Modal content */
  children: React.ReactNode
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  function Modal({
    isOpen,
    onClose,
    title,
    size = 'md',
    rounded = 'lg',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    className,
    children,
    ...props
  }, ref) {
    
    // Handle escape key
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return
      
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, closeOnEscape, onClose])
    
    // Prevent body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }
      
      return () => {
        document.body.style.overflow = 'unset'
      }
    }, [isOpen])
    
    if (!isOpen) return null
    
    return (
      <div
        className={clsx(modalStyles.overlay)}
        onClick={closeOnOverlayClick ? onClose : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div
          ref={ref}
          className={clsx(
            modalStyles.container,
            modalStyles.sizes[size],
            modalStyles.rounded[rounded],
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className={clsx(headerStyles.base)}>
              {title && (
                <h3 id="modal-title" className={clsx(headerStyles.title)}>
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  className={clsx(headerStyles.closeButton)}
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Content area */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            {children}
          </div>
        </div>
      </div>
    )
  }
)

// ModalHeader Component
export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string
  /** Header content */
  children: React.ReactNode
}

export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  function ModalHeader({
    className,
    children,
    ...props
  }, ref) {
    return (
      <div
        ref={ref}
        className={clsx(headerStyles.base, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

// ModalContent Component
export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string
  /** Content */
  children: React.ReactNode
}

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  function ModalContent({
    className,
    children,
    ...props
  }, ref) {
    return (
      <div
        ref={ref}
        className={clsx(contentStyles, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

// ModalFooter Component
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string
  /** Footer content */
  children: React.ReactNode
}

export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  function ModalFooter({
    className,
    children,
    ...props
  }, ref) {
    return (
      <div
        ref={ref}
        className={clsx(footerStyles, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

// Legacy API compatibility
export interface ModalLegacyProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  children: React.ReactNode
  className?: string
}

export const ModalLegacy = forwardRef<HTMLDivElement, ModalLegacyProps>(
  function ModalLegacy({
    size = 'md',
    showCloseButton = true,
    ...props
  }, ref) {
    // Map legacy sizes to new sizes
    const sizeMap = {
      sm: 'sm' as const,
      md: 'md' as const,
      lg: 'lg' as const,
      xl: 'xl' as const,
    }
    
    return (
      <Modal
        ref={ref}
        size={sizeMap[size]}
        showCloseButton={showCloseButton}
        closeOnOverlayClick={true}
        closeOnEscape={true}
        {...props}
      />
    )
  }
)

// Legacy component exports for compatibility
export const ModalHeaderLegacy = ModalHeader
export const ModalContentLegacy = ModalContent  
export const ModalFooterLegacy = ModalFooter