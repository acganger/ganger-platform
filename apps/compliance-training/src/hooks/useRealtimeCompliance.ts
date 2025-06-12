'use client'

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useCompliance } from '@/lib/compliance-context';

// Create Supabase client for real-time subscriptions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RealtimeStatus {
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
  updateCount: number;
}

export function useRealtimeCompliance() {
  const { actions, state } = useCompliance();
  const [status, setStatus] = useState<RealtimeStatus>({
    isConnected: false,
    lastUpdate: null,
    error: null,
    updateCount: 0
  });
  
  const subscriptionsRef = useRef<any[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Debounced reload to prevent excessive API calls
  const debouncedReload = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      actions.loadDashboardData();
      setStatus(prev => ({
        ...prev,
        lastUpdate: new Date(),
        updateCount: prev.updateCount + 1
      }));
    }, 500); // 500ms debounce
  }, [actions]);

  // Handle real-time payload updates
  const handleRealtimeUpdate = useCallback((table: string, payload: any) => {
    
    try {
      // Handle specific update types for better performance
      switch (payload.eventType) {
        case 'INSERT':
        case 'UPDATE':
        case 'DELETE':
          debouncedReload();
          break;
        default:
      }
      
      setStatus(prev => ({ ...prev, error: null }));
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Update processing failed'
      }));
    }
  }, [debouncedReload]);

  // Connection status monitoring
  useEffect(() => {
    const checkConnection = () => {
      const connected = supabase.realtime.isConnected();
      setStatus(prev => ({ 
        ...prev, 
        isConnected: connected,
        error: connected ? null : 'Connection lost'
      }));
    };

    // Check connection status every 5 seconds
    const connectionInterval = setInterval(checkConnection, 5000);
    checkConnection(); // Initial check

    return () => {
      clearInterval(connectionInterval);
    };
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    // Clear existing subscriptions
    subscriptionsRef.current.forEach(sub => sub.unsubscribe());
    subscriptionsRef.current = [];

    try {
      // Training completions subscription
      const completionSubscription = supabase
        .channel('compliance_training_completions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'training_completions'
          },
          (payload) => handleRealtimeUpdate('training_completions', payload)
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
          } else if (status === 'CHANNEL_ERROR') {
            setStatus(prev => ({ ...prev, error: 'Failed to subscribe to completions' }));
          }
        });

      // Employees subscription
      const employeeSubscription = supabase
        .channel('compliance_employees')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'employees'
          },
          (payload) => handleRealtimeUpdate('employees', payload)
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
          } else if (status === 'CHANNEL_ERROR') {
            setStatus(prev => ({ ...prev, error: 'Failed to subscribe to employees' }));
          }
        });

      // Training modules subscription
      const trainingSubscription = supabase
        .channel('compliance_training_modules')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'training_modules'
          },
          (payload) => handleRealtimeUpdate('training_modules', payload)
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
          } else if (status === 'CHANNEL_ERROR') {
            setStatus(prev => ({ ...prev, error: 'Failed to subscribe to training modules' }));
          }
        });

      subscriptionsRef.current = [
        completionSubscription,
        employeeSubscription,
        trainingSubscription
      ];

      setStatus(prev => ({ ...prev, error: null }));
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Subscription setup failed'
      }));
    }

    // Cleanup subscriptions on unmount
    return () => {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
      subscriptionsRef.current = [];
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [handleRealtimeUpdate]);

  // Manual reconnection function
  const reconnect = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, error: null }));
      
      // Force reload data
      await actions.loadDashboardData();
      
      setStatus(prev => ({ 
        ...prev, 
        lastUpdate: new Date(),
        updateCount: prev.updateCount + 1
      }));
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Reconnection failed'
      }));
    }
  }, [actions]);

  return {
    ...status,
    reconnect,
    isSyncing: state.loading
  };
}