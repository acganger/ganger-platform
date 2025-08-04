import { getSupabaseClient } from '@ganger/auth';
import { performanceMonitor } from './performance-monitor';
import { hipaaErrorTracker } from './hipaa-compliant-error-tracking';

export interface QueryMetrics {
  query: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'rpc' | 'other';
  table?: string;
  duration: number;
  rowCount?: number;
  error?: string;
  timestamp: string;
  cached?: boolean;
  planTime?: number;
  executionTime?: number;
  affectedRows?: number;
  queryHash: string;
}

export interface TableStats {
  tableName: string;
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  errorRate: number;
  operations: {
    select: number;
    insert: number;
    update: number;
    delete: number;
  };
  indexUsage?: {
    indexScans: number;
    seqScans: number;
    indexHitRate: number;
  };
  cacheStats?: {
    hitRate: number;
    missRate: number;
  };
}

export interface QueryPattern {
  pattern: string;
  count: number;
  averageDuration: number;
  p95Duration: number;
  errorRate: number;
  lastSeen: string;
  examples: string[];
}

export interface DatabaseHealth {
  connectionPoolHealth: {
    active: number;
    idle: number;
    waiting: number;
    maxSize: number;
    utilizationPercent: number;
  };
  queryPerformance: {
    averageQueryTime: number;
    slowQueryRate: number;
    errorRate: number;
  };
  tableHealth: Array<{
    table: string;
    health: 'good' | 'degraded' | 'poor';
    issues: string[];
  }>;
  recommendations: string[];
}

interface QueryThresholds {
  fast: number;
  acceptable: number;
  slow: number;
}

const DEFAULT_QUERY_THRESHOLDS: QueryThresholds = {
  fast: 50,
  acceptable: 200,
  slow: 1000
};

const TABLE_THRESHOLDS: Record<string, QueryThresholds> = {
  'auth.users': { fast: 20, acceptable: 50, slow: 200 },
  'inventory_items': { fast: 100, acceptable: 300, slow: 1000 },
  'patient_handouts': { fast: 50, acceptable: 150, slow: 500 }
};

