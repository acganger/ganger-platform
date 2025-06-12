'use client'

import React, { useMemo } from 'react'
import LineChart from './LineChart'
import type { ChartSeries, ChartConfig, ChartOptions } from './types'

interface AreaChartProps {
  series: ChartSeries[]
  config?: Partial<ChartConfig>
  options?: ChartOptions
  className?: string
  loading?: boolean
  error?: string
}

export default function AreaChart({
  series,
  config = {},
  options = {},
  className = '',
  loading = false,
  error
}: AreaChartProps) {
  // Convert series to area chart format (filled)
  const areaSeries = useMemo(() => {
    return series.map(s => ({
      ...s,
      fill: true
    }))
  }, [series])

  const areaConfig: Partial<ChartConfig> = {
    ...config,
    type: 'area'
  }

  return (
    <LineChart
      series={areaSeries}
      config={areaConfig}
      options={options}
      className={className}
      loading={loading}
      error={error}
    />
  )
}