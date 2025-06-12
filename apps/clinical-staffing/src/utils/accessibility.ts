// Accessibility utility functions

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

export function announceToScreenReader(message: string): void {
  if (typeof window === 'undefined') return;
  
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
}

export function focusElement(elementId: string): void {
  if (typeof window === 'undefined') return;
  
  const element = document.getElementById(elementId);
  if (element) {
    element.focus();
  }
}

export function trapFocus(containerElement: HTMLElement): () => void {
  const focusableElements = containerElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  function handleTab(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }

  containerElement.addEventListener('keydown', handleTab);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    containerElement.removeEventListener('keydown', handleTab);
  };
}

export function handleEscapeKey(callback: () => void): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      callback();
    }
  };
}

// ARIA label helpers
export function getAriaLabel(action: string, target: string): string {
  return `${action} ${target}`;
}

export function getAriaDescription(description: string): string {
  return description;
}

// Status announcement helpers
export function announceStatus(status: 'success' | 'error' | 'warning' | 'info', message: string): void {
  const prefix = {
    success: 'Success:',
    error: 'Error:',
    warning: 'Warning:',
    info: 'Information:'
  }[status];
  
  announceToScreenReader(`${prefix} ${message}`);
}

export function announceFormValidation(errors: Record<string, string>): void {
  const errorCount = Object.keys(errors).length;
  if (errorCount > 0) {
    announceToScreenReader(`Form has ${errorCount} error${errorCount > 1 ? 's' : ''}. Please review and correct.`);
  }
}

// Loading state announcements
export function announceLoadingState(isLoading: boolean, loadingText = 'Loading', completeText = 'Content loaded'): void {
  if (isLoading) {
    announceToScreenReader(loadingText);
  } else {
    announceToScreenReader(completeText);
  }
}

// Drag and drop accessibility
export function announceDragStart(itemName: string): void {
  announceToScreenReader(`Started dragging ${itemName}. Use arrow keys to move, space to drop, escape to cancel.`);
}

export function announceDragEnd(itemName: string, target?: string): void {
  if (target) {
    announceToScreenReader(`Dropped ${itemName} on ${target}`);
  } else {
    announceToScreenReader(`Cancelled dragging ${itemName}`);
  }
}

// Keyboard navigation helpers
export function handleArrowKeyNavigation(
  e: KeyboardEvent, 
  items: HTMLElement[], 
  currentIndex: number
): number {
  let newIndex = currentIndex;
  
  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      newIndex = Math.min(currentIndex + 1, items.length - 1);
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      newIndex = Math.max(currentIndex - 1, 0);
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = items.length - 1;
      break;
    default:
      return currentIndex;
  }
  
  e.preventDefault();
  items[newIndex]?.focus();
  return newIndex;
}

export default {
  generateId,
  announceToScreenReader,
  focusElement,
  trapFocus,
  handleEscapeKey,
  getAriaLabel,
  getAriaDescription,
  announceStatus,
  announceFormValidation,
  announceLoadingState,
  announceDragStart,
  announceDragEnd,
  handleArrowKeyNavigation,
};