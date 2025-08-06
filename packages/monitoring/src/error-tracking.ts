import { NextApiRequest, NextApiResponse } from 'next';

interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  user?: string;
  url?: string;
  method?: string;
  statusCode?: number;
}

class ErrorTracker {
  private logs: ErrorLog[] = [];
  private maxLogs = 1000;

  logError(error: Error | unknown, context?: Record<string, any>) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
    };

    this.addLog(errorLog);
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(errorLog);
    }
  }

  logWarning(message: string, context?: Record<string, any>) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'warning',
      message,
      context,
    };

    this.addLog(log);
  }

  logInfo(message: string, context?: Record<string, any>) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    };

    this.addLog(log);
  }

  logApiError(
    req: NextApiRequest,
    res: NextApiResponse,
    error: Error | unknown,
    statusCode: number = 500
  ) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
      statusCode,
      user: (req as any).user?.email,
      context: {
        headers: req.headers,
        query: req.query,
        body: req.body,
      },
    };

    this.addLog(errorLog);
    
    // Send error response
    res.status(statusCode).json({
      error: {
        message: process.env.NODE_ENV === 'production' 
          ? 'An error occurred' 
          : errorLog.message,
        timestamp: errorLog.timestamp,
      },
    });
  }

  private addLog(log: ErrorLog) {
    this.logs.push(log);
    
    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private async sendToMonitoring(log: ErrorLog) {
    try {
      // Send to Supabase logs table
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase.from('error_logs').insert({
        level: log.level,
        message: log.message,
        stack: log.stack,
        context: log.context,
        user_email: log.user,
        url: log.url,
        method: log.method,
        status_code: log.statusCode,
        created_at: log.timestamp,
      });
    } catch (error) {
      // Silently fail - don't break the app if monitoring fails
      console.error('Failed to send error to monitoring:', error);
    }
  }

  getRecentErrors(limit: number = 100): ErrorLog[] {
    return this.logs
      .filter(log => log.level === 'error')
      .slice(-limit)
      .reverse();
  }

  getRecentLogs(limit: number = 100): ErrorLog[] {
    return this.logs.slice(-limit).reverse();
  }

  clearLogs() {
    this.logs = [];
  }

  getErrorStats() {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    const stats = {
      total: this.logs.length,
      errors: this.logs.filter(l => l.level === 'error').length,
      warnings: this.logs.filter(l => l.level === 'warning').length,
      lastHour: this.logs.filter(l => 
        now - new Date(l.timestamp).getTime() < hour
      ).length,
      lastDay: this.logs.filter(l => 
        now - new Date(l.timestamp).getTime() < day
      ).length,
    };

    return stats;
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// Middleware for API error handling
export function withErrorTracking(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      errorTracker.logApiError(req, res, error);
    }
  };
}

// React error boundary helper
export function logErrorBoundary(error: Error, errorInfo: any) {
  errorTracker.logError(error, {
    componentStack: errorInfo.componentStack,
    source: 'ErrorBoundary',
  });
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(label: string) {
    const values = this.metrics.get(label) || [];
    
    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      mean: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  getAllMetrics() {
    const result: Record<string, any> = {};
    
    for (const [label, _values] of this.metrics) {
      result[label] = this.getMetrics(label);
    }
    
    return result;
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();