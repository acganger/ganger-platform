import { useRouter } from 'next/router';
import SafeLink from '@/components/ui/SafeLink';
import { useAuth } from '@/lib/auth-eos';
import { 
  Home, 
  Target, 
  BarChart3, 
  AlertCircle, 
  CheckSquare, 
  Calendar,
  Users,
  FileText,
  Settings,
  X,
  PlayCircle
} from 'lucide-react';

interface DesktopSidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Level 10 Meeting',
    href: '/meeting/start',
    icon: PlayCircle,
    primary: true,
  },
  { type: 'divider' },
  {
    name: 'Rocks',
    href: '/rocks',
    icon: Target,
  },
  {
    name: 'Scorecard',
    href: '/scorecard',
    icon: BarChart3,
  },
  {
    name: 'Issues',
    href: '/issues',
    icon: AlertCircle,
  },
  {
    name: 'Todos',
    href: '/todos',
    icon: CheckSquare,
  },
  { type: 'divider' },
  {
    name: 'Meetings',
    href: '/meetings',
    icon: Calendar,
  },
  {
    name: 'Team',
    href: '/team',
    icon: Users,
  },
  {
    name: 'V/TO',
    href: '/vto',
    icon: FileText,
  },
  { type: 'divider' },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export default function DesktopSidebar({ mobile = false, onClose }: DesktopSidebarProps) {
  const router = useRouter();
  const { activeTeam, userRole } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(href);
  };

  const canAccess = (item: any) => {
    // Restrict certain features based on role
    if (item.href === '/settings' && userRole === 'viewer') {
      return false;
    }
    if (item.href === '/team' && userRole === 'viewer') {
      return false;
    }
    return true;
  };

  return (
    <div className={`${mobile ? 'h-full' : 'desktop-sidebar'} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-eos-600 rounded-lg flex items-center justify-center">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {activeTeam?.name || 'EOS L10'}
            </h2>
            <p className="text-xs text-gray-500 truncate">
              {userRole === 'leader' ? 'Team Leader' : 
               userRole === 'member' ? 'Team Member' : 'Viewer'}
            </p>
          </div>
        </div>
        
        {mobile && onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin">
        {navigation.map((item, index) => {
          if (item.type === 'divider') {
            return (
              <div key={index} className="border-t border-gray-200 my-4" />
            );
          }

          if (!canAccess(item) || !item.href || !item.icon) {
            return null;
          }

          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <SafeLink
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                active
                  ? 'bg-eos-100 text-eos-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              } ${item.primary ? 'mb-4' : ''}`}
              onClick={mobile ? onClose : undefined}
            >
              <Icon 
                className={`mr-3 h-5 w-5 ${
                  active ? 'text-eos-500' : 'text-gray-500 group-hover:text-gray-700'
                }`} 
              />
              <span className={item.primary ? 'font-semibold' : ''}>
                {item.name}
              </span>
              
              {item.primary && (
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              )}
            </SafeLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>EOS L10 Platform</p>
          <p>v1.0.0</p>
        </div>
      </div>
    </div>
  );
}