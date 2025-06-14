/**
 * Performance optimization utilities for Compliance Training Frontend
 * 
 * This module provides comprehensive performance monitoring, optimization,
 * and analytics for enterprise-grade performance requirements.
 */

// Performance measurement types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: number;
  category: 'network' | 'rendering' | 'computation' | 'memory' | 'user_experience';
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface PerformanceReport {
  sessionId: string;
  userId?: string;
  timestamp: number;
  metrics: PerformanceMetric[];
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

// Performance thresholds based on Core Web Vitals and enterprise requirements
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LARGEST_CONTENTFUL_PAINT: { warning: 2500, critical: 4000 }, // ms
  FIRST_INPUT_DELAY: { warning: 100, critical: 300 }, // ms
  CUMULATIVE_LAYOUT_SHIFT: { warning: 0.1, critical: 0.25 }, // score
  
  // Custom metrics
  TIME_TO_INTERACTIVE: { warning: 3800, critical: 5000 }, // ms
  FIRST_CONTENTFUL_PAINT: { warning: 1800, critical: 3000 }, // ms
  BUNDLE_SIZE: { warning: 500000, critical: 1000000 }, // bytes
  MEMORY_USAGE: { warning: 50, critical: 80 }, // MB
  API_RESPONSE_TIME: { warning: 1000, critical: 3000 }, // ms
  
  // Application-specific
  TABLE_RENDER_TIME: { warning: 500, critical: 1000 }, // ms
  SEARCH_RESPONSE_TIME: { warning: 300, critical: 800 }, // ms
  EXPORT_GENERATION_TIME: { warning: 5000, critical: 15000 }, // ms
} as const;

/**
 * Performance monitoring class with enterprise features
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private isMonitoring = false;
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupPerformanceObservers();
  }

  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.measureInitialMetrics();
    this.startContinuousMonitoring();
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  /**
   * Add a custom performance metric
   */
  public addMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: performance.now(),
      threshold: PERFORMANCE_THRESHOLDS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS] || metric.threshold
    };

    this.metrics.push(fullMetric);
    this.checkThreshold(fullMetric);
  }

  /**
   * Measure function execution time
   */
  public measureFunction<T>(
    name: string,
    fn: () => T,
    category: PerformanceMetric['category'] = 'computation'
  ): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();

    this.addMetric({
      name,
      value: endTime - startTime,
      unit: 'ms',
      category
    });

    return result;
  }

  /**
   * Measure async function execution time
   */
  public async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceMetric['category'] = 'computation'
  ): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();

    this.addMetric({
      name,
      value: endTime - startTime,
      unit: 'ms',
      category
    });

    return result;
  }

  /**
   * Measure API request performance
   */
  public async measureApiRequest<T>(
    name: string,
    request: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await request();
      const endTime = performance.now();
      
      this.addMetric({
        name: `api_${name}`,
        value: endTime - startTime,
        unit: 'ms',
        category: 'network'
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      this.addMetric({
        name: `api_${name}_error`,
        value: endTime - startTime,
        unit: 'ms',
        category: 'network'
      });
      
      throw error;
    }
  }

  /**
   * Get performance report
   */
  public getReport(): PerformanceReport {
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      metrics: [...this.metrics],
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceMemory: this.getDeviceMemory(),
      hardwareConcurrency: navigator.hardwareConcurrency
    };
  }

  /**
   * Get metrics by category
   */
  public getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.category === category);
  }

  /**
   * Get critical performance issues
   */
  public getCriticalIssues(): PerformanceMetric[] {
    return this.metrics.filter(metric => {
      if (!metric.threshold) return false;
      return metric.value > metric.threshold.critical;
    });
  }

  /**
   * Clear metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  private setupPerformanceObservers(): void {
    // Observe Core Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        this.addMetric({
          name: 'LARGEST_CONTENTFUL_PAINT',
          value: lastEntry.startTime,
          unit: 'ms',
          category: 'user_experience'
        });
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
      }

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.addMetric({
            name: 'FIRST_INPUT_DELAY',
            value: entry.processingStart - entry.startTime,
            unit: 'ms',
            category: 'user_experience'
          });
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
      }

      // Navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.addMetric({
            name: 'TIME_TO_INTERACTIVE',
            value: entry.domInteractive - entry.navigationStart,
            unit: 'ms',
            category: 'rendering'
          });
        });
      });
      
      try {
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (e) {
      }
    }
  }

  private measureInitialMetrics(): void {
    // Measure initial page load metrics
    if (performance.timing) {
      const timing = performance.timing;
      
      this.addMetric({
        name: 'FIRST_CONTENTFUL_PAINT',
        value: timing.domContentLoadedEventEnd - timing.navigationStart,
        unit: 'ms',
        category: 'rendering'
      });
    }

    // Measure memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      this.addMetric({
        name: 'MEMORY_USAGE',
        value: memory.usedJSHeapSize / (1024 * 1024), // Convert to MB
        unit: 'bytes',
        category: 'memory'
      });
    }
  }

  private startContinuousMonitoring(): void {
    // Monitor memory usage every 30 seconds
    const memoryInterval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(memoryInterval);
        return;
      }

      if ('memory' in performance) {
        const memory = (performance as any).memory;
        
        this.addMetric({
          name: 'MEMORY_USAGE',
          value: memory.usedJSHeapSize / (1024 * 1024),
          unit: 'bytes',
          category: 'memory'
        });
      }
    }, 30000);
  }

  private checkThreshold(metric: PerformanceMetric): void {
    if (!metric.threshold) return;

    if (metric.value > metric.threshold.critical) {
      
      // Send to monitoring service in production
      this.reportCriticalIssue(metric);
    } else if (metric.value > metric.threshold.warning) {
    }
  }

  private reportCriticalIssue(metric: PerformanceMetric): void {
    // In production, send to monitoring service like DataDog, New Relic, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to analytics service
      try {
        fetch('/api/performance/critical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            metric,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
          })
        }).catch(() => {
          // Silent fail for performance metrics
        });
      } catch (e) {
        // Silent fail
      }
    }
  }

  private getConnectionType(): string | undefined {
    return (navigator as any).connection?.effectiveType;
  }

  private getDeviceMemory(): number | undefined {
    return (navigator as any).deviceMemory;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for component performance monitoring
 */
