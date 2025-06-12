'use client'

import type { Integration, IntegrationFilters } from '@/types'
import { LoadingGrid } from '@/components/ui/LoadingState'
import { IntegrationCard } from '@/components/cards/IntegrationCard'

interface IntegrationGridProps {
  integrations: Integration[]
  onIntegrationClick: (integration: Integration) => void
  onTestConnection: (integrationId: string) => void
  isRefreshing?: boolean
  filters?: IntegrationFilters
  emptyState?: {
    title: string
    message: string
    action?: {
      label: string
      onClick: () => void
    }
  }
}

export function IntegrationGrid({ 
  integrations, 
  onIntegrationClick, 
  onTestConnection,
  isRefreshing = false,
  filters,
  emptyState 
}: IntegrationGridProps) {
  // Filter integrations based on filters
  const filteredIntegrations = integrations.filter(integration => {
    // Search filter
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase()
      const matchesSearch = 
        integration.name.toLowerCase().includes(searchTerm) ||
        integration.display_name.toLowerCase().includes(searchTerm) ||
        integration.description.toLowerCase().includes(searchTerm) ||
        integration.service_type.toLowerCase().includes(searchTerm)
      
      if (!matchesSearch) return false
    }

    // Status filter
    if (filters?.status?.length && !filters.status.includes(integration.health_status)) {
      return false
    }

    // Service type filter
    if (filters?.service_type?.length && !filters.service_type.includes(integration.service_type)) {
      return false
    }

    // Environment filter
    if (filters?.environment?.length && !filters.environment.includes(integration.environment)) {
      return false
    }

    // Has incidents filter
    if (filters?.has_incidents) {
      // This would require incident data - placeholder for now
      // In real implementation, you'd check if integration has recent incidents
    }

    // Has maintenance filter
    if (filters?.has_maintenance) {
      // This would require maintenance window data - placeholder for now
      // In real implementation, you'd check if integration is in maintenance
    }

    return true
  })

  // Loading state
  if (isRefreshing && integrations.length === 0) {
    return <LoadingGrid count={6} columns={3} />
  }

  // Empty state
  if (filteredIntegrations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14-7H3a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {emptyState?.title || 'No integrations found'}
        </h3>
        
        <p className="text-gray-500 mb-4">
          {emptyState?.message || 'No integrations have been configured yet.'}
        </p>

        {emptyState?.action && (
          <button
            onClick={emptyState.action.onClick}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            {emptyState.action.label}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredIntegrations.map(integration => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          onClick={() => onIntegrationClick(integration)}
          onTestConnection={() => onTestConnection(integration.id)}
          showActions={true}
          compact={false}
        />
      ))}
    </div>
  )
}