import { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Menu, 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@ganger/ui-catalyst';
import { Avatar } from '@ganger/ui-catalyst';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export const Header = ({ title, onMenuClick }: HeaderProps) => {
  const { authUser, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Left side - Mobile menu button and title */}
          <div className="flex items-center">
            <Button
              plain
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </Button>
            
            <h1 className="ml-4 lg:ml-0 text-2xl font-semibold text-gray-900">
              {title}
            </h1>
          </div>

          {/* Center - Search bar (hidden on mobile) */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search tickets, users, or content..."
              />
            </form>
          </div>

          {/* Right side - Notifications and user menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              plain
              size="sm"
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
            </Button>

            {/* User menu */}
            <div className="relative">
              <Button
                plain
                size="sm"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-2 text-sm bg-white hover:bg-gray-50 h-auto"
              >
                {/* User avatar */}
                <Avatar 
                  size="sm"
                  alt={authUser?.name || 'User'}
                />
                
                <div className="hidden md:block text-left">
                  <p className="text-gray-900 font-medium">
                    {authUser?.name || 'User'}
                  </p>
                  <p className="text-gray-500 text-xs capitalize">
                    {authUser?.role || 'Staff'}
                  </p>
                </div>
                
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                        <p className="font-medium text-gray-900">
                          {authUser?.name}
                        </p>
                        <p className="text-xs">
                          {authUser?.email}
                        </p>
                      </div>
                      
                      <Button
                        plain
                        size="sm"
                        onClick={() => {
                          setUserMenuOpen(false);
                          router.push('/profile');
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 justify-start h-auto"
                      >
                        <User className="h-4 w-4 mr-3" />
                        Your Profile
                      </Button>
                      
                      <Button
                        plain
                        size="sm"
                        onClick={() => {
                          setUserMenuOpen(false);
                          router.push('/settings');
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 justify-start h-auto"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </Button>
                      
                      <div className="border-t border-gray-100">
                        <Button
                          plain
                          size="sm"
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 justify-start h-auto"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign out
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
