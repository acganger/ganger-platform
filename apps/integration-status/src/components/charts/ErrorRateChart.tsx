'use client'

import React, { useMemo } from 'react'
import LineChart from './LineChart'
import type { ErrorRateData, ChartSeries } from './types'
import { 
  formatPercentage, 
  analyzeTrend,
  CHART_COLORS 
} from './chartUtils'

interface ErrorRateChartProps {
  data: ErrorRateData[]
  timeframe: string
  height?: number
  showErrorTypes?: boolean
  threshold?: number
  className?: string
  loading?: boolean
  error?: string
}

export default function ErrorRateChart({
  data,
  timeframe,
  height = 350,
  showErrorTypes = true,
  threshold = 0.05, // 5% threshold
  className = '',
  loading = false,
  error
}: ErrorRateChartProps) {
  const chartSeries = useMemo(() => {
    if (!data.length) return []

    const errorRateSeries: ChartSeries = {
      name: 'Error Rate',
      data: data.map(item => ({
        label: new Date(item.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        value: item.errorRate * 100, // Convert to percentage
        timestamp: item.timestamp,
        color: item.errorRate > threshold ? CHART_COLORS.danger : CHART_COLORS.success
      })),
      color: CHART_COLORS.danger,
      fill: true
    }

    return [errorRateSeries]
  }, [data, threshold])

  const errorStats = useMemo(() => {
    if (!data.length) {
      return {
        averageErrorRate: 0,
        peakErrorRate: 0,
        totalErrors: 0,
        totalRequests: 0,
        thresholdExceeded: 0
      }
    }

    const totalErrors = data.reduce((sum, item) => sum + item.errorCount, 0)
    const totalRequests = data.reduce((sum, item) => sum + item.totalRequests, 0)
    const averageErrorRate = totalRequests > 0 ? totalErrors / totalRequests : 0
    const peakErrorRate = Math.max(...data.map(item => item.errorRate))
    const thresholdExceeded = data.filter(item => item.errorRate > threshold).length

    return {
      averageErrorRate,
      peakErrorRate,
      totalErrors,
      totalRequests,
      thresholdExceeded
    }
  }, [data, threshold])

  const trendAnalysis = useMemo(() => {
    if (!data.length) return null
    
    const errorRateValues = data.map(d => d.errorRate * 100)
    return analyzeTrend(errorRateValues, timeframe)
  }, [data, timeframe])

  const errorTypeBreakdown = useMemo(() => {
    if (!data.length || !showErrorTypes) return []

    const errorTypeCounts: Record<string, number> = {}
    
    data.forEach(item => {
      Object.entries(item.errorTypes).forEach(([type, count]) => {
        errorTypeCounts[type] = (errorTypeCounts[type] || 0) + count
      })
    })

    return Object.entries(errorTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 error types
  }, [data, showErrorTypes])

  const chartOptions = {
    title: 'Error Rate Trend',
    subtitle: `${timeframe} overview`,
    yAxis: {
      title: 'Error Rate (%)',
      min: 0,
      format: 'percentage' as const
    },
    xAxis: {
      title: 'Time',
      type: 'datetime' as const
    },
    tooltip: {
      enabled: true,
      format: 'percentage'
    }
  }

  const getThresholdStatus = () => {
    const currentErrorRate = data.length > 0 ? data[data.length - 1].errorRate : 0
    if (currentErrorRate > threshold) {
      return {
        status: 'critical',
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        message: 'Error rate above threshold'
      }
    } else {
      return {
        status: 'healthy',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
        message: 'Error rate within threshold'
      }
    }
  }

  const thresholdStatus = getThresholdStatus()

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Error Rate Analysis</h3>
            <p className="text-sm text-gray-500 mt-1">Error trends and threshold monitoring</p>
          </div>
          
          {/* Current Status */}
          <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${thresholdStatus.color}`}>
            {thresholdStatus.icon}
            <span className="text-sm font-medium">{thresholdStatus.message}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <LineChart
          series={chartSeries}
          config={{ 
            height,
            showLegend: false,
            showGrid: true,
            animate: true 
          }}
          options={chartOptions}
          loading={loading}
          error={error}
        />
        
        {/* Threshold Line Indicator */}
        <div className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
          <div className="w-4 h-px bg-gray-400 border-t border-dashed"></div>
          <span>Threshold: {formatPercentage(threshold)}</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Average Error Rate</div>
            <div className="text-xl font-semibold text-gray-900">
              {formatPercentage(errorStats.averageErrorRate)}
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-sm text-red-600">Peak Error Rate</div>
            <div className="text-xl font-semibold text-red-900">
              {formatPercentage(errorStats.peakErrorRate)}
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600">Total Errors</div>
            <div className="text-xl font-semibold text-blue-900">
              {errorStats.totalErrors.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-sm text-yellow-600">Threshold Breaches</div>
            <div className="text-xl font-semibold text-yellow-900">
              {errorStats.thresholdExceeded}
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        {trendAnalysis && (
          <div className="mb-6">
            <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${
              trendAnalysis.trend === 'increasing' ? 'text-red-600 bg-red-50 border-red-200' :
              trendAnalysis.trend === 'decreasing' ? 'text-green-600 bg-green-50 border-green-200' :
              'text-gray-600 bg-gray-50 border-gray-200'
            }`}>
              <span className="text-sm font-medium">
                Error rate trend: {trendAnalysis.trend}
              </span>
              <span className="text-sm">
                {formatPercentage(trendAnalysis.changePercentage)} over {timeframe}
              </span>
            </div>
          </div>
        )}

        {/* Error Type Breakdown */}
        {showErrorTypes && errorTypeBreakdown.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Top Error Types</h4>
            <div className="space-y-2">
              {errorTypeBreakdown.map(({ type, count }) => (
                <div key={type} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS.danger }}
                    ></div>
                    <span className="text-sm text-gray-700">{type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {count.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({formatPercentage(count / errorStats.totalErrors)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}