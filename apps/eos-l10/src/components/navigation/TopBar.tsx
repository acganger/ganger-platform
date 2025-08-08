import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-eos';
import { 
  Menu, 
  Bell, 
  Search, 
  Wifi, 
  WifiOff,
  ChevronDown
} from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
  showMenuButton: boolean;
}

export default function TopBar({ onMenuClick, showMenuButton }: TopBarProps) {
  const { user, signOut, activeTeam } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatTime = () => {
    return new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const [currentTime, setCurrentTime] = useState(formatTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTime());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu className="h-5 w-5 text-gray-500" />
            </button>
          )}

          {/* Search - Hidden on small screens */}
          <div className="hidden sm:block relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-eos-500 focus:border-eos-500"
            />
          </div>
        </div>

        {/* Center Section - Team Info */}
        <div className="hidden md:flex items-center space-x-2">
          <div className="text-sm text-gray-600">
            {activeTeam?.name}
          </div>
          <div className="text-xs text-gray-400">
            {currentTime}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="h-5 w-5 text-gray-500" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
            >
              <div className="w-8 h-8 bg-eos-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.full_name || user?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || 'No email'}
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Navigate to profile
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </button>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Navigate to settings
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </button>
                
                <div className="border-t border-gray-200 my-1" />
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}