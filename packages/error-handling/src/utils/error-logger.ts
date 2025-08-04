import { SerializedError } from '../types';
import { sanitizeObject, sanitizeStackTrace } from './error-sanitizer';
import { GangerError } from './error-classes';

export interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  userMessage?: string;
  severity: SerializedError['severity'];
  metadata?: Record<string, any>;
  stack?: string;
  environment: {
    nodeEnv: string;
    userAgent?: string;
    url?: string;
    userId?: string;
  };
}

/**
 * HIPAA-compliant error logger
 * In production, this would send to a secure logging service
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error with HIPAA-compliant sanitization
   */
  logError(error: Error | GangerError | SerializedError, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(error, 'error', metadata);
    this.addLog(entry);
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(entry);
    } else {
      console.error('[Error Logger]', entry);
    }
  }

  /**
   * Log a warning
   */
  logWarning(message: string, metadata?: Record<string, any>): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warning',
      code: 'WARNING',
      message,
      severity: 'low',
      metadata: sanitizeObject(metadata || {}),
      environment: this.getEnvironment(),
    };
    
    this.addLog(entry);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Error Logger]', entry);
    }
  }

  /**
   * Log info
   */
  logInfo(message: string, metadata?: Record<string, any>): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      code: 'INFO',
      message,
      severity: 'low',
      metadata: sanitizeObject(metadata || {}),
      environment: this.getEnvironment(),
    };
    
    this.addLog(entry);
    
    if (process.env.NODE_ENV === 'development') {
      console.info('[Error Logger]', entry);
    }
  }

  /**
   * Get recent logs (for debugging)
   */
  getRecentLogs(count = 50): ErrorLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  private createLogEntry(
    error: Error | GangerError | SerializedError,
    level: ErrorLogEntry['level'],
    metadata?: Record<string, any>
  ): ErrorLogEntry {
    let code = 'UNKNOWN_ERROR';
    let message = 'An unknown error occurred';
    let userMessage: string | undefined;
    let severity: SerializedError['severity'] = 'medium';
    let stack: string | undefined;

    if (error instanceof GangerError) {
      code = error.code;
      message = error.message;
      userMessage = error.userMessage;
      severity = error.severity;
      stack = error.stack;
      metadata = { ...error.metadata, ...metadata };
    } else if (error instanceof Error) {
      code = error.name;
      message = error.message;
      stack = error.stack;
    } else if ('code' in error) {
      code = error.code;
      message = error.message;
      userMessage = error.userMessage;
      severity = error.severity;
      metadata = { ...error.metadata, ...metadata };
    }

    return {
      timestamp: new Date().toISOString(),
      level,
      code,
      message: sanitizeObject({ message }).message,
      userMessage,
      severity,
      metadata: sanitizeObject(metadata || {}),
      stack: sanitizeStackTrace(stack),
      environment: this.getEnvironment(),
    };
  }

  private addLog(entry: ErrorLogEntry): void {
    this.logs.push(entry);
    
    // Keep logs under max limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private getEnvironment(): ErrorLogEntry['environment'] {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userId: undefined, // Set by auth context
    };
  }

  private async sendToMonitoring(entry: ErrorLogEntry): Promise<void> {
    try {
      // In production, this would send to a service like Sentry, Datadog, etc.
      // For now, we'll just use the monitoring package
      const { errorTracking } = await import('@ganger/monitoring');
      await errorTracking.trackError({
        message: entry.message,
        stack: entry.stack,
        timestamp: entry.timestamp,
        url: entry.environment.url || '',
        userAgent: entry.environment.userAgent,
        userId: entry.environment.userId,
        metadata: {
          ...entry.metadata,
          code: entry.code,
          severity: entry.severity,
          level: entry.level,
        },
      });
    } catch (err) {
      // Fail silently to avoid error loops
      console.error('Failed to send error to monitoring:', err);
    }
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();