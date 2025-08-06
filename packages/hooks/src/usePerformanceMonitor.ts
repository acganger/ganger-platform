import { useEffect, useRef, useCallback } from 'react';
import { errorTracking } from '@ganger/monitoring';

// These functions are not exported from monitoring package, implementing locally

const measurePageLoad = (pageName: string) => {
  const loadTime = performance.now();
  console.log(`Page ${pageName} loaded in ${loadTime}ms`);
};

interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  effectTime: number;
  apiCallTime: number;
}

interface UsePerformanceMonitorOptions {
  componentName: string;
  trackRenders?: boolean;
  trackApiCalls?: boolean;
  trackEffects?: boolean;
  reportThreshold?: number; // Only report if time exceeds threshold (ms)
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions) {
  const {
    componentName,
    trackRenders = true,
    trackApiCalls = true,
    trackEffects = true,
    reportThreshold = 100
  } = options;

  const renderStartTime = useRef<number>(0);
  const effectStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  // Track component render time
  if (trackRenders) {
    renderStartTime.current = performance.now();
  }

  useEffect(() => {
    if (trackRenders) {
      const renderTime = performance.now() - renderStartTime.current;
      renderCount.current += 1;

      if (renderTime > reportThreshold) {
        errorTracking.trackPerformance({
          name: 'component_render_time',
          value: renderTime,
          unit: 'ms',
          timestamp: new Date().toISOString(),
          tags: {
            component: componentName,
            renderCount: renderCount.current.toString()
          }
        });
      }
    }

    // Track page load metrics on mount
    if (renderCount.current === 1 && typeof window !== 'undefined') {
      measurePageLoad(componentName);
    }
  });

  // Track effect execution time
  const measureEffect = useCallback((effectName: string, effect: () => void | (() => void)) => {
    if (!trackEffects) {
      return effect();
    }

    effectStartTime.current = performance.now();
    const cleanup = effect();
    const effectTime = performance.now() - effectStartTime.current;

    if (effectTime > reportThreshold) {
      errorTracking.trackPerformance({
        name: 'effect_execution_time',
        value: effectTime,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        tags: {
          component: componentName,
          effect: effectName
        }
      });
    }

    return cleanup;
  }, [componentName, reportThreshold, trackEffects]);

  // Track API call performance
  const trackApiCall = useCallback(async <T,>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    if (!trackApiCalls) {
      return apiCall();
    }

    const startTime = performance.now();
    let status = 200;

    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      status = error instanceof Error && 'status' in error ? (error as any).status : 500;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      console.log(`API Call ${componentName}/${apiName} took ${duration}ms with status ${status}`);
    }
  }, [componentName, trackApiCalls]);

  // Track custom metrics
  const trackMetric = useCallback((
    metricName: string,
    value: number,
    unit = 'ms',
    tags?: Record<string, string>
  ) => {
    errorTracking.trackPerformance({
      name: metricName,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags: {
        component: componentName,
        ...tags
      }
    });
  }, [componentName]);

  // Get current performance metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    const currentRenderTime = performance.now() - renderStartTime.current;
    
    return {
      renderTime: currentRenderTime,
      updateTime: 0, // Would need to track between renders
      effectTime: effectStartTime.current ? performance.now() - effectStartTime.current : 0,
      apiCallTime: 0 // Tracked separately per call
    };
  }, []);

  return {
    measureEffect,
    trackApiCall,
    trackMetric,
    getMetrics
  };
}

// Convenience hook for tracking component mount/unmount
export function useComponentLifecycle(componentName: string) {
  const mountTime = useRef<number>(0);

  useEffect(() => {
    mountTime.current = performance.now();
    
    errorTracking.trackEvent(`${componentName}_mounted`, {
      timestamp: new Date().toISOString()
    });

    return () => {
      const lifecycleTime = performance.now() - mountTime.current;
      
      errorTracking.trackEvent(`${componentName}_unmounted`, {
        timestamp: new Date().toISOString(),
        lifecycleTime
      });

      errorTracking.trackPerformance({
        name: 'component_lifecycle_time',
        value: lifecycleTime,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        tags: {
          component: componentName
        }
      });
    };
  }, [componentName]);
}