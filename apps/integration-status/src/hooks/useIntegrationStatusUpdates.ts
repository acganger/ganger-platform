'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { 
  AlertRule, 
  WebSocketMessage, 
  IntegrationStatusUpdate,
  ConnectionState 
} from '@/types'

interface UseIntegrationStatusUpdatesOptions {
  onIntegrationUpdate?: (update: IntegrationStatusUpdate) => void
  onNewAlert?: (alert: AlertRule) => void
  onAlertResolved?: (alertId: string) => void
  onHealthCheckComplete?: (data: any) => void
  autoReconnect?: boolean
  maxReconnectAttempts?: number
  reconnectInterval?: number
}

interface UseIntegrationStatusUpdatesReturn extends ConnectionState {
  lastUpdate?: string
}

export function useIntegrationStatusUpdates(
  options: UseIntegrationStatusUpdatesOptions = {}
): UseIntegrationStatusUpdatesReturn {
  const {
    onIntegrationUpdate,
    onNewAlert,
    onAlertResolved,
    onHealthCheckComplete,
    autoReconnect = true,
    maxReconnectAttempts = 10,
    reconnectInterval = 5000
  } = options

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    connectionQuality: 'disconnected'
  })
  
  const [lastUpdate, setLastUpdate] = useState<string>()
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const connectionStartTimeRef = useRef<number | undefined>(undefined)

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws'

  // Clean up function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  // Calculate connection quality based on various factors
  const calculateConnectionQuality = useCallback(() => {
    if (!connectionState.isConnected) return 'disconnected'
    
    const connectionTime = connectionStartTimeRef.current 
      ? Date.now() - connectionStartTimeRef.current 
      : 0
    
    // Simple quality calculation (can be enhanced with actual latency measurements)
    if (connectionTime > 30000 && connectionState.reconnectAttempts === 0) {
      return 'excellent'
    } else if (connectionState.reconnectAttempts === 0) {
      return 'good'
    } else if (connectionState.reconnectAttempts < 3) {
      return 'good'
    } else {
      return 'poor'
    }
  }, [connectionState.isConnected, connectionState.reconnectAttempts])

  // Handle WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      setLastUpdate(new Date().toISOString())

      switch (message.type) {
        case 'integration_status_update':
          if (onIntegrationUpdate) {
            onIntegrationUpdate(message.data as IntegrationStatusUpdate)
          }
          break

        case 'new_alert':
          if (onNewAlert) {
            onNewAlert(message.data as AlertRule)
          }
          break

        case 'alert_resolved':
          if (onAlertResolved) {
            onAlertResolved(message.data.alertId)
          }
          break

        case 'health_check_complete':
          if (onHealthCheckComplete) {
            onHealthCheckComplete(message.data)
          }
          break

        default:
      }
    } catch (error) {
    }
  }, [onIntegrationUpdate, onNewAlert, onAlertResolved, onHealthCheckComplete])

  // Send heartbeat to keep connection alive
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }))
    }
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setConnectionState(prev => ({ 
      ...prev, 
      isConnecting: true,
      connectionQuality: 'disconnected'
    }))

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      connectionStartTimeRef.current = Date.now()

      ws.onopen = () => {
        setConnectionState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          reconnectAttempts: 0,
          lastConnected: new Date().toISOString()
        }))

        // Subscribe to integration status updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          channel: 'integration_status'
        }))

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000)
      }

      ws.onmessage = handleMessage

      ws.onclose = (event) => {
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          connectionQuality: 'disconnected'
        }))

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }

        // Auto-reconnect if enabled and not a clean close
        if (autoReconnect && event.code !== 1000) {
          setConnectionState(prev => {
            const newAttempts = prev.reconnectAttempts + 1
            
            if (newAttempts <= maxReconnectAttempts) {
              const delay = Math.min(reconnectInterval * Math.pow(2, newAttempts - 1), 30000)
              
              reconnectTimeoutRef.current = setTimeout(() => {
                connect()
              }, delay)
              
            } else {
            }
            
            return { ...prev, reconnectAttempts: newAttempts }
          })
        }
      }

      ws.onerror = () => {
        setConnectionState(prev => ({
          ...prev,
          isConnecting: false,
          connectionQuality: 'disconnected'
        }))
      }

    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        connectionQuality: 'disconnected'
      }))
    }
  }, [wsUrl, autoReconnect, maxReconnectAttempts, reconnectInterval, handleMessage, sendHeartbeat])

  // Initialize connection on mount
  useEffect(() => {
    connect()
    return cleanup
  }, [connect, cleanup])

  // Update connection quality when state changes
  useEffect(() => {
    const quality = calculateConnectionQuality()
    setConnectionState(prev => ({ ...prev, connectionQuality: quality }))
  }, [calculateConnectionQuality])

  // Handle window focus/blur for connection management
  useEffect(() => {
    const handleFocus = () => {
      if (!connectionState.isConnected && !connectionState.isConnecting) {
        connect()
      }
    }

    const handleBeforeUnload = () => {
      cleanup()
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [connectionState.isConnected, connectionState.isConnecting, connect, cleanup])

  return {
    ...connectionState,
    lastUpdate
  }
}