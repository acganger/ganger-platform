// Authentication hooks
export { useAuth } from './useAuth';
export { useUser } from './useUser';
export { usePermissions } from './usePermissions';

// Data fetching hooks
export { useSupabaseQuery, useSupabaseItem, useSupabaseList } from './useSupabaseQuery';
export { useSupabaseMutation } from './useSupabaseMutation';

// Realtime hooks
export { 
  useRealtimeSubscription, 
  useRealtimeList, 
  useRealtimeItem,
  usePresence 
} from './useRealtimeSubscription';
export type { RealtimeOptions, RealtimeSubscriptionState } from './useRealtimeSubscription';

// Form and validation hooks
export { useDebounce, useDebouncedCallback, useDebouncedState } from './useDebounce';
export { useThrottle, useThrottledCallback } from './useThrottle';

// Error handling hooks
export { useErrorHandler, useAsyncErrorHandler, useRetry } from './useErrorHandler';
export type { ErrorHandlerOptions } from './useErrorHandler';

// UI/UX hooks
export { useToast } from './useToast';
export type { Toast, ToastType } from './useToast';
export { useModal } from './useModal';
export { useLocalStorage } from './useLocalStorage';

// Keyboard hooks
export { 
  useKeyboardShortcuts, 
  useKeyboardNavigation,
  useGlobalShortcuts 
} from './useKeyboardShortcuts';
export type { KeyboardShortcut, UseKeyboardShortcutsOptions } from './useKeyboardShortcuts';

// Performance hooks
export { usePerformanceMonitor, useComponentLifecycle } from './usePerformanceMonitor';

// Re-export types
// Note: ApiRequest, ApiResponse, ApiHandlerOptions have been removed as they don't exist in @ganger/utils/server