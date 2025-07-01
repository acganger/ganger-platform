'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@ganger/auth/client';
import toast from 'react-hot-toast';

interface AuditLogEntry {
  id: string;
  app_id?: string;
  user_id: string;
  action: string;
  description: string;
  before_value?: any;
  after_value?: any;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  users: {
    email: string;
    name?: string;
  };
  platform_applications?: {
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
    totalPages: number;
  };
}

export function AuditLogViewer() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    app_id: '',
    user_id: '',
    search: '',
    date_from: '',
    date_to: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      const result: ApiResponse<AuditLogEntry[]> = await response.json();

      if (result.success && result.data) {
        setLogs(result.data);
        setTotalPages(Math.ceil((result.meta?.total || 0) / (result.meta?.limit || 20)));
        setError(null);
      } else {
        setError(result.error?.message || 'Failed to fetch audit logs');
        toast.error(result.error?.message || 'Failed to fetch audit logs');
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

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CONFIGURATION_CREATED':
      case 'APPLICATION_CREATED':
      case 'PERMISSION_GRANTED':
        return 'bg-green-100 text-green-800';
      case 'CONFIGURATION_UPDATED':
      case 'APPLICATION_UPDATED':
      case 'PERMISSION_MODIFIED':
        return 'bg-blue-100 text-blue-800';
      case 'CONFIGURATION_DELETED':
      case 'APPLICATION_DELETED':
      case 'PERMISSION_REVOKED':
        return 'bg-red-100 text-red-800';
      case 'IMPERSONATION_STARTED':
      case 'IMPERSONATION_ENDED':
        return 'bg-orange-100 text-orange-800';
      case 'LOGIN':
      case 'LOGOUT':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatJsonValue = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 h-16 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
        <button
          onClick={fetchAuditLogs}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search logs..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="CONFIGURATION_CREATED">Config Created</option>
              <option value="CONFIGURATION_UPDATED">Config Updated</option>
              <option value="CONFIGURATION_DELETED">Config Deleted</option>
              <option value="PERMISSION_GRANTED">Permission Granted</option>
              <option value="PERMISSION_MODIFIED">Permission Modified</option>
              <option value="PERMISSION_REVOKED">Permission Revoked</option>
              <option value="IMPERSONATION_STARTED">Impersonation Started</option>
              <option value="IMPERSONATION_ENDED">Impersonation Ended</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              onClick={() => {
                setFilters({
                  action: '',
                  app_id: '',
                  user_id: '',
                  search: '',
                  date_from: '',
                  date_to: ''
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

      {/* Audit Logs Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Application
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(entry.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {entry.users.email}
                    </div>
                    {entry.users.name && (
                      <div className="text-sm text-gray-500">{entry.users.name}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(entry.action)}`}
                  >
                    {entry.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.platform_applications ? (
                    <div>
                      <div className="font-medium">{entry.platform_applications.display_name}</div>
                      <div className="text-gray-500">{entry.platform_applications.app_name}</div>
                    </div>
                  ) : (
                    <span className="text-gray-500">System</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {entry.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.ip_address || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setSelectedEntry(entry)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {logs.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-gray-500">No audit logs found</div>
        </div>
      )}

      {/* Audit Entry Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Audit Log Details</h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {new Date(selectedEntry.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedEntry.users.email}
                    {selectedEntry.users.name && ` (${selectedEntry.users.name})`}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action</label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(selectedEntry.action)}`}
                    >
                      {selectedEntry.action}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Application</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedEntry.platform_applications ? 
                      `${selectedEntry.platform_applications.display_name} (${selectedEntry.platform_applications.app_name})` : 
                      'System'
                    }
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">IP Address</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedEntry.ip_address || 'Unknown'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Agent</label>
                  <div className="mt-1 text-sm text-gray-900 break-all">
                    {selectedEntry.user_agent || 'Unknown'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <div className="mt-1 text-sm text-gray-900">
                  {selectedEntry.description}
                </div>
              </div>

              {selectedEntry.before_value && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Before Value</label>
                  <pre className="mt-1 text-xs bg-gray-100 p-3 rounded border overflow-x-auto">
                    {formatJsonValue(selectedEntry.before_value)}
                  </pre>
                </div>
              )}

              {selectedEntry.after_value && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">After Value</label>
                  <pre className="mt-1 text-xs bg-gray-100 p-3 rounded border overflow-x-auto">
                    {formatJsonValue(selectedEntry.after_value)}
                  </pre>
                </div>
              )}

              {selectedEntry.metadata && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Metadata</label>
                  <pre className="mt-1 text-xs bg-gray-100 p-3 rounded border overflow-x-auto">
                    {formatJsonValue(selectedEntry.metadata)}
                  </pre>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedEntry(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}