import React from 'react';
import { useRouter } from 'next/router';
import { TeamMember } from '@/types/eos';
import { PlayCircle, Calendar, Target, AlertCircle, CheckSquare } from 'lucide-react';

interface QuickActionsProps {
  userRole: TeamMember['role'] | null;
}

export default function QuickActions({ userRole }: QuickActionsProps) {
  const router = useRouter();
  const canCreateContent = userRole !== 'viewer';

  const actions = [
    {
      name: 'Start L10 Meeting',
      href: '/meeting/start',
      icon: PlayCircle,
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Begin weekly Level 10 meeting',
      primary: true,
    },
    ...(canCreateContent ? [
      {
        name: 'Add Rock',
        href: '/rocks/new',
        icon: Target,
        color: 'bg-blue-600 hover:bg-blue-700',
        description: 'Create quarterly goal',
      },
      {
        name: 'Create Issue',
        href: '/issues/new',
        icon: AlertCircle,
        color: 'bg-red-600 hover:bg-red-700',
        description: 'Report team issue',
      },
      {
        name: 'Add Todo',
        href: '/todos/new',
        icon: CheckSquare,
        color: 'bg-purple-600 hover:bg-purple-700',
        description: 'Assign new task',
      },
    ] : []),
    {
      name: 'View Calendar',
      href: '/meetings',
      icon: Calendar,
      color: 'bg-gray-600 hover:bg-gray-700',
      description: 'See upcoming meetings',
    },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Quick Actions</h3>
        <p className="card-description">
          Get started with common tasks
        </p>
      </div>
      <div className="card-content">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.name}
                onClick={() => router.push(action.href)}
                className={`group flex flex-col items-center p-4 rounded-lg text-white transition-all transform hover:scale-105 ${action.color} ${
                  action.primary ? 'lg:col-span-2' : ''
                }`}
              >
                <Icon className={`h-6 w-6 mb-2 ${action.primary ? 'h-8 w-8' : ''}`} />
                <span className={`text-sm font-medium text-center ${action.primary ? 'text-base' : ''}`}>
                  {action.name}
                </span>
                <span className="text-xs opacity-80 text-center mt-1 hidden sm:block">
                  {action.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}