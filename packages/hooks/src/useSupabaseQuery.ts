import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getSupabaseClient } from '@ganger/auth';
import { errorTracking } from '@ganger/monitoring';

interface SupabaseQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  single?: boolean;
}

export function useSupabaseQuery<T = any>(
  queryKey: string[],
  options: SupabaseQueryOptions<T>
) {
  const supabase = getSupabaseClient();
  
  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const startTime = performance.now();
      
      try {
        let query = supabase
          .from(options.table)
          .select(options.select || '*');

        // Apply filters
        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value === null) {
              query = query.is(key, null);
            } else if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (typeof value === 'object' && value.gte !== undefined) {
              query = query.gte(key, value.gte);
              if (value.lte !== undefined) {
                query = query.lte(key, value.lte);
              }
            } else if (typeof value === 'object' && value.ilike !== undefined) {
              query = query.ilike(key, value.ilike);
            } else {
              query = query.eq(key, value);
            }
          });
        }

        // Apply ordering
        if (options.orderBy) {
          query = query.order(options.orderBy.column, {
            ascending: options.orderBy.ascending ?? true
          });
        }

        // Apply limit
        if (options.limit) {
          query = query.limit(options.limit);
        }

        // Execute query
        const { data, error } = options.single 
          ? await query.single()
          : await query;

        if (error) {
          throw error;
        }

        // Track performance
        const duration = performance.now() - startTime;
        if (typeof window !== 'undefined') {
          errorTracking.trackPerformance({
            name: 'supabase_query_duration',
            value: duration,
            unit: 'ms',
            timestamp: new Date().toISOString(),
            tags: {
              table: options.table,
              queryKey: queryKey.join(':'),
              resultCount: Array.isArray(data) ? data.length.toString() : '1'
            }
          });
        }

        return data as T;
      } catch (error) {
        // Track errors
        if (typeof window !== 'undefined') {
          errorTracking.trackError(error as Error, {
            queryKey: queryKey.join(':'),
            table: options.table,
            filters: options.filters
          });
        }
        throw error;
      }
    },
    ...options
  });
}

// Convenience hooks for common queries
export function useSupabaseItem<T = any>(
  table: string,
  id: string,
  select?: string
) {
  return useSupabaseQuery<T>(
    [table, id],
    {
      table,
      select,
      filters: { id },
      single: true,
      enabled: !!id
    }
  );
}

export function useSupabaseList<T = any>(
  table: string,
  filters?: Record<string, any>,
  options?: {
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  }
) {
  return useSupabaseQuery<T[]>(
    [table, 'list', JSON.stringify(filters)],
    {
      table,
      select: options?.select,
      filters,
      orderBy: options?.orderBy,
      limit: options?.limit
    }
  );
}