import type { ChartDataPoint, ChartSeries, PerformanceMetric, UptimeData, ErrorRateData, TrendAnalysis } from './types'

// Color palette for charts
export const CHART_COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  secondary: '#6B7280',
  light: '#F3F4F6',
  dark: '#1F2937'
}

export const STATUS_COLORS = {
  healthy: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
  unknown: '#6B7280',
  maintenance: '#3B82F6',
  info: '#06B6D4'
}

// Format numbers for display
export function formatNumber(value: number, decimals = 2): string {
  if (!isFinite(value) || isNaN(value)) return '0'
  
  const absValue = Math.abs(value)
  if (absValue >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)}M`
  }
  if (absValue >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`
  }
  return value.toFixed(decimals)
}

// Format percentages
export function formatPercentage(value: number, decimals = 1): string {
  if (!isFinite(value) || isNaN(value)) return '0.0%'
  
  const percentage = Math.max(0, Math.min(100, value * 100))
  return `${percentage.toFixed(decimals)}%`
}

// Format response times
export function formatResponseTime(ms: number): string {
  if (!isFinite(ms) || isNaN(ms) || ms < 0) return '0ms'
  
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`
  }
  return `${Math.round(ms)}ms`
}

// Format timestamps for chart labels
export function formatTimestamp(timestamp: string, format: 'time' | 'date' | 'datetime' = 'time'): string {
  const date = new Date(timestamp)
  
  switch (format) {
    case 'time':
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    case 'date':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    case 'datetime':
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    default:
      return timestamp
  }
}

// Generate time series data points
export function generateTimeSeriesLabels(
  startTime: Date, 
  endTime: Date, 
  intervalMinutes: number
): string[] {
  const labels: string[] = []
  const current = new Date(startTime)
  
  while (current <= endTime) {
    labels.push(current.toISOString())
    current.setMinutes(current.getMinutes() + intervalMinutes)
  }
  
  return labels
}

// Calculate uptime percentage
export function calculateUptime(uptimeData: UptimeData[]): number {
  if (!uptimeData || uptimeData.length === 0) return 0
  
  const upCount = uptimeData.filter(d => d?.status === 'up').length
  return Math.min(Math.max(upCount / uptimeData.length, 0), 1)
}

// Calculate average response time
export function calculateAverageResponseTime(data: PerformanceMetric[]): number {
  if (!data || data.length === 0) return 0
  
  const validData = data.filter(metric => metric?.responseTime != null && metric.responseTime >= 0)
  if (validData.length === 0) return 0
  
  const sum = validData.reduce((acc, metric) => acc + metric.responseTime, 0)
  return sum / validData.length
}

// Calculate error rate
export function calculateErrorRate(data: ErrorRateData[]): number {
  if (!data || data.length === 0) return 0
  
  const validData = data.filter(d => d?.totalRequests != null && d?.errorCount != null)
  if (validData.length === 0) return 0
  
  const totalRequests = validData.reduce((acc, d) => acc + Math.max(0, d.totalRequests), 0)
  const totalErrors = validData.reduce((acc, d) => acc + Math.max(0, d.errorCount), 0)
  
  return totalRequests > 0 ? Math.min(totalErrors / totalRequests, 1) : 0
}

// Analyze performance trends
export function analyzeTrend(data: number[], timeframe: string): TrendAnalysis {
  if (!data || data.length < 2) {
    return {
      trend: 'stable',
      changePercentage: 0,
      confidence: 0,
      timeframe
    }
  }
  
  // Filter out invalid data points
  const validData = data.filter(val => val != null && !isNaN(val) && isFinite(val))
  if (validData.length < 2) {
    return {
      trend: 'stable',
      changePercentage: 0,
      confidence: 0,
      timeframe
    }
  }
  
  // Simple linear regression to determine trend
  const n = validData.length
  const sumX = (n * (n - 1)) / 2 // Sum of indices
  const sumY = validData.reduce((acc, val) => acc + val, 0)
  const sumXY = validData.reduce((acc, val, idx) => acc + (idx * val), 0)
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6 // Sum of squared indices
  
  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) {
    return {
      trend: 'stable',
      changePercentage: 0,
      confidence: 0,
      timeframe
    }
  }
  
  const slope = (n * sumXY - sumX * sumY) / denominator
  const avgY = sumY / n
  
  const changePercentage = avgY !== 0 ? Math.abs((slope * (n - 1)) / avgY) : Math.abs(slope)
  
  // Calculate R-squared for confidence
  const yMean = sumY / n
  const totalVariation = validData.reduce((acc, val) => acc + Math.pow(val - yMean, 2), 0)
  const explainedVariation = Math.pow(slope, 2) * sumXX
  const rSquared = totalVariation !== 0 ? Math.min(explainedVariation / totalVariation, 1) : 0
  
  let trend: 'increasing' | 'decreasing' | 'stable'
  if (changePercentage < 0.05) {
    trend = 'stable'
  } else if (slope > 0) {
    trend = 'increasing'
  } else {
    trend = 'decreasing'
  }
  
  return {
    trend,
    changePercentage: Math.min(changePercentage, 1),
    confidence: Math.max(0, Math.min(rSquared, 1)),
    timeframe
  }
}

// Convert performance metrics to chart data
export function metricsToChartData(metrics: PerformanceMetric[]): ChartSeries[] {
  if (!metrics || metrics.length === 0) return []
  
  const validMetrics = metrics.filter(m => 
    m && 
    m.timestamp && 
    m.responseTime != null && 
    m.errorRate != null && 
    m.throughput != null &&
    !isNaN(m.responseTime) &&
    !isNaN(m.errorRate) &&
    !isNaN(m.throughput)
  )
  
  if (validMetrics.length === 0) return []
  
  return [
    {
      name: 'Response Time',
      data: validMetrics.map(m => ({
        label: formatTimestamp(m.timestamp),
        value: Math.max(0, m.responseTime),
        timestamp: m.timestamp,
        color: CHART_COLORS.primary
      })),
      color: CHART_COLORS.primary
    },
    {
      name: 'Error Rate',
      data: validMetrics.map(m => ({
        label: formatTimestamp(m.timestamp),
        value: Math.max(0, Math.min(100, m.errorRate * 100)), // Convert to percentage and clamp
        timestamp: m.timestamp,
        color: CHART_COLORS.danger
      })),
      color: CHART_COLORS.danger
    },
    {
      name: 'Throughput',
      data: validMetrics.map(m => ({
        label: formatTimestamp(m.timestamp),
        value: Math.max(0, m.throughput),
        timestamp: m.timestamp,
        color: CHART_COLORS.success
      })),
      color: CHART_COLORS.success
    }
  ]
}

// Convert uptime data to chart format
export function uptimeToChartData(uptimeData: UptimeData[]): ChartDataPoint[] {
  return uptimeData.map(data => ({
    label: formatTimestamp(data.timestamp),
    value: data.status === 'up' ? 1 : 0,
    timestamp: data.timestamp,
    color: STATUS_COLORS[data.status === 'up' ? 'healthy' : 'critical'],
    metadata: {
      status: data.status,
      responseTime: data.responseTime,
      errorCount: data.errorCount
    }
  }))
}

// Generate mock performance data for development
export function generateMockPerformanceData(
  hours: number = 24,
  intervalMinutes: number = 15
): PerformanceMetric[] {
  const data: PerformanceMetric[] = []
  const now = new Date()
  const startTime = new Date(now.getTime() - (hours * 60 * 60 * 1000))
  
  const labels = generateTimeSeriesLabels(startTime, now, intervalMinutes)
  
  labels.forEach((timestamp, index) => {
    // Add some realistic variation
    const baseResponseTime = 150
    const responseTime = baseResponseTime + (Math.random() * 100) + (Math.sin(index * 0.1) * 50)
    
    const baseErrorRate = 0.02
    const errorRate = Math.max(0, baseErrorRate + (Math.random() * 0.03) - 0.015)
    
    const baseThroughput = 1000
    const throughput = baseThroughput + (Math.random() * 500) - 250
    
    data.push({
      timestamp,
      responseTime: Math.max(50, responseTime),
      throughput: Math.max(0, throughput),
      errorRate: Math.min(1, errorRate),
      availability: Math.random() > 0.05 ? 1 : 0 // 95% uptime
    })
  })
  
  return data
}

// Generate mock uptime data
export function generateMockUptimeData(days: number = 7): UptimeData[] {
  const data: UptimeData[] = []
  const now = new Date()
  const startTime = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
  
  const labels = generateTimeSeriesLabels(startTime, now, 60) // Hourly data
  
  labels.forEach(timestamp => {
    const random = Math.random()
    let status: 'up' | 'down' | 'degraded' | 'maintenance'
    
    if (random > 0.95) {
      status = 'down'
    } else if (random > 0.90) {
      status = 'degraded'
    } else if (random > 0.98) {
      status = 'maintenance'
    } else {
      status = 'up'
    }
    
    data.push({
      timestamp,
      status,
      responseTime: status === 'up' ? 100 + (Math.random() * 200) : undefined,
      errorCount: status === 'down' ? Math.floor(Math.random() * 10) : 0
    })
  })
  
  return data
}

// Smooth data using moving average
export function smoothData(data: number[], windowSize: number = 3): number[] {
  if (data.length <= windowSize) return data
  
  const smoothed: number[] = []
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2))
    const slice = data.slice(start, end)
    const average = slice.reduce((acc, val) => acc + val, 0) / slice.length
    smoothed.push(average)
  }
  
  return smoothed
}