class DatabasePerformanceMonitor {
  private queryMetrics: QueryMetrics[] = [];
  private tableStats: Map<string, TableStats> = new Map();
  private queryPatterns: Map<string, QueryPattern> = new Map();
  private connectionMetrics = {
    active: 0,
    idle: 0,
    waiting: 0,
    maxSize: 20
  };
  private readonly maxMetricsSize = 10000;
  private readonly patternCacheSize = 500;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushInterval();
    this.setupSupabaseInterceptor();
  }

  private startFlushInterval() {
    // Flush metrics every 5 minutes
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
      this.analyzePatterns();
    }, 300000);
  }

  private setupSupabaseInterceptor() {
    // This would intercept Supabase queries if we had access to the client
    // In practice, this would be done at the Supabase client initialization
    console.log('Database performance monitoring initialized');
  }

  public async trackQuery<T>(
    operation: QueryMetrics['operation'],
    table: string,
    queryFn: () => Promise<T>,
    queryDetails?: Partial<QueryMetrics>
  ): Promise<T> {
    const startTime = performance.now();
    const startMark = `db-${operation}-${table}-${Date.now()}`;
    performance.mark(startMark);

    let result: T;
    let error: Error | null = null;
    let rowCount = 0;

    try {
      result = await queryFn();
      
      // Try to extract row count
      if (Array.isArray(result)) {
        rowCount = result.length;
      } else if (result && typeof result === 'object' && 'count' in result) {
        rowCount = (result as any).count;
      }
      
      return result;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Generate query representation for pattern matching
      const queryRepresentation = this.generateQueryRepresentation(
        operation,
        table,
        queryDetails?.query || ''
      );

      const metrics: QueryMetrics = {
        query: queryRepresentation,
        operation,
        table,
        duration,
        rowCount,
        error: error?.message,
        timestamp: new Date().toISOString(),
        queryHash: this.hashQuery(queryRepresentation),
        ...queryDetails
      };

      // Record metrics
      this.recordQueryMetrics(metrics);

      // Performance mark
      performance.measure(
        `db-${operation}-${table}`,
        startMark
      );

      // Track in performance monitor
      performanceMonitor.trackApiRequest(
        `db-${table}`,
        duration,
        !error
      );

      // Track slow queries
      if (duration > this.getThreshold(table).slow) {
        hipaaErrorTracker.trackError({
          message: `Slow database query: ${operation} on ${table}`,
          duration,
          query: queryRepresentation
        }, {
          component: 'database-monitor',
          action: 'slow-query',
          tags: {
            table,
            operation,
            duration: duration.toString()
          }
        });
      }
    }
  }

  private generateQueryRepresentation(
    operation: string, 
    table: string, 
    query: string
  ): string {
    // Remove specific values to create patterns
    let pattern = query;
    
    // Remove UUIDs
    pattern = pattern.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '?'
    );
    
    // Remove numbers
    pattern = pattern.replace(/\b\d+\b/g, '?');
    
    // Remove quoted strings
    pattern = pattern.replace(/'[^']*'/g, '?');
    pattern = pattern.replace(/"[^"]*"/g, '?');
    
    return `${operation.toUpperCase()} ${table} ${pattern}`.trim();
  }

  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private getThreshold(table: string): QueryThresholds {
    return TABLE_THRESHOLDS[table] || DEFAULT_QUERY_THRESHOLDS;
  }

  private recordQueryMetrics(metrics: QueryMetrics) {
    // Add to metrics array
    this.queryMetrics.push(metrics);
    
    // Maintain size limit
    if (this.queryMetrics.length > this.maxMetricsSize) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsSize);
    }

    // Update table stats
    this.updateTableStats(metrics);
    
    // Update query patterns
    this.updateQueryPattern(metrics);
  }

  private updateTableStats(metrics: QueryMetrics) {
    if (!metrics.table) return;
    
    const stats = this.tableStats.get(metrics.table) || {
      tableName: metrics.table,
      totalQueries: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      errorRate: 0,
      operations: {
        select: 0,
        insert: 0,
        update: 0,
        delete: 0
      }
    };
    
    stats.totalQueries++;
    stats.averageQueryTime = (stats.averageQueryTime * (stats.totalQueries - 1) + metrics.duration) / stats.totalQueries;
    
    if (metrics.duration > this.getThreshold(metrics.table).slow) {
      stats.slowQueries++;
    }
    
    if (metrics.error) {
      stats.errorRate = ((stats.errorRate * (stats.totalQueries - 1)) + 100) / stats.totalQueries;
    } else {
      stats.errorRate = (stats.errorRate * (stats.totalQueries - 1)) / stats.totalQueries;
    }
    
    // Update operation counts
    if (metrics.operation in stats.operations) {
      stats.operations[metrics.operation as keyof typeof stats.operations]++;
    }
    
    this.tableStats.set(metrics.table, stats);
  }

  private updateQueryPattern(metrics: QueryMetrics) {
    const pattern = this.queryPatterns.get(metrics.queryHash) || {
      pattern: metrics.query,
      count: 0,
      averageDuration: 0,
      p95Duration: 0,
      errorRate: 0,
      lastSeen: metrics.timestamp,
      examples: []
    };
    
    pattern.count++;
    pattern.averageDuration = (pattern.averageDuration * (pattern.count - 1) + metrics.duration) / pattern.count;
    pattern.lastSeen = metrics.timestamp;
    
    if (metrics.error) {
      pattern.errorRate = ((pattern.errorRate * (pattern.count - 1)) + 100) / pattern.count;
    } else {
      pattern.errorRate = (pattern.errorRate * (pattern.count - 1)) / pattern.count;
    }
    
    // Keep a few examples
    if (pattern.examples.length < 3 && !pattern.examples.includes(metrics.query)) {
      pattern.examples.push(metrics.query);
    }
    
    this.queryPatterns.set(metrics.queryHash, pattern);
    
    // Maintain pattern cache size
    if (this.queryPatterns.size > this.patternCacheSize) {
      // Remove least used patterns
      const sortedPatterns = Array.from(this.queryPatterns.entries())
        .sort((a, b) => a[1].count - b[1].count);
      
      for (let i = 0; i < 50; i++) {
        this.queryPatterns.delete(sortedPatterns[i][0]);
      }
    }
  }

  private analyzePatterns() {
    // Calculate p95 for patterns
    const patternMetrics = new Map<string, number[]>();
    
    for (const metric of this.queryMetrics) {
      const durations = patternMetrics.get(metric.queryHash) || [];
      durations.push(metric.duration);
      patternMetrics.set(metric.queryHash, durations);
    }
    
    for (const [hash, durations] of patternMetrics) {
      const pattern = this.queryPatterns.get(hash);
      if (pattern && durations.length > 0) {
        const sorted = [...durations].sort((a, b) => a - b);
        const p95Index = Math.ceil(0.95 * sorted.length) - 1;
        pattern.p95Duration = sorted[Math.max(0, p95Index)];
      }
    }
  }

  public getTableStats(): TableStats[] {
    return Array.from(this.tableStats.values());
  }

  public getSlowQueries(limit = 10): QueryMetrics[] {
    return [...this.queryMetrics]
      .filter(m => !m.error)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  public getErrorQueries(limit = 10): QueryMetrics[] {
    return this.queryMetrics
      .filter(m => m.error)
      .slice(-limit)
      .reverse();
  }

  public getQueryPatterns(minCount = 10): QueryPattern[] {
    return Array.from(this.queryPatterns.values())
      .filter(p => p.count >= minCount)
      .sort((a, b) => b.count - a.count);
  }

  public getDatabaseHealth(): DatabaseHealth {
    const totalQueries = this.queryMetrics.length;
    const errorQueries = this.queryMetrics.filter(m => m.error).length;
    const slowQueries = this.queryMetrics.filter(m => 
      m.table && m.duration > this.getThreshold(m.table).slow
    ).length;
    
    const avgQueryTime = totalQueries > 0 ?
      this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries : 0;
    
    const tableHealth = Array.from(this.tableStats.values()).map(stats => {
      const issues: string[] = [];
      let health: 'good' | 'degraded' | 'poor' = 'good';
      
      if (stats.errorRate > 5) {
        issues.push(`High error rate: ${stats.errorRate.toFixed(1)}%`);
        health = 'poor';
      }
      
      if (stats.slowQueries / stats.totalQueries > 0.1) {
        issues.push(`Many slow queries: ${((stats.slowQueries / stats.totalQueries) * 100).toFixed(1)}%`);
        health = health === 'poor' ? 'poor' : 'degraded';
      }
      
      if (stats.averageQueryTime > this.getThreshold(stats.tableName).acceptable) {
        issues.push(`High average query time: ${stats.averageQueryTime.toFixed(0)}ms`);
        health = health === 'poor' ? 'poor' : 'degraded';
      }
      
      return {
        table: stats.tableName,
        health,
        issues
      };
    });
    
    const recommendations: string[] = [];
    
    // Add recommendations based on patterns
    const slowPatterns = this.getQueryPatterns()
      .filter(p => p.averageDuration > 500);
    
    if (slowPatterns.length > 0) {
      recommendations.push(
        `Consider optimizing these slow query patterns: ${
          slowPatterns.slice(0, 3).map(p => p.pattern).join(', ')
        }`
      );
    }
    
    // Check for missing indexes
    const tablesWithHighSeqScans = Array.from(this.tableStats.values())
      .filter(stats => {
        const selectRatio = stats.operations.select / stats.totalQueries;
        return selectRatio > 0.5 && stats.averageQueryTime > 200;
      });
    
    if (tablesWithHighSeqScans.length > 0) {
      recommendations.push(
        `Consider adding indexes to: ${
          tablesWithHighSeqScans.map(s => s.tableName).join(', ')
        }`
      );
    }
    
    // Connection pool recommendations
    if (this.connectionMetrics.waiting > 0) {
      recommendations.push(
        'Connection pool is saturated. Consider increasing pool size.'
      );
    }
    
    return {
      connectionPoolHealth: {
        ...this.connectionMetrics,
        utilizationPercent: (this.connectionMetrics.active / this.connectionMetrics.maxSize) * 100
      },
      queryPerformance: {
        averageQueryTime: avgQueryTime,
        slowQueryRate: totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0,
        errorRate: totalQueries > 0 ? (errorQueries / totalQueries) * 100 : 0
      },
      tableHealth,
      recommendations
    };
  }

  public updateConnectionMetrics(metrics: {
    active: number;
    idle: number;
    waiting: number;
    maxSize?: number;
  }) {
    this.connectionMetrics = {
      ...this.connectionMetrics,
      ...metrics
    };
  }

  private async flushMetrics() {
    if (this.queryMetrics.length === 0) return;
    
    const summary = {
      tableStats: this.getTableStats(),
      slowQueries: this.getSlowQueries(20),
      errorQueries: this.getErrorQueries(20),
      queryPatterns: this.getQueryPatterns(5),
      health: this.getDatabaseHealth(),
      timestamp: new Date().toISOString()
    };
    
    try {
      await fetch('/api/monitoring/database-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(summary)
      });
      
      // Clear old metrics after successful flush
      const oneHourAgo = new Date(Date.now() - 3600000);
      this.queryMetrics = this.queryMetrics.filter(m => 
        new Date(m.timestamp) > oneHourAgo
      );
    } catch (error) {
      console.error('Failed to flush database metrics:', error);
    }
  }

  public destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushMetrics();
  }
}

