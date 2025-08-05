import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@ganger/ui';
import { 
  isOnline as checkOnline, 
  saveOfflineAction, 
  getPendingOfflineActions,
  clearOfflineAction,
  cacheAPIResponse,
  getCachedAPIResponse 
} from '../lib/pwa';

interface UseOfflineOptions {
  showToasts?: boolean;
  syncOnReconnect?: boolean;
}

export function useOffline(options: UseOfflineOptions = {}) {
  const { showToasts = true, syncOnReconnect = true } = options;
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    // Set initial state
    setIsOnline(checkOnline());

    // Update pending actions
    const loadPendingActions = async () => {
      const actions = await getPendingOfflineActions();
      setPendingActions(actions);
    };
    loadPendingActions();

    // Handle online/offline events
    const handleOnline = async () => {
      setIsOnline(true);
      if (showToasts) {
        addToast({
          title: 'Success',
          message: 'Connection restored',
          type: 'success'
        });
      }
      
      if (syncOnReconnect) {
        await syncPendingActions();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (showToasts) {
        addToast({
          title: 'Warning',
          message: 'You are offline. Changes will be saved locally.',
          type: 'warning'
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToasts, syncOnReconnect]);

  // Sync pending actions when back online
  const syncPendingActions = useCallback(async () => {
    const actions = await getPendingOfflineActions();
    let successCount = 0;
    let failCount = 0;

    for (const action of actions) {
      try {
        const response = await fetch(action.endpoint, {
          method: action.type === 'DELETE' ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action.data),
        });

        if (response.ok) {
          await clearOfflineAction(action.id);
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('Failed to sync action:', error);
        failCount++;
      }
    }

    if (successCount > 0) {
      addToast({
        title: 'Success',
        message: `Synced ${successCount} offline changes`,
        type: 'success'
      });
    }
    
    if (failCount > 0) {
      addToast({
        title: 'Error',
        message: `Failed to sync ${failCount} changes`,
        type: 'error'
      });
    }

    // Reload pending actions
    const remaining = await getPendingOfflineActions();
    setPendingActions(remaining);
  }, []);

  // Execute action with offline support
  const executeAction = useCallback(async (
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      data?: any;
      cache?: boolean;
    } = {}
  ) => {
    const { method = 'GET', data, cache = true } = options;

    // Try online first
    if (isOnline) {
      try {
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: data ? JSON.stringify(data) : undefined,
        });

        if (response.ok) {
          const result = await response.json();
          
          // Cache GET responses
          if (method === 'GET' && cache) {
            await cacheAPIResponse(endpoint, result);
          }
          
          return { success: true, data: result, offline: false };
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Online request failed:', error);
        // Fall through to offline handling
      }
    }

    // Handle offline
    if (method === 'GET') {
      // Try to get from cache
      const cachedData = await getCachedAPIResponse(endpoint);
      if (cachedData) {
        return { success: true, data: cachedData, offline: true, cached: true };
      }
      return { success: false, error: 'No cached data available', offline: true };
    } else {
      // Save action for later sync
      await saveOfflineAction({
        type: method as 'CREATE' | 'UPDATE' | 'DELETE',
        endpoint,
        data,
        timestamp: Date.now(),
      });
      
      // Update pending actions
      const actions = await getPendingOfflineActions();
      setPendingActions(actions);
      
      if (showToasts) {
        addToast({
          title: 'Info',
          message: 'Changes saved offline and will sync when connection is restored',
          type: 'info'
        });
      }
      
      return { success: true, offline: true, pending: true };
    }
  }, [isOnline, showToasts]);

  return {
    isOnline,
    pendingActions,
    executeAction,
    syncPendingActions,
    hasPendingActions: pendingActions.length > 0,
  };
}