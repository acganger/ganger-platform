import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { getSupabaseClient } from '@ganger/auth';
import { captureError } from '@ganger/monitoring';

export interface RealtimeOptions {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  filter?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface RealtimeSubscriptionState<T> {
  data: T[];
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Generic hook for Supabase realtime subscriptions
 */
export function useRealtimeSubscription<T extends { id: string }>(
  table: string,
  options: RealtimeOptions = {}
): RealtimeSubscriptionState<T> {
  const [state, setState] = useState<RealtimeSubscriptionState<T>>({
    data: [],
    isConnected: false,
    isLoading: true,
    error: null,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = getSupabaseClient();

  // Handle realtime changes
  const handleRealtimeChange = useCallback((
    payload: RealtimePostgresChangesPayload<T>
  ) => {
    setState(prev => {
      const newData = [...prev.data];
      
      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new) {
            newData.push(payload.new as T);
          }
          break;
          
        case 'UPDATE':
          if (payload.new) {
            const index = newData.findIndex(item => item.id === (payload.new as T).id);
            if (index !== -1) {
              newData[index] = payload.new as T;
            }
          }
          break;
          
        case 'DELETE':
          if (payload.old) {
            const index = newData.findIndex(item => item.id === (payload.old as T).id);
            if (index !== -1) {
              newData.splice(index, 1);
            }
          }
          break;
      }
      
      return { ...prev, data: newData };
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const setupSubscription = async () => {
      try {
        // First, fetch initial data
        const { data: initialData, error: fetchError } = await supabase
          .from(table)
          .select('*');

        if (fetchError) throw fetchError;

        if (!isMounted) return;

        setState(prev => ({
          ...prev,
          data: initialData || [],
          isLoading: false,
        }));

        // Set up realtime subscription
        const channel = supabase
          .channel(`${table}-changes`)
          .on(
            'postgres_changes' as any,
            {
              event: options.event || '*',
              schema: options.schema || 'public',
              table,
              filter: options.filter,
            },
            handleRealtimeChange
          )
          .subscribe((status) => {
            if (!isMounted) return;

            if (status === 'SUBSCRIBED') {
              setState(prev => ({ ...prev, isConnected: true }));
              options.onConnect?.();
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setState(prev => ({ ...prev, isConnected: false }));
              options.onDisconnect?.();
            }
          });

        channelRef.current = channel;
      } catch (error) {
        if (!isMounted) return;
        
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setState(prev => ({
          ...prev,
          error: errorObj,
          isLoading: false,
        }));
        
        captureError(errorObj, { context: 'useRealtimeSubscription', table });
        options.onError?.(errorObj);
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, options.event, options.schema, options.filter, supabase]);

  return state;
}

/**
 * Hook for realtime list subscriptions with optimistic updates
 */
export function useRealtimeList<T extends { id: string }>(
  table: string,
  options: RealtimeOptions = {}
) {
  const [state, setState] = useState<RealtimeSubscriptionState<T>>({
    data: [],
    isConnected: false,
    isLoading: true,
    error: null,
  });
  
  // Use the realtime subscription
  const realtimeState = useRealtimeSubscription<T>(table, options);
  
  // Sync realtime state with local state
  useEffect(() => {
    setState(realtimeState);
  }, [realtimeState]);
  
  const optimisticUpdate = useCallback((
    id: string,
    updates: Partial<T>
  ) => {
    setState(prev => ({
      ...prev,
      data: prev.data.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  const optimisticInsert = useCallback((newItem: T) => {
    setState(prev => ({
      ...prev,
      data: [...prev.data, newItem],
    }));
  }, []);

  const optimisticDelete = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      data: prev.data.filter(item => item.id !== id),
    }));
  }, []);

  return {
    ...state,
    optimisticUpdate,
    optimisticInsert,
    optimisticDelete,
  };
}

/**
 * Hook for single item realtime subscription
 */
export function useRealtimeItem<T extends { id: string }>(
  table: string,
  id: string,
  options: Omit<RealtimeOptions, 'filter'> = {}
) {
  const { data, ...rest } = useRealtimeSubscription<T>(table, {
    ...options,
    filter: `id=eq.${id}`,
  });

  return {
    ...rest,
    data: data[0] || null,
  };
}

/**
 * Hook for presence/online status
 */
export function usePresence(roomId: string, userId: string) {
  const [presence, setPresence] = useState<Record<string, any>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const channel = supabase.channel(roomId, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setPresence(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setPresence(prev => ({ ...prev, [key]: newPresences }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setPresence(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId, online: true });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, supabase]);

  const updatePresence = useCallback(async (data: any) => {
    if (channelRef.current) {
      await channelRef.current.track({ userId, ...data });
    }
  }, [userId]);

  return { presence, updatePresence };
}