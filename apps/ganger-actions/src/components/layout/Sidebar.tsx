import { useRouter } from 'next/router';
import { 
  Home, 
  Ticket, 
  Users, 
  FileText, 
  Clock, 
  Settings,
  PlusCircle,
  Building2,
  BarChart3,
  Package,
  Clipboard,
  Pill,
  Monitor,
  Calendar,
  GraduationCap,
  Stethoscope,
  MessageSquare,
  Cog,
  Activity,
  Phone,
  UserCheck,
  Calculator,
  Palette
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@ganger/ui';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Submit Request', href: '/forms', icon: PlusCircle },
  { name: 'Tickets', href: '/tickets', icon: Ticket },
];

const appNavigation = [
  // Medical apps
  { name: 'Inventory Management', href: '/inventory', icon: Package, external: true },
  { name: 'Patient Handouts', href: '/handouts', icon: Clipboard, external: true },
  { name: 'Medication Auth', href: '/meds', icon: Pill, external: true },
  { name: 'Check-in Kiosk', href: '/kiosk', icon: Monitor, external: true },
  
  // Business apps
  { name: 'EOS L10', href: '/l10', icon: Calendar, external: true },
  { name: 'Compliance Training', href: '/compliance', icon: GraduationCap, external: true },
  { name: 'Clinical Staffing', href: '/staffing', icon: Stethoscope, external: true },
  { name: 'Social Reviews', href: '/socials', icon: MessageSquare, external: true },
];

const managerNavigation = [
  { name: 'Team Overview', href: '/team', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'User Management', href: '/users', icon: Users },
  
  // Management apps
  { name: 'Configuration', href: '/config', icon: Cog, external: true },
  { name: 'Integration Status', href: '/status', icon: Activity, external: true },
];

const adminNavigation = [
  { name: 'System Settings', href: '/admin/settings', icon: Settings },
  { name: 'All Locations', href: '/admin/locations', icon: Building2 },
  
  // Admin apps
  { name: 'AI Receptionist', href: '/ai-receptionist', icon: Phone, external: true },
  { name: 'Call Center Ops', href: '/call-center', icon: UserCheck, external: true },
  { name: 'Pharma Scheduling', href: '/reps', icon: Calendar, external: true },
  { name: 'Batch Closeout', href: '/batch', icon: Calculator, external: true },
  { name: 'Component Showcase', href: '/showcase', icon: Palette, external: true },
];

interface NavigationItemProps {
  item: {
    name: string;
    href: string;
    icon: any;
    external?: boolean;
  };
  isActive: boolean;
}

const NavigationItem = ({ item, isActive }: NavigationItemProps) => {
  const router = useRouter();
  
  const handleClick = () => {
    if (item.external) {
      // For external apps, navigate using window.location to trigger proper routing
      window.location.href = item.href;
    } else {
      router.push(item.href);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        'group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <item.icon
        className={cn(
          'mr-3 h-5 w-5 flex-shrink-0',
          isActive
            ? 'text-primary-500'
            : 'text-gray-400 group-hover:text-gray-500'
        )}
      />
      {item.name}
    </button>
  );
};

export const Sidebar = () => {
  const { authUser } = useAuth();
  const router = useRouter();
  
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return router.pathname === '/dashboard';
    }
    return router.pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
      {/* Logo/Brand */}
      <div className="flex items-center flex-shrink-0 px-4 mb-8">
        <div className="flex items-center">
          <Building2 className="h-8 w-8 text-primary-600" />
          <div className="ml-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Staff Portal
            </h2>
            <p className="text-xs text-gray-500">
              Ganger Dermatology
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-8">
        {/* Main Navigation */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Main
          </h3>
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavigationItem
                key={item.name}
                item={item}
                isActive={isActive(item.href)}
              />
            ))}
          </div>
        </div>

        {/* Manager Navigation */}
        {authUser && (authUser.role === 'manager' || authUser.role === 'admin') && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Management
            </h3>
            <div className="space-y-1">
              {managerNavigation.map((item) => (
                <NavigationItem
                  key={item.name}
                  item={item}
                  isActive={isActive(item.href)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Admin Navigation */}
        {authUser && authUser.role === 'admin' && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Administration
            </h3>
            <div className="space-y-1">
              {adminNavigation.map((item) => (
                <NavigationItem
                  key={item.name}
                  item={item}
                  isActive={isActive(item.href)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Platform Apps */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Platform Apps
          </h3>
          <div className="space-y-1">
            {appNavigation.map((item) => (
              <NavigationItem
                key={item.name}
                item={item}
                isActive={isActive(item.href)}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* User Info */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
        <div className="flex items-center">
          <div>
            <p className="text-sm font-medium text-gray-700">
              {authUser?.name}
            </p>
            <p className="text-xs text-gray-500">
              {authUser?.location} • {authUser?.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};