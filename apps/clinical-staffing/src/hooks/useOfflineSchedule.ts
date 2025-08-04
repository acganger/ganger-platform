import { useEffect, useState, useCallback } from 'react';
import { 
  isOnline, 
  cacheSchedule, 
  getCachedSchedule, 
  getCachedSchedulesByDate,
  saveScheduleUpdate 
} from '../lib/pwa';
import { toast } from '@ganger/ui';

interface UseOfflineScheduleOptions {
  providerId?: string;
  date: string;
  enableCache?: boolean;
}

export function useOfflineSchedule({ providerId, date, enableCache = true }: UseOfflineScheduleOptions) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [isFromCache, setIsFromCache] = useState(false);

  // Fetch schedule data
  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch from network first
      if (isOnline()) {
        const endpoint = providerId 
          ? `/clinical-staffing/api/staff-schedules?providerId=${providerId}&date=${date}`
          : `/clinical-staffing/api/staff-schedules?date=${date}`;
          
        const response = await fetch(endpoint);
        
        if (response.ok) {
          const networkData = await response.json();
          setData(networkData);
          setIsFromCache(false);

          // Cache the data for offline use
          if (enableCache && providerId) {
            await cacheSchedule({
              providerId,
              date,
              data: networkData,
              timestamp: Date.now()
            });
          }
          
          return;
        }
      }
    } catch (err) {
      console.log('Network fetch failed, trying cache...', err);
    }

    // If network fails or offline, try cache
    if (enableCache) {
      try {
        let cachedData;
        
        if (providerId) {
          cachedData = await getCachedSchedule(providerId, date);
        } else {
          // Get all schedules for the date
          const schedules = await getCachedSchedulesByDate(date);
          cachedData = schedules.length > 0 ? { schedules } : null;
        }

        if (cachedData) {
          setData(cachedData.data || cachedData);
          setIsFromCache(true);
          
          if (!isOnline()) {
            toast.info('Showing cached schedule data');
          }
        } else {
          throw new Error('No cached data available');
        }
      } catch (err) {
        setError(new Error('Unable to load schedule data. Please check your connection.'));
      }
    }

    setLoading(false);
  }, [providerId, date, enableCache]);

  // Update schedule with offline support
  const updateSchedule = useCallback(async (updateData: any) => {
    try {
      if (isOnline()) {
        // Try to update on the server
        const response = await fetch('/clinical-staffing/api/staff-schedules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          const updatedData = await response.json();
          setData(updatedData);
          toast.success('Schedule updated successfully');
          
          // Update cache
          if (enableCache && providerId) {
            await cacheSchedule({
              providerId,
              date,
              data: updatedData,
              timestamp: Date.now()
            });
          }
          
          return updatedData;
        }
      }
    } catch (err) {
      console.error('Failed to update schedule:', err);
    }

    // If offline or update failed, save for later sync
    await saveScheduleUpdate({
      id: `update_${Date.now()}`,
      type: 'UPDATE',
      endpoint: '/clinical-staffing/api/staff-schedules',
      data: updateData,
      timestamp: Date.now()
    });

    // Optimistically update local state
    setData((prev: any) => ({ ...prev, ...updateData }));
    toast.info('Schedule saved offline. Will sync when connection is restored.');
    
    return updateData;
  }, [providerId, date, enableCache]);

  // Listen for online/offline changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Refetch when coming back online
      fetchSchedule();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchSchedule]);

  // Listen for sync events
  useEffect(() => {
    const handleSync = (event: CustomEvent) => {
      if (event.detail && event.detail.data) {
        // Refresh data after successful sync
        fetchSchedule();
      }
    };

    window.addEventListener('schedule-synced', handleSync as any);

    return () => {
      window.removeEventListener('schedule-synced', handleSync as any);
    };
  }, [fetchSchedule]);

  // Initial fetch
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return {
    data,
    loading,
    error,
    isOffline,
    isFromCache,
    refetch: fetchSchedule,
    updateSchedule
  };
}