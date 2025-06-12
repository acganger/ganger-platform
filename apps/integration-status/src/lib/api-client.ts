'use client'

import type { 
  Integration, 
  ServiceMetrics, 
  IncidentReport, 
  AlertRule, 
  DashboardOverview,
  IntegrationFilters,
  APIResponse,
  RequestConfig,
  IntegrationChange
} from '@/types'

// API Client Configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
  }
}

// Error Types
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

// Request utilities
async function makeRequest<T>(config: RequestConfig): Promise<APIResponse<T>> {
  const { method, url, params, data, headers = {}, timeout = API_CONFIG.timeout } = config
  
  // Build URL with query parameters
  const fullURL = new URL(url, API_CONFIG.baseURL)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => fullURL.searchParams.append(key, String(v)))
        } else {
          fullURL.searchParams.append(key, String(value))
        }
      }
    })
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: {
      ...API_CONFIG.headers,
      ...headers,
    },
    // signal: AbortSignal.timeout(timeout), // Not supported in all environments
  }

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(fullURL.toString(), requestOptions)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new APIError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData.code,
        errorData.details
      )
    }

    const result = await response.json()
    return result
  } catch (error: unknown) {
    const err = error as Error
    if (err.name === 'AbortError') {
      throw new TimeoutError(`Request timed out after ${timeout}ms`)
    }
    if (error instanceof APIError) {
      throw error
    }
    if (error instanceof TypeError && err.message.includes('fetch')) {
      throw new NetworkError('Network connection failed')
    }
    throw new APIError('Request failed', undefined, 'UNKNOWN_ERROR', error)
  }
}

