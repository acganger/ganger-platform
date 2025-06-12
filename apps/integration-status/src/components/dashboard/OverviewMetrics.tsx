'use client'

import type { DashboardOverview } from '@/types'

interface OverviewMetricsProps {
  overview: DashboardOverview
  isRefreshing?: boolean
  onRefresh?: () => void
}

export function OverviewMetrics({ 
  overview, 
  isRefreshing = false, 
  onRefresh 
}: OverviewMetricsProps) {
  const metrics = [
    {
      title: 'Total Integrations',
      value: overview.total_integrations,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H3a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
        </svg>
      )
    },
    {
      title: 'Healthy',
      value: overview.healthy_count,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    {
      title: 'Warning',
      value: overview.warning_count,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Critical',
      value: overview.critical_count,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  const aggregateMetrics = [
    {
      title: 'Overall Uptime',
      value: `${overview.overall_uptime.toFixed(1)}%`,
      subtitle: '30-day average',
      color: overview.overall_uptime >= 99 ? 'text-green-600' : overview.overall_uptime >= 95 ? 'text-yellow-600' : 'text-red-600'
    },
    {
      title: 'Avg Response Time',
      value: `${overview.avg_response_time}ms`,
      subtitle: 'Across all services',
      color: overview.avg_response_time <= 500 ? 'text-green-600' : overview.avg_response_time <= 1000 ? 'text-yellow-600' : 'text-red-600'
    },
    {
      title: 'Incidents (24h)',
      value: overview.total_incidents_24h,
      subtitle: 'Last 24 hours',
      color: overview.total_incidents_24h === 0 ? 'text-green-600' : overview.total_incidents_24h <= 2 ? 'text-yellow-600' : 'text-red-600'
    },
    {
      title: 'Active Alerts',
      value: overview.active_alerts,
      subtitle: 'Requiring attention',
      color: overview.active_alerts === 0 ? 'text-green-600' : overview.active_alerts <= 3 ? 'text-yellow-600' : 'text-red-600'
    }
  ]

  return (
    <div className="mb-8">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          System Overview
        </h2>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`
              flex items-center px-3 py-2 text-sm font-medium rounded-md border
              ${isRefreshing 
                ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              } transition-colors
            `}
          >
            <svg 
              className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className={`${metric.bgColor} ${metric.color} p-2 rounded-lg mr-3`}>
                {metric.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {metric.value}
                </p>
                <p className="text-sm text-gray-500">
                  {metric.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Aggregate metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {aggregateMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-center">
              <p className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {metric.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metric.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}