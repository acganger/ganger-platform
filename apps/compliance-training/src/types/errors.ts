/**
 * Comprehensive error types for Compliance Training Frontend
 * Provides type-safe error handling with recovery strategies
 */

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories for better organization
export type ErrorCategory = 
  | 'NETWORK'
  | 'VALIDATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'DATA_INTEGRITY'
  | 'USER_INPUT'
  | 'SYSTEM'
  | 'EXTERNAL_SERVICE';

// Recovery strategies
export type RecoveryStrategy = 
  | 'RETRY_AUTOMATIC'
  | 'RETRY_MANUAL'
  | 'FALLBACK_DATA'
  | 'REDIRECT'
  | 'USER_ACTION_REQUIRED'
  | 'IGNORE'
  | 'RELOAD_PAGE';

// Base error interface
export interface BaseError {
  id: string;
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, unknown>;
  userMessage?: string;
  technicalDetails?: string;
  recoveryStrategy?: RecoveryStrategy;
  retryable: boolean;
  userReported?: boolean;
  stackTrace?: string;
}

// Specific error types
export interface NetworkError extends BaseError {
  category: 'NETWORK';
  statusCode?: number;
  endpoint?: string;
  method?: string;
  timeout?: boolean;
  offline?: boolean;
}

export interface ValidationError extends BaseError {
  category: 'VALIDATION';
  fieldName?: string;
  fieldValue?: unknown;
  validationRule?: string;
  expectedFormat?: string;
}

export interface AuthenticationError extends BaseError {
  category: 'AUTHENTICATION';
  tokenExpired?: boolean;
  invalidCredentials?: boolean;
  sessionTimeout?: boolean;
}

export interface AuthorizationError extends BaseError {
  category: 'AUTHORIZATION';
  requiredPermission?: string;
  userRole?: string;
  resourceId?: string;
}

export interface DataIntegrityError extends BaseError {
  category: 'DATA_INTEGRITY';
  corruptedData?: unknown;
  missingFields?: string[];
  inconsistentState?: boolean;
}

export interface UserInputError extends BaseError {
  category: 'USER_INPUT';
  inputField?: string;
  inputValue?: unknown;
  suggestion?: string;
}

export interface SystemError extends BaseError {
  category: 'SYSTEM';
  componentName?: string;
  errorBoundary?: boolean;
  renderError?: boolean;
}

export interface ExternalServiceError extends BaseError {
  category: 'EXTERNAL_SERVICE';
  serviceName?: string;
  serviceEndpoint?: string;
  serviceStatus?: number;
  downtime?: boolean;
}

// Union type for all error types
export type AppError = 
  | NetworkError
  | ValidationError
  | AuthenticationError
  | AuthorizationError
  | DataIntegrityError
  | UserInputError
  | SystemError
  | ExternalServiceError;

// Error state for components
export interface ErrorState {
  hasError: boolean;
  error: AppError | null;
  errorBoundary: boolean;
  recoveryAttempts: number;
  lastRecoveryAttempt?: Date;
  isRecovering: boolean;
}

// Error context for providers
export interface ErrorContextValue {
  errors: AppError[];
  errorHistory: AppError[];
  reportError: (error: AppError) => void;
  clearError: (errorId: string) => void;
  clearAllErrors: () => void;
  retryError: (errorId: string) => Promise<boolean>;
  getErrorsByCategory: (category: ErrorCategory) => AppError[];
  getErrorsBySeverity: (severity: ErrorSeverity) => AppError[];
  globalErrorHandler: (error: Error, errorInfo?: any) => void;
}

// Error reporting payload
export interface ErrorReport {
  error: AppError;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  buildVersion?: string;
  additionalContext?: Record<string, unknown>;
}

// Error metrics for monitoring
export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  mostCommonErrors: Array<{ code: string; count: number }>;
  recoverySuccessRate: number;
  averageRecoveryTime: number;
  userReportedErrors: number;
}

// Error recovery result
export interface RecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  retryCount: number;
  duration: number;
  fallbackUsed?: boolean;
  userActionRequired?: boolean;
  errorCleared: boolean;
}

// Error handling configuration
export interface ErrorConfig {
  maxRetries: number;
  retryDelay: number;
  enableReporting: boolean;
  enableRecovery: boolean;
  showStackTrace: boolean;
  enableErrorBoundary: boolean;
  fallbackToOfflineMode: boolean;
  autoRetryNetworkErrors: boolean;
  logErrorsToConsole: boolean;
}

// Toast notification for errors
export interface ErrorToastProps {
  error: AppError;
  onDismiss: (errorId: string) => void;
  onRetry?: (errorId: string) => void;
  onReport?: (errorId: string) => void;
  autoHide?: boolean;
  hideDelay?: number;
}

// Error boundary props
export interface ErrorBoundaryProps {
  fallbackComponent?: React.ComponentType<{ error: AppError; onRetry: () => void }>;
  onError?: (error: AppError, errorInfo: any) => void;
  enableRecovery?: boolean;
  children: React.ReactNode;
}

// Async error handler
export interface AsyncErrorHandler<T> {
  execute: () => Promise<T>;
  onSuccess?: (result: T) => void;
  onError?: (error: AppError) => void;
  onRetry?: (attempt: number) => void;
  maxRetries?: number;
  retryDelay?: number;
  fallback?: () => T | Promise<T>;
}