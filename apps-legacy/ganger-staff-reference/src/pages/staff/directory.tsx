import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
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

// Mock data
const MOCK_STAFF: StaffMember[] = [
  {
    id: '1',
    name: 'Dr. Anand Ganger',
    email: 'anand@gangerdermatology.com',
    phone: '+1 (248) 555-0123',
    position: 'Medical Director',
    department: 'Administration',
    location: 'Ann Arbor',
    startDate: '2020-01-15',
    status: 'active',
    bio: 'Board-certified dermatologist specializing in medical and cosmetic dermatology.',
    skills: ['Medical Dermatology', 'Cosmetic Procedures', 'Practice Management']
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@gangerdermatology.com',
    phone: '+1 (248) 555-0124',
    position: 'Practice Manager',
    department: 'Administration',
    location: 'Ann Arbor',
    startDate: '2021-03-10',
    manager: 'Dr. Anand Ganger',
    status: 'active',
    bio: 'Experienced healthcare administrator with 8+ years in dermatology practice management.',
    skills: ['Practice Management', 'Staff Coordination', 'Patient Experience']
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike@gangerdermatology.com',
    phone: '+1 (248) 555-0125',
    position: 'IT Specialist',
    department: 'IT',
    location: 'Remote',
    startDate: '2022-07-20',
    manager: 'Sarah Johnson',
    status: 'remote',
    bio: 'Full-stack developer and IT specialist maintaining all practice technology systems.',
    skills: ['Software Development', 'Network Administration', 'Database Management']
  },
  {
    id: '4',
    name: 'Emily Rodriguez',
    email: 'emily@gangerdermatology.com',
    phone: '+1 (248) 555-0126',
    position: 'Medical Assistant',
    department: 'Clinical',
    location: 'Plymouth',
    startDate: '2023-02-14',
    manager: 'Dr. Anand Ganger',
    status: 'active',
    bio: 'Certified medical assistant with expertise in patient care and clinical procedures.',
    skills: ['Patient Care', 'Clinical Procedures', 'Medical Documentation']
  },
  {
    id: '5',
    name: 'Jessica Smith',
    email: 'jessica@gangerdermatology.com',
    phone: '+1 (248) 555-0127',
    position: 'Registered Nurse',
    department: 'Clinical',
    location: 'Wixom',
    startDate: '2022-09-05',
    manager: 'Dr. Anand Ganger',
    status: 'vacation',
    bio: 'RN with specialization in dermatology and cosmetic procedure assistance.',
    skills: ['Clinical Care', 'Cosmetic Procedures', 'Patient Education']
  },
  {
    id: '6',
    name: 'David Wilson',
    email: 'david@gangerdermatology.com',
    phone: '+1 (248) 555-0128',
    position: 'Front Desk Coordinator',
    department: 'Reception',
    location: 'Ann Arbor',
    startDate: '2023-05-12',
    manager: 'Sarah Johnson',
    status: 'active',
    bio: 'Customer service specialist managing patient appointments and front desk operations.',
    skills: ['Customer Service', 'Appointment Scheduling', 'Insurance Verification']
  }
];

const DEPARTMENTS = ['All', 'Administration', 'Clinical', 'IT', 'Reception', 'Billing'];
const LOCATIONS = ['All', 'Ann Arbor', 'Plymouth', 'Wixom', 'Remote'];

export default function StaffDirectoryPage() {
  const { authUser, isAuthenticated, loading } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterLocation, setFilterLocation] = useState('All');
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);

  // Filter staff
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'All' || member.department === filterDepartment;
    const matchesLocation = filterLocation === 'All' || member.location === filterLocation;
    
    return matchesSearch && matchesDepartment && matchesLocation;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'vacation': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'remote': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'vacation': return 'On Vacation';
      case 'sick': return 'Sick Leave';
      case 'remote': return 'Remote';
      default: return status;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
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
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <span className="text-lg font-semibold text-blue-600">
                    {getInitials(member.name)}
                  </span>
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
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                    {getStatusLabel(member.status)}
                  </span>
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
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xl font-semibold text-blue-600">
                        {getInitials(selectedMember.name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedMember.name}
                      </h3>
                      <p className="text-gray-600">{selectedMember.position}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedMember.status)} mt-2`}>
                        {getStatusLabel(selectedMember.status)}
                      </span>
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
                          <span key={skill} className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                            {skill}
                          </span>
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