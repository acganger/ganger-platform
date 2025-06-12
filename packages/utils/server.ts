// Server-side utilities exports for API routes
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
} from './src/api-responses';

export type {
  StandardErrorResponse,
  StandardSuccessResponse,
  ValidationErrorResponse,
} from './src/api-responses';

export {
  withRateLimit,
  checkRateLimit,
  initializeRedisStore,
  createUserRateLimit,
  createCombinedRateLimit,
  createRateLimitStatusEndpoint,
  isRateLimited,
  RateLimits,
} from './src/rate-limiting';

export type {
  RateLimitConfig,
  RateLimitResult,
} from './src/rate-limiting';

export {
  performHealthCheck,
  createHealthCheckEndpoint,
  createDatabaseStatsEndpoint,
  getMonitoringDashboard,
} from './src/health-check';

export type {
  HealthCheckResult,
} from './src/health-check';

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
} from './src/helpers/common';

// Audit logging function for compliance
export async function auditLog(entry: {
  action: string;
  userId?: string;
  userEmail?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  result?: 'success' | 'failure';
  error?: string;
}) {
  // In a real implementation, this would write to audit logs
  // For testing purposes, we'll just log to console
  console.log('Audit Log:', {
    timestamp: new Date().toISOString(),
    ...entry
  });
}