// Retry logic for failed requests
async function makeRequestWithRetry<T>(config: RequestConfig): Promise<APIResponse<T>> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= API_CONFIG.retryAttempts; attempt++) {
    try {
      return await makeRequest<T>(config)
    } catch (error) {
      lastError = error as Error
      
      // Don't retry for certain error types
      if (error instanceof APIError && error.status && error.status >= 400 && error.status < 500) {
        throw error
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < API_CONFIG.retryAttempts) {
        const delay = API_CONFIG.retryDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError!
}

// Integration API
export const integrationApi = {
  // Get all integrations
  async getIntegrations(filters?: IntegrationFilters): Promise<APIResponse<Integration[]>> {
    return makeRequestWithRetry({
      method: 'GET',
      url: '/integrations',
      params: filters
    })
  },

  // Get single integration
  async getIntegration(integrationId: string): Promise<APIResponse<Integration>> {
    return makeRequestWithRetry({
      method: 'GET',
      url: `/integrations/${integrationId}`
    })
  },

  // Test integration connection
  async testConnection(integrationId: string): Promise<APIResponse<any>> {
    return makeRequestWithRetry({
      method: 'POST',
      url: `/integrations/${integrationId}/test`,
      timeout: 30000 // Longer timeout for connection tests
    })
  },

  // Update integration configuration
  async updateIntegration(integrationId: string, data: Partial<Integration>): Promise<APIResponse<Integration>> {
    return makeRequestWithRetry({
      method: 'PUT',
      url: `/integrations/${integrationId}`,
      data
    })
  },

  // Delete integration
  async deleteIntegration(integrationId: string): Promise<APIResponse<void>> {
    return makeRequestWithRetry({
      method: 'DELETE',
      url: `/integrations/${integrationId}`
    })
  },

  // Create new integration
  async createIntegration(data: Omit<Integration, 'id' | 'created_at' | 'updated_at'>): Promise<APIResponse<Integration>> {
    return makeRequestWithRetry({
      method: 'POST',
      url: '/integrations',
      data
    })
  }
}

// Metrics API
export const metricsApi = {
  // Get integration metrics
  async getMetrics(
    integrationId: string, 
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h',
    detailed = false
  ): Promise<APIResponse<ServiceMetrics>> {
    return makeRequestWithRetry({
      method: 'GET',
      url: `/integrations/${integrationId}/metrics`,
      params: { range: timeRange, detailed }
    })
  },

  // Get aggregate metrics for dashboard
  async getDashboardOverview(): Promise<APIResponse<DashboardOverview>> {
    return makeRequestWithRetry({
      method: 'GET',
      url: '/dashboard/overview'
    })
  },

  // Get historical metrics
  async getHistoricalMetrics(
    integrationId: string,
    startDate: string,
    endDate: string
  ): Promise<APIResponse<ServiceMetrics[]>> {
    return makeRequestWithRetry({
      method: 'GET',
      url: `/integrations/${integrationId}/metrics/history`,
      params: { start_date: startDate, end_date: endDate }
    })
  }
}

// Incident API
export const incidentApi = {
  // Get incidents for integration
  async getIncidents(
    integrationId?: string,
    limit = 25,
    offset = 0
  ): Promise<APIResponse<IncidentReport[]>> {
    const url = integrationId 
      ? `/integrations/${integrationId}/incidents`
      : '/incidents'
    
    return makeRequestWithRetry({
      method: 'GET',
      url,
      params: { limit, offset }
    })
  },

  // Get single incident
  async getIncident(incidentId: string): Promise<APIResponse<IncidentReport>> {
    return makeRequestWithRetry({
      method: 'GET',
      url: `/incidents/${incidentId}`
    })
  },

  // Create incident
  async createIncident(data: Omit<IncidentReport, 'id' | 'created_at' | 'updated_at'>): Promise<APIResponse<IncidentReport>> {
    return makeRequestWithRetry({
      method: 'POST',
      url: '/incidents',
      data
    })
  },

  // Update incident
  async updateIncident(incidentId: string, data: Partial<IncidentReport>): Promise<APIResponse<IncidentReport>> {
    return makeRequestWithRetry({
      method: 'PUT',
      url: `/incidents/${incidentId}`,
      data
    })
  },

  // Resolve incident
  async resolveIncident(incidentId: string, resolution: string): Promise<APIResponse<IncidentReport>> {
    return makeRequestWithRetry({
      method: 'POST',
      url: `/incidents/${incidentId}/resolve`,
      data: { resolution_notes: resolution }
    })
  }
}

// Alert API
export const alertApi = {
  // Get alerts
  async getAlerts(
    integrationId?: string,
    severity?: string,
    status?: string
  ): Promise<APIResponse<AlertRule[]>> {
    return makeRequestWithRetry({
      method: 'GET',
      url: '/alerts',
      params: { 
        integration_id: integrationId,
        severity,
        status
      }
    })
  },

  // Get critical alerts
  async getCriticalAlerts(): Promise<APIResponse<AlertRule[]>> {
    return makeRequestWithRetry({
      method: 'GET',
      url: '/alerts/critical'
    })
  },

  // Acknowledge alert
  async acknowledgeAlert(alertId: string): Promise<APIResponse<AlertRule>> {
    return makeRequestWithRetry({
      method: 'POST',
      url: `/alerts/${alertId}/acknowledge`
    })
  },

  // Resolve alert
  async resolveAlert(alertId: string): Promise<APIResponse<AlertRule>> {
    return makeRequestWithRetry({
      method: 'POST',
      url: `/alerts/${alertId}/resolve`
    })
  },

  // Create alert rule
  async createAlertRule(data: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>): Promise<APIResponse<AlertRule>> {
    return makeRequestWithRetry({
      method: 'POST',
      url: '/alert-rules',
      data
    })
  },

  // Update alert rule
  async updateAlertRule(ruleId: string, data: Partial<AlertRule>): Promise<APIResponse<AlertRule>> {
    return makeRequestWithRetry({
      method: 'PUT',
      url: `/alert-rules/${ruleId}`,
      data
    })
  },

  // Delete alert rule
  async deleteAlertRule(ruleId: string): Promise<APIResponse<void>> {
    return makeRequestWithRetry({
      method: 'DELETE',
      url: `/alert-rules/${ruleId}`
    })
  }
}

// Change History API
export const changeApi = {
  // Get integration change history
  async getChangeHistory(
    integrationId?: string,
    limit = 50,
    offset = 0
  ): Promise<APIResponse<IntegrationChange[]>> {
    const url = integrationId 
      ? `/integrations/${integrationId}/changes`
      : '/changes'
    
    return makeRequestWithRetry({
      method: 'GET',
      url,
      params: { limit, offset }
    })
  }
}

// Export combined API client
export const apiClient = {
  ...integrationApi,
  ...metricsApi,
  ...incidentApi,
  ...alertApi,
  ...changeApi,
  
  // Batch operations
  async batchTestConnections(integrationIds: string[]): Promise<Record<string, APIResponse<any>>> {
    const results: Record<string, APIResponse<any>> = {}
    
    // Test connections in parallel with concurrency limit
    const concurrency = 5
    for (let i = 0; i < integrationIds.length; i += concurrency) {
      const batch = integrationIds.slice(i, i + concurrency)
      const promises = batch.map(async (id) => {
        try {
          const result = await integrationApi.testConnection(id)
          return { id, result }
        } catch (error) {
          return { 
            id, 
            result: { 
              success: false, 
              error: { 
                code: 'TEST_FAILED', 
                message: error instanceof Error ? error.message : 'Unknown error' 
              } 
            } 
          }
        }
      })
      
      const batchResults = await Promise.all(promises)
      batchResults.forEach(({ id, result }) => {
        results[id] = result
      })
    }
    
    return results
  }
}

// Error handler for API responses
export function handleAPIError(error: unknown): string {
  if (error instanceof APIError) {
    return error.message
  }
  if (error instanceof NetworkError) {
    return 'Network connection failed. Please check your internet connection.'
  }
  if (error instanceof TimeoutError) {
    return 'Request timed out. Please try again.'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

// Type guards for API responses
export function isSuccessfulResponse<T>(response: APIResponse<T>): response is APIResponse<T> & { success: true; data: T } {
  return response.success && response.data !== undefined
}

export function isErrorResponse<T>(response: APIResponse<T>): response is APIResponse<T> & { success: false; error: NonNullable<APIResponse<T>['error']> } {
  return !response.success && response.error !== undefined
}