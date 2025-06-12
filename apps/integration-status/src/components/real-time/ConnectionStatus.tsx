'use client'

import { useState, useEffect } from 'react'
import { useIntegrationStatusUpdates } from '@/hooks/useIntegrationStatusUpdates'

export function ConnectionStatus() {
  const { isConnected, connectionQuality, reconnectAttempts } = useIntegrationStatusUpdates()
  const [showDetails, setShowDetails] = useState(false)

  const getStatusColor = () => {
    if (!isConnected) return 'text-red-500 bg-red-50 border-red-200'
    
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500 bg-green-50 border-green-200'
      case 'good': return 'text-blue-500 bg-blue-50 border-blue-200'
      case 'poor': return 'text-yellow-500 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = () => {
    if (!isConnected) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
        </svg>
      )
    }

    return (
      <div className="relative">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
        
        {/* Connection quality indicator */}
        <div className="absolute -top-1 -right-1">
          <div className={`w-2 h-2 rounded-full ${
            connectionQuality === 'excellent' ? 'bg-green-400' :
            connectionQuality === 'good' ? 'bg-blue-400' :
            connectionQuality === 'poor' ? 'bg-yellow-400' : 'bg-gray-400'
          }`} />
        </div>
      </div>
    )
  }

  const getStatusText = () => {
    if (!isConnected) {
      return reconnectAttempts > 0 ? 'Reconnecting...' : 'Disconnected'
    }
    
    switch (connectionQuality) {
      case 'excellent': return 'Excellent'
      case 'good': return 'Good'
      case 'poor': return 'Poor'
      default: return 'Connected'
    }
  }

  // Hide if connection is excellent (don't clutter the UI)
  if (isConnected && connectionQuality === 'excellent') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <div 
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer
          transition-all duration-200 hover:shadow-md
          ${getStatusColor()}
        `}
        onClick={() => setShowDetails(!showDetails)}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        
        {reconnectAttempts > 0 && (
          <span className="text-xs opacity-75">
            (Attempt {reconnectAttempts})
          </span>
        )}

        {/* Expand/collapse icon */}
        <svg 
          className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Details dropdown */}
      {showDetails && (
        <div className={`
          absolute top-full right-0 mt-2 w-64 p-3 rounded-lg border shadow-lg bg-white
          ${getStatusColor()}
        `}>
          <h4 className="font-medium mb-2">Real-time Connection</h4>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-medium">{getStatusText()}</span>
            </div>
            
            {!isConnected && reconnectAttempts > 0 && (
              <div className="flex justify-between">
                <span>Reconnect Attempts:</span>
                <span className="font-medium">{reconnectAttempts}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>WebSocket:</span>
              <span className="font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {isConnected && (
              <div className="flex justify-between">
                <span>Quality:</span>
                <span className="font-medium capitalize">{connectionQuality}</span>
              </div>
            )}
          </div>
          
          <div className="mt-3 pt-2 border-t border-current border-opacity-20">
            <p className="text-xs opacity-75">
              {isConnected 
                ? 'Real-time updates are active' 
                : 'Some features may be limited'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}