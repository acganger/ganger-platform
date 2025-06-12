import { useQuery } from '@tanstack/react-query';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon 
} from '@/components/icons';
import { medicationAuthAPI } from '@/lib/api/client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  color: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ title, value, icon: Icon, change, changeType, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    red: 'bg-red-500 text-white',
  };

  const changeClasses = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${colorClasses[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
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
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    changeType ? changeClasses[changeType] : 'text-gray-600'
                  }`}>
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
}

export function DashboardStats() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => medicationAuthAPI.getAnalyticsDashboard(),
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                  <div className="ml-5 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Authorizations',
      value: analytics?.total_authorizations || 0,
      icon: DocumentTextIcon,
      color: 'blue' as const,
      change: '+12% from last month',
      changeType: 'increase' as const,
    },
    {
      title: 'Success Rate',
      value: `${Math.round((analytics?.success_rate || 0) * 100)}%`,
      icon: CheckCircleIcon,
      color: 'green' as const,
      change: '+5% from last month',
      changeType: 'increase' as const,
    },
    {
      title: 'Avg Processing Time',
      value: `${Math.round(analytics?.average_processing_time || 0)}h`,
      icon: ClockIcon,
      color: 'yellow' as const,
      change: '-2h from last month',
      changeType: 'increase' as const,
    },
    {
      title: 'Urgent Pending',
      value: analytics?.urgent_authorizations || 0,
      icon: ExclamationTriangleIcon,
      color: 'red' as const,
      change: analytics?.urgent_authorizations && analytics.urgent_authorizations > 0 ? 'Needs attention' : 'All clear',
      changeType: analytics?.urgent_authorizations && analytics.urgent_authorizations > 0 ? 'neutral' as const : 'neutral' as const,
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
}