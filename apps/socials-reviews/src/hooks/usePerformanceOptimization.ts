'use client'

import { useCallback, useMemo, useRef } from 'react';

// Debounce hook for performance optimization
export function useDebounce<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

// Throttle hook for performance optimization
export function useThrottle<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - (now - lastCall.current));
      }
    }) as T,
    [callback, delay]
  );
}

// Memoized search/filter hook
export function useMemoizedSearch<T>(
  items: T[],
  searchQuery: string,
  searchFields: (keyof T)[],
  filters: Record<string, unknown> = {}
) {
  return useMemo(() => {
    let filteredItems = items;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          if (Array.isArray(value)) {
            return value.some(v => 
              typeof v === 'string' && v.toLowerCase().includes(query)
            );
          }
          return false;
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue !== null && filterValue !== undefined) {
        if (Array.isArray(filterValue) && filterValue.length > 0) {
          filteredItems = filteredItems.filter(item => {
            const itemValue = item[key as keyof T];
            if (Array.isArray(itemValue)) {
              return itemValue.some(v => filterValue.includes(v));
            }
            return filterValue.includes(itemValue);
          });
        } else if (typeof filterValue === 'object' && filterValue && 'start' in filterValue && 'end' in filterValue) {
          // Date range filter
          filteredItems = filteredItems.filter(item => {
            const itemValue = item[key as keyof T];
            if (typeof itemValue === 'string') {
              const itemDate = new Date(itemValue);
              const startDate = new Date((filterValue as { start: string }).start);
              const endDate = new Date((filterValue as { end: string }).end);
              return itemDate >= startDate && itemDate <= endDate;
            }
            return false;
          });
        } else if (typeof filterValue === 'number') {
          // Numeric filter (e.g., minimum engagement rate)
          filteredItems = filteredItems.filter(item => {
            const itemValue = item[key as keyof T];
            return typeof itemValue === 'number' && itemValue >= filterValue;
          });
        }
      }
    });

    return filteredItems;
  }, [items, searchQuery, searchFields, filters]);
}

// Optimized sorting hook
export function useMemoizedSort<T>(
  items: T[],
  sortBy: keyof T,
  sortOrder: 'asc' | 'desc'
) {
  return useMemo(() => {
    if (!sortBy) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      let comparison = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Handle date strings
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          comparison = aDate.getTime() - bDate.getTime();
        } else {
          comparison = aValue.localeCompare(bValue);
        }
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [items, sortBy, sortOrder]);
}

// Pagination hook
export function usePagination<T>(
  items: T[],
  pageSize: number = 10,
  currentPage: number = 1
) {
  return useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / pageSize);

    return {
      items: paginatedItems,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      totalItems: items.length,
    };
  }, [items, pageSize, currentPage]);
}

// Combined search, filter, sort, and pagination hook
export function useOptimizedData<T>(
  items: T[],
  {
    searchQuery = '',
    searchFields = [],
    filters = {},
    sortBy,
    sortOrder = 'asc',
    pageSize = 10,
    currentPage = 1,
  }: {
    searchQuery?: string;
    searchFields?: (keyof T)[];
    filters?: Record<string, unknown>;
    sortBy?: keyof T;
    sortOrder?: 'asc' | 'desc';
    pageSize?: number;
    currentPage?: number;
  }
) {
  // First, apply search and filters
  const searchedAndFiltered = useMemoizedSearch(
    items,
    searchQuery,
    searchFields,
    filters
  );

  // Then, apply sorting
  const sorted = useMemoizedSort(
    searchedAndFiltered,
    sortBy!,
    sortOrder
  );

  // Finally, apply pagination
  const paginated = usePagination(sorted, pageSize, currentPage);

  return {
    ...paginated,
    totalFilteredItems: sorted.length,
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(name: string) {
  const measureRef = useRef<number | null>(null);

  const startMeasure = useCallback(() => {
    measureRef.current = performance.now();
  }, []);

  const endMeasure = useCallback(() => {
    if (measureRef.current) {
      const duration = performance.now() - measureRef.current;
      // Log performance metric
      void duration;
      
      // Send to analytics if available
      if (typeof window !== 'undefined' && (window as typeof window & { gtag?: Function }).gtag) {
        (window as typeof window & { gtag: Function }).gtag('event', 'performance_measure', {
          event_category: 'Performance',
          event_label: name,
          value: Math.round(duration),
        });
      }
    }
  }, [name]);

  return { startMeasure, endMeasure };
}

// Memory optimization for large lists
export function useMemoryOptimization<T>(
  items: T[],
  maxItems: number = 1000
) {
  return useMemo(() => {
    if (items.length <= maxItems) {
      return items;
    }

    // Keep only the most recent items
    return items.slice(-maxItems);
  }, [items, maxItems]);
}