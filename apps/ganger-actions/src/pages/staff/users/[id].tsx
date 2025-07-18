export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner, Badge } from '@ganger/ui';
import { Input, Select } from '@ganger/ui-catalyst';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building,
  MapPin,
  Edit2,
  Save,
  X,
  UserCheck,
  AlertTriangle,
  Clock,
  Activity,
  ChevronRight
} from 'lucide-react';

interface StaffUser {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  role: 'admin' | 'manager' | 'staff';
  location: string;
  hire_date?: string;
  phone_number?: string;
  is_active: boolean;
  google_user_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details?: any;
}

const ROLES = [
  { value: 'admin', label: 'Administrator', icon: Shield },
  { value: 'manager', label: 'Manager', icon: UserCheck },
  { value: 'staff', label: 'Staff', icon: User }
];

const LOCATIONS = ['Wixom', 'Ann Arbor', 'Plymouth', 'Multiple'];

export default function UserProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser, hasRole, isAuthenticated, loading: authLoading } = useAuth();
  
  const [user, setUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<StaffUser>>({});
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check permissions
  const canEdit = hasRole(['admin', 'manager']) || currentUser?.id === id;
  const canViewDetails = hasRole(['admin', 'manager']) || currentUser?.id === id;

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchUserProfile();
      fetchActivityLog();
      fetchFormData();
    }
  }, [id, isAuthenticated]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('User not found');
        } else if (response.status === 403) {
          setError('You do not have permission to view this profile');
        } else {
          throw new Error('Failed to fetch user profile');
        }
        return;
      }
      
      const data = await response.json();
      if (data.success && data.data?.user) {
        setUser(data.data.user);
        setEditedUser(data.data.user);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch user');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivityLog = async () => {
    try {
      const response = await fetch(`/api/users/${id}/activity`);
      if (response.ok) {
        const data = await response.json();
        setActivityLog(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activity log:', error);
    }
  };

  const fetchFormData = async () => {
    try {
      // Get unique departments from the current users list
      const response = await fetch('/api/users?limit=100');
      if (response.ok) {
        const data = await response.json();
        const uniqueDepts = [...new Set(data.users?.map((u: any) => u.department).filter(Boolean) || [])] as string[];
        setDepartments(uniqueDepts.sort());
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedUser({ ...user });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser({ ...user });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedUser),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      const data = await response.json();
      if (data.success && data.data?.user) {
        setUser(data.data.user);
        setIsEditing(false);
      } else {
        throw new Error(data.error?.message || 'Failed to update user');
      }
      
      // Refresh activity log
      fetchActivityLog();
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleInfo = (role: string) => {
    return ROLES.find(r => r.value === role) || ROLES[2]; // Default to staff
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'user_created':
        return <UserCheck className="h-4 w-4" />;
      case 'profile_updated':
        return <Edit2 className="h-4 w-4" />;
      case 'role_changed':
        return <Shield className="h-4 w-4" />;
      case 'status_changed':
        return <Activity className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityDescription = (activity: ActivityLog) => {
    switch (activity.action) {
      case 'user_created':
        return `User account created by ${activity.details?.created_by || 'system'}`;
      case 'profile_updated':
        return `Profile information updated`;
      case 'role_changed':
        return `Role changed from ${activity.details?.old_role} to ${activity.details?.new_role}`;
      case 'status_changed':
        return `Status changed to ${activity.details?.new_status}`;
      default:
        return activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading user profile..." center />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    router.push('/auth/signin');
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{error}</h3>
          <div className="mt-6">
            <Link href="/staff/users" className="text-primary-600 hover:text-primary-500">
              Back to Users
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No user found
  if (!user) {
    return null;
  }

  const roleInfo = getRoleInfo(user.role);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/staff/users" className="text-gray-400 hover:text-gray-500 mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <User className="h-6 w-6 text-primary-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">User Profile</h1>
            </div>
            {canEdit && !isEditing && (
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )}
            {isEditing && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
                <Badge variant={user.is_active ? 'success' : 'destructive'} size="md">
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editedUser.full_name || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{user.full_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 flex items-center text-sm text-gray-900">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    {user.email}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={editedUser.phone_number || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, phone_number: e.target.value })}
                    />
                  ) : (
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      {user.phone_number || 'Not provided'}
                    </div>
                  )}
                </div>

                {/* Employee ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editedUser.employee_id || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, employee_id: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{user.employee_id || 'Not assigned'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Job Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Job Information</h2>

              <div className="space-y-4">
                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  {isEditing ? (
                    <Select
                      value={editedUser.role || 'staff'}
                      onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value as StaffUser['role'] })}
                      options={ROLES.map(role => ({ value: role.value, label: role.label }))}
                    />
                  ) : (
                    <div className="mt-1 flex items-center">
                      <RoleIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <Badge 
                        variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'primary' : 'success'} 
                        size="sm"
                      >
                        {roleInfo.label}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  {isEditing ? (
                    <Select
                      value={editedUser.department || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, department: e.target.value })}
                      placeholder="Select Department"
                      options={departments.map(dept => ({ value: dept, label: dept }))}
                    />
                  ) : (
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      {user.department || 'Not assigned'}
                    </div>
                  )}
                </div>


                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  {isEditing ? (
                    <Select
                      value={editedUser.location || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, location: e.target.value })}
                      placeholder="Select Location"
                      options={LOCATIONS.map(loc => ({ value: loc, label: loc }))}
                    />
                  ) : (
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      {user.location || 'Not assigned'}
                    </div>
                  )}
                </div>

                {/* Hire Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hire Date</label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedUser.hire_date ? editedUser.hire_date.split('T')[0] : ''}
                      onChange={(e) => setEditedUser({ ...editedUser, hire_date: e.target.value })}
                    />
                  ) : (
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {formatDate(user.hire_date)}
                    </div>
                  )}
                </div>


                {/* Status (Edit mode only) */}
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <Select
                      value={editedUser.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setEditedUser({ ...editedUser, is_active: e.target.value === 'active' })}
                      options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' }
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Account Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(user.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(user.updated_at)}</dd>
                </div>
              </dl>
            </div>

            {/* Recent Activity */}
            {canViewDetails && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
                {activityLog.length > 0 ? (
                  <ul className="space-y-3">
                    {activityLog.slice(0, 5).map((activity) => (
                      <li key={activity.id} className="flex items-start">
                        <div className="flex-shrink-0 text-gray-400">
                          {getActivityIcon(activity.action)}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm text-gray-900">{getActivityDescription(activity)}</p>
                          <p className="mt-1 text-xs text-gray-500">{formatDateTime(activity.timestamp)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No recent activity</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}