'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@ganger/auth';
import toast from 'react-hot-toast';

interface PendingChange {
  id: string;
  app_id: string;
  config_id?: string;
  config_key: string;
  config_section?: string;
  change_type: 'CREATE' | 'UPDATE' | 'DELETE';
  old_value?: any;
  new_value?: any;
  value_type?: string;
  description?: string;
  is_sensitive?: boolean;
  requires_restart?: boolean;
  environment: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  requested_by: string;
  approved_by?: string;
  approved_at?: string;
  approval_comments?: string;
  rejection_feedback?: string;
  created_at: string;
  urgency_score: number;
  hours_old: number;
  platform_applications: {
    app_name: string;
    display_name: string;
  };
  requested_by_user: {
    email: string;
    name?: string;
  };
  approved_by_user?: {
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
    totalPages: number;
    summary?: {
      pending: number;
      high_priority: number;
      overdue: number;
    };
  };
}

export function ApprovalWorkflow() {
  useAuth(); // Verify user is authenticated
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'pending',
    priority: '',
    app_id: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ pending: 0, high_priority: 0, overdue: 0 });
  const [selectedChange, setSelectedChange] = useState<PendingChange | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionForm, setActionForm] = useState({
    reason: '',
    feedback: '',
    apply_immediately: true
  });

  useEffect(() => {
    fetchPendingChanges();
  }, [currentPage, filters]);

  const fetchPendingChanges = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '15'
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/approval/pending?${params}`);
      const result: ApiResponse<PendingChange[]> = await response.json();

      if (result.success && result.data) {
        setPendingChanges(result.data);
        setTotalPages(Math.ceil((result.meta?.total || 0) / (result.meta?.limit || 15)));
        setSummary(result.meta?.summary || { pending: 0, high_priority: 0, overdue: 0 });
        setError(null);
      } else {
        setError(result.error?.message || 'Failed to fetch pending changes');
        toast.error(result.error?.message || 'Failed to fetch pending changes');
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

  const handleApproveReject = async () => {
    if (!selectedChange) return;

    const isApproval = actionType === 'approve';
    const endpoint = `/api/approval/${selectedChange.id}/${isApproval ? 'approve' : 'reject'}`;
    
    const body = isApproval 
      ? { 
          comments: actionForm.reason, 
          apply_immediately: actionForm.apply_immediately 
        }
      : { 
          reason: actionForm.reason, 
          feedback: actionForm.feedback 
        };

    setActionLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const result: ApiResponse<any> = await response.json();

      if (result.success) {
        toast.success(`Change ${isApproval ? 'approved' : 'rejected'} successfully`);
        setSelectedChange(null);
        setActionType(null);
        setActionForm({ reason: '', feedback: '', apply_immediately: true });
        fetchPendingChanges(); // Refresh the list
      } else {
        toast.error(result.error?.message || `Failed to ${isApproval ? 'approve' : 'reject'} change`);
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (value: any, valueType: string = 'string') => {
    if (value === null || value === undefined) return 'null';
    if (valueType === 'json' && typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-24 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Approval Workflow</h2>
        <button
          onClick={fetchPendingChanges}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{summary.pending}</div>
          <div className="text-sm text-gray-600">Pending Changes</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">{summary.high_priority}</div>
          <div className="text-sm text-gray-600">High Priority</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{summary.overdue}</div>
          <div className="text-sm text-gray-600">Overdue (&gt;24h)</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ status: 'pending', priority: '', app_id: '' });
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

      {/* Pending Changes List */}
      <div className="space-y-4">
        {pendingChanges.map((change) => (
          <div
            key={change.id}
            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
              change.urgency_score >= 5 ? 'border-red-300 bg-red-50' : 
              change.urgency_score >= 3 ? 'border-orange-300 bg-orange-50' : 
              'border-gray-200 bg-white'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{change.config_key}</h3>
                  <span className="text-sm text-gray-500">{change.platform_applications.display_name}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getChangeTypeColor(change.change_type)}`}>
                    {change.change_type}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(change.priority)}`}>
                    {change.priority}
                  </span>
                  {change.hours_old > 24 && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Overdue
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{change.reason}</p>
                <div className="text-xs text-gray-500">
                  Requested by {change.requested_by_user?.email} • {change.hours_old}h ago • {change.environment}
                </div>
              </div>

              {change.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedChange(change);
                      setActionType('approve');
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedChange(change);
                      setActionType('reject');
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setSelectedChange(change)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Details
                  </button>
                </div>
              )}

              {change.status !== 'pending' && (
                <div className="text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    change.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {change.status}
                  </span>
                  {change.approved_by_user && (
                    <div className="text-xs text-gray-500 mt-1">
                      by {change.approved_by_user?.email}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick preview of changes */}
            <div className="bg-gray-50 rounded p-2 text-sm">
              {change.change_type === 'CREATE' && (
                <div>
                  <strong>New Value:</strong>
                  <pre className="text-xs mt-1 whitespace-pre-wrap">
                    {formatValue(change.new_value, change.value_type)}
                  </pre>
                </div>
              )}
              {change.change_type === 'UPDATE' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Old Value:</strong>
                    <pre className="text-xs mt-1 whitespace-pre-wrap">
                      {formatValue(change.old_value, change.value_type)}
                    </pre>
                  </div>
                  <div>
                    <strong>New Value:</strong>
                    <pre className="text-xs mt-1 whitespace-pre-wrap">
                      {formatValue(change.new_value, change.value_type)}
                    </pre>
                  </div>
                </div>
              )}
              {change.change_type === 'DELETE' && (
                <div className="text-red-600">
                  <strong>Configuration will be deleted</strong>
                </div>
              )}
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

      {pendingChanges.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-gray-500">No changes found</div>
        </div>
      )}

      {/* Action Modal */}
      {selectedChange && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {actionType === 'approve' ? 'Approve Change' : 'Reject Change'}
                </h3>
                <button
                  onClick={() => {
                    setSelectedChange(null);
                    setActionType(null);
                    setActionForm({ reason: '', feedback: '', apply_immediately: true });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Change Details</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm space-y-1">
                    <div><strong>Config Key:</strong> {selectedChange.config_key}</div>
                    <div><strong>Application:</strong> {selectedChange.platform_applications.display_name}</div>
                    <div><strong>Change Type:</strong> {selectedChange.change_type}</div>
                    <div><strong>Priority:</strong> {selectedChange.priority}</div>
                    <div><strong>Reason:</strong> {selectedChange.reason}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {actionType === 'approve' ? 'Comments (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  value={actionForm.reason}
                  onChange={(e) => setActionForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={
                    actionType === 'approve' 
                      ? 'Optional comments about this approval...'
                      : 'Explain why this change is being rejected...'
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={actionType === 'reject'}
                />
              </div>

              {actionType === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Feedback (Optional)
                  </label>
                  <textarea
                    value={actionForm.feedback}
                    onChange={(e) => setActionForm(prev => ({ ...prev, feedback: e.target.value }))}
                    placeholder="Provide suggestions for improvement..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {actionType === 'approve' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="apply_immediately"
                    checked={actionForm.apply_immediately}
                    onChange={(e) => setActionForm(prev => ({ ...prev, apply_immediately: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="apply_immediately" className="ml-2 block text-sm text-gray-900">
                    Apply change immediately after approval
                  </label>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleApproveReject}
                  disabled={actionLoading || (actionType === 'reject' && !actionForm.reason.trim())}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionType === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {actionLoading 
                    ? (actionType === 'approve' ? 'Approving...' : 'Rejecting...')
                    : (actionType === 'approve' ? 'Approve Change' : 'Reject Change')
                  }
                </button>
                <button
                  onClick={() => {
                    setSelectedChange(null);
                    setActionType(null);
                    setActionForm({ reason: '', feedback: '', apply_immediately: true });
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedChange && !actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Change Details</h3>
                <button
                  onClick={() => setSelectedChange(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Config Key</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedChange.config_key}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Application</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedChange.platform_applications.display_name} ({selectedChange.platform_applications.app_name})
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Change Type</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getChangeTypeColor(selectedChange.change_type)}`}>
                      {selectedChange.change_type}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedChange.priority)}`}>
                      {selectedChange.priority}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Environment</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedChange.environment}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedChange.status === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedChange.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedChange.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason for Change</label>
                <div className="mt-1 text-sm text-gray-900">{selectedChange.reason}</div>
              </div>

              {selectedChange.change_type !== 'DELETE' && (
                <div className="grid grid-cols-1 gap-4">
                  {selectedChange.change_type === 'UPDATE' && selectedChange.old_value && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Current Value</label>
                      <pre className="mt-1 text-xs bg-gray-100 p-3 rounded border overflow-x-auto">
                        {formatValue(selectedChange.old_value, selectedChange.value_type)}
                      </pre>
                    </div>
                  )}
                  {selectedChange.new_value && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {selectedChange.change_type === 'CREATE' ? 'Value' : 'New Value'}
                      </label>
                      <pre className="mt-1 text-xs bg-gray-100 p-3 rounded border overflow-x-auto">
                        {formatValue(selectedChange.new_value, selectedChange.value_type)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested By</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedChange.requested_by_user?.email}
                    {selectedChange.requested_by_user.name && ` (${selectedChange.requested_by_user.name})`}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested At</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {new Date(selectedChange.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {selectedChange.approved_by_user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {selectedChange.status === 'approved' ? 'Approved By' : 'Rejected By'}
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedChange.approved_by_user?.email}
                      {selectedChange.approved_by_user.name && ` (${selectedChange.approved_by_user.name})`}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {selectedChange.status === 'approved' ? 'Approved At' : 'Rejected At'}
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedChange.approved_at && new Date(selectedChange.approved_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {selectedChange.approval_comments && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {selectedChange.status === 'approved' ? 'Approval Comments' : 'Rejection Reason'}
                  </label>
                  <div className="mt-1 text-sm text-gray-900">{selectedChange.approval_comments}</div>
                </div>
              )}

              {selectedChange.rejection_feedback && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rejection Feedback</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedChange.rejection_feedback}</div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedChange(null)}
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