'use client'

import { useState } from 'react'
import type { IntegrationFilters, HealthStatus, ServiceType, Environment } from '@/types'

interface FilterControlsProps {
  filters: IntegrationFilters
  onChange: (filters: IntegrationFilters) => void
  isRefreshing?: boolean
  onRefresh?: () => void
  resultCount?: number
}

export function FilterControls({ 
  filters, 
  onChange, 
  isRefreshing = false, 
  onRefresh,
  resultCount = 0 
}: FilterControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const statusOptions: { value: HealthStatus; label: string; color: string }[] = [
    { value: 'healthy', label: 'Healthy', color: 'text-green-600' },
    { value: 'warning', label: 'Warning', color: 'text-yellow-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' },
    { value: 'unknown', label: 'Unknown', color: 'text-gray-600' },
    { value: 'maintenance', label: 'Maintenance', color: 'text-purple-600' }
  ]

  const serviceTypeOptions: { value: ServiceType; label: string }[] = [
    { value: 'api', label: 'API' },
    { value: 'database', label: 'Database' },
    { value: 'storage', label: 'Storage' },
    { value: 'payment', label: 'Payment' },
    { value: 'communication', label: 'Communication' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'other', label: 'Other' }
  ]

  const environmentOptions: { value: Environment; label: string }[] = [
    { value: 'production', label: 'Production' },
    { value: 'staging', label: 'Staging' },
    { value: 'development', label: 'Development' }
  ]

  const handleSearchChange = (search: string) => {
    onChange({ ...filters, search })
  }

  const handleStatusFilter = (status: HealthStatus) => {
    const currentStatuses = filters.status || []
    const isSelected = currentStatuses.includes(status)
    
    const newStatuses = isSelected
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status]
    
    onChange({ ...filters, status: newStatuses.length > 0 ? newStatuses : undefined })
  }

  const handleServiceTypeFilter = (serviceType: ServiceType) => {
    const currentTypes = filters.service_type || []
    const isSelected = currentTypes.includes(serviceType)
    
    const newTypes = isSelected
      ? currentTypes.filter(t => t !== serviceType)
      : [...currentTypes, serviceType]
    
    onChange({ ...filters, service_type: newTypes.length > 0 ? newTypes : undefined })
  }

  const handleEnvironmentFilter = (environment: Environment) => {
    const currentEnvs = filters.environment || []
    const isSelected = currentEnvs.includes(environment)
    
    const newEnvs = isSelected
      ? currentEnvs.filter(e => e !== environment)
      : [...currentEnvs, environment]
    
    onChange({ ...filters, environment: newEnvs.length > 0 ? newEnvs : undefined })
  }

  const clearAllFilters = () => {
    onChange({ search: '' })
  }

  const hasActiveFilters = Boolean(
    filters.search || 
    filters.status?.length || 
    filters.service_type?.length || 
    filters.environment?.length ||
    filters.has_incidents ||
    filters.has_maintenance
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex flex-col space-y-4">
        {/* Top row: Search and main controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search input */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search integrations..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            {/* Result count */}
            <span className="text-sm text-gray-500">
              {resultCount} integration{resultCount !== 1 ? 's' : ''}
            </span>

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {[
                    filters.status?.length,
                    filters.service_type?.length,
                    filters.environment?.length,
                    filters.search ? 1 : 0,
                    filters.has_incidents ? 1 : 0,
                    filters.has_maintenance ? 1 : 0
                  ].filter(Boolean).reduce((a, b) => (a || 0) + (b || 0), 0)}
                </span>
              )}
            </button>

            {/* Refresh button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className={`
                  inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-colors
                  ${isRefreshing 
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
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
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(status => (
            <button
              key={status.value}
              onClick={() => handleStatusFilter(status.value)}
              className={`
                inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${filters.status?.includes(status.value)
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }
              `}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${status.color.replace('text-', 'bg-')}`} />
              {status.label}
            </button>
          ))}
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            {/* Service Type filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type
              </label>
              <div className="flex flex-wrap gap-2">
                {serviceTypeOptions.map(type => (
                  <button
                    key={type.value}
                    onClick={() => handleServiceTypeFilter(type.value)}
                    className={`
                      inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                      ${filters.service_type?.includes(type.value)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }
                    `}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Environment filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment
              </label>
              <div className="flex flex-wrap gap-2">
                {environmentOptions.map(env => (
                  <button
                    key={env.value}
                    onClick={() => handleEnvironmentFilter(env.value)}
                    className={`
                      inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                      ${filters.environment?.includes(env.value)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }
                    `}
                  >
                    {env.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional filters */}
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={filters.has_incidents || false}
                  onChange={(e) => onChange({ ...filters, has_incidents: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Has incidents</span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={filters.has_maintenance || false}
                  onChange={(e) => onChange({ ...filters, has_maintenance: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">In maintenance</span>
              </label>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}