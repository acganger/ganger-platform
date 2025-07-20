export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner, Badge } from '@ganger/ui';
import { Avatar } from '@ganger/ui-catalyst';
import { 
  ArrowLeft, 
  Folder, 
  Search, 
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Users,
  Building,
  Clock
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  location: string;
  startDate: string;
  manager?: string;
  team?: string;
  status: 'active' | 'vacation' | 'sick' | 'remote';
  avatar?: string;
  bio?: string;
  skills?: string[];
}

const DEPARTMENTS = ['All', 'Administration', 'Clinical', 'IT', 'Reception', 'Billing'];
const LOCATIONS = ['All', 'Ann Arbor', 'Plymouth', 'Wixom', 'Remote'];

export default function StaffDirectoryPage() {
  const { authUser, isAuthenticated, loading } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterLocation, setFilterLocation] = useState('All');
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);

  // Fetch staff data
  useEffect(() => {
    if (isAuthenticated) {
      fetchStaffDirectory();
    }
  }, [isAuthenticated]);

  const fetchStaffDirectory = async () => {
    try {
      setLoadingStaff(true);
      setError(null);
      
      const response = await fetch('/api/staff/directory');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch staff directory');
      }
      
      setStaff(data.staff || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching staff directory:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Filter staff
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'All' || member.department === filterDepartment;
    const matchesLocation = filterLocation === 'All' || member.location === filterLocation;
    
    return matchesSearch && matchesDepartment && matchesLocation;
  });


  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'vacation': return 'On Vacation';
      case 'sick': return 'Sick Leave';
      case 'remote': return 'Remote';
      default: return status;
    }
  };


  const formatStartDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const years = now.getFullYear() - date.getFullYear();
    const months = now.getMonth() - date.getMonth();
    
    let tenure = '';
    if (years > 0) {
      tenure = `${years} year${years > 1 ? 's' : ''}`;
      if (months > 0) {
        tenure += `, ${months} month${months > 1 ? 's' : ''}`;
      }
    } else if (months > 0) {
      tenure = `${months} month${months > 1 ? 's' : ''}`;
    } else {
      tenure = 'New employee';
    }
    
    return `${date.toLocaleDateString()} (${tenure})`;
  };

  // Authentication loading state
  if (loading || loadingStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" text={loading ? "Loading directory..." : "Fetching staff data..."} center />
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    window.location.href = '/auth/login';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Staff Portal
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {authUser?.name || 'Staff Member'}
              </span>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Employee Directory
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Contact information and profiles for all staff members
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept} Department{dept !== 'All' ? '' : 's'}</option>
              ))}
            </select>
            
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {LOCATIONS.map(location => (
                <option key={location} value={location}>{location} Location{location !== 'All' ? '' : 's'}</option>
              ))}
            </select>
            
            <div className="text-sm text-gray-500 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span className="font-medium">{filteredStaff.length}</span>&nbsp;staff members
            </div>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStaff.map((member) => (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar 
                    size="xl"
                    alt={member.name}
                  />
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {member.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3">
                  {member.position}
                </p>
                
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center">
                    <Building className="h-4 w-4 mr-1" />
                    {member.department}
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {member.location}
                  </div>
                </div>
                
                <div className="mt-4 flex justify-center space-x-2">
                  <a
                    href={`mailto:${member.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-gray-400 hover:text-blue-600"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-gray-400 hover:text-blue-600"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
                
                <div className="mt-4">
                  <Badge 
                    variant={member.status === 'active' ? 'success' : member.status === 'remote' ? 'primary' : member.status === 'vacation' ? 'warning' : 'destructive'} 
                    size="sm"
                  >
                    {getStatusLabel(member.status)}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Staff Member Detail Modal */}
        {selectedMember && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <Avatar 
                      size="xl"
                      alt={selectedMember.name}
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedMember.name}
                      </h3>
                      <p className="text-gray-600">{selectedMember.position}</p>
                      <Badge 
                        variant={selectedMember.status === 'active' ? 'success' : selectedMember.status === 'remote' ? 'primary' : selectedMember.status === 'vacation' ? 'warning' : 'destructive'} 
                        size="sm" 
                        className="mt-2"
                      >
                        {getStatusLabel(selectedMember.status)}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <a href={`mailto:${selectedMember.email}`} className="text-blue-600 hover:text-blue-800">
                            {selectedMember.email}
                          </a>
                        </div>
                      </div>
                      {selectedMember.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <a href={`tel:${selectedMember.phone}`} className="text-blue-600 hover:text-blue-800">
                              {selectedMember.phone}
                            </a>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <Building className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Department</p>
                          <p className="text-gray-900">{selectedMember.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="text-gray-900">{selectedMember.location}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Employment Details */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Employment Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Start Date</p>
                          <p className="text-gray-900">{formatStartDate(selectedMember.startDate)}</p>
                        </div>
                      </div>
                      {selectedMember.manager && (
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Reports To</p>
                            <p className="text-gray-900">{selectedMember.manager}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Bio */}
                  {selectedMember.bio && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">About</h4>
                      <p className="text-gray-600">{selectedMember.bio}</p>
                    </div>
                  )}
                  
                  {/* Skills */}
                  {selectedMember.skills && selectedMember.skills.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Skills & Expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedMember.skills.map(skill => (
                          <Badge key={skill} variant="outline" size="sm">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}