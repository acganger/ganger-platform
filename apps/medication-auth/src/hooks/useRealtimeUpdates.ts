import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  subscribeToAuthorizationUpdates,
  subscribeToUserAuthorizations,
  subscribeToAIRecommendations,
  subscribeToSystemNotifications,
  supabase
} from '@/lib/supabase';
import { authorizationKeys } from './useAuthorizations';
import { addNotification } from '@/components/shared/NotificationCenter';
import type { RealtimeUpdate } from '@/types';

// Hook for real-time authorization updates
export function useAuthorizationRealtime(authorizationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authorizationId) return;

    const subscription = subscribeToAuthorizationUpdates(
      authorizationId,
      (payload) => {
        // Invalidate specific authorization queries
        queryClient.invalidateQueries({ 
          queryKey: authorizationKeys.detail(authorizationId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: authorizationKeys.status(authorizationId) 
        });

        // Show notification for status changes
        if (payload.eventType === 'UPDATE' && payload.new?.status !== payload.old?.status) {
          const newStatus = payload.new.status;
          const statusMessages = {
            submitted: 'Authorization submitted successfully',
            processing: 'Authorization is now being processed',
            approved: 'Authorization has been approved!',
            denied: 'Authorization was denied',
            pending_info: 'Additional information required',
          };

          if (statusMessages[newStatus as keyof typeof statusMessages]) {
            addNotification({
              type: newStatus === 'approved' ? 'success' : newStatus === 'denied' ? 'error' : 'info',
              title: 'Status Update',
              message: statusMessages[newStatus as keyof typeof statusMessages],
              authorization_id: authorizationId,
              autoHide: newStatus !== 'denied', // Keep denials visible longer
            });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [authorizationId, queryClient]);
}

// Hook for real-time AI recommendations
export function useAIRecommendationsRealtime(authorizationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authorizationId) return;

    const subscription = subscribeToAIRecommendations(
      authorizationId,
      (payload) => {
        // Invalidate AI recommendations
        queryClient.invalidateQueries({ 
          queryKey: authorizationKeys.ai(authorizationId) 
        });

        // Show notification for new AI recommendations
        if (payload.eventType === 'INSERT') {
          const recommendation = payload.new;
          addNotification({
            type: 'info',
            title: 'AI Recommendation',
            message: `New AI suggestion available for authorization #${authorizationId.slice(-8)}`,
            authorization_id: authorizationId,
            autoHide: false, // Keep AI recommendations visible
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [authorizationId, queryClient]);
}

// Hook for user-specific authorization updates
export function useUserAuthorizationsRealtime(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const subscription = subscribeToUserAuthorizations(
      userId,
      (payload) => {
        // Invalidate all authorization lists
        queryClient.invalidateQueries({ 
          queryKey: authorizationKeys.lists() 
        });

        // Handle different event types
        if (payload.eventType === 'INSERT') {
          addNotification({
            type: 'success',
            title: 'New Authorization',
            message: 'A new authorization has been created',
            autoHide: true,
          });
        } else if (payload.eventType === 'UPDATE') {
          const authId = payload.new?.id;
          if (authId) {
            // Invalidate specific authorization
            queryClient.invalidateQueries({ 
              queryKey: authorizationKeys.detail(authId) 
            });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, queryClient]);
}

// Hook for system notifications
export function useSystemNotificationsRealtime(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const subscription = subscribeToSystemNotifications(
      userId,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const notification = payload.new;
          
          addNotification({
            type: notification.type || 'info',
            title: notification.title || 'System Notification',
            message: notification.message,
            authorization_id: notification.authorization_id,
            autoHide: !notification.action_required,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, queryClient]);
}

// Hook for connection status monitoring
export function useConnectionStatus() {
  const handleConnectionChange = useCallback((status: 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR') => {
    if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      addNotification({
        type: 'warning',
        title: 'Connection Issue',
        message: 'Real-time updates may be delayed. Checking connection...',
        autoHide: true,
        duration: 3000,
      });
    } else if (status === 'SUBSCRIBED') {
      // Only show reconnection message if we were previously disconnected
      const wasDisconnected = localStorage.getItem('realtime_disconnected');
      if (wasDisconnected) {
        addNotification({
          type: 'success',
          title: 'Reconnected',
          message: 'Real-time updates restored',
          autoHide: true,
          duration: 2000,
        });
        localStorage.removeItem('realtime_disconnected');
      }
    }
  }, []);

  useEffect(() => {
    // Monitor connection status
    const channel = supabase.channel('connection-monitor');
    
    channel.subscribe((status) => {
      if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        localStorage.setItem('realtime_disconnected', 'true');
      }
      handleConnectionChange(status as any);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [handleConnectionChange]);
}

// Combined hook for all real-time features
export function useRealtimeUpdates(authorizationId?: string, userId?: string) {
  useAuthorizationRealtime(authorizationId);
  useAIRecommendationsRealtime(authorizationId);
  useUserAuthorizationsRealtime(userId);
  useSystemNotificationsRealtime(userId);
  useConnectionStatus();

  return {
    // Utility functions
    refreshData: useCallback(() => {
      const queryClient = useQueryClient();
      queryClient.invalidateQueries({ queryKey: authorizationKeys.all });
    }, []),
  };
}