'use client'

import React, { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import type { ChartSeries, ChartConfig, ChartOptions } from './types'
import { CHART_COLORS, formatNumber, formatTimestamp } from './chartUtils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface LineChartProps {
  series: ChartSeries[]
  config?: Partial<ChartConfig>
  options?: ChartOptions
  className?: string
  loading?: boolean
  error?: string
}

export default function LineChart({
  series,
  config = {},
  options = {},
  className = '',
  loading = false,
  error
}: LineChartProps) {
  const chartConfig: ChartConfig = useMemo(() => ({
    type: 'line',
    height: 300,
    responsive: true,
    showLegend: true,
    showTooltip: true,
    showGrid: true,
    animate: true,
    colors: [
      CHART_COLORS.primary,
      CHART_COLORS.success,
      CHART_COLORS.warning,
      CHART_COLORS.danger,
      CHART_COLORS.info
    ],
    theme: 'light',
    ...config
  }), [config])

  const chartData = useMemo(() => {
    if (!series.length) return { labels: [], datasets: [] }

    // Extract labels from the first series (assuming all series have same x-axis)
    const labels = series[0]?.data.map(point => 
      point.timestamp ? formatTimestamp(point.timestamp, 'time') : point.label
    ) || []

    // Optimize for large datasets - reduce point visibility
    const dataPointCount = labels.length
    const pointRadius = dataPointCount > 100 ? 0 : dataPointCount > 50 ? 1 : 3
    const pointHoverRadius = pointRadius + 2

    const datasets = series.map((s, index) => {
      const color = s.color || chartConfig.colors?.[index % chartConfig.colors.length] || CHART_COLORS.primary
      
      return {
        label: s.name,
        data: s.data.map(point => point.value),
        borderColor: color,
        backgroundColor: s.fill ? `${color}20` : 'transparent',
        borderWidth: s.strokeWidth || 2,
        fill: s.fill || false,
        tension: 0.3,
        pointRadius,
        pointHoverRadius,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        // Performance optimizations for large datasets
        spanGaps: true
      }
    })

    return { labels, datasets }
  }, [series, chartConfig.colors])

  const chartOptions = useMemo(() => ({
    responsive: chartConfig.responsive,
    maintainAspectRatio: false,
    animation: {
      duration: chartConfig.animate ? (series[0]?.data.length > 100 ? 500 : 1000) : 0
    },
    // Performance optimizations
    datasets: {
      line: {
        pointHoverRadius: 6,
        pointHitRadius: 10
      }
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
        position: (options.legend?.position || 'top'),
        align: (options.legend?.align || 'center'),
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        enabled: chartConfig.showTooltip && options.tooltip?.enabled !== false,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          title: (context: any) => {
            const dataIndex = context[0]?.dataIndex
            if (dataIndex !== undefined && series[0]?.data[dataIndex]?.timestamp) {
              return formatTimestamp(series[0].data[dataIndex].timestamp, 'datetime')
            }
            return context[0]?.label || ''
          },
          label: (context: any) => {
            const value = context.raw
            const formatted = options.yAxis?.format === 'percentage' 
              ? `${value.toFixed(1)}%`
              : options.yAxis?.format === 'time'
              ? `${value.toFixed(0)}ms`
              : formatNumber(value)
            return `${context.dataset.label}: ${formatted}`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: !!options.xAxis?.title,
          text: options.xAxis?.title,
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        grid: {
          display: chartConfig.showGrid,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          maxTicksLimit: 8,
          font: {
            size: 10
          }
        }
      },
      y: {
        display: true,
        title: {
          display: !!options.yAxis?.title,
          text: options.yAxis?.title,
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        min: options.yAxis?.min,
        max: options.yAxis?.max,
        grid: {
          display: chartConfig.showGrid,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value: any) {
            if (options.yAxis?.format === 'percentage') {
              return `${value}%`
            }
            if (options.yAxis?.format === 'time') {
              return `${value}ms`
            }
            return formatNumber(value)
          },
          font: {
            size: 10
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    elements: {
      point: {
        hoverRadius: 8
      }
    }
  }), [chartConfig, options, series])

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

  if (!series.length || !chartData.labels.length) {
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
    <div className={`relative ${className}`} style={{ height: chartConfig.height }}>
      <Line 
        data={chartData} 
        options={chartOptions}
        aria-label={`Line chart showing ${series.map(s => s.name).join(', ')} over time`}
        role="img"
      />
      {/* Screen reader accessible data summary */}
      <div className="sr-only">
        Chart data summary: {series.length} data series with {chartData.labels.length} time points. 
        {series.map(s => `${s.name}: ${s.data.length} data points`).join('. ')}
      </div>
    </div>
  )
}