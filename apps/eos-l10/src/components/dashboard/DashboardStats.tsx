import { TeamAnalytics } from '@/types/eos';
import { Target, BarChart3, Users, Clock, CheckSquare } from 'lucide-react';

interface DashboardStatsProps {
  analytics: TeamAnalytics;
  loading: boolean;
}

export default function DashboardStats({ analytics, loading }: DashboardStatsProps) {
  const stats = [
    {
      name: 'Rock Completion',
      value: `${analytics.rock_completion_rate}%`,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Scorecard Compliance',
      value: `${analytics.scorecard_compliance}%`,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Meeting Attendance',
      value: `${analytics.meeting_attendance}%`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Issue Resolution',
      value: `${analytics.issue_resolution_time}d`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      name: 'Todo Completion',
      value: `${analytics.todo_completion_rate}%`,
      icon: CheckSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card">
            <div className="card-content p-4">
              <div className="flex items-center">
                <div className="skeleton w-10 h-10 rounded-lg mr-3"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-16 mb-2"></div>
                  <div className="skeleton h-6 w-12"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.name} className="card">
            <div className="card-content p-4">
              <div className="flex items-center">
                <div className={`${stat.bgColor} p-2 rounded-lg mr-3`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {stat.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}