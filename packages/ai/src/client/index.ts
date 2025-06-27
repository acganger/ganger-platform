/**
 * @fileoverview Client-side AI exports
 * Main entry point for client-side AI functionality (React hooks and components)
 */

// React hooks
export {
  useAI,
  useAIChat,
  useAIUsage,
  useAISafety
} from './hooks';

// React components
export {
  AIChatComponent,
  AIUsageMonitor,
  AISafetyIndicator,
  QuickAIButton,
  AIAvailabilityStatus
} from './components';

// Re-export types for client use
export type {
  UseAIOptions,
  UseAIReturn,
  AIChatComponentProps,
  AIUsageMonitorProps,
  ChatMessage,
  AIResponse,
  ApplicationContext,
  AIError
} from '../shared/types';