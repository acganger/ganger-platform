// hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string;
}

interface NotificationHookState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

interface UseNotificationsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  realTimeUpdates?: boolean;
}

interface UseNotificationsReturn extends NotificationHookState {
  // Actions
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  bulkMarkAsRead: (notificationIds: string[]) => Promise<boolean>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  
  // Filters
  filterByType: (type: string | null) => void;
  filterByRead: (read: boolean | null) => void;
  filterByPriority: (priority: string | null) => void;
  
  // State
  hasMore: boolean;
  filters: {
    type: string | null;
    read: boolean | null;
    priority: string | null;
  };
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    limit = 50,
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    realTimeUpdates = true
  } = options;

  const [state, setState] = useState<NotificationHookState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null
  });

  const [filters, setFilters] = useState({
    type: null as string | null,
    read: null as boolean | null,
    priority: null as string | null
  });

  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Initialize Supabase client
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (reset: boolean = false) => {
    try {
      setState(prev => ({ ...prev, loading: reset ? true : prev.loading, error: null }));

      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString()
      });

      // Apply filters
      if (filters.type) params.append('type', filters.type);
      if (filters.read !== null) params.append('read', filters.read.toString());
      if (filters.priority) params.append('priority', filters.priority);

      const response = await fetch(`/api/notifications?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch notifications');
      }

      const newNotifications = result.data.notifications || [];
      const pagination = result.data.pagination;

      setState(prev => ({
        ...prev,
        notifications: reset ? newNotifications : [...prev.notifications, ...newNotifications],
        unreadCount: pagination?.unread_count || 0,
        loading: false,
        error: null
      }));

      setHasMore(pagination?.has_more || false);
      setOffset(reset ? newNotifications.length : currentOffset + newNotifications.length);

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications'
      }));
    }
  }, [limit, offset, filters]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      });

      const result = await response.json();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => 
            n.id === notificationId 
              ? { ...n, read: true, read_at: new Date().toISOString() }
              : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1)
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const unreadIds = state.notifications
        .filter(n => !n.read)
        .map(n => n.id);

      if (unreadIds.length === 0) return true;

      const response = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'mark_read',
          notification_ids: unreadIds
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => 
            !n.read ? { ...n, read: true, read_at: new Date().toISOString() } : n
          ),
          unreadCount: 0
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }, [state.notifications]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        setState(prev => {
          const notification = prev.notifications.find(n => n.id === notificationId);
          const wasUnread = notification && !notification.read;
          
          return {
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount
          };
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }, []);

  // Bulk mark as read
  const bulkMarkAsRead = useCallback(async (notificationIds: string[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'mark_read',
          notification_ids: notificationIds
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setState(prev => {
          const unreadCount = prev.notifications
            .filter(n => notificationIds.includes(n.id) && !n.read)
            .length;

          return {
            ...prev,
            notifications: prev.notifications.map(n => 
              notificationIds.includes(n.id) && !n.read
                ? { ...n, read: true, read_at: new Date().toISOString() }
                : n
            ),
            unreadCount: Math.max(0, prev.unreadCount - unreadCount)
          };
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to bulk mark as read:', error);
      return false;
    }
  }, []);

  // Refresh notifications
  const refresh = useCallback(async () => {
    await fetchNotifications(true);
  }, [fetchNotifications]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (!hasMore || state.loading) return;
    await fetchNotifications(false);
  }, [fetchNotifications, hasMore, state.loading]);

  // Filter functions
  const filterByType = useCallback((type: string | null) => {
    setFilters(prev => ({ ...prev, type }));
    setOffset(0);
  }, []);

  const filterByRead = useCallback((read: boolean | null) => {
    setFilters(prev => ({ ...prev, read }));
    setOffset(0);
  }, []);

  const filterByPriority = useCallback((priority: string | null) => {
    setFilters(prev => ({ ...prev, priority }));
    setOffset(0);
  }, []);

  // Initial load and filter changes
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchNotifications(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeUpdates) return;

    const channel = supabase
      .channel('notifications-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_notifications'
        },
        (payload) => {
          // Add new notification to the top of the list
          const newNotification = payload.new as Notification;
          setState(prev => ({
            ...prev,
            notifications: [newNotification, ...prev.notifications],
            unreadCount: prev.unreadCount + 1
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'staff_notifications'
        },
        (payload) => {
          // Update notification in the list
          const updatedNotification = payload.new as Notification;
          setState(prev => ({
            ...prev,
            notifications: prev.notifications.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            )
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'staff_notifications'
        },
        (payload) => {
          // Remove notification from the list
          const deletedId = payload.old.id;
          setState(prev => ({
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== deletedId)
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realTimeUpdates, supabase]);

  return {
    ...state,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    bulkMarkAsRead,
    refresh,
    loadMore,
    filterByType,
    filterByRead,
    filterByPriority,
    hasMore,
    filters
  };
}

// Hook for just the unread count (lightweight)
export function useUnreadNotificationCount(): {
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=1&read=false');
      const result = await response.json();
      
      if (result.success) {
        setCount(result.data.pagination?.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time updates for count
  useEffect(() => {
    const channel = supabase
      .channel('notification-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_notifications'
        },
        () => {
          // Refresh count on any notification change
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCount, supabase]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return {
    count,
    loading,
    refresh: fetchCount
  };
}
