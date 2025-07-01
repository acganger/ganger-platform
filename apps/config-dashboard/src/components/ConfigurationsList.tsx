'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@ganger/auth/client';
import toast from 'react-hot-toast';

interface Configuration {
  id: string;
  app_id: string;
  config_key: string;
  config_section?: string;
  config_value: any;
  value_type: string;
  description?: string;
  is_sensitive: boolean;
  requires_restart: boolean;
  environment: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  platform_applications: {
    app_name: string;
    display_name: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export function ConfigurationsList() {
  const { user } = useAuth();
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    app_id: '',
    environment: 'production',
    approval_status: '',
    is_sensitive: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchConfigurations();
  }, [currentPage, filters]);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '15'
      });

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/configurations?${params}`);
      const result: ApiResponse<Configuration[]> = await response.json();

      if (result.success && result.data) {
        setConfigurations(result.data);
        setTotalPages(Math.ceil((result.meta?.total || 0) / (result.meta?.limit || 15)));
        setError(null);
      } else {
        setError(result.error?.message || 'Failed to fetch configurations');
        toast.error(result.error?.message || 'Failed to fetch configurations');
      }
    } catch (err) {
      setError('Network error occurred');
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const formatConfigValue = (value: any, valueType: string, isSensitive: boolean) => {
    if (isSensitive && typeof value === 'string' && value.includes('SENSITIVE')) {
      return '••••••••';
    }

    if (valueType === 'json' && typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 h-20 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Configuration Settings</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Add Configuration
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search configurations..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
            <select
              value={filters.environment}
              onChange={(e) => handleFilterChange('environment', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
            <select
              value={filters.approval_status}
              onChange={(e) => handleFilterChange('approval_status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sensitive</label>
            <select
              value={filters.is_sensitive}
              onChange={(e) => handleFilterChange('is_sensitive', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="true">Sensitive</option>
              <option value="false">Not Sensitive</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  search: '',
                  app_id: '',
                  environment: 'production',
                  approval_status: '',
                  is_sensitive: ''
                });
                setCurrentPage(1);
              }}
              className="w-full bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Configurations List */}
      <div className="space-y-4">
        {configurations.map((config) => (
          <div key={config.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{config.config_key}</h3>
                  <span className="text-sm text-gray-500">
                    {config.platform_applications.display_name}
                  </span>
                  {config.config_section && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {config.config_section}
                    </span>
                  )}
                </div>
                
                {config.description && (
                  <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                )}
              </div>

              <div className="flex space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    config.approval_status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : config.approval_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {config.approval_status}
                </span>
                
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {config.environment}
                </span>
                
                {config.is_sensitive && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                    Sensitive
                  </span>
                )}
                
                {config.requires_restart && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    Restart Required
                  </span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded p-3 mb-3">
              <div className="text-sm text-gray-700">
                <strong>Value ({config.value_type}):</strong>
                <pre className="mt-1 text-xs font-mono whitespace-pre-wrap">
                  {formatConfigValue(config.config_value, config.value_type, config.is_sensitive)}
                </pre>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500">
              <div>
                Updated: {new Date(config.updated_at).toLocaleString()}
              </div>
              <div className="space-x-2">
                <button className="text-blue-600 hover:text-blue-800">Edit</button>
                <button className="text-green-600 hover:text-green-800">History</button>
                <button className="text-red-600 hover:text-red-800">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {configurations.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-gray-500">No configurations found</div>
        </div>
      )}
    </div>
  );
}