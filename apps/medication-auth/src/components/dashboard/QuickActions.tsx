import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon, ChartBarIcon } from '@/components/icons';

export function QuickActions() {
  const actions = [
    {
      name: 'New Authorization',
      href: '/create',
      icon: PlusIcon,
      description: 'Start a new medication authorization request',
      color: 'bg-blue-600 hover:bg-blue-700',
      primary: true,
    },
    {
      name: 'Search Patients',
      href: '/create?step=patient',
      icon: MagnifyingGlassIcon,
      description: 'Find patient and view history',
      color: 'bg-gray-600 hover:bg-gray-700',
    },
    {
      name: 'View Reports',
      href: '/analytics',
      icon: ChartBarIcon,
      description: 'Analytics and performance reports',
      color: 'bg-green-600 hover:bg-green-700',
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {actions.map((action) => (
        <Link
          key={action.name}
          href={action.href}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${action.color} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
            action.primary ? 'text-white' : ''
          }`}
          title={action.description}
        >
          <action.icon className="w-4 h-4 mr-2" />
          {action.name}
        </Link>
      ))}
    </div>
  );
}