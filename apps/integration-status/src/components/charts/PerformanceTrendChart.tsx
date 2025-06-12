'use client'

import React, { useMemo } from 'react'
import LineChart from './LineChart'
import type { PerformanceMetric, TrendAnalysis } from './types'
import { 
  analyzeTrend, 
  formatResponseTime, 
  formatPercentage,
  CHART_COLORS
} from './chartUtils'

interface PerformanceTrendChartProps {
  data: PerformanceMetric[]
  timeframe: string
  height?: number
  showTrendAnalysis?: boolean
  className?: string
  loading?: boolean
  error?: string
}

export default function PerformanceTrendChart({
  data,
  timeframe,
  height = 400,
  showTrendAnalysis = true,
  className = '',
  loading = false,
  error
}: PerformanceTrendChartProps) {
  const chartSeries = useMemo(() => {
    if (!data.length) return []

    return [
      {
        name: 'Response Time (ms)',
        data: data.map(metric => ({
          label: new Date(metric.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          value: metric.responseTime,
          timestamp: metric.timestamp,
          color: CHART_COLORS.primary
        })),
        color: CHART_COLORS.primary,
        fill: false
      }
    ]
  }, [data])

  const trendAnalysis = useMemo(() => {
    if (!data.length) return null
    
    const responseTimeValues = data.map(d => d.responseTime)
    return analyzeTrend(responseTimeValues, timeframe)
  }, [data, timeframe])

  const averageResponseTime = useMemo(() => {
    if (!data.length) return 0
    return data.reduce((sum, metric) => sum + metric.responseTime, 0) / data.length
  }, [data])

  const chartOptions = {
    title: 'Performance Trend',
    subtitle: `${timeframe} overview`,
    yAxis: {
      title: 'Response Time (ms)',
      min: 0,
      format: 'time' as const
    },
    xAxis: {
      title: 'Time',
      type: 'datetime' as const
    },
    tooltip: {
      enabled: true,
      format: 'time'
    }
  }

  const getTrendIcon = (trend: TrendAnalysis['trend']) => {
    switch (trend) {
      case 'increasing':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        )
      case 'decreasing':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      case 'stable':
        return (
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        )
    }
  }

  const getTrendColor = (trend: TrendAnalysis['trend']) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'decreasing':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'stable':
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Performance Trend</h3>
            <p className="text-sm text-gray-500 mt-1">Response time trends over {timeframe}</p>
          </div>
          
          {/* Average Response Time */}
          <div className="text-right">
            <div className="text-sm text-gray-500">Average Response Time</div>
            <div className="text-xl font-semibold text-gray-900">
              {formatResponseTime(averageResponseTime)}
            </div>
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
      </div>

      {/* Trend Analysis */}
      {showTrendAnalysis && trendAnalysis && (
        <div className="px-6 pb-6">
          <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getTrendColor(trendAnalysis.trend)}`}>
            {getTrendIcon(trendAnalysis.trend)}
            <span className="text-sm font-medium">
              {trendAnalysis.trend === 'increasing' && 'Response time increasing'}
              {trendAnalysis.trend === 'decreasing' && 'Response time improving'}
              {trendAnalysis.trend === 'stable' && 'Response time stable'}
            </span>
            <span className="text-sm">
              {formatPercentage(trendAnalysis.changePercentage)} over {timeframe}
            </span>
            <span className="text-xs text-gray-500">
              ({Math.round(trendAnalysis.confidence * 100)}% confidence)
            </span>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-900">Peak Response Time</span>
            </div>
            <div className="text-lg font-semibold text-blue-900 mt-1">
              {data.length ? formatResponseTime(Math.max(...data.map(d => d.responseTime))) : '---'}
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-900">Best Response Time</span>
            </div>
            <div className="text-lg font-semibold text-green-900 mt-1">
              {data.length ? formatResponseTime(Math.min(...data.map(d => d.responseTime))) : '---'}
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-900">Data Points</span>
            </div>
            <div className="text-lg font-semibold text-yellow-900 mt-1">
              {data.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}