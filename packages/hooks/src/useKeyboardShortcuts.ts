import { useEffect, useRef, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
  enabled?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  enableOnInput?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const {
    enableOnInput = false,
    preventDefault = true,
    stopPropagation = true,
  } = options;

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if focused on input/textarea and not enabled
    if (!enableOnInput) {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target.contentEditable === 'true'
      ) {
        return;
      }
    }

    // Check each shortcut
    for (const shortcut of shortcutsRef.current) {
      if (shortcut.enabled === false) continue;

      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !shortcut.ctrl || event.ctrlKey === shortcut.ctrl;
      const altMatches = !shortcut.alt || event.altKey === shortcut.alt;
      const shiftMatches = !shortcut.shift || event.shiftKey === shortcut.shift;
      const metaMatches = !shortcut.meta || event.metaKey === shortcut.meta;

      if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        shortcut.handler(event);
        break;
      }
    }
  }, [enableOnInput, preventDefault, stopPropagation]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Return helper to get formatted shortcut string
  const getShortcutString = useCallback((shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.meta) parts.push('⌘');
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    
    // Format the key
    let key = shortcut.key;
    if (key === ' ') key = 'Space';
    else if (key === 'ArrowUp') key = '↑';
    else if (key === 'ArrowDown') key = '↓';
    else if (key === 'ArrowLeft') key = '←';
    else if (key === 'ArrowRight') key = '→';
    else if (key === 'Enter') key = '⏎';
    else if (key === 'Escape') key = 'Esc';
    else key = key.charAt(0).toUpperCase() + key.slice(1);
    
    parts.push(key);
    
    return parts.join('+');
  }, []);

  return { getShortcutString };
}

/**
 * Hook for common navigation shortcuts
 */
export function useKeyboardNavigation(options?: {
  onNext?: () => void;
  onPrevious?: () => void;
  onSelect?: () => void;
  onCancel?: () => void;
  onSearch?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowDown',
      handler: () => options?.onNext?.(),
      description: 'Navigate to next item',
    },
    {
      key: 'ArrowUp',
      handler: () => options?.onPrevious?.(),
      description: 'Navigate to previous item',
    },
    {
      key: 'Enter',
      handler: () => options?.onSelect?.(),
      description: 'Select current item',
    },
    {
      key: 'Escape',
      handler: () => options?.onCancel?.(),
      description: 'Cancel/close',
    },
    {
      key: '/',
      handler: (e) => {
        e.preventDefault();
        options?.onSearch?.();
      },
      description: 'Focus search',
    },
  ].filter(s => s.handler);

  useKeyboardShortcuts(shortcuts);
}

/**
 * Hook for application-wide shortcuts
 */
export function useGlobalShortcuts() {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      meta: true,
      ctrl: true,
      handler: () => {
        // Open command palette
        const event = new CustomEvent('openCommandPalette');
        window.dispatchEvent(event);
      },
      description: 'Open command palette',
    },
    {
      key: '?',
      shift: true,
      handler: () => {
        // Show keyboard shortcuts help
        const event = new CustomEvent('showKeyboardHelp');
        window.dispatchEvent(event);
      },
      description: 'Show keyboard shortcuts',
    },
    {
      key: 'n',
      alt: true,
      handler: () => {
        // Toggle notifications
        const event = new CustomEvent('toggleNotifications');
        window.dispatchEvent(event);
      },
      description: 'Toggle notifications',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}