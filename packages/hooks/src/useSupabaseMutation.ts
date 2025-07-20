import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@ganger/auth';
import { errorTracking } from '@ganger/monitoring';

interface SupabaseMutationOptions<T, V> extends Omit<UseMutationOptions<T, Error, V>, 'mutationFn'> {
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  invalidateQueries?: string[];
}

export function useSupabaseMutation<T = any, V = any>(
  options: SupabaseMutationOptions<T, V>
) {
  const supabase = getSupabaseClient();
  const queryClient = useQueryClient();
  
  return useMutation<T, Error, V>({
    mutationFn: async (variables: V) => {
      const startTime = performance.now();
      
      try {
        let result;
        
        switch (options.operation) {
          case 'insert':
            result = await supabase
              .from(options.table)
              .insert(variables)
              .select()
              .single();
            break;
            
          case 'update':
            const { id, ...updateData } = variables as any;
            result = await supabase
              .from(options.table)
              .update(updateData)
              .eq('id', id)
              .select()
              .single();
            break;
            
          case 'delete':
            result = await supabase
              .from(options.table)
              .delete()
              .eq('id', variables as any)
              .select()
              .single();
            break;
            
          case 'upsert':
            result = await supabase
              .from(options.table)
              .upsert(variables)
              .select()
              .single();
            break;
        }
        
        if (result.error) {
          throw result.error;
        }
        
        // Track performance
        const duration = performance.now() - startTime;
        if (typeof window !== 'undefined') {
          errorTracking.trackPerformance({
            name: 'supabase_mutation_duration',
            value: duration,
            unit: 'ms',
            timestamp: new Date().toISOString(),
            tags: {
              table: options.table,
              operation: options.operation
            }
          });
        }
        
        return result.data as T;
      } catch (error) {
        // Track errors
        if (typeof window !== 'undefined') {
          errorTracking.trackError(error as Error, {
            table: options.table,
            operation: options.operation
          });
        }
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
      
      // Call user's onSuccess if provided
      options.onSuccess?.(data, variables, context);
    },
    ...options
  });
}