'use client'

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';

// Debounce hook for expensive operations
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for frequent events
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;
}

// Memoization with dependencies
export function useDeepMemo<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<{ deps: any[]; value: T } | undefined>(undefined);

  if (!ref.current || !depsEqual(ref.current.deps, deps)) {
    ref.current = {
      deps: [...deps],
      value: factory()
    };
  }

  return ref.current.value;
}

function depsEqual(prevDeps: any[], nextDeps: any[]): boolean {
  if (prevDeps.length !== nextDeps.length) return false;
  
  return prevDeps.every((dep, index) => {
    const nextDep = nextDeps[index];
    
    if (Array.isArray(dep) && Array.isArray(nextDep)) {
      return depsEqual(dep, nextDep);
    }
    
    if (typeof dep === 'object' && typeof nextDep === 'object') {
      return JSON.stringify(dep) === JSON.stringify(nextDep);
    }
    
    return dep === nextDep;
  });
}

// Virtual scrolling hook
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((scrollTop: number) => {
    setScrollTop(scrollTop);
  }, []);

  return {
    visibleItems,
    visibleRange,
    totalHeight,
    offsetY,
    handleScroll
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(name: string) {
  const startTime = useRef<number | undefined>(undefined);
  const measurements = useRef<Array<{ name: string; duration: number; timestamp: number }>>([]);

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      const measurement = {
        name,
        duration,
        timestamp: Date.now()
      };

      measurements.current.push(measurement);
      
      // Keep only last 100 measurements
      if (measurements.current.length > 100) {
        measurements.current = measurements.current.slice(-100);
      }

      if (process.env.NODE_ENV === 'development') {
      }

      return duration;
    }
    return 0;
  }, [name]);

  const getStats = useCallback(() => {
    const durations = measurements.current.map(m => m.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return { avg, min, max, count: durations.length };
  }, []);

  return { start, end, getStats, measurements: measurements.current };
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return { isIntersecting, entry, ref: elementRef };
}

// Memory usage monitoring
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSMemory?: number;
    totalJSMemory?: number;
    jsMemoryLimit?: number;
  }>({});

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSMemory: memory.usedJSMemory,
          totalJSMemory: memory.totalJSMemory,
          jsMemoryLimit: memory.jsMemoryLimit
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

// Cache hook with expiration
export function useCache<T>(key: string, fetchFn: () => Promise<T>, ttl: number = 5 * 60 * 1000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const fetchData = useCallback(async (force = false) => {
    const cached = cacheRef.current.get(key);
    const now = Date.now();

    // Return cached data if valid and not forced
    if (!force && cached && (now - cached.timestamp) < ttl) {
      setData(cached.data);
      return cached.data;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      cacheRef.current.set(key, { data: result, timestamp: now });
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cacheRef.current.delete(key);
  }, [key]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refresh, invalidate };
}

// Optimized filtering hook
export function useOptimizedFilter<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  deps: any[] = []
) {
  return useMemo(() => {
    if (!items.length) return [];
    
    const startTime = performance.now();
    const filtered = items.filter(filterFn);
    const duration = performance.now() - startTime;
    
    if (process.env.NODE_ENV === 'development' && duration > 10) {
    }
    
    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, filterFn, ...deps]);
}