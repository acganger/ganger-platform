/**
 * Error factory for creating type-safe, structured errors
 * Provides consistent error creation across the application
 */

import type { 
  AppError, 
  NetworkError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError,
  DataIntegrityError,
  UserInputError,
  SystemError,
  ExternalServiceError,
  ErrorSeverity,
  RecoveryStrategy
} from '../types/errors';

let errorIdCounter = 0;

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
  return `error_${Date.now()}_${++errorIdCounter}`;
}

/**
 * Create base error structure
 */
function createBaseError(
  code: string,
  message: string,
  severity: ErrorSeverity = 'medium',
  context?: Record<string, unknown>
) {
  return {
    id: generateErrorId(),
    code,
    message,
    severity,
    timestamp: new Date(),
    context: context || {},
    retryable: false,
    userReported: false,
    stackTrace: new Error().stack
  };
}

/**
 * Network error factory
 */
export function createNetworkError(
  message: string,
  options: {
    statusCode?: number;
    endpoint?: string;
    method?: string;
    timeout?: boolean;
    offline?: boolean;
    context?: Record<string, unknown>;
  } = {}
): NetworkError {
  const severity: ErrorSeverity = options.statusCode === 500 ? 'high' : 'medium';
  const recoveryStrategy: RecoveryStrategy = options.timeout || options.offline 
    ? 'RETRY_AUTOMATIC' 
    : 'RETRY_MANUAL';

  return {
    ...createBaseError(`NETWORK_${options.statusCode || 'ERROR'}`, message, severity, options.context),
    category: 'NETWORK',
    statusCode: options.statusCode,
    endpoint: options.endpoint,
    method: options.method,
    timeout: options.timeout,
    offline: options.offline,
    recoveryStrategy,
    retryable: true,
    userMessage: options.offline 
      ? 'You appear to be offline. Please check your connection and try again.'
      : options.timeout
      ? 'The request timed out. Please try again.'
      : 'A network error occurred. Please try again.'
  };
}

/**
 * Validation error factory
 */
export function createValidationError(
  message: string,
  options: {
    fieldName?: string;
    fieldValue?: unknown;
    validationRule?: string;
    expectedFormat?: string;
    context?: Record<string, unknown>;
  } = {}
): ValidationError {
  return {
    ...createBaseError('VALIDATION_FAILED', message, 'low', options.context),
    category: 'VALIDATION',
    fieldName: options.fieldName,
    fieldValue: options.fieldValue,
    validationRule: options.validationRule,
    expectedFormat: options.expectedFormat,
    recoveryStrategy: 'USER_ACTION_REQUIRED',
    retryable: false,
    userMessage: `Please check the ${options.fieldName || 'input'} and try again.`
  };
}

/**
 * Authentication error factory
 */
export function createAuthenticationError(
  message: string,
  options: {
    tokenExpired?: boolean;
    invalidCredentials?: boolean;
    sessionTimeout?: boolean;
    context?: Record<string, unknown>;
  } = {}
): AuthenticationError {
  const code = options.tokenExpired 
    ? 'AUTH_TOKEN_EXPIRED'
    : options.sessionTimeout
    ? 'AUTH_SESSION_TIMEOUT'
    : 'AUTH_FAILED';

  return {
    ...createBaseError(code, message, 'high', options.context),
    category: 'AUTHENTICATION',
    tokenExpired: options.tokenExpired,
    invalidCredentials: options.invalidCredentials,
    sessionTimeout: options.sessionTimeout,
    recoveryStrategy: 'REDIRECT',
    retryable: false,
    userMessage: options.tokenExpired || options.sessionTimeout
      ? 'Your session has expired. Please sign in again.'
      : 'Authentication failed. Please check your credentials.'
  };
}

/**
 * Authorization error factory
 */
export function createAuthorizationError(
  message: string,
  options: {
    requiredPermission?: string;
    userRole?: string;
    resourceId?: string;
    context?: Record<string, unknown>;
  } = {}
): AuthorizationError {
  return {
    ...createBaseError('AUTHORIZATION_FAILED', message, 'medium', options.context),
    category: 'AUTHORIZATION',
    requiredPermission: options.requiredPermission,
    userRole: options.userRole,
    resourceId: options.resourceId,
    recoveryStrategy: 'USER_ACTION_REQUIRED',
    retryable: false,
    userMessage: 'You do not have permission to perform this action.'
  };
}

/**
 * Data integrity error factory
 */
