import { useState, useEffect } from 'react';
import { WifiIcon, ExclamationTriangleIcon } from '@/components/icons';
import { supabase } from '@/lib/supabase';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export function RealtimeStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let pingInterval: NodeJS.Timeout;

    const channel = supabase.channel('status-monitor');
    
    channel.subscribe((channelStatus) => {
      switch (channelStatus) {
        case 'SUBSCRIBED':
          setStatus('connected');
          setLastUpdate(new Date());
          
          // Set up periodic ping to verify connection
          pingInterval = setInterval(() => {
            setLastUpdate(new Date());
          }, 30000); // Every 30 seconds
          break;
          
        case 'CLOSED':
          setStatus('disconnected');
          if (pingInterval) clearInterval(pingInterval);
          break;
          
        case 'CHANNEL_ERROR':
          setStatus('error');
          if (pingInterval) clearInterval(pingInterval);
          break;
          
        default:
          setStatus('connecting');
      }
    });

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      channel.unsubscribe();
    };
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: WifiIcon,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Connected',
          description: 'Real-time updates active',
        };
      case 'connecting':
        return {
          icon: WifiIcon,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Connecting...',
          description: 'Establishing connection',
        };
      case 'disconnected':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          label: 'Disconnected',
          description: 'Reconnecting...',
        };
      case 'error':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Connection Error',
          description: 'Please refresh the page',
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center px-3 py-2 rounded-md border ${config.bgColor} ${config.borderColor}`}>
      <IconComponent className={`w-4 h-4 mr-2 ${config.color} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
        <span className="text-xs text-gray-500">
          {config.description}
        </span>
      </div>
      
      {status === 'connected' && lastUpdate && (
        <div className="ml-3 text-xs text-gray-400">
          {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

// Compact version for header/toolbar use
export function RealtimeStatusCompact() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    const channel = supabase.channel('status-monitor-compact');
    
    channel.subscribe((channelStatus) => {
      switch (channelStatus) {
        case 'SUBSCRIBED':
          setStatus('connected');
          break;
        case 'CLOSED':
          setStatus('disconnected');
          break;
        case 'CHANNEL_ERROR':
          setStatus('error');
          break;
        default:
          setStatus('connecting');
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const getIndicatorClass = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-400';
      case 'connecting':
        return 'bg-yellow-400 animate-pulse';
      case 'disconnected':
        return 'bg-orange-400 animate-pulse';
      case 'error':
        return 'bg-red-400';
    }
  };

  const getTooltip = () => {
    switch (status) {
      case 'connected':
        return 'Real-time updates active';
      case 'connecting':
        return 'Connecting to real-time updates';
      case 'disconnected':
        return 'Disconnected - attempting to reconnect';
      case 'error':
        return 'Connection error - please refresh';
    }
  };

  return (
    <div 
      className="flex items-center space-x-2 cursor-help"
      title={getTooltip()}
    >
      <div className={`w-2 h-2 rounded-full ${getIndicatorClass()}`}></div>
      <span className="text-xs text-gray-500">Live</span>
    </div>
  );
}