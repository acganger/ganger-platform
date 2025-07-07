/**
 * Simple logger utility for API routes
 * In production, this could be replaced with a proper logging service
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  userEmail?: string;
  requestId?: string;
  path?: string;
  method?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context));
    if (error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      });
    }
  }

  /**
   * Log API request
   */
  logRequest(req: any, userEmail?: string): void {
    this.info('API Request', {
      path: req.url,
      method: req.method,
      userEmail,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
  }

  /**
   * Log API response
   */
  logResponse(req: any, statusCode: number, duration: number): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this[level]('API Response', {
      path: req.url,
      method: req.method,
      statusCode,
      duration: `${duration}ms`,
    });
  }

  /**
   * Log database operation
   */
  logDatabase(operation: string, table: string, duration?: number, error?: Error): void {
    if (error) {
      this.error(`Database operation failed: ${operation} on ${table}`, error);
    } else {
      this.debug(`Database operation: ${operation} on ${table}`, {
        duration: duration ? `${duration}ms` : undefined,
      });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Request timing middleware
 */
export function withRequestLogging(
  handler: (req: any, res: any) => Promise<void>
) {
  return async (req: any, res: any) => {
    const startTime = Date.now();
    
    // Log request
    const session = await import('next-auth').then(m => 
      m.getServerSession(req, res, { providers: [] })
    ).catch(() => null);
    
    logger.logRequest(req, session?.user?.email);
    
    // Capture original end function
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      logger.logResponse(req, res.statusCode, duration);
      originalEnd.apply(res, args);
    };
    
    await handler(req, res);
  };
}