import { useRouter } from 'next/router';
import SafeLink from '@/components/ui/SafeLink';
import { 
  Home, 
  Target, 
  BarChart3, 
  AlertCircle, 
  CheckSquare, 
  Calendar,
  Users
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
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
  {
    name: 'Meetings',
    href: '/meetings',
    icon: Calendar,
  },
];

export default function MobileNavigation() {
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(href);
  };

  return (
    <nav className="mobile-nav">
      <div className="grid grid-cols-6 gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <SafeLink
              key={item.name}
              href={item.href}
              className={`mobile-nav-item touch-target touch-feedback ${
                active ? 'active' : ''
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </SafeLink>
          );
        })}
      </div>
    </nav>
  );
}