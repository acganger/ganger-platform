import { SerializedError, ErrorRecoveryStrategy } from '../types';

/**
 * Base error class for Ganger Platform
 * Ensures HIPAA compliance by sanitizing error messages
 */
export class GangerError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly severity: SerializedError['severity'];
  public readonly recoverable: boolean;
  public readonly recoveryStrategy: ErrorRecoveryStrategy;
  public readonly metadata?: Record<string, any>;

  constructor(
    code: string,
    message: string,
    userMessage: string,
    severity: SerializedError['severity'] = 'medium',
    recoverable = true,
    recoveryStrategy: ErrorRecoveryStrategy = 'none',
    metadata?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.userMessage = userMessage;
    this.severity = severity;
    this.recoverable = recoverable;
    this.recoveryStrategy = recoveryStrategy;
    this.metadata = metadata;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): SerializedError {
    return {
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      recoverable: this.recoverable,
      metadata: {
        ...this.metadata,
        recoveryStrategy: this.recoveryStrategy,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
      },
    };
  }
}

/**
 * Network/API related errors
 */
export class NetworkError extends GangerError {
  constructor(
    message: string,
    statusCode?: number,
    metadata?: Record<string, any>
  ) {
    const userMessage = statusCode === 0 
      ? 'Unable to connect to the server. Please check your internet connection.'
      : `Network error occurred. Please try again. (${statusCode || 'Unknown'})`;

    super(
      'NETWORK_ERROR',
      message,
      userMessage,
      'high',
      true,
      'retry',
      { ...metadata, statusCode }
    );
  }
}

/**
 * Authentication/Authorization errors
 */
export class AuthError extends GangerError {
  constructor(
    message: string,
    code: string = 'AUTH_ERROR',
    metadata?: Record<string, any>
  ) {
    const userMessage = code === 'UNAUTHORIZED' 
      ? 'You are not authorized to perform this action.'
      : code === 'SESSION_EXPIRED'
      ? 'Your session has expired. Please sign in again.'
      : 'Authentication error. Please sign in again.';

    super(
      code,
      message,
      userMessage,
      'high',
      true,
      code === 'SESSION_EXPIRED' ? 'redirect' : 'reload',
      metadata
    );
  }
}

/**
 * Validation errors
 */
export class ValidationError extends GangerError {
  constructor(
    message: string,
    field?: string,
    metadata?: Record<string, any>
  ) {
    super(
      'VALIDATION_ERROR',
      message,
      'Please check your input and try again.',
      'low',
      true,
      'none',
      { ...metadata, field }
    );
  }
}

/**
 * Database/Storage errors
 */
export class DatabaseError extends GangerError {
  constructor(
    message: string,
    operation?: string,
    metadata?: Record<string, any>
  ) {
    super(
      'DATABASE_ERROR',
      message,
      'A database error occurred. Our team has been notified.',
      'critical',
      false,
      'contact-support',
      { ...metadata, operation }
    );
  }
}

/**
 * Business logic errors
 */
export class BusinessError extends GangerError {
  constructor(
    code: string,
    message: string,
    userMessage: string,
    metadata?: Record<string, any>
  ) {
    super(
      code,
      message,
      userMessage,
      'medium',
      true,
      'none',
      metadata
    );
  }
}

/**
 * Integration errors (third-party services)
 */
export class IntegrationError extends GangerError {
  constructor(
    service: string,
    message: string,
    metadata?: Record<string, any>
  ) {
    super(
      'INTEGRATION_ERROR',
      message,
      `Unable to connect to ${service}. Please try again later.`,
      'high',
      true,
      'retry',
      { ...metadata, service }
    );
  }
}

/**
 * File/Upload errors
 */
export class FileError extends GangerError {
  constructor(
    message: string,
    fileName?: string,
    metadata?: Record<string, any>
  ) {
    super(
      'FILE_ERROR',
      message,
      'File operation failed. Please check the file and try again.',
      'medium',
      true,
      'retry',
      { ...metadata, fileName }
    );
  }
}

/**
 * Permission errors
 */
export class PermissionError extends GangerError {
  constructor(
    resource: string,
    action: string,
    metadata?: Record<string, any>
  ) {
    super(
      'PERMISSION_ERROR',
      `Permission denied for ${action} on ${resource}`,
      'You do not have permission to perform this action.',
      'medium',
      false,
      'contact-support',
      { ...metadata, resource, action }
    );
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends GangerError {
  constructor(
    retryAfter?: number,
    metadata?: Record<string, any>
  ) {
    const userMessage = retryAfter
      ? `Too many requests. Please try again in ${retryAfter} seconds.`
      : 'Too many requests. Please try again later.';

    super(
      'RATE_LIMIT_ERROR',
      'Rate limit exceeded',
      userMessage,
      'medium',
      true,
      'retry',
      { ...metadata, retryAfter }
    );
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends GangerError {
  constructor(
    message: string,
    configKey?: string,
    metadata?: Record<string, any>
  ) {
    super(
      'CONFIGURATION_ERROR',
      message,
      'System configuration error. Please contact support.',
      'critical',
      false,
      'contact-support',
      { ...metadata, configKey }
    );
  }
}