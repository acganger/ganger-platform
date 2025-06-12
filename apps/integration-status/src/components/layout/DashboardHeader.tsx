'use client'

import { ReactNode } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { GangerLogo } from '@ganger/ui'

interface ConnectionStatus {
  isConnected: boolean
  quality: 'excellent' | 'good' | 'poor' | 'disconnected'
}

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  lastUpdate?: string
  connectionStatus?: ConnectionStatus
  actions?: ReactNode
}

export function DashboardHeader({
  title,
  subtitle,
  lastUpdate,
  connectionStatus,
  actions
}: DashboardHeaderProps) {
  const getConnectionColor = (status?: ConnectionStatus) => {
    if (!status) return 'text-gray-400'
    
    if (!status.isConnected) return 'text-red-500'
    
    switch (status.quality) {
      case 'excellent': return 'text-green-500'
      case 'good': return 'text-blue-500'
      case 'poor': return 'text-yellow-500'
      default: return 'text-gray-400'
    }
  }

  const getConnectionIcon = (status?: ConnectionStatus) => {
    if (!status || !status.isConnected) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
        </svg>
      )
    }

    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    )
  }

  const getConnectionText = (status?: ConnectionStatus) => {
    if (!status) return 'Unknown'
    if (!status.isConnected) return 'Disconnected'
    
    switch (status.quality) {
      case 'excellent': return 'Excellent'
      case 'good': return 'Good'
      case 'poor': return 'Poor'
      default: return 'Connected'
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 mb-8">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-4">
              <GangerLogo href="/" size="lg" />
              <div className="ml-4 pl-4 border-l border-gray-300">
                <h1 className="text-xl font-semibold text-gray-900">
                  Integration Status
                </h1>
                <p className="text-sm text-gray-500">
                  System Health Monitor
                </p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">
                {subtitle}
              </p>
            )}
            
            {/* Status indicators */}
            <div className="mt-3 flex items-center space-x-6 text-sm">
              {/* Last update */}
              {lastUpdate && (
                <div className="flex items-center text-gray-500">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Last updated {formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}
                  </span>
                </div>
              )}

              {/* Connection status */}
              {connectionStatus && (
                <div className={`flex items-center ${getConnectionColor(connectionStatus)}`}>
                  <span className="mr-1.5">
                    {getConnectionIcon(connectionStatus)}
                  </span>
                  <span>
                    {getConnectionText(connectionStatus)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}