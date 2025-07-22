import { startTransaction } from './sentry';

export interface PerformanceMark {
  name: string;
  timestamp: number;
}

export interface PerformanceMeasure {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
}

export class PerformanceTracker {
  private marks: Map<string, PerformanceMark> = new Map();
  private measures: PerformanceMeasure[] = [];
  private serverTimings: Map<string, number> = new Map();

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    this.marks.set(name, {
      name,
      timestamp: performance.now()
    });
  }

  /**
   * Measure the duration between two marks
   */
  measure(
    name: string, 
    startMark: string, 
    endMark?: string,
    metadata?: Record<string, any>
  ): PerformanceMeasure | null {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return null;
    }

    const endTime = endMark 
      ? this.marks.get(endMark)?.timestamp || performance.now()
      : performance.now();

    const duration = endTime - start.timestamp;

    const measure: PerformanceMeasure = {
      name,
      duration,
      startTime: start.timestamp,
      endTime,
      metadata
    };

    this.measures.push(measure);

    // Send to Sentry if duration exceeds threshold
    if (duration > 3000) {
      const transaction = startTransaction(name, 'performance');
      transaction.setData('duration', duration);
      transaction.setData('metadata', metadata);
      transaction.finish();
    }

    return measure;
  }

  /**
   * Track server-side timing
   */
  serverTiming(name: string, duration: number): void {
    this.serverTimings.set(name, duration);
  }

  /**
   * Get all measures
   */
  getMeasures(): PerformanceMeasure[] {
    return [...this.measures];
  }

  /**
   * Get measures by name pattern
   */
  getMeasuresByPattern(pattern: RegExp): PerformanceMeasure[] {
    return this.measures.filter(m => pattern.test(m.name));
  }

  /**
   * Get average duration for measures matching a pattern
   */
  getAverageDuration(pattern: RegExp): number {
    const matching = this.getMeasuresByPattern(pattern);
    if (matching.length === 0) return 0;

    const total = matching.reduce((sum, m) => sum + m.duration, 0);
    return total / matching.length;
  }

  /**
   * Clear all marks and measures
   */
  clear(): void {
    this.marks.clear();
    this.measures = [];
    this.serverTimings.clear();
  }

  /**
   * Generate Server-Timing header value
   */
  getServerTimingHeader(): string {
    const entries = Array.from(this.serverTimings.entries())
      .map(([name, duration]) => `${name};dur=${duration}`)
      .join(', ');
    
    return entries;
  }
}

// Global instance for easy access
export const performanceTracker = new PerformanceTracker();

// React hook for performance tracking
export function usePerformanceTracking(componentName: string) {
  const tracker = new PerformanceTracker();

  const trackRender = () => {
    tracker.mark(`${componentName}-render-start`);
    
    return () => {
      tracker.measure(
        `${componentName}-render`,
        `${componentName}-render-start`
      );
    };
  };

  const trackEffect = (effectName: string) => {
    const markName = `${componentName}-${effectName}-start`;
    tracker.mark(markName);
    
    return () => {
      tracker.measure(
        `${componentName}-${effectName}`,
        markName
      );
    };
  };

  const trackApiCall = async <T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const markName = `${componentName}-${apiName}-start`;
    tracker.mark(markName);
    
    try {
      const result = await apiCall();
      const measure = tracker.measure(
        `${componentName}-${apiName}`,
        markName,
        undefined,
        { component: componentName, api: apiName }
      );
      
      // Log slow API calls
      if (measure && measure.duration > 2000) {
        console.warn(`Slow API call: ${apiName} took ${measure.duration}ms`);
      }
      
      return result;
    } catch (error) {
      tracker.measure(
        `${componentName}-${apiName}-error`,
        markName,
        undefined,
        { component: componentName, api: apiName, error: String(error) }
      );
      throw error;
    }
  };

  return {
    trackRender,
    trackEffect,
    trackApiCall,
    getMetrics: () => tracker.getMeasures()
  };
}

// Web Vitals tracking
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  // Track First Contentful Paint (FCP)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        performanceTracker.serverTiming('fcp', entry.startTime);
      }
    }
  }).observe({ entryTypes: ['paint'] });

  // Track Largest Contentful Paint (LCP)
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    performanceTracker.serverTiming('lcp', lastEntry.startTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // Track First Input Delay (FID)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fidEntry = entry as PerformanceEventTiming;
      performanceTracker.serverTiming('fid', fidEntry.processingStart - fidEntry.startTime);
    }
  }).observe({ entryTypes: ['first-input'] });

  // Track Cumulative Layout Shift (CLS)
  let clsValue = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
    performanceTracker.serverTiming('cls', clsValue);
  }).observe({ entryTypes: ['layout-shift'] });
}