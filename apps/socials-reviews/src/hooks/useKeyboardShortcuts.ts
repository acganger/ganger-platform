'use client'

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      if (shortcut.disabled) continue;

      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrl === event.ctrlKey;
      const shiftMatches = !!shortcut.shift === event.shiftKey;
      const altMatches = !!shortcut.alt === event.altKey;
      const metaMatches = !!shortcut.meta === event.metaKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Predefined shortcuts for the application
export function useSocialsReviewsShortcuts({
  onRefresh,
  onNewReview,
  onNewPost,
  onSearch,
  onHelp,
  onSwitchTab,
  onQuickFilter,
}: {
  onRefresh?: () => void;
  onNewReview?: () => void;
  onNewPost?: () => void;
  onSearch?: () => void;
  onHelp?: () => void;
  onSwitchTab?: (tab: string) => void;
  onQuickFilter?: (filter: string) => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    // Global shortcuts
    {
      key: 'r',
      ctrl: true,
      action: () => onRefresh?.(),
      description: 'Refresh data',
    },
    {
      key: 'f',
      ctrl: true,
      action: () => onSearch?.(),
      description: 'Focus search',
    },
    {
      key: '?',
      action: () => onHelp?.(),
      description: 'Show keyboard shortcuts',
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals or clear selection
        const event = new CustomEvent('close-modals');
        window.dispatchEvent(event);
      },
      description: 'Close modals/clear selection',
    },

    // Tab navigation
    {
      key: '1',
      alt: true,
      action: () => onSwitchTab?.('reviews'),
      description: 'Switch to Reviews tab',
    },
    {
      key: '2',
      alt: true,
      action: () => onSwitchTab?.('social'),
      description: 'Switch to Social Media tab',
    },
    {
      key: '3',
      alt: true,
      action: () => onSwitchTab?.('content'),
      description: 'Switch to Content Library tab',
    },
    {
      key: '4',
      alt: true,
      action: () => onSwitchTab?.('settings'),
      description: 'Switch to Settings tab',
    },

    // Quick actions
    {
      key: 'n',
      ctrl: true,
      action: () => onNewReview?.(),
      description: 'Create new review response',
    },
    {
      key: 'g',
      ctrl: true,
      action: () => onNewPost?.(),
      description: 'GD It! - Adapt new content',
    },

    // Quick filters
    {
      key: 'u',
      ctrl: true,
      action: () => onQuickFilter?.('urgent'),
      description: 'Filter urgent reviews',
    },
    {
      key: 'p',
      ctrl: true,
      action: () => onQuickFilter?.('pending'),
      description: 'Filter pending items',
    },
    {
      key: 'h',
      ctrl: true,
      action: () => onQuickFilter?.('high-performing'),
      description: 'Filter high-performing posts',
    },

    // Accessibility shortcuts
    {
      key: 'h',
      alt: true,
      action: () => {
        const heading = document.querySelector('h1, h2, h3') as HTMLElement;
        heading?.focus();
      },
      description: 'Jump to main heading',
    },
    {
      key: 'm',
      alt: true,
      action: () => {
        const main = document.querySelector('main, [role="main"]') as HTMLElement;
        main?.focus();
      },
      description: 'Jump to main content',
    },
    {
      key: 'n',
      alt: true,
      action: () => {
        const nav = document.querySelector('nav, [role="navigation"]') as HTMLElement;
        nav?.focus();
      },
      description: 'Jump to navigation',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

// Hook for showing keyboard shortcuts help
export function useShortcutsHelp() {
  const [isVisible, setIsVisible] = React.useState(false);

  const shortcuts = [
    { combo: 'Ctrl + R', description: 'Refresh data' },
    { combo: 'Ctrl + F', description: 'Focus search' },
    { combo: '?', description: 'Show this help' },
    { combo: 'Esc', description: 'Close modals' },
    { combo: 'Alt + 1-4', description: 'Switch tabs' },
    { combo: 'Ctrl + N', description: 'New review response' },
    { combo: 'Ctrl + G', description: 'GD It! - Adapt content' },
    { combo: 'Ctrl + U', description: 'Filter urgent reviews' },
    { combo: 'Ctrl + P', description: 'Filter pending items' },
    { combo: 'Ctrl + H', description: 'Filter high-performing posts' },
    { combo: 'Alt + H', description: 'Jump to main heading' },
    { combo: 'Alt + M', description: 'Jump to main content' },
    { combo: 'Alt + N', description: 'Jump to navigation' },
  ];

  const showHelp = () => setIsVisible(true);
  const hideHelp = () => setIsVisible(false);

  // Listen for help requests
  useEffect(() => {
    const handleShowHelp = () => showHelp();
    window.addEventListener('show-shortcuts-help', handleShowHelp);
    return () => window.removeEventListener('show-shortcuts-help', handleShowHelp);
  }, []);

  return {
    isVisible,
    shortcuts,
    showHelp,
    hideHelp,
  };
}

// Power user features
export function usePowerUserFeatures() {
  // Bulk actions state
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const [bulkMode, setBulkMode] = React.useState(false);

  // Bulk selection shortcuts
  const bulkShortcuts: KeyboardShortcut[] = [
    {
      key: 'a',
      ctrl: true,
      action: () => {
        const event = new CustomEvent('select-all');
        window.dispatchEvent(event);
      },
      description: 'Select all items',
    },
    {
      key: 'a',
      ctrl: true,
      shift: true,
      action: () => {
        setSelectedItems([]);
      },
      description: 'Deselect all items',
    },
    {
      key: 'b',
      ctrl: true,
      action: () => setBulkMode(!bulkMode),
      description: 'Toggle bulk selection mode',
    },
    {
      key: 'Delete',
      action: () => {
        if (selectedItems.length > 0) {
          const event = new CustomEvent('bulk-delete', { detail: selectedItems });
          window.dispatchEvent(event);
        }
      },
      description: 'Delete selected items',
    },
  ];

  useKeyboardShortcuts(bulkShortcuts);

  // Quick actions
  const performBulkAction = useCallback((action: string, itemIds: string[]) => {
    // Perform bulk action
    void action;
    void itemIds;
    // Implementation would depend on the specific action
  }, []);

  return {
    selectedItems,
    setSelectedItems,
    bulkMode,
    setBulkMode,
    performBulkAction,
  };
}

// Use React import for state hooks
import React from 'react';