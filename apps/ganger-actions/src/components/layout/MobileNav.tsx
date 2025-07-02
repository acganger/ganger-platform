import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { 
  X, 
  Home, 
  Ticket, 
  Users, 
  FileText, 
  Clock, 
  Settings,
  PlusCircle,
  Building2,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Tickets', href: '/tickets', icon: Ticket },
  { name: 'New Ticket', href: '/tickets/new', icon: PlusCircle },
  { name: 'Time Off Requests', href: '/time-off', icon: Clock },
  { name: 'Punch Corrections', href: '/punch-fix', icon: FileText },
];

const managerNavigation = [
  { name: 'Team Overview', href: '/team', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'User Management', href: '/users', icon: Users },
];

const adminNavigation = [
  { name: 'System Settings', href: '/admin/settings', icon: Settings },
  { name: 'All Locations', href: '/admin/locations', icon: Building2 },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItemProps {
  item: {
    name: string;
    href: string;
    icon: any;
  };
  isActive: boolean;
  onClick: () => void;
}

const NavigationItem = ({ item, isActive, onClick }: NavigationItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center rounded-md px-3 py-3 text-base font-medium transition-colors',
        isActive
          ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-500'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent'
      )}
    >
      <item.icon
        className={cn(
          'mr-4 h-6 w-6 flex-shrink-0',
          isActive
            ? 'text-primary-500'
            : 'text-gray-400 group-hover:text-gray-500'
        )}
      />
      {item.name}
    </button>
  );
};

export const MobileNav = ({ isOpen, onClose }: MobileNavProps) => {
  const { authUser } = useAuth();
  const router = useRouter();
  
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return router.pathname === '/dashboard';
    }
    return router.pathname.startsWith(href);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-0 z-50 flex">
        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4">
          {/* Close button */}
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Logo/Brand */}
          <div className="flex flex-shrink-0 items-center px-4 mb-8">
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

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4 space-y-8 overflow-y-auto">
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
                    onClick={() => handleNavigation(item.href)}
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
                      onClick={() => handleNavigation(item.href)}
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
                      onClick={() => handleNavigation(item.href)}
                    />
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* User Info */}
          <div className="flex-shrink-0 border-t border-gray-200 px-4 py-4">
            <div className="flex items-center">
              <div>
                <p className="text-base font-medium text-gray-700">
                  {authUser?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {authUser?.location} • {authUser?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-14 flex-shrink-0" aria-hidden="true">
          {/* Dummy element to force sidebar to shrink to fit close icon */}
        </div>
      </div>
    </div>
  );
};