export function usePerformanceMonitoring(componentName: string) {
  const startTime = performance.now();

  // Measure component mount time
  const measureMount = () => {
    const mountTime = performance.now() - startTime;
    performanceMonitor.addMetric({
      name: `component_mount_${componentName}`,
      value: mountTime,
      unit: 'ms',
      category: 'rendering'
    });
  };

  // Measure render time
  const measureRender = (renderType: 'initial' | 'update' = 'update') => {
    const renderStart = performance.now();
    
    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStart;
      performanceMonitor.addMetric({
        name: `component_render_${componentName}_${renderType}`,
        value: renderTime,
        unit: 'ms',
        category: 'rendering'
      });
    });
  };

  return {
    measureMount,
    measureRender,
    addMetric: performanceMonitor.addMetric.bind(performanceMonitor),
    measureFunction: performanceMonitor.measureFunction.bind(performanceMonitor),
    measureAsyncFunction: performanceMonitor.measureAsyncFunction.bind(performanceMonitor)
  };
}

/**
 * Decorator for automatic function performance monitoring
 */
export function performanceMonitored(category: PerformanceMetric['category'] = 'computation') {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const method = descriptor.value;
    if (!method) return descriptor;

    descriptor.value = function (this: any, ...args: any[]) {
      return performanceMonitor.measureFunction(
        `${target.constructor.name}.${propertyName}`,
        () => method.apply(this, args),
        category
      );
    } as T;

    return descriptor;
  };
}

/**
 * Bundle size analyzer
 */
export class BundleAnalyzer {
  private static readonly CHUNK_SIZE_THRESHOLD = 250000; // 250KB
  private static readonly TOTAL_SIZE_THRESHOLD = 1000000; // 1MB

  public static analyzeBundleSize(): void {
    if ('getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      let totalSize = 0;
      const largeBundles: Array<{ name: string; size: number }> = [];

      resources.forEach((resource) => {
        if (resource.name.includes('.js') || resource.name.includes('.css')) {
          const size = resource.transferSize || 0;
          totalSize += size;

          if (size > this.CHUNK_SIZE_THRESHOLD) {
            largeBundles.push({ name: resource.name, size });
          }

          performanceMonitor.addMetric({
            name: 'bundle_chunk_size',
            value: size,
            unit: 'bytes',
            category: 'network'
          });
        }
      });

      performanceMonitor.addMetric({
        name: 'BUNDLE_SIZE',
        value: totalSize,
        unit: 'bytes',
        category: 'network'
      });

      if (largeBundles.length > 0) {
      }

      if (totalSize > this.TOTAL_SIZE_THRESHOLD) {
      }
    }
  }
}

/**
 * Memory leak detector
 */
export class MemoryLeakDetector {
  private static measurements: number[] = [];
  private static readonly MEASUREMENT_INTERVAL = 10000; // 10 seconds
  private static readonly LEAK_THRESHOLD = 5; // MB increase over 5 measurements

  public static startDetection(): void {
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const currentUsage = memory.usedJSHeapSize / (1024 * 1024);
        
        this.measurements.push(currentUsage);
        
        // Keep only last 10 measurements
        if (this.measurements.length > 10) {
          this.measurements.shift();
        }

        // Check for memory leak pattern
        if (this.measurements.length >= 5) {
          const trend = this.calculateTrend();
          if (trend > this.LEAK_THRESHOLD) {
            console.warn('Memory leak detected:', {
              trend: `+${trend.toFixed(2)} MB`,
              currentUsage: `${currentUsage.toFixed(2)} MB`,
              measurements: this.measurements
            });

            performanceMonitor.addMetric({
              name: 'memory_leak_detected',
              value: trend,
              unit: 'bytes',
              category: 'memory'
            });
          }
        }
      }
    }, this.MEASUREMENT_INTERVAL);
  }

  private static calculateTrend(): number {
    if (this.measurements.length < 5) return 0;
    
    const recent = this.measurements.slice(-5);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];
    
    return newest - oldest;
  }
}

// Auto-start performance monitoring in browser
if (typeof window !== 'undefined') {
  performanceMonitor.startMonitoring();
  BundleAnalyzer.analyzeBundleSize();
  MemoryLeakDetector.startDetection();
}