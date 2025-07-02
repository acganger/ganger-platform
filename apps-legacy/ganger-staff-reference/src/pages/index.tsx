import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Activity,
  BarChart3,
  Calendar,
  CheckSquare,
  Clipboard,
  Clock,
  Cog,
  Database,
  FileText,
  Folder,
  Heart,
  Home,
  MessageSquare,
  Package,
  Phone,
  Pill,
  Settings,
  Shield,
  Smartphone,
  Star,
  Stethoscope,
  Users,
  Zap
} from 'lucide-react';

// Staff Portal Application Categories and Links
const STAFF_APPLICATIONS = [
  {
    category: 'Staff Management',
    description: 'Employee forms, time off, and staff administration',
    apps: [
      {
        name: 'Time Off Requests',
        description: 'Submit PTO, sick leave, and unpaid leave requests',
        path: '/staff/timeoff',
        icon: Calendar,
        status: 'active',
        users: 24,
        isStaffFunction: true
      },
      {
        name: 'Support Tickets',
        description: 'IT support requests and issue tracking',
        path: '/staff/tickets',
        icon: MessageSquare,
        status: 'active',
        users: 18,
        isStaffFunction: true
      },
      {
        name: 'User Management',
        description: 'Create and manage staff user accounts',
        path: '/staff/users',
        icon: Users,
        status: 'active',
        users: 3,
        isStaffFunction: true,
        adminOnly: true
      },
      {
        name: 'Employee Directory',
        description: 'Staff contact information and profiles',
        path: '/staff/directory',
        icon: Folder,
        status: 'active',
        users: 24,
        isStaffFunction: true
      }
    ]
  },
  {
    category: 'Core Medical Applications',
    description: 'Primary medical practice management tools',
    apps: [
      {
        name: 'Inventory Management',
        description: 'Medical supply tracking with barcode scanning',
        path: '/inventory',
        icon: Package,
        status: 'active',
        users: 12
      },
      {
        name: 'Patient Handouts',
        description: 'Educational materials with QR scanning',
        path: '/handouts',
        icon: FileText,
        status: 'active',
        users: 8
      },
      {
        name: 'Check-in Kiosk Admin',
        description: 'Patient self-service terminal management',
        path: '/kiosk',
        icon: Smartphone,
        status: 'active',
        users: 5
      },
      {
        name: 'Medication Authorization',
        description: 'Prior authorization workflow management',
        path: '/meds',
        icon: Pill,
        status: 'active',
        users: 6
      }
    ]
  },
  {
    category: 'Business Operations',
    description: 'Practice management and operational tools',
    apps: [
      {
        name: 'EOS L10 Management',
        description: 'Team meetings and KPI tracking',
        path: '/l10',
        icon: BarChart3,
        status: 'active',
        users: 15
      },
      {
        name: 'Rep Scheduling Admin',
        description: 'Pharmaceutical representative scheduling',
        path: '/reps',
        icon: Calendar,
        status: 'active',
        users: 4
      },
      {
        name: 'Call Center Operations',
        description: '3CX integration and call management',
        path: '/phones',
        icon: Phone,
        status: 'active',
        users: 8
      },
      {
        name: 'Batch Closeout',
        description: 'Financial reconciliation and reporting',
        path: '/batch',
        icon: Clipboard,
        status: 'active',
        users: 3
      }
    ]
  },
  {
    category: 'Platform Administration',
    description: 'System administration and monitoring tools',
    apps: [
      {
        name: 'Social Media & Reviews',
        description: 'Online presence and reputation management',
        path: '/socials',
        icon: Star,
        status: 'active',
        users: 2
      },
      {
        name: 'Clinical Staffing',
        description: 'Provider scheduling and coverage',
        path: '/staffing',
        icon: Stethoscope,
        status: 'active',
        users: 7
      },
      {
        name: 'Compliance Training',
        description: 'HIPAA and regulatory compliance',
        path: '/compliance',
        icon: Shield,
        status: 'active',
        users: 24
      },
      {
        name: 'Platform Dashboard',
        description: 'Central management and analytics',
        path: '/dashboard',
        icon: Home,
        status: 'active',
        users: 18
      },
      {
        name: 'Configuration',
        description: 'System settings and user management',
        path: '/config',
        icon: Cog,
        status: 'active',
        users: 3
      },
      {
        name: 'Component Showcase',
        description: 'UI design system and components',
        path: '/showcase',
        icon: Zap,
        status: 'active',
        users: 5
      },
      {
        name: 'Integration Status',
        description: 'Third-party service monitoring',
        path: '/status',
        icon: Activity,
        status: 'active',
        users: 6
      }
    ]
  }
];

// Quick Stats Data
const PLATFORM_STATS = [
  { label: 'Total Applications', value: '16', change: '+4 this month', changeType: 'positive' as const },
  { label: 'Active Staff Users', value: '24', change: '+2 this week', changeType: 'positive' as const },
  { label: 'System Uptime', value: '99.97%', change: '+0.02%', changeType: 'positive' as const },
  { label: 'Daily Requests', value: '2.4k', change: '+12%', changeType: 'positive' as const }
];

const StaffPortalCard = ({ 
  app, 
  onNavigate 
}: { 
  app: typeof STAFF_APPLICATIONS[0]['apps'][0]; 
  onNavigate: (path: string) => void; 
}) => {
  const Icon = app.icon;
  
  return (
    <div
      onClick={() => onNavigate(app.path)}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
              {app.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {app.description}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {app.status}
          </span>
          <span className="text-xs text-gray-400">
            {app.users} users
          </span>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ 
  label, 
  value, 
  change, 
  changeType 
}: { 
  label: string; 
  value: string; 
  change: string; 
  changeType: 'positive' | 'negative' | 'neutral'; 
}) => {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className={`text-sm ${changeColors[changeType]}`}>
          {change}
        </p>
      </div>
    </div>
  );
};

export default function StaffPortalHomePage() {
  const { authUser, isAuthenticated, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter applications based on search
  const filteredApplications = STAFF_APPLICATIONS.map(category => ({
    ...category,
    apps: category.apps.filter(app =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.apps.length > 0);

  const handleNavigate = (path: string) => {
    // Navigate to the specific application
    window.location.href = path;
  };

  // Authentication loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading Staff Portal...</p>
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
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Ganger Dermatology - Staff Portal
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {authUser?.name?.split(' ')[0] || 'Staff Member'}
              </span>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Staff Portal Dashboard
          </h2>
          <p className="text-lg text-gray-600">
            Access all Ganger Dermatology staff applications and tools from one central location.
          </p>
        </div>

        {/* Platform Statistics */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_STATS.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="max-w-md">
            <label htmlFor="search" className="sr-only">Search applications</label>
            <div className="relative">
              <input
                type="text"
                name="search"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        <div className="space-y-8">
          {filteredApplications.map((category) => (
            <div key={category.category}>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {category.category}
                </h3>
                <p className="text-gray-600">
                  {category.description}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {category.apps.map((app) => (
                  <StaffPortalCard
                    key={app.name}
                    app={app}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Ganger Dermatology Staff Portal - Version 1.6.0
            </p>
            <p className="text-xs text-gray-400 mt-1">
              All systems operational - Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}