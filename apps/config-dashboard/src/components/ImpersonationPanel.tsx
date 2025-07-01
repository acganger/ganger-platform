'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@ganger/auth/client';
import toast from 'react-hot-toast';

interface ImpersonationStatus {
  user_id: string;
  user_email: string;
  can_impersonate: boolean;
  is_impersonating: boolean;
  is_being_impersonated: boolean;
  active_session?: {
    id: string;
    target_user: {
      id: string;
      email: string;
      name: string;
    };
    started_at: string;
    expires_at: string;
    time_remaining_minutes: number;
    reason: string;
    location?: string;
  };
  impersonated_by?: {
    id: string;
    impersonator: {
      id: string;
      email: string;
      name: string;
    };
    started_at: string;
    expires_at: string;
    reason: string;
    location?: string;
  };
}

interface User {
  id: string;
  email: string;
  name?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export function ImpersonationPanel() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ImpersonationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showStartForm, setShowStartForm] = useState(false);
  const [formData, setFormData] = useState({
    target_user_id: '',
    reason: '',
    location: '',
    max_duration_minutes: 60
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchUsers();
    
    // Set up polling for status updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/impersonation/status');
      const result: ApiResponse<ImpersonationStatus> = await response.json();
      
      if (result.success && result.data) {
        setStatus(result.data);
      } else {
        console.error('Failed to fetch impersonation status:', result.error);
      }
    } catch (error) {
      console.error('Error fetching impersonation status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // This would typically fetch from a users API endpoint
      // For now, we'll implement this as needed
      setUsers([]);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleStartImpersonation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.target_user_id || !formData.reason.trim()) {
      toast.error('Please select a user and provide a reason');
      return;
    }

    setActionLoading(true);
    
    try {
      const response = await fetch('/api/impersonation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result: ApiResponse<any> = await response.json();

      if (result.success) {
        toast.success('Impersonation session started successfully');
        setShowStartForm(false);
        setFormData({
          target_user_id: '',
          reason: '',
          location: '',
          max_duration_minutes: 60
        });
        fetchStatus(); // Refresh status
      } else {
        toast.error(result.error?.message || 'Failed to start impersonation');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndImpersonation = async (reason?: string) => {
    setActionLoading(true);
    
    try {
      const response = await fetch('/api/impersonation/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const result: ApiResponse<any> = await response.json();

      if (result.success) {
        toast.success('Impersonation session ended successfully');
        fetchStatus(); // Refresh status
      } else {
        toast.error(result.error?.message || 'Failed to end impersonation');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimeRemaining = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-6 w-48 rounded mb-4"></div>
          <div className="bg-gray-200 h-20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-6">
        <div className="text-red-600">Failed to load impersonation status</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">User Impersonation</h2>
        {status.can_impersonate && !status.is_impersonating && (
          <button
            onClick={() => setShowStartForm(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
          >
            Start Impersonation
          </button>
        )}
      </div>

      {/* Current Status Card */}
      <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Current Status</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {status.can_impersonate ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-gray-500">Can Impersonate</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${status.is_impersonating ? 'text-orange-600' : 'text-gray-900'}`}>
                {status.is_impersonating ? 'Active' : 'None'}
              </div>
              <div className="text-sm text-gray-500">Impersonation Session</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${status.is_being_impersonated ? 'text-red-600' : 'text-gray-900'}`}>
                {status.is_being_impersonated ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-gray-500">Being Impersonated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Impersonation Session */}
      {status.active_session && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-lg font-medium text-orange-900 mb-2">
                Active Impersonation Session
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Target User:</span> {status.active_session.target_user?.email}
                  {status.active_session.target_user.name && (
                    <span className="text-gray-600"> ({status.active_session.target_user.name})</span>
                  )}
                </div>
                <div>
                  <span className="font-medium">Started:</span> {new Date(status.active_session.started_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Expires:</span> {new Date(status.active_session.expires_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Time Remaining:</span> {formatTimeRemaining(status.active_session.time_remaining_minutes)}
                </div>
                <div>
                  <span className="font-medium">Reason:</span> {status.active_session.reason}
                </div>
                {status.active_session.location && (
                  <div>
                    <span className="font-medium">Location:</span> {status.active_session.location}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => handleEndImpersonation()}
              disabled={actionLoading}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Ending...' : 'End Session'}
            </button>
          </div>
        </div>
      )}

      {/* Being Impersonated Warning */}
      {status.impersonated_by && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-medium text-red-900 mb-2">
            ⚠️ You are being impersonated
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Impersonator:</span> {status.impersonated_by.impersonator.email}
              {status.impersonated_by.impersonator.name && (
                <span className="text-gray-600"> ({status.impersonated_by.impersonator.name})</span>
              )}
            </div>
            <div>
              <span className="font-medium">Started:</span> {new Date(status.impersonated_by.started_at).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Expires:</span> {new Date(status.impersonated_by.expires_at).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Reason:</span> {status.impersonated_by.reason}
            </div>
            {status.impersonated_by.location && (
              <div>
                <span className="font-medium">Location:</span> {status.impersonated_by.location}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start Impersonation Form Modal */}
      {showStartForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Start Impersonation Session</h3>
            </div>
            <form onSubmit={handleStartImpersonation} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target User Email
                </label>
                <input
                  type="email"
                  value={formData.target_user_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_user_id: e.target.value }))}
                  placeholder="user@gangerdermatology.com"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Impersonation
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain why you need to impersonate this user..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Main Office, Remote"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Duration (Minutes)
                </label>
                <select
                  value={formData.max_duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_duration_minutes: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={480}>8 hours</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Starting...' : 'Start Session'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStartForm(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* No Permission Message */}
      {!status.can_impersonate && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-gray-600 text-center">
            You do not have permission to impersonate other users.
            <br />
            Contact your administrator if you need impersonation access.
          </div>
        </div>
      )}
    </div>
  );
}