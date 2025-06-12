'use client'

import React, { useState, useMemo } from 'react'
import LineChart from './LineChart'
import type { PerformanceMetric } from './types'
import { 
  metricsToChartData, 
  formatResponseTime, 
  formatPercentage,
  formatNumber
} from './chartUtils'

interface MetricsChartProps {
  data: PerformanceMetric[]
  timeframe: string
  height?: number
  className?: string
  loading?: boolean
  error?: string
}

type MetricType = 'responseTime' | 'errorRate' | 'throughput' | 'all'

export default function MetricsChart({
  data,
  timeframe,
  height = 400,
  className = '',
  loading = false,
  error
}: MetricsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('all')

  const chartSeries = useMemo(() => {
    if (!data.length) return []

    const allSeries = metricsToChartData(data)

    switch (selectedMetric) {
      case 'responseTime':
        return [allSeries[0]] // Response Time only
      case 'errorRate':
        return [allSeries[1]] // Error Rate only
      case 'throughput':
        return [allSeries[2]] // Throughput only
      case 'all':
      default:
        return allSeries
    }
  }, [data, selectedMetric])

  const metricStats = useMemo(() => {
    if (!data.length) {
      return {
        avgResponseTime: 0,
        peakResponseTime: 0,
        avgErrorRate: 0,
        peakErrorRate: 0,
        avgThroughput: 0,
        peakThroughput: 0,
        availability: 0
      }
    }

    const avgResponseTime = data.reduce((sum, m) => sum + m.responseTime, 0) / data.length
    const peakResponseTime = Math.max(...data.map(m => m.responseTime))
    
    const avgErrorRate = data.reduce((sum, m) => sum + m.errorRate, 0) / data.length
    const peakErrorRate = Math.max(...data.map(m => m.errorRate))
    
    const avgThroughput = data.reduce((sum, m) => sum + m.throughput, 0) / data.length
    const peakThroughput = Math.max(...data.map(m => m.throughput))
    
    const availability = data.reduce((sum, m) => sum + m.availability, 0) / data.length

    return {
      avgResponseTime,
      peakResponseTime,
      avgErrorRate,
      peakErrorRate,
      avgThroughput,
      peakThroughput,
      availability
    }
  }, [data])

  const getChartOptions = () => {
    const baseOptions = {
      title: 'Performance Metrics',
      subtitle: `${timeframe} overview`,
      xAxis: {
        title: 'Time',
        type: 'datetime' as const
      },
      tooltip: {
        enabled: true
      }
    }

    switch (selectedMetric) {
      case 'responseTime':
        return {
          ...baseOptions,
          title: 'Response Time Trends',
          yAxis: {
            title: 'Response Time (ms)',
            min: 0,
            format: 'time' as const
          }
        }
      case 'errorRate':
        return {
          ...baseOptions,
          title: 'Error Rate Trends',
          yAxis: {
            title: 'Error Rate (%)',
            min: 0,
            max: 100,
            format: 'percentage' as const
          }
        }
      case 'throughput':
        return {
          ...baseOptions,
          title: 'Throughput Trends',
          yAxis: {
            title: 'Requests per minute',
            min: 0
          }
        }
      case 'all':
      default:
        return {
          ...baseOptions,
          yAxis: {
            title: 'Mixed Metrics',
            min: 0
          }
        }
    }
  }

  const metricButtons = [
    { key: 'all' as MetricType, label: 'All Metrics', icon: '📊' },
    { key: 'responseTime' as MetricType, label: 'Response Time', icon: '⏱️' },
    { key: 'errorRate' as MetricType, label: 'Error Rate', icon: '⚠️' },
    { key: 'throughput' as MetricType, label: 'Throughput', icon: '🚀' }
  ]

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
              <p className="text-sm text-gray-500 mt-1">Comprehensive performance analysis for {timeframe}</p>
            </div>
            
            {/* Overall Health Score */}
            <div className="text-right">
              <div className="text-sm text-gray-500">Health Score</div>
              <div className={`text-2xl font-bold ${
                metricStats.availability > 0.99 ? 'text-green-600' :
                metricStats.availability > 0.95 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {Math.round(metricStats.availability * 100)}%
              </div>
            </div>
          </div>

          {/* Metric Selection */}
          <div className="flex space-x-2">
            {metricButtons.map(button => (
              <button
                key={button.key}
                onClick={() => setSelectedMetric(button.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedMetric === button.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{button.icon}</span>
                {button.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <LineChart
          series={chartSeries}
          config={{ 
            height,
            showLegend: selectedMetric === 'all',
            showGrid: true,
            animate: true 
          }}
          options={getChartOptions()}
          loading={loading}
          error={error}
        />
      </div>

      {/* Detailed Statistics */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Response Time Stats */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <h4 className="text-sm font-semibold text-blue-900">Response Time</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-600">Average</span>
                <span className="text-sm font-medium text-blue-900">
                  {formatResponseTime(metricStats.avgResponseTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-600">Peak</span>
                <span className="text-sm font-medium text-blue-900">
                  {formatResponseTime(metricStats.peakResponseTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Error Rate Stats */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <h4 className="text-sm font-semibold text-red-900">Error Rate</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-red-600">Average</span>
                <span className="text-sm font-medium text-red-900">
                  {formatPercentage(metricStats.avgErrorRate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-red-600">Peak</span>
                <span className="text-sm font-medium text-red-900">
                  {formatPercentage(metricStats.peakErrorRate)}
                </span>
              </div>
            </div>
          </div>

          {/* Throughput Stats */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <h4 className="text-sm font-semibold text-green-900">Throughput</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-green-600">Average</span>
                <span className="text-sm font-medium text-green-900">
                  {formatNumber(metricStats.avgThroughput)} req/min
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-green-600">Peak</span>
                <span className="text-sm font-medium text-green-900">
                  {formatNumber(metricStats.peakThroughput)} req/min
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">SLA Compliance</div>
            <div className={`text-lg font-bold ${
              metricStats.availability > 0.995 ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {formatPercentage(Math.min(metricStats.availability, 1))}
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Data Points</div>
            <div className="text-lg font-bold text-gray-900">
              {data.length}
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Timeframe</div>
            <div className="text-lg font-bold text-gray-900">
              {timeframe}
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Status</div>
            <div className={`text-lg font-bold ${
              metricStats.avgErrorRate < 0.01 && metricStats.avgResponseTime < 500 
                ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {metricStats.avgErrorRate < 0.01 && metricStats.avgResponseTime < 500 ? 'Healthy' : 'Monitor'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}