'use client'

import { useState, useEffect, memo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { Integration, ServiceMetrics, IntegrationStatusCardProps } from '@/types'
import { LoadingSkeleton } from '@/components/ui/LoadingState'

const IntegrationCardComponent = ({ 
  integration, 
  onClick, 
  onTestConnection,
  metrics: providedMetrics,
  compact = false,
  showActions = true
}: IntegrationStatusCardProps & { onTestConnection?: () => void }) => {
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(providedMetrics || null)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  // Fetch metrics if not provided
  useEffect(() => {
    if (!providedMetrics && !compact) {
      const fetchMetrics = async () => {
        setIsLoadingMetrics(true)
        try {
          // TODO: Replace with actual API call when metrics endpoint is ready
          // const response = await fetch(`/api/integrations/${integration.id}/metrics`)
          // const data = await response.json()
          // setMetrics(data)
          
          // Simulate loading metrics for now
          await new Promise(resolve => setTimeout(resolve, 1000))
          setMetrics({
            integration_id: integration.id,
            timestamp: new Date().toISOString(),
            uptime_percentage: 99.5,
            avg_response_time: 234,
          p95_response_time: 456,
          p99_response_time: 789,
          total_requests: 15420,
          successful_requests: 15350,
          failed_requests: 70,
          success_rate: 99.5,
          error_count: 70,
          requests_per_hour: 642,
          uptime_trend: 1,
          response_time_trend: -1,
          success_rate_trend: 0
        })
        } catch (error) {
          console.error('Failed to fetch metrics:', error)
          // Keep metrics as null to show "unavailable" state
        } finally {
          setIsLoadingMetrics(false)
        }
      }
      
      fetchMetrics()
    }
  }, [integration.id, providedMetrics, compact])

  const statusConfig = {
    healthy: { 
      color: 'border-l-green-500 bg-green-50', 
      icon: '✅', 
      label: 'Healthy',
      textColor: 'text-green-700'
    },
    warning: { 
      color: 'border-l-yellow-500 bg-yellow-50', 
      icon: '⚠️', 
      label: 'Warning',
      textColor: 'text-yellow-700'
    },
    critical: { 
      color: 'border-l-red-500 bg-red-50', 
      icon: '🚨', 
      label: 'Critical',
      textColor: 'text-red-700'
    },
    unknown: { 
      color: 'border-l-gray-500 bg-gray-50', 
      icon: '❓', 
      label: 'Unknown',
      textColor: 'text-gray-700'
    },
    maintenance: { 
      color: 'border-l-purple-500 bg-purple-50', 
      icon: '🔧', 
      label: 'Maintenance',
      textColor: 'text-purple-700'
    }
  }

  const config = statusConfig[integration.health_status] || statusConfig.unknown

  const handleTestConnection = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onTestConnection) return
    
    setIsTestingConnection(true)
    try {
      await onTestConnection()
    } finally {
      setIsTestingConnection(false)
    }
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`
  
  const getTrendIcon = (trend?: number) => {
    if (!trend) return null
    if (trend > 0) return <span className="text-green-500 ml-1">↗</span>
    if (trend < 0) return <span className="text-red-500 ml-1">↘</span>
    return <span className="text-gray-400 ml-1">→</span>
  }

  return (
    <div 
      className={`
        relative bg-white rounded-lg border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer
        ${config.color} border-r border-t border-b border-gray-200
        ${integration.health_status === 'critical' ? 'animate-pulse-slow' : ''}
      `}
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Integration icon */}
            <div className="flex-shrink-0">
              {integration.icon_url ? (
                <img 
                  src={integration.icon_url} 
                  alt={integration.name}
                  className="w-10 h-10 rounded-lg object-cover"
                  onError={(e) => {
                    // Fallback to default icon if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              {/* Fallback icon */}
              <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg ${integration.icon_url ? 'hidden' : ''}`}>
                {config.icon}
              </div>
            </div>

            {/* Integration info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {integration.display_name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {integration.description}
              </p>
              <div className="flex items-center mt-1 space-x-3 text-xs text-gray-400">
                <span className="capitalize">{integration.service_type}</span>
                <span>•</span>
                <span className="capitalize">{integration.environment}</span>
              </div>
            </div>
          </div>
          
          {/* Status badge */}
          <div className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium border ${config.color} ${config.textColor}`}>
            <span className="mr-1">{config.icon}</span>
            {config.label}
          </div>
        </div>

        {/* Metrics Grid */}
        {!compact && (
          <div className="mb-4">
            {isLoadingMetrics ? (
              <LoadingSkeleton lines={2} />
            ) : metrics ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 flex items-center justify-center">
                    {formatPercentage(metrics.uptime_percentage)}
                    {getTrendIcon(metrics.uptime_trend)}
                  </div>
                  <div className="text-xs text-gray-500">Uptime</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 flex items-center justify-center">
                    {metrics.avg_response_time}ms
                    {getTrendIcon(metrics.response_time_trend)}
                  </div>
                  <div className="text-xs text-gray-500">Response Time</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 flex items-center justify-center">
                    {formatPercentage(metrics.success_rate)}
                    {getTrendIcon(metrics.success_rate_trend)}
                  </div>
                  <div className="text-xs text-gray-500">Success Rate</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-lg font-semibold ${metrics.error_count > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {metrics.error_count}
                  </div>
                  <div className="text-xs text-gray-500">Errors (24h)</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">Metrics unavailable</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Last check time */}
          <div className="text-xs text-gray-500">
            Last checked: {formatDistanceToNow(new Date(integration.last_health_check), { addSuffix: true })}
          </div>
          
          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className={`
                  px-3 py-1 text-xs font-medium rounded border transition-colors
                  ${isTestingConnection
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {isTestingConnection ? (
                  <>
                    <svg className="w-3 h-3 mr-1 animate-spin inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Testing...
                  </>
                ) : (
                  'Test Now'
                )}
              </button>
              
              {integration.health_status === 'critical' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle acknowledge action
                  }}
                  className="px-3 py-1 text-xs font-medium rounded border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                >
                  Acknowledge
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Custom comparison function for React.memo
const areEqual = (
  prevProps: IntegrationStatusCardProps & { onTestConnection?: () => void },
  nextProps: IntegrationStatusCardProps & { onTestConnection?: () => void }
) => {
  return (
    prevProps.integration.id === nextProps.integration.id &&
    prevProps.integration.health_status === nextProps.integration.health_status &&
    prevProps.integration.last_health_check === nextProps.integration.last_health_check &&
    prevProps.metrics?.integration_id === nextProps.metrics?.integration_id &&
    prevProps.metrics?.timestamp === nextProps.metrics?.timestamp &&
    prevProps.compact === nextProps.compact &&
    prevProps.showActions === nextProps.showActions
  )
}

export const IntegrationCard = memo(IntegrationCardComponent, areEqual)