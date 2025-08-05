'use client'

import { useState, useEffect } from 'react'
import type { IntegrationDetailModalProps } from '@/types'

export function IntegrationDetailModal({ 
  integration, 
  onClose,
  onTestConnection,
  initialTab = 'overview'
}: IntegrationDetailModalProps & {
  onTestConnection?: (integrationId: string) => void
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 150) // Wait for animation
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'metrics', label: 'Metrics', icon: '📈' },
    { id: 'incidents', label: 'Incidents', icon: '🚨' },
    { id: 'config', label: 'Configuration', icon: '⚙️' }
  ]

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-150 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden transition-transform duration-150 ${isVisible ? 'scale-100' : 'scale-95'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {integration.icon_url ? (
              <img 
                src={integration.icon_url} 
                alt={integration.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                🔗
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {integration.display_name}
              </h2>
              <p className="text-gray-500">{integration.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Status badge */}
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              integration.health_status === 'healthy' ? 'bg-green-100 text-green-800' :
              integration.health_status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              integration.health_status === 'critical' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {integration.health_status}
            </div>
            
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Service Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service Type</label>
                    <p className="mt-1 capitalize">{integration.service_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base URL</label>
                    <p className="mt-1 font-mono text-sm">{integration.base_url}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Authentication</label>
                    <p className="mt-1 uppercase">{integration.auth_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Environment</label>
                    <p className="mt-1 capitalize">{integration.environment}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Status</h3>
                <div className="text-center">
                  <div className="text-3xl mb-2">
                    {integration.health_status === 'healthy' ? '✅' :
                     integration.health_status === 'warning' ? '⚠️' :
                     integration.health_status === 'critical' ? '🚨' : '❓'}
                  </div>
                  <p className="text-lg font-medium capitalize">{integration.health_status}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Last checked: {new Date(integration.last_health_check).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Metrics Dashboard
              </h3>
              <p className="text-gray-500">
                Performance metrics and analytics will be displayed here.
              </p>
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🚨</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Incident History
              </h3>
              <p className="text-gray-500">
                Recent incidents and their resolution status will be shown here.
              </p>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Configuration Settings
              </h3>
              <p className="text-gray-500">
                Integration configuration and alert settings will be available here.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            Integration ID: {integration.id}
          </div>
          
          <div className="flex items-center space-x-3">
            {onTestConnection && (
              <button
                onClick={() => onTestConnection(integration.id)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Test Connection
              </button>
            )}
            
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-sm font-medium rounded-md text-white hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}