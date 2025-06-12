'use client'

import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface SyncStatusIndicatorProps {
  lastSync?: Date;
  isConnected?: boolean;
  isSyncing?: boolean;
  error?: string | null;
  className?: string;
}

export function SyncStatusIndicator({
  lastSync,
  isConnected = true,
  isSyncing = false,
  error,
  className = ''
}: SyncStatusIndicatorProps) {
  const getStatusInfo = () => {
    if (error) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Sync Error',
        className: 'text-red-600 bg-red-50 border-red-200'
      };
    }

    if (isSyncing) {
      return {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        text: 'Syncing...',
        className: 'text-blue-600 bg-blue-50 border-blue-200'
      };
    }

    if (!isConnected) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        text: 'Offline',
        className: 'text-gray-600 bg-gray-50 border-gray-200'
      };
    }

    return {
      icon: <CheckCircle className="h-4 w-4" />,
      text: 'Synced',
      className: 'text-green-600 bg-green-50 border-green-200'
    };
  };

  const status = getStatusInfo();

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${status.className} ${className}`}>
      <div className="flex items-center space-x-1">
        {status.icon}
        <span className="text-sm font-medium">{status.text}</span>
      </div>
      
      {lastSync && !error && (
        <div className="text-xs opacity-75">
          {formatLastSync(lastSync)}
        </div>
      )}
      
      {error && (
        <div className="text-xs opacity-75" title={error}>
          Click to retry
        </div>
      )}
    </div>
  );
}