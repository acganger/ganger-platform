export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner, Button, Badge } from '@ganger/ui';
import { Card, CardHeader, CardContent, CardTitle } from '@ganger/ui-catalyst';
import { Input, Select } from '@ganger/ui-catalyst';
import { 
  ArrowLeft, 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  AlertTriangle,
  MapPin,
  Building
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface StaffUser {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: 'admin' | 'manager' | 'staff';
  department?: string;
  location?: string;
  is_active: boolean;
  hire_date?: string;
  manager?: {
    id: string;
    full_name: string;
    email: string;
  };
  employee_id?: string;
  created_at: string;
  updated_at: string;
}

interface UserFilters {
  departments: string[];
  locations: string[];
  roles: string[];
}

const ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' }
];

export default function UserManagementPage() {
  const router = useRouter();
  const { user, hasRole, isAuthenticated, loading } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    departments: [],
    locations: [],
    roles: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    role: 'staff' as StaffUser['role'],
    department: '',
    location: '',
    hire_date: new Date().toISOString().split('T')[0],
    manager_id: '',
    employee_id: ''
  });

  // Check permissions
  const canManageUsers = hasRole(['admin', 'manager']);

  // Fetch users and filters on component mount and when filters change
  useEffect(() => {
    if (isAuthenticated && canManageUsers) {
      fetchUsers();
    }
  }, [searchTerm, filterDepartment, filterRole, filterLocation, currentPage, isAuthenticated]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(filterDepartment && { department: filterDepartment }),
        ...(filterRole && { role: filterRole }),
        ...(filterLocation && { location: filterLocation })
      });

      const response = await fetch(`/api/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
      if (data.filters) {
        setFilters(data.filters);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      const data = await response.json();
      
      // Refresh the user list
      await fetchUsers();
      
      // Reset form
      setShowCreateForm(false);
      setNewUser({
        full_name: '',
        email: '',
        phone_number: '',
        role: 'staff',
        department: '',
        location: '',
            hire_date: new Date().toISOString().split('T')[0],
        manager_id: '',
        employee_id: ''
      });
      
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsSaving(false);
    }
  };


  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Authentication loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." center />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    router.push('/auth/signin');
    return null;
  }

  // No permission
  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to view this page.
          </p>
          <div className="mt-6">
            <Link href="/" className="text-primary-600 hover:text-primary-500">
              Go back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-gray-400 hover:text-gray-500 mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Users className="h-6 w-6 text-primary-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
            </div>
            {canManageUsers && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateForm(true)}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Add User
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 w-full"
              />
            </div>

            {/* Department Filter */}
            <Select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {filters.departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Select>

            {/* Location Filter */}
            <Select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {filters.locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </Select>

            {/* Role Filter */}
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">All Roles</option>
              {ROLES.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </Select>
          </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="md" text="Loading users..." center />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/staff/users/${user.id}`}>
                          <div className="flex items-center cursor-pointer">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-primary-700 font-medium">
                                  {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 hover:text-primary-600">{user.full_name}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {user.email}
                              </div>
                              {user.phone_number && (
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {user.phone_number}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'primary' : 'success'} 
                          size="sm"
                        >
                          {ROLES.find(r => r.value === user.role)?.label || user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Building className="h-4 w-4 mr-1 text-gray-400" />
                          {user.department || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {user.location || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={user.is_active ? 'success' : 'destructive'} size="sm">
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.manager ? user.manager.full_name : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block text-left">
                          <Link href={`/staff/users/${user.id}`} className="text-primary-600 hover:text-primary-900">
                            View Profile
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalUsers > 50 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage * 50 >= totalUsers}
                  className="ml-3"
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(currentPage - 1) * 50 + 1}</span>{' '}
                    to{' '}
                    <span className="font-medium">{Math.min(currentPage * 50, totalUsers)}</span>{' '}
                    of{' '}
                    <span className="font-medium">{totalUsers}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="rounded-r-none"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage * 50 >= totalUsers}
                      className="rounded-l-none"
                    >
                      Next
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full">
            <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <Input
                type="text"
                label="Full Name *"
                required
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              />

              <Input
                type="email"
                label="Email *"
                required
                pattern=".*@gangerdermatology\.com$"
                title="Email must be @gangerdermatology.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />

              <Input
                type="text"
                label="Employee ID"
                value={newUser.employee_id}
                onChange={(e) => setNewUser({ ...newUser, employee_id: e.target.value })}
              />

              <Input
                type="tel"
                label="Phone"
                value={newUser.phone_number}
                onChange={(e) => setNewUser({ ...newUser, phone_number: e.target.value })}
              />

              <Select
                label="Role *"
                required
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as StaffUser['role'] })}
              >
                <option value="">Select role</option>
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </Select>

              <Select
                label="Department"
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
              >
                <option value="">Select Department</option>
                {filters.departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </Select>

              <Select
                label="Location"
                value={newUser.location}
                onChange={(e) => setNewUser({ ...newUser, location: e.target.value })}
              >
                <option value="">Select Location</option>
                {filters.locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </Select>


              <Input
                type="date"
                label="Hire Date"
                value={newUser.hire_date}
                onChange={(e) => setNewUser({ ...newUser, hire_date: e.target.value })}
              />

              <Select
                label="Manager"
                value={newUser.manager_id}
                onChange={(e) => setNewUser({ ...newUser, manager_id: e.target.value })}
              >
                <option value="">No Manager</option>
                {users.filter(u => u.role === 'manager' || u.role === 'admin').map(manager => (
                  <option key={manager.id} value={manager.id}>{manager.full_name}</option>
                ))}
              </Select>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isSaving}
                >
                  {isSaving ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}