import React from 'react';
import SafeLink from '@/components/ui/SafeLink';
import { Rock, Issue, Todo } from '@/types/eos';
import { Target, AlertCircle, CheckSquare, Clock, ArrowRight } from 'lucide-react';

interface RecentActivityProps {
  rocks: Rock[];
  issues: Issue[];
  todos: Todo[];
  loading: boolean;
}

export default function RecentActivity({ rocks, issues, todos, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Activity</h3>
        </div>
        <div className="card-content">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="skeleton w-8 h-8 rounded mr-3"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-40 mb-1"></div>
                  <div className="skeleton h-3 w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Combine and sort all activities
  const activities = [
    ...rocks.map(rock => ({
      id: rock.id,
      type: 'rock' as const,
      title: rock.title,
      status: rock.status,
      date: rock.updated_at,
      href: `/rocks/${rock.id}`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    })),
    ...issues.map(issue => ({
      id: issue.id,
      type: 'issue' as const,
      title: issue.title,
      status: issue.priority,
      date: issue.created_at,
      href: `/issues/${issue.id}`,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    })),
    ...todos.map(todo => ({
      id: todo.id,
      type: 'todo' as const,
      title: todo.title,
      status: todo.priority,
      date: todo.updated_at,
      href: `/todos/${todo.id}`,
      icon: CheckSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 8);

  const getStatusColor = (type: string, status: string) => {
    if (type === 'rock') {
      switch (status) {
        case 'on_track': return 'text-green-600';
        case 'off_track': return 'text-red-600';
        case 'complete': return 'text-blue-600';
        default: return 'text-gray-600';
      }
    }
    if (type === 'issue') {
      switch (status) {
        case 'critical': return 'text-red-600';
        case 'high': return 'text-orange-600';
        case 'medium': return 'text-yellow-600';
        default: return 'text-gray-600';
      }
    }
    if (type === 'todo') {
      switch (status) {
        case 'high': return 'text-red-600';
        case 'medium': return 'text-yellow-600';
        default: return 'text-green-600';
      }
    }
    return 'text-gray-600';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="card-title">Recent Activity</h3>
          <div className="flex space-x-2">
            <SafeLink 
              href="/rocks"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Rocks
            </SafeLink>
            <span className="text-xs text-gray-300">•</span>
            <SafeLink 
              href="/issues"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Issues
            </SafeLink>
            <span className="text-xs text-gray-300">•</span>
            <SafeLink 
              href="/todos"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Todos
            </SafeLink>
          </div>
        </div>
      </div>
      <div className="card-content">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <SafeLink
                  key={`${activity.type}-${activity.id}`}
                  href={activity.href}
                  className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className={`${activity.bgColor} p-2 rounded mr-3`}>
                    <Icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-eos-600">
                      {activity.title}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="capitalize">{activity.type}</span>
                      <span className="mx-1">•</span>
                      <span className={getStatusColor(activity.type, activity.status)}>
                        {activity.status.replace('_', ' ')}
                      </span>
                      <span className="mx-1">•</span>
                      <span>
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </SafeLink>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}