import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { StaffSchedule, RealtimePayload, StaffingSubscription } from '@/types/staffing';

export function useRealtimeStaffing() {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | undefined>();
  const [lastUpdate, setLastUpdate] = useState<string | undefined>();

  const handleScheduleUpdate = useCallback((payload: RealtimePayload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setSchedules(prev => {
      switch (eventType) {
        case 'INSERT':
          return [...prev, newRecord as StaffSchedule];
        
        case 'UPDATE':
          return prev.map(schedule => 
            schedule.id === newRecord.id ? newRecord as StaffSchedule : schedule
          );
        
        case 'DELETE':
          return prev.filter(schedule => schedule.id !== oldRecord.id);
        
        default:
          return prev;
      }
    });
    
    setLastUpdate(new Date().toISOString());
  }, []);

  useEffect(() => {
    let subscription: any;

    const setupSubscription = () => {
      subscription = supabase
        .channel('staff-schedules-changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'staff_schedules' 
          },
          handleScheduleUpdate
        )
        .subscribe((status) => {
          
          switch (status) {
            case 'SUBSCRIBED':
              setIsConnected(true);
              setConnectionError(undefined);
              break;
            case 'CHANNEL_ERROR':
              setIsConnected(false);
              setConnectionError('Failed to subscribe to real-time updates');
              break;
            case 'TIMED_OUT':
              setIsConnected(false);
              setConnectionError('Connection timed out');
              break;
            case 'CLOSED':
              setIsConnected(false);
              break;
          }
        });
    };

    // Set up subscription
    setupSubscription();

    // Cleanup function
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [handleScheduleUpdate]);

  // Manual reconnection function
  const reconnect = useCallback(() => {
    setConnectionError(undefined);
    // The useEffect will handle creating a new subscription
  }, []);

  return {
    schedules,
    setSchedules,
    isConnected,
    connectionError,
    lastUpdate,
    reconnect,
  } as StaffingSubscription & {
    setSchedules: React.Dispatch<React.SetStateAction<StaffSchedule[]>>;
    reconnect: () => void;
  };
}

export default useRealtimeStaffing;