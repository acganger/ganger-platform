/**
 * @fileoverview Server-side AI exports
 * Main entry point for server-side AI functionality
 */

// Core client
export { GangerAI, createGangerAI } from './client';

// Safety filtering
export {
  SafetyFilter,
  createSafetyFilter,
  quickSafetyCheck,
  SafetyCategory
} from './safety';

// Usage monitoring
export {
  AIUsageMonitor,
  createUsageMonitor,
  AI_USAGE_SCHEMA
} from './monitoring';

// Re-export types for server use
export type {
  AIModel,
  ApplicationContext,
  UseCase,
  GangerAIConfig,
  AIChatRequest,
  AIResponse,
  ChatMessage,
  SafetyCheckResponse,
  AIUsageEvent,
  DailyUsageReport,
  RateLimitConfig,
  ModelConfig,
  EmergencyState,
  HIPAAComplianceLevel,
  AIError,
  RateLimitError,
  BudgetExceededError,
  SafetyViolationError,
  ModelUnavailableError
} from '../shared/types';

// Re-export constants for server use
export {
  AI_MODELS,
  APP_RATE_LIMITS,
  MODEL_SELECTION,
  EMERGENCY_THRESHOLDS,
  HIPAA_SAFETY_CONFIG,
  SYSTEM_PROMPTS,
  DEFAULT_BUDGETS,
  PLATFORM_URLS,
  ERROR_MESSAGES
} from '../shared/constants';