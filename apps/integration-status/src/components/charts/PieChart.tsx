'use client'

import React, { useMemo } from 'react'
import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import type { ChartDataPoint, ChartConfig, ChartOptions } from './types'
import { CHART_COLORS, formatNumber, formatPercentage } from './chartUtils'

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface PieChartProps {
  data: ChartDataPoint[]
  config?: Partial<ChartConfig>
  options?: ChartOptions
  className?: string
  loading?: boolean
  error?: string
}

export default function PieChart({
  data,
  config = {},
  options = {},
  className = '',
  loading = false,
  error
}: PieChartProps) {
  const chartConfig: ChartConfig = useMemo(() => ({
    type: 'pie',
    height: 300,
    responsive: true,
    showLegend: true,
    showTooltip: true,
    animate: true,
    colors: [
      CHART_COLORS.primary,
      CHART_COLORS.success,
      CHART_COLORS.warning,
      CHART_COLORS.danger,
      CHART_COLORS.info,
      CHART_COLORS.secondary
    ],
    theme: 'light',
    ...config
  }), [config])

  const chartData = useMemo(() => {
    if (!data.length) return { labels: [], datasets: [] }

    const labels = data.map(point => point.label)
    const values = data.map(point => point.value)
    const colors = data.map((point, index) => 
      point.color || chartConfig.colors?.[index % chartConfig.colors.length] || CHART_COLORS.primary
    )

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(color => color),
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8
      }]
    }
  }, [data, chartConfig.colors])

  const totalValue = useMemo(() => {
    return data.reduce((sum, point) => sum + point.value, 0)
  }, [data])

  const chartOptions = useMemo(() => ({
    responsive: chartConfig.responsive,
    maintainAspectRatio: false,
    animation: {
      duration: chartConfig.animate ? 1000 : 0,
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      title: {
        display: !!options.title,
        text: options.title,
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: 20
      },
      subtitle: {
        display: !!options.subtitle,
        text: options.subtitle,
        font: {
          size: 12
        },
        padding: 10
      },
      legend: {
        display: chartConfig.showLegend && (typeof options.legend === 'object' || options.legend !== false),
        position: (options.legend?.position || 'right'),
        align: (options.legend?.align || 'center'),
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          },
          generateLabels: (chart: any) => {
            const original = ChartJS.defaults.plugins.legend.labels.generateLabels
            const labels = original(chart)
            
            labels.forEach((label: any, index: number) => {
              if (data[index]) {
                const percentage = totalValue > 0 ? (data[index].value / totalValue) * 100 : 0
                label.text = `${label.text} (${percentage.toFixed(1)}%)`
              }
            })
            
            return labels
          }
        }
      },
      tooltip: {
        enabled: chartConfig.showTooltip && options.tooltip?.enabled !== false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          title: (context: any) => {
            return context[0]?.label || ''
          },
          label: (context: any) => {
            const value = context.raw
            const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0
            const formatted = options.yAxis?.format === 'percentage' 
              ? formatPercentage(value / 100)
              : formatNumber(value)
            return `${context.label}: ${formatted} (${percentage.toFixed(1)}%)`
          }
        }
      }
    },
    cutout: config.type === 'doughnut' ? '50%' : '0%',
    elements: {
      arc: {
        borderAlign: 'center' as const
      }
    }
  }), [chartConfig, options, data, totalValue, config.type])

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height: chartConfig.height }}>
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-500">Loading chart...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 rounded-lg border border-red-200 ${className}`} style={{ height: chartConfig.height }}>
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-red-600 font-medium">Failed to load chart</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height: chartConfig.height }}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      {(options.title || options.subtitle) && (
        <div className="p-4 border-b border-gray-200">
          {options.title && (
            <h3 className="text-lg font-semibold text-gray-900">{options.title}</h3>
          )}
          {options.subtitle && (
            <p className="text-sm text-gray-500 mt-1">{options.subtitle}</p>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="p-4">
        <div style={{ height: chartConfig.height }}>
          <Pie 
            data={chartData} 
            options={chartOptions}
            aria-label={`Pie chart showing distribution of ${data.map(d => d.label).join(', ')}`}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 pb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {formatNumber(totalValue)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">Data points</span>
            <span className="text-sm text-gray-700">{data.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}