export interface ChartDataPoint {
  label: string
  value: number
  timestamp?: string
  color?: string
  metadata?: Record<string, any>
}

export interface ChartSeries {
  name: string
  data: ChartDataPoint[]
  color?: string
  strokeWidth?: number
  fill?: boolean
}

export interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'pie' | 'doughnut'
  width?: number
  height?: number
  responsive?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  showGrid?: boolean
  animate?: boolean
  colors?: string[]
  theme?: 'light' | 'dark'
}

export interface ChartOptions {
  title?: string
  subtitle?: string
  xAxis?: {
    title?: string
    type?: 'category' | 'datetime' | 'numeric'
    format?: string
  }
  yAxis?: {
    title?: string
    min?: number
    max?: number
    format?: string
  }
  tooltip?: {
    enabled?: boolean
    format?: string
    shared?: boolean
  }
  legend?: {
    position?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
  }
  zoom?: {
    enabled?: boolean
    type?: 'x' | 'y' | 'xy'
  }
}

export interface PerformanceMetric {
  timestamp: string
  responseTime: number
  throughput: number
  errorRate: number
  cpuUsage?: number
  memoryUsage?: number
  availability: number
}

export interface UptimeData {
  timestamp: string
  status: 'up' | 'down' | 'degraded' | 'maintenance'
  responseTime?: number
  errorCount?: number
}

export interface ErrorRateData {
  timestamp: string
  totalRequests: number
  errorCount: number
  errorRate: number
  errorTypes: Record<string, number>
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable'
  changePercentage: number
  confidence: number
  timeframe: string
}