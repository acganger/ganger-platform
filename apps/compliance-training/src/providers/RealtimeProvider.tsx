'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRealtimeCompliance } from '@/hooks/useRealtimeCompliance';
import { LiveUpdateNotification, LiveUpdateToast } from '@/components/shared/LiveUpdateNotification';

interface RealtimeContextValue {
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
  updateCount: number;
  isSyncing: boolean;
  reconnect: () => Promise<void>;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

interface RealtimeProviderProps {
  children: ReactNode;
  enableNotifications?: boolean;
}

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export function RealtimeProvider({ 
  children, 
  enableNotifications = true 
}: RealtimeProviderProps) {
  const realtimeStatus = useRealtimeCompliance();
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [previousUpdateCount, setPreviousUpdateCount] = useState(0);
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);

  // Show notification when new updates are received
  useEffect(() => {
    if (enableNotifications && realtimeStatus.updateCount > previousUpdateCount && previousUpdateCount > 0) {
      setShowUpdateNotification(true);
      
      // Show toast for quick feedback
      showNotification(
        `${realtimeStatus.updateCount - previousUpdateCount} compliance updates received`,
        'success'
      );
    }
    setPreviousUpdateCount(realtimeStatus.updateCount);
  }, [realtimeStatus.updateCount, previousUpdateCount, enableNotifications]);

  // Show error notifications
  useEffect(() => {
    if (enableNotifications && realtimeStatus.error) {
      showNotification(
        'Real-time connection error. Click sync to retry.',
        'warning'
      );
    }
  }, [realtimeStatus.error, enableNotifications]);

  // Show connection status changes
  useEffect(() => {
    if (enableNotifications) {
      if (realtimeStatus.isConnected && previousUpdateCount > 0) {
        showNotification('Real-time sync reconnected', 'success');
      } else if (!realtimeStatus.isConnected && previousUpdateCount > 0) {
        showNotification('Real-time sync disconnected', 'warning');
      }
    }
  }, [realtimeStatus.isConnected, enableNotifications, previousUpdateCount]);

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: ToastNotification = { id, message, type };
    
    setToastNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleRefreshFromNotification = () => {
    setShowUpdateNotification(false);
    // Trigger a manual refresh through the reconnect function
    realtimeStatus.reconnect();
  };

  const contextValue: RealtimeContextValue = {
    isConnected: realtimeStatus.isConnected,
    lastUpdate: realtimeStatus.lastUpdate,
    error: realtimeStatus.error,
    updateCount: realtimeStatus.updateCount,
    isSyncing: realtimeStatus.isSyncing,
    reconnect: realtimeStatus.reconnect,
    showNotification
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
      
      {/* Live Update Notification */}
      {enableNotifications && (
        <LiveUpdateNotification
          isVisible={showUpdateNotification}
          updateCount={realtimeStatus.updateCount - previousUpdateCount + 1}
          onDismiss={() => setShowUpdateNotification(false)}
          onRefresh={handleRefreshFromNotification}
        />
      )}
      
      {/* Toast Notifications */}
      {enableNotifications && toastNotifications.map(notification => (
        <LiveUpdateToast
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </RealtimeContext.Provider>
  );
}