/**
 * Simple error logger that works with Vercel's built-in logging
 * Errors will appear in Vercel Dashboard → Functions → Logs
 */

interface ErrorContext {
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log an error with context
   * In production, these will appear in Vercel logs
   * In development, these will appear in console
   */
  logError(error: Error | unknown, context?: ErrorContext) {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    const logData = {
      timestamp,
      level: 'error',
      message: errorMessage,
      stack: errorStack,
      ...context,
      // Add useful metadata
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    };

    if (this.isDevelopment) {
      // In development, use console.error for better DX
      console.error('🚨 Error:', logData);
    } else {
      // In production, use console.error which Vercel captures
      // Format as JSON for better parsing in Vercel logs
      console.error(JSON.stringify(logData));
    }
  }

  /**
   * Log a warning
   */
  logWarning(message: string, context?: ErrorContext) {
    const timestamp = new Date().toISOString();
    
    const logData = {
      timestamp,
      level: 'warn',
      message,
      ...context,
    };

    if (this.isDevelopment) {
      console.warn('⚠️ Warning:', logData);
    } else {
      console.warn(JSON.stringify(logData));
    }
  }

  /**
   * Log info (useful for tracking important events)
   */
  logInfo(message: string, context?: ErrorContext) {
    const timestamp = new Date().toISOString();
    
    const logData = {
      timestamp,
      level: 'info',
      message,
      ...context,
    };

    if (this.isDevelopment) {
      console.info('ℹ️ Info:', logData);
    } else {
      // In production, only log if explicitly enabled
      if (process.env.NEXT_PUBLIC_VERBOSE_LOGGING === 'true') {
        console.log(JSON.stringify(logData));
      }
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Helper function for React error boundaries
export function logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
  errorLogger.logError(error, {
    action: 'React Error Boundary',
    metadata: {
      componentStack: errorInfo.componentStack,
    },
  });
}

// Helper for API route errors
export function logApiError(
  error: Error | unknown,
  request: Request,
  context?: Record<string, any>
) {
  errorLogger.logError(error, {
    action: 'API Route Error',
    metadata: {
      method: request.method,
      url: request.url,
      ...context,
    },
  });
}