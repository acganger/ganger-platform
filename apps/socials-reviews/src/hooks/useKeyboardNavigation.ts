'use client'

import { useEffect, useCallback } from 'react';

export interface UseKeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  onShiftTab?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
      case 'Enter':
        if (!event.shiftKey) {
          event.preventDefault();
          onEnter?.();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        onArrowRight?.();
        break;
      case 'Tab':
        if (event.shiftKey) {
          if (onShiftTab) {
            event.preventDefault();
            onShiftTab();
          }
        } else {
          if (onTab) {
            event.preventDefault();
            onTab();
          }
        }
        break;
    }
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, onShiftTab]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [handleKeyDown, enabled]);
}

// Hook for managing focus within a list of items
export function useListKeyboardNavigation<T>(
  items: T[],
  selectedIndex: number,
  onSelectionChange: (index: number) => void,
  onItemActivate?: (item: T, index: number) => void,
  enabled: boolean = true
) {
  useKeyboardNavigation({
    onArrowDown: () => {
      const nextIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
      onSelectionChange(nextIndex);
    },
    onArrowUp: () => {
      const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
      onSelectionChange(prevIndex);
    },
    onEnter: () => {
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        onItemActivate?.(items[selectedIndex]!, selectedIndex);
      }
    },
    enabled,
  });
}

// Hook for managing tab navigation
export function useTabNavigation(
  tabs: string[],
  activeTab: string,
  onTabChange: (tab: string) => void,
  enabled: boolean = true
) {
  const currentIndex = tabs.indexOf(activeTab);

  useKeyboardNavigation({
    onArrowLeft: () => {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
      onTabChange(tabs[prevIndex]!);
    },
    onArrowRight: () => {
      const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
      onTabChange(tabs[nextIndex]!);
    },
    enabled,
  });
}

// Hook for managing modal keyboard navigation
export function useModalKeyboardNavigation(
  isOpen: boolean,
  onClose: () => void,
  onSubmit?: () => void
) {
  useKeyboardNavigation({
    onEscape: onClose,
    onEnter: onSubmit,
    enabled: isOpen,
  });
}

// Custom hook for screen reader announcements
export function useScreenReaderAnnouncement() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove the announcement after it's been read
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return { announce };
}