export function createDataIntegrityError(
  message: string,
  options: {
    corruptedData?: unknown;
    missingFields?: string[];
    inconsistentState?: boolean;
    context?: Record<string, unknown>;
  } = {}
): DataIntegrityError {
  return {
    ...createBaseError('DATA_INTEGRITY_ERROR', message, 'high', options.context),
    category: 'DATA_INTEGRITY',
    corruptedData: options.corruptedData,
    missingFields: options.missingFields,
    inconsistentState: options.inconsistentState,
    recoveryStrategy: 'FALLBACK_DATA',
    retryable: true,
    userMessage: 'There was an issue with the data. We\'re attempting to recover.'
  };
}

/**
 * User input error factory
 */
export function createUserInputError(
  message: string,
  options: {
    inputField?: string;
    inputValue?: unknown;
    suggestion?: string;
    context?: Record<string, unknown>;
  } = {}
): UserInputError {
  return {
    ...createBaseError('USER_INPUT_ERROR', message, 'low', options.context),
    category: 'USER_INPUT',
    inputField: options.inputField,
    inputValue: options.inputValue,
    suggestion: options.suggestion,
    recoveryStrategy: 'USER_ACTION_REQUIRED',
    retryable: false,
    userMessage: options.suggestion || 'Please check your input and try again.'
  };
}

/**
 * System error factory
 */
export function createSystemError(
  message: string,
  options: {
    componentName?: string;
    errorBoundary?: boolean;
    renderError?: boolean;
    context?: Record<string, unknown>;
  } = {}
): SystemError {
  return {
    ...createBaseError('SYSTEM_ERROR', message, 'critical', options.context),
    category: 'SYSTEM',
    componentName: options.componentName,
    errorBoundary: options.errorBoundary,
    renderError: options.renderError,
    recoveryStrategy: options.renderError ? 'RELOAD_PAGE' : 'RETRY_AUTOMATIC',
    retryable: !options.renderError,
    userMessage: options.renderError
      ? 'Something went wrong. Please refresh the page.'
      : 'A system error occurred. We\'re working to fix it.'
  };
}

/**
 * External service error factory
 */
export function createExternalServiceError(
  message: string,
  options: {
    serviceName?: string;
    serviceEndpoint?: string;
    serviceStatus?: number;
    downtime?: boolean;
    context?: Record<string, unknown>;
  } = {}
): ExternalServiceError {
  return {
    ...createBaseError('EXTERNAL_SERVICE_ERROR', message, 'medium', options.context),
    category: 'EXTERNAL_SERVICE',
    serviceName: options.serviceName,
    serviceEndpoint: options.serviceEndpoint,
    serviceStatus: options.serviceStatus,
    downtime: options.downtime,
    recoveryStrategy: options.downtime ? 'FALLBACK_DATA' : 'RETRY_AUTOMATIC',
    retryable: true,
    userMessage: options.downtime
      ? `${options.serviceName || 'External service'} is temporarily unavailable. Using cached data.`
      : `There was an issue connecting to ${options.serviceName || 'external service'}. Retrying...`
  };
}

/**
 * Convert native JavaScript Error to AppError
 */
export function convertNativeError(error: Error, context?: Record<string, unknown>): SystemError {
  return createSystemError(error.message, {
    componentName: 'Unknown',
    errorBoundary: true,
    renderError: false,
    context: {
      ...context,
      originalStack: error.stack,
      errorName: error.name
    }
  });
}

/**
 * Create error from fetch response
 */
export function createErrorFromResponse(response: Response, context?: Record<string, unknown>): NetworkError {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return createNetworkError(`HTTP ${response.status}: ${response.statusText}`, {
    statusCode: response.status,
    endpoint: response.url,
    method: 'GET', // Default, should be passed in context
    context: {
      ...context,
      responseHeaders: headers
    }
  });
}

/**
 * Create validation errors from form validation
 */
export function createValidationErrors(
  validationResult: { field: string; message: string; value?: unknown }[]
): ValidationError[] {
  return validationResult.map(({ field, message, value }) =>
    createValidationError(message, {
      fieldName: field,
      fieldValue: value
    })
  );
}

/**
 * Error severity escalation
 */
export function escalateErrorSeverity(error: AppError): AppError {
  const severityMap: Record<ErrorSeverity, ErrorSeverity> = {
    low: 'medium',
    medium: 'high',
    high: 'critical',
    critical: 'critical'
  };

  return {
    ...error,
    severity: severityMap[error.severity],
    context: {
      ...error.context,
      escalated: true,
      originalSeverity: error.severity
    }
  };
}

/**
 * Create error with automatic retry configuration
 */
export function createRetryableError(
  baseError: AppError,
  maxRetries: number = 3,
  retryDelay: number = 1000
): AppError {
  return {
    ...baseError,
    retryable: true,
    recoveryStrategy: 'RETRY_AUTOMATIC',
    context: {
      ...baseError.context,
      maxRetries,
      retryDelay,
      retryCount: 0
    }
  };
}