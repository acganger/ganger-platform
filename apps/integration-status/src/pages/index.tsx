'use client'

import { useState, useEffect, useCallback } from 'react'
import { ErrorBoundary } from '@/components/errors/ErrorBoundary'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { OverviewMetrics } from '@/components/dashboard/OverviewMetrics'
import { CriticalAlertsBanner } from '@/components/dashboard/CriticalAlertsBanner'
import { IntegrationGrid } from '@/components/dashboard/IntegrationGrid'
import { FilterControls } from '@/components/dashboard/FilterControls'
import { IntegrationDetailModal } from '@/components/modals/IntegrationDetailModal'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAuth } from '@/lib/auth'
import { useIntegrationStatusUpdates } from '@/hooks/useIntegrationStatusUpdates'
import { useToast } from '@/hooks/useToast'
import { integrationApi, metricsApi, alertApi } from '@/lib/api-client'
import type { 
  Integration, 
  DashboardOverview, 
  IntegrationFilters, 
  AlertRule 
} from '@/types'

export default function IntegrationStatusDashboard() {
  // Authentication
  const { user, isLoading: authLoading, isAuthenticated, login } = useAuth()

  // State management
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [criticalAlerts, setCriticalAlerts] = useState<AlertRule[]>([])
  const [filters, setFilters] = useState<IntegrationFilters>({
    status: undefined,
    service_type: undefined,
    environment: undefined,
    search: '',
    tags: undefined,
    has_incidents: false,
    has_maintenance: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Custom hooks
  const { 
    isConnected, 
    connectionQuality,
    lastUpdate
  } = useIntegrationStatusUpdates({
    onIntegrationUpdate: (update) => {
      setIntegrations(prev => prev.map(integration => 
        integration.id === update.integration_id
          ? { ...integration, ...update }
          : integration
      ))
    },
    onNewAlert: (alert) => {
      if (alert.severity === 'critical') {
        setCriticalAlerts(prev => [alert, ...prev])
      }
    },
    onAlertResolved: (alertId) => {
      setCriticalAlerts(prev => prev.filter(alert => alert.id !== alertId))
    }
  })

  const { toast } = useToast()

  // Load initial data
  const loadDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)

      // Load data in parallel
      const [
        integrationsResponse,
        overviewResponse,
        alertsResponse
      ] = await Promise.all([
        integrationApi.getIntegrations(filters),
        metricsApi.getDashboardOverview(),
        alertApi.getCriticalAlerts()
      ])

      if (integrationsResponse.success) {
        setIntegrations(integrationsResponse.data || [])
      }

      if (overviewResponse.success) {
        setOverview(overviewResponse.data || null)
      }

      if (alertsResponse.success) {
        setCriticalAlerts(alertsResponse.data || [])
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(errorMessage)
      toast({
        type: 'error',
        title: 'Load Error',
        message: errorMessage
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [filters, toast])

  // Initial load
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && isConnected) {
        loadDashboardData(false)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [loadDashboardData, isLoading, isConnected])

  // Event handlers
  const handleRefresh = () => {
    loadDashboardData(false)
  }

  const handleFilterChange = (newFilters: IntegrationFilters) => {
    setFilters(newFilters)
  }

  const handleIntegrationClick = (integration: Integration) => {
    setSelectedIntegration(integration)
  }

  const handleCloseModal = () => {
    setSelectedIntegration(null)
  }

  const handleDismissAlert = (alertId: string) => {
    setCriticalAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await alertApi.acknowledgeAlert(alertId)
      if (response.success) {
        setCriticalAlerts(prev => prev.filter(alert => alert.id !== alertId))
        toast({
          type: 'success',
          title: 'Alert Acknowledged',
          message: 'The alert has been acknowledged successfully.'
        })
      }
    } catch (err) {
      toast({
        type: 'error',
        title: 'Acknowledge Failed',
        message: 'Failed to acknowledge the alert. Please try again.'
      })
    }
  }

  const handleTestConnection = async (integrationId: string) => {
    try {
      const response = await integrationApi.testConnection(integrationId)
      if (response.success) {
        toast({
          type: 'success',
          title: 'Test Successful',
          message: 'Connection test completed successfully.'
        })
        // Refresh the specific integration
        loadDashboardData(false)
      } else {
        toast({
          type: 'error',
          title: 'Test Failed',
          message: response.error?.message || 'Connection test failed.'
        })
      }
    } catch (err) {
      toast({
        type: 'error',
        title: 'Test Error',
        message: 'Failed to test connection. Please try again.'
      })
    }
  }

  // Authentication loading
  if (authLoading) {
    return (
      <DashboardLayout>
        <LoadingState 
          message="Authenticating..."
          showProgress={true}
        />
      </DashboardLayout>
    )
  }

  // Authentication required
  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="text-blue-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign in to access the Integration Status Dashboard.
            </p>
            <button
              onClick={login}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign in with Google Workspace
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Restricted to @gangerdermatology.com accounts
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Data loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState 
          message="Loading integration status dashboard..."
          showProgress={true}
        />
      </DashboardLayout>
    )
  }

  // Error state
  if (error && !integrations.length) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to Load Dashboard
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <button
              onClick={() => loadDashboardData()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="container-responsive py-6">
          {/* Header */}
          <DashboardHeader
            title="Third-Party Integration Status"
            subtitle="Monitor health and performance of all external service integrations"
            lastUpdate={lastUpdate}
            connectionStatus={{
              isConnected,
              quality: connectionQuality
            }}
          />

          {/* Critical Alerts Banner */}
          {criticalAlerts.length > 0 && (
            <CriticalAlertsBanner
              alerts={criticalAlerts}
              onDismiss={handleDismissAlert}
              onAcknowledge={handleAcknowledgeAlert}
              onViewDetails={handleIntegrationClick}
            />
          )}

          {/* Overview Metrics */}
          {overview && (
            <OverviewMetrics
              overview={overview}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          )}

          {/* Filter Controls */}
          <FilterControls
            filters={filters}
            onChange={handleFilterChange}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            resultCount={integrations.length}
          />

          {/* Integration Grid */}
          <IntegrationGrid
            integrations={integrations}
            onIntegrationClick={handleIntegrationClick}
            onTestConnection={handleTestConnection}
            isRefreshing={isRefreshing}
            filters={filters}
            emptyState={{
              title: 'No Integrations Found',
              message: filters.search || filters.status?.length 
                ? 'No integrations match your current filters.'
                : 'No integrations have been configured yet.',
              action: filters.search || filters.status?.length
                ? {
                    label: 'Clear Filters',
                    onClick: () => setFilters({ search: '' })
                  }
                : undefined
            }}
          />

          {/* Integration Detail Modal */}
          {selectedIntegration && (
            <IntegrationDetailModal
              integration={selectedIntegration}
              onClose={handleCloseModal}
              onTestConnection={handleTestConnection}
              onAcknowledgeAlert={handleAcknowledgeAlert}
            />
          )}
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  )
}