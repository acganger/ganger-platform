'use client'

import React, { useMemo } from 'react'
import type { UptimeData } from './types'
import { 
  calculateUptime, 
  formatPercentage, 
  formatTimestamp,
  STATUS_COLORS 
} from './chartUtils'

interface UptimeChartProps {
  data: UptimeData[]
  timeframe: string
  height?: number
  className?: string
  loading?: boolean
  error?: string
}

export default function UptimeChart({
  data,
  timeframe,
  height = 300,
  className = '',
  loading = false,
  error
}: UptimeChartProps) {
  const uptimeStats = useMemo(() => {
    if (!data.length) {
      return {
        overallUptime: 0,
        totalDowntime: 0,
        incidentCount: 0,
        longestOutage: 0,
        averageResponseTime: 0
      }
    }

    const overallUptime = calculateUptime(data)
    const downPeriods = data.filter(d => d.status === 'down')
    const incidentCount = downPeriods.length
    
    // Calculate total downtime (assuming each data point represents 1 hour)
    const totalDowntime = downPeriods.length * 60 // minutes
    
    // Find longest consecutive outage
    let currentOutage = 0
    let longestOutage = 0
    
    data.forEach(point => {
      if (point.status === 'down') {
        currentOutage++
        longestOutage = Math.max(longestOutage, currentOutage)
      } else {
        currentOutage = 0
      }
    })

    // Calculate average response time for 'up' periods
    const upPeriods = data.filter(d => d.status === 'up' && d.responseTime)
    const averageResponseTime = upPeriods.length > 0 
      ? upPeriods.reduce((sum, d) => sum + (d.responseTime || 0), 0) / upPeriods.length 
      : 0

    return {
      overallUptime,
      totalDowntime,
      incidentCount,
      longestOutage: longestOutage * 60, // Convert to minutes
      averageResponseTime
    }
  }, [data])

  const statusBlocks = useMemo(() => {
    return data.map((point, index) => {
      const width = 100 / data.length
      return {
        ...point,
        width: `${width}%`,
        left: `${index * width}%`,
        color: STATUS_COLORS[point.status === 'up' ? 'healthy' : 
                           point.status === 'degraded' ? 'warning' :
                           point.status === 'maintenance' ? 'maintenance' : 'critical']
      }
    })
  }, [data])

  const getStatusIcon = (status: UptimeData['status']) => {
    switch (status) {
      case 'up':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'down':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'degraded':
        return (
          <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'maintenance':
        return (
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
    }
  }

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 0.999) return 'text-green-600'
    if (uptime >= 0.995) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height }}>
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-500">Loading uptime data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 rounded-lg border border-red-200 ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-red-600 font-medium">Failed to load uptime data</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Uptime Monitor</h3>
            <p className="text-sm text-gray-500 mt-1">{timeframe} availability overview</p>
          </div>
          
          {/* Overall Uptime */}
          <div className="text-right">
            <div className="text-sm text-gray-500">Overall Uptime</div>
            <div className={`text-2xl font-bold ${getUptimeColor(uptimeStats.overallUptime)}`}>
              {formatPercentage(uptimeStats.overallUptime)}
            </div>
          </div>
        </div>
      </div>

      {/* Uptime Bar */}
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Status Timeline</span>
            <span>{data.length} data points</span>
          </div>
          
          <div className="relative bg-gray-200 rounded-full h-8 overflow-hidden">
            {statusBlocks.map((block, index) => (
              <div
                key={index}
                className="absolute top-0 h-full transition-all duration-200 hover:opacity-80"
                style={{
                  left: block.left,
                  width: block.width,
                  backgroundColor: block.color
                }}
                title={`${block.status} at ${formatTimestamp(block.timestamp, 'datetime')}`}
              />
            ))}
          </div>
          
          {/* Timeline Labels */}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{data.length > 0 ? formatTimestamp(data[0].timestamp, 'datetime') : ''}</span>
            <span>{data.length > 0 ? formatTimestamp(data[data.length - 1].timestamp, 'datetime') : ''}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.healthy }}></div>
            <span>Up</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.warning }}></div>
            <span>Degraded</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.critical }}></div>
            <span>Down</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.maintenance }}></div>
            <span>Maintenance</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-600 mb-2">
              {getStatusIcon('up')}
              <span className="text-sm font-medium">Uptime</span>
            </div>
            <div className="text-xl font-semibold text-green-900">
              {formatPercentage(uptimeStats.overallUptime)}
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-600 mb-2">
              {getStatusIcon('down')}
              <span className="text-sm font-medium">Total Downtime</span>
            </div>
            <div className="text-xl font-semibold text-red-900">
              {uptimeStats.totalDowntime} min
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-yellow-600 mb-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium">Incidents</span>
            </div>
            <div className="text-xl font-semibold text-yellow-900">
              {uptimeStats.incidentCount}
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Avg Response</span>
            </div>
            <div className="text-xl font-semibold text-blue-900">
              {Math.round(uptimeStats.averageResponseTime)}ms
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}