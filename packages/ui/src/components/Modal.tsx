import React from 'react';
// @ts-ignore - Used in JSX className expressions
import { cn } from '../utils/cn';

/**
 * Props for the Modal component
 */
// @ts-ignore - Used in Modal component and exported
interface ModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  
  /**
   * Callback function when the modal should close
   * Called when clicking overlay, close button, or pressing Escape
   */
  onClose: () => void;
  
  /**
   * Optional title displayed in the modal header
   */
  title?: string;
  
  /**
   * Modal content
   */
  children: React.ReactNode;
  
  /**
   * Size of the modal
   * @default 'md'
   * - sm: max-width 28rem
   * - md: max-width 32rem
   * - lg: max-width 42rem
   * - xl: max-width 56rem
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Whether to show the close button in the header
   * @default true
   */
  showCloseButton?: boolean;
}

// @ts-ignore - Used in ModalHeader component and exported
interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

// @ts-ignore - Used in ModalContent component and exported
interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

// @ts-ignore - Used in ModalFooter component and exported
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Modal component for overlays and dialogs
 * 
 * @description
 * A flexible modal component that displays content in an overlay. Supports
 * keyboard navigation (Escape to close), click-outside-to-close, and prevents
 * body scroll when open. Can be used with or without the section components.
 * 
 * @example
 * ```tsx
 * // Basic modal with title
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * <Modal 
 *   isOpen={isOpen} 
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 * >
 *   <ModalContent>
 *     <p>Are you sure you want to proceed?</p>
 *   </ModalContent>
 *   <ModalFooter>
 *     <Button variant="outline" onClick={() => setIsOpen(false)}>
 *       Cancel
 *     </Button>
 *     <Button onClick={handleConfirm}>Confirm</Button>
 *   </ModalFooter>
 * </Modal>
 * 
 * // Custom modal without title
 * <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
 *   <ModalHeader>
 *     <h2 className="text-xl font-bold">Custom Header</h2>
 *   </ModalHeader>
 *   <ModalContent>
 *     <form onSubmit={handleSubmit}>
 *       <Input label="Name" />
 *       <Input label="Email" type="email" />
 *     </form>
 *   </ModalContent>
 * </Modal>
 * 
 * // Large modal
 * <Modal isOpen={isOpen} onClose={onClose} size="lg" title="User Details">
 *   <ModalContent>
 *     // Large content
 *   </ModalContent>
 * </Modal>
 * ```
 * 
 * @component
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden',
          sizeClasses[size],
          'w-full mx-4'
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * ModalHeader component for custom modal headers
 * 
 * @description
 * Container for custom modal header content when the default title prop
 * is not sufficient. Adds appropriate padding and border.
 * 
 * @component
 */
const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className }) => (
  <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
    {children}
  </div>
);

/**
 * ModalContent component for modal body
 * 
 * @description
 * Container for the main content of the modal. Provides consistent
 * padding for modal body content.
 * 
 * @component
 */
const ModalContent: React.FC<ModalContentProps> = ({ children, className }) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
);

/**
 * ModalFooter component for modal actions
 * 
 * @description
 * Container for modal footer content, typically used for action buttons.
 * Adds appropriate spacing, background color, and right-aligns content by default.
 * 
 * @component
 */
const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => (
  <div className={cn('px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2', className)}>
    {children}
  </div>
);

export { Modal, ModalHeader, ModalContent, ModalFooter };
export type { ModalProps, ModalHeaderProps, ModalContentProps, ModalFooterProps };