// Global instance
export const databasePerformanceMonitor = new DatabasePerformanceMonitor();

// Supabase query wrapper
export async function monitoredQuery<T>(
  table: string,
  queryBuilder: any
): Promise<T> {
  const operation = queryBuilder._method || 'select';
  
  return databasePerformanceMonitor.trackQuery(
    operation,
    table,
    async () => {
      const { data, error, count } = await queryBuilder;
      if (error) throw error;
      
      // Include count if available
      if (count !== undefined) {
        return { data, count } as T;
      }
      return data as T;
    }
  );
}

// React hook for database monitoring
// Usage: import React from 'react' in your component
export function useDatabaseMonitoring() {
  // Example implementation - would use React hooks in actual component
  const getMonitoringData = () => {
    return {
      health: databasePerformanceMonitor.getDatabaseHealth(),
      tableStats: databasePerformanceMonitor.getTableStats()
    };
  };
  
  const trackQuery = async <T>(
    operation: QueryMetrics['operation'],
    table: string,
    queryFn: () => Promise<T>
  ): Promise<T> => {
    return databasePerformanceMonitor.trackQuery(operation, table, queryFn);
  };
  
  return {
    getMonitoringData,
    getSlowQueries: () => databasePerformanceMonitor.getSlowQueries(),
    trackQuery
  };
}