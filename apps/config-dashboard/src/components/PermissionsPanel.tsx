'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@ganger/auth';
import toast from 'react-hot-toast';

interface Permission {
  id: string;
  app_id: string;
  permission_type: 'role' | 'user';
  role_name?: string;
  user_id?: string;
  permission_level: 'read' | 'write' | 'admin';
  config_section?: string;
  specific_keys?: string[];
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  platform_applications: {
    app_name: string;
    display_name: string;
  };
  users?: {
    email: string;
    name?: string;
  };
  granted_by_user?: {
    email: string;
    name?: string;
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

export function PermissionsPanel() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    app_id: '',
    permission_type: '',
    permission_level: '',
    is_active: 'true'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPermissions();
  }, [currentPage, filters]);

  const fetchPermissions = async () => {
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

      const response = await fetch(`/api/permissions?${params}`);
      const result: ApiResponse<Permission[]> = await response.json();

      if (result.success && result.data) {
        setPermissions(result.data);
        setTotalPages(Math.ceil((result.meta?.total || 0) / (result.meta?.limit || 20)));
        setError(null);
      } else {
        setError(result.error?.message || 'Failed to fetch permissions');
        toast.error(result.error?.message || 'Failed to fetch permissions');
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

  const getPermissionLevelColor = (level: string) => {
    switch (level) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'write':
        return 'bg-yellow-100 text-yellow-800';
      case 'read':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionTypeColor = (type: string) => {
    return type === 'role' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-16 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Access Permissions</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Grant Permission
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Permission Type</label>
            <select
              value={filters.permission_type}
              onChange={(e) => handleFilterChange('permission_type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="role">Role-based</option>
              <option value="user">User-specific</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Permission Level</label>
            <select
              value={filters.permission_level}
              onChange={(e) => handleFilterChange('permission_level', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="read">Read</option>
              <option value="write">Write</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.is_active}
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  app_id: '',
                  permission_type: '',
                  permission_level: '',
                  is_active: 'true'
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

      {/* Permissions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Application
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permission Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scope
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Granted By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {permissions.map((permission) => (
              <tr key={permission.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {permission.platform_applications.display_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {permission.platform_applications.app_name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionTypeColor(permission.permission_type)}`}
                    >
                      {permission.permission_type}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {permission.permission_type === 'role' 
                          ? permission.role_name 
                          : permission.users?.email || 'Unknown User'
                        }
                      </div>
                      {permission.permission_type === 'user' && permission.users?.name && (
                        <div className="text-sm text-gray-500">{permission.users.name}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionLevelColor(permission.permission_level)}`}
                  >
                    {permission.permission_level}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {permission.config_section ? (
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        Section: {permission.config_section}
                      </span>
                    ) : permission.specific_keys && permission.specific_keys.length > 0 ? (
                      <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                        Keys: {permission.specific_keys.length}
                      </span>
                    ) : (
                      <span className="text-gray-500">All configurations</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                        permission.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {permission.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {permission.expires_at && (
                      <div className="text-xs text-gray-500">
                        Expires: {new Date(permission.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {permission.granted_by_user?.email || 'System'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(permission.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Revoke
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

      {permissions.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-gray-500">No permissions found</div>
        </div>
      )}
    </div>
  );
}