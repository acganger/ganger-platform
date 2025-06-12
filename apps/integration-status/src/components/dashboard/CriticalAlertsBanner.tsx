'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { AlertRule, Integration } from '@/types'

interface CriticalAlertsBannerProps {
  alerts: AlertRule[]
  onDismiss?: (alertId: string) => void
  onAcknowledge?: (alertId: string) => void
  onViewDetails?: (integration: Integration) => void
}

export function CriticalAlertsBanner({ 
  alerts, 
  onDismiss, 
  onAcknowledge,
  onViewDetails 
}: CriticalAlertsBannerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  const activeAlerts = alerts.filter(alert => 
    alert.severity === 'critical' && !dismissedAlerts.has(alert.id)
  )

  if (activeAlerts.length === 0) return null

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]))
    onDismiss?.(alertId)
  }

  const handleAcknowledge = async (alertId: string) => {
    if (onAcknowledge) {
      await onAcknowledge(alertId)
    }
    handleDismiss(alertId)
  }

  return (
    <div className="mb-6" role="alert" aria-live="assertive">
      {activeAlerts.map(alert => (
        <div 
          key={alert.id} 
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3 shadow-sm"
        >
          <div className="flex items-start">
            {/* Alert icon */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Alert content */}
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-red-800">
                  Critical Integration Issue
                </h3>
                
                <div className="flex items-center space-x-2">
                  {/* Severity badge */}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Critical
                  </span>
                  
                  {/* Dismiss button */}
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    aria-label="Dismiss alert"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Alert message */}
              <div className="mt-2 text-sm text-red-700">
                <p className="font-medium">{alert.message}</p>
                
                <div className="mt-1 space-y-1">
                  <p>
                    <span className="font-medium">Service:</span> {alert.integration_name}
                  </p>
                  {alert.triggered_at && (
                    <p>
                      <span className="font-medium">Triggered:</span>{' '}
                      {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                {onViewDetails && (
                  <button
                    onClick={() => {
                      // We would need the integration object here, 
                      // for now just show integration ID
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                )}
                
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 transition-colors"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Acknowledge
                </button>

                <button
                  onClick={() => {
                    // Trigger a test connection for this integration
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 transition-colors"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Test Now
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Summary for multiple alerts */}
      {activeAlerts.length > 1 && (
        <div className="bg-red-100 border border-red-200 rounded-lg p-3 mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-red-800">
                {activeAlerts.length} critical issues require immediate attention
              </span>
            </div>
            
            <button
              onClick={() => {
                // Acknowledge all critical alerts
                activeAlerts.forEach(alert => handleAcknowledge(alert.id))
              }}
              className="text-xs font-medium text-red-700 hover:text-red-800 underline"
            >
              Acknowledge All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}