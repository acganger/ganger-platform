/**
 * Vercel-compatible error logger for the Ganger Platform
 * Replaces Sentry with free Vercel logging
 * 
 * All errors are automatically captured in:
 * Vercel Dashboard → Functions → Logs
 */

import type { User } from '@supabase/supabase-js';

interface ErrorContext {
  userId?: string;
  userEmail?: string;
  action?: string;
  metadata?: Record<string, any>;
  url?: string;
  method?: string;
}

interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: ErrorContext;
  environment: string;
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private environment = process.env.NODE_ENV || 'development';

  /**
   * Log an error with context
   * In production, these appear in Vercel logs as structured JSON
   */
  logError(error: Error | unknown, context?: ErrorContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: this.scrubSensitiveData(errorMessage),
      stack: errorStack ? this.scrubSensitiveData(errorStack) : undefined,
      context: context ? this.scrubContext(context) : undefined,
      environment: this.environment,
    };

    this.output(logEntry);
  }

  /**
   * Log a warning
   */
  logWarning(message: string, context?: ErrorContext): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: this.scrubSensitiveData(message),
      context: context ? this.scrubContext(context) : undefined,
      environment: this.environment,
    };

    this.output(logEntry);
  }

  /**
   * Log info (useful for tracking important events)
   */
  logInfo(message: string, context?: ErrorContext): void {
    // Only log info in development or if verbose logging is enabled
    if (!this.isDevelopment && process.env.NEXT_PUBLIC_VERBOSE_LOGGING !== 'true') {
      return;
    }

    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: this.scrubSensitiveData(message),
      context: context ? this.scrubContext(context) : undefined,
      environment: this.environment,
    };

    this.output(logEntry);
  }

  /**
   * Set user context (replacement for Sentry.setUser)
   */
  setUser(user: User | null): void {
    // In Vercel logging, we don't maintain state
    // User info should be passed with each error via context
    if (user && this.isDevelopment) {
      console.log(`[ErrorLogger] User context updated: ${user.id}`);
    }
  }

  /**
   * Track custom events (replacement for Sentry breadcrumbs)
   */
  trackEvent(eventName: string, data?: Record<string, any>): void {
    if (this.isDevelopment || process.env.NEXT_PUBLIC_VERBOSE_LOGGING === 'true') {
      this.logInfo(`Event: ${eventName}`, {
        action: 'custom_event',
        metadata: data,
      });
    }
  }

  /**
   * Start a transaction (no-op for Vercel logging)
   */
  startTransaction(name: string, op: string): { finish: () => void } {
    const startTime = Date.now();
    
    return {
      finish: () => {
        if (this.isDevelopment) {
          const duration = Date.now() - startTime;
          this.logInfo(`Transaction: ${name} (${op}) completed in ${duration}ms`);
        }
      },
    };
  }

  private output(logEntry: ErrorLogEntry): void {
    if (this.isDevelopment) {
      // Pretty console output for development
      const emoji = {
        error: '🚨',
        warn: '⚠️',
        info: 'ℹ️',
      }[logEntry.level];

      console[logEntry.level === 'info' ? 'log' : logEntry.level](
        `${emoji} [${logEntry.timestamp}] ${logEntry.message}`,
        logEntry.context || '',
        logEntry.stack || ''
      );
    } else {
      // Structured JSON for Vercel logs
      const method = logEntry.level === 'info' ? 'log' : logEntry.level;
      console[method](JSON.stringify(logEntry));
    }
  }

  /**
   * Scrub sensitive data from strings (HIPAA compliance)
   */
  private scrubSensitiveData(str: string): string {
    // Remove email addresses
    str = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
    
    // Remove phone numbers
    str = str.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
    
    // Remove SSN patterns
    str = str.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');
    
    // Remove potential patient names in common patterns
    str = str.replace(/patient[:\s]+\S+/gi, 'patient:[REDACTED]');
    
    // Remove dates of birth
    str = str.replace(/\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g, '[REDACTED_DOB]');
    
    return str;
  }

  /**
   * Scrub sensitive data from context objects
   */
  private scrubContext(context: ErrorContext): ErrorContext {
    const scrubbed: ErrorContext = {};
    
    // Only include non-sensitive fields
    if (context.userId) scrubbed.userId = context.userId;
    if (context.action) scrubbed.action = context.action;
    if (context.url) scrubbed.url = this.scrubSensitiveData(context.url);
    if (context.method) scrubbed.method = context.method;
    
    // Scrub metadata
    if (context.metadata) {
      scrubbed.metadata = this.scrubObjectData(context.metadata);
    }
    
    return scrubbed;
  }

  /**
   * Recursively scrub sensitive data from objects
   */
  private scrubObjectData(obj: Record<string, any>): Record<string, any> {
    const sensitiveKeys = [
      'password', 'ssn', 'dob', 'dateOfBirth', 'email', 
      'phone', 'address', 'name', 'firstName', 'lastName',
      'patientName', 'patientId', 'medicalRecord', 'diagnosis',
      'medication', 'prescription', 'insurance', 'creditCard'
    ];

    const scrubbed: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        scrubbed[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        scrubbed[key] = this.scrubSensitiveData(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        scrubbed[key] = this.scrubObjectData(value);
      } else {
        scrubbed[key] = value;
      }
    }

    return scrubbed;
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Helper functions for compatibility with Sentry API

/**
 * Capture an exception (Sentry.captureException replacement)
 */
export function captureException(error: Error | unknown, context?: ErrorContext): void {
  errorLogger.logError(error, context);
}

/**
 * Capture a message (Sentry.captureMessage replacement)
 */
export function captureMessage(
  message: string,
  level: 'error' | 'warning' | 'info' = 'info',
  context?: ErrorContext
): void {
  const levelMap = {
    error: () => errorLogger.logError(new Error(message), context),
    warning: () => errorLogger.logWarning(message, context),
    info: () => errorLogger.logInfo(message, context),
  };
  
  levelMap[level]();
}

/**
 * Set user context (Sentry.setUser replacement)
 */
export function setUser(user: User | null): void {
  errorLogger.setUser(user);
}

/**
 * Helper for React error boundaries
 */
export function logErrorToService(error: Error, errorInfo: React.ErrorInfo): void {
  errorLogger.logError(error, {
    action: 'React Error Boundary',
    metadata: {
      componentStack: errorInfo.componentStack,
    },
  });
}

/**
 * Helper for API route errors
 */
export function logApiError(
  error: Error | unknown,
  request: Request,
  context?: Record<string, any>
): void {
  errorLogger.logError(error, {
    action: 'API Route Error',
    method: request.method,
    url: request.url,
    metadata: context,
  });
}

// Export types for convenience
export type { ErrorContext, ErrorLogEntry };