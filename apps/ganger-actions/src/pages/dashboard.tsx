import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { 
  Ticket, 
  Clock, 
  Users, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType 
}: {
  title: string;
  value: string | number;
  icon: any;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}) => {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${changeColors[changeType || 'neutral']}`}>
                    {change}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick 
}: {
  title: string;
  description: string;
  icon: any;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <div>
        <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-600 group-hover:bg-primary-100">
          <Icon className="h-6 w-6" />
        </span>
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      </div>
    </button>
  );
};

export default function DashboardPage() {
  const { authUser } = useAuth();
  const router = useRouter();

  const stats = [
    {
      title: 'Open Tickets',
      value: 12,
      icon: Ticket,
      change: '+2 from last week',
      changeType: 'positive' as const,
    },
    {
      title: 'Pending Time Off',
      value: 3,
      icon: Clock,
      change: 'Same as last week',
      changeType: 'neutral' as const,
    },
    {
      title: 'Team Members',
      value: 24,
      icon: Users,
      change: '+1 this month',
      changeType: 'positive' as const,
    },
    {
      title: 'Resolution Rate',
      value: '94%',
      icon: TrendingUp,
      change: '+2% from last month',
      changeType: 'positive' as const,
    },
  ];

  const quickActions = [
    {
      title: 'Submit Support Ticket',
      description: 'Get help with IT issues, equipment problems, or general support.',
      icon: Ticket,
      onClick: () => router.push('/forms/support'),
    },
    {
      title: 'Request Time Off',
      description: 'Submit vacation, sick leave, or other time off requests.',
      icon: Clock,
      onClick: () => router.push('/forms/time-off'),
    },
    {
      title: 'Fix Punch Time',
      description: 'Correct clock in/out times and attendance records.',
      icon: AlertCircle,
      onClick: () => router.push('/forms/punch-fix'),
    },
    {
      title: 'Update Availability',
      description: 'Change your work schedule or availability preferences.',
      icon: Users,
      onClick: () => router.push('/forms/availability'),
    },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {authUser?.name?.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here&apos;s what&apos;s happening in your workspace today.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
            <button className="text-sm text-primary-600 hover:text-primary-500 font-medium">
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <QuickAction key={action.title} {...action} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="text-center py-8">
              <p className="text-gray-500">No recent activity to display.</p>
              <p className="text-sm text-gray-400 mt-1">
                Your tickets and requests will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}