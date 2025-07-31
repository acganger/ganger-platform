// Validation utilities
export * from './validation/schemas';

// Formatting utilities - temporarily disabled due to date-fns dependency issue
// TODO: Fix date-fns dependency resolution in monorepo
// export * from './formatting/text';

// Currency and number formatters
export * from './formatters';

// Analytics utilities
export {
  analytics,
  trackEvent,
  trackPageView,
  trackError,
  setUserId,
  measurePerformance,
  useAnalytics,
} from './analytics/events';
export type {
  AnalyticsEvent,
  UserSession,
} from './analytics/events';

// Notification utilities
export {
  notifications,
  useNotifications,
} from './notifications';
export type {
  NotificationOptions,
  NotificationInstance,
} from './notifications';

// Health check and monitoring utilities
export {
  performHealthCheck,
  createHealthCheckEndpoint,
  createDatabaseStatsEndpoint,
  getMonitoringDashboard,
} from './health-check';
export type {
  HealthCheckResult,
} from './health-check';

// Rate limiting utilities
export {
  withRateLimit,
  checkRateLimit,
  initializeRedisStore,
  createUserRateLimit,
  createCombinedRateLimit,
  createRateLimitStatusEndpoint,
  isRateLimited,
  RateLimits,
} from './rate-limiting';
export type {
  RateLimitConfig,
  RateLimitResult,
} from './rate-limiting';

// API response standardization
export {
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
  withStandardErrorHandling,
  respondWithSuccess,
  respondWithError,
  respondWithValidationError,
  transformZodErrors,
  transformSupabaseError,
  handleMethodNotAllowed,
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  HIPAAError,
  ErrorCodes,
  ErrorSeverity,
} from './api-responses';
export type {
  StandardErrorResponse,
  StandardSuccessResponse,
  ValidationErrorResponse,
} from './api-responses';

// Common helper utilities
export {
  generateId,
  generateShortId,
  encrypt,
  decrypt,
  hashPassword,
  generateHash,
  chunk,
  unique,
  uniqueBy,
  shuffle,
  groupBy,
  pick,
  omit,
  deepClone,
  isEqual,
  debounce,
  throttle,
  memoize,
  retry,
  sleep,
  timeout,
  promiseAll,
  buildUrl,
  parseQueryParams,
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isFunction,
  isEmpty,
  localStorage,
  sessionStorage,
  randomInt,
  randomFloat,
  randomChoice,
  randomString,
  isBrowser,
  isServer,
  isDevelopment,
  isProduction,
  isTest,
  AppError,
  createError,
} from './helpers/common';

// Error logging utilities (Vercel-compatible)
export {
  errorLogger,
  captureException,
  captureMessage,
  setUser,
  logErrorToService,
  logApiError,
} from './error-logger';
export type {
  ErrorContext,
  ErrorLogEntry,
} from './error-logger';