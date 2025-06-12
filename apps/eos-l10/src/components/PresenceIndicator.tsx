import { usePresence } from '@/hooks/usePresence';
import { Users, Circle } from 'lucide-react';

interface PresenceIndicatorProps {
  page?: string;
  showCount?: boolean;
  showAvatars?: boolean;
  maxAvatars?: number;
}

export default function PresenceIndicator({ 
  page = 'dashboard', 
  showCount = true,
  showAvatars = true,
  maxAvatars = 5 
}: PresenceIndicatorProps) {
  const { onlineUsers } = usePresence(page);

  if (onlineUsers.length === 0) {
    return null;
  }

  const displayUsers = onlineUsers.slice(0, maxAvatars);
  const extraCount = Math.max(0, onlineUsers.length - maxAvatars);

  return (
    <div className="flex items-center space-x-2">
      {showAvatars && (
        <div className="flex -space-x-2">
          {displayUsers.map((user) => (
            <div
              key={user.user_id}
              className="relative"
              title={`${user.full_name} - ${user.page}`}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-8 h-8 rounded-full border-2 border-white bg-gray-100"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-eos-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-eos-700">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
          ))}
          
          {extraCount > 0 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                +{extraCount}
              </span>
            </div>
          )}
        </div>
      )}

      {showCount && (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Circle className="w-2 h-2 fill-green-400 text-green-400" />
          <span>{onlineUsers.length} online</span>
        </div>
      )}

      {!showAvatars && (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{onlineUsers.length}</span>
        </div>
      )}
    </div>
  );
}

export function PresenceDot({ userId }: { userId: string }) {
  const { onlineUsers } = usePresence();
  const isOnline = onlineUsers.some(user => user.user_id === userId);

  if (!isOnline) {
    return null;
  }

  return (
    <div 
      className="w-2 h-2 bg-green-400 rounded-full"
      title="Online"
    />
  );
}

export function TeamPresenceIndicator() {
  const { onlineUsers } = usePresence();

  return (
    <div className="hidden sm:flex items-center space-x-3 bg-white rounded-lg px-3 py-2 shadow-sm border">
      <div className="flex items-center space-x-1">
        <Circle className="w-2 h-2 fill-green-400 text-green-400" />
        <span className="text-sm text-gray-600 font-medium">
          {onlineUsers.length} team member{onlineUsers.length !== 1 ? 's' : ''} online
        </span>
      </div>
      
      {onlineUsers.length > 0 && (
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 3).map((user) => (
            <div
              key={user.user_id}
              className="relative"
              title={user.full_name}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-6 h-6 rounded-full border-2 border-white"
                />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-eos-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-eos-700">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          ))}
          
          {onlineUsers.length > 3 && (
            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                +{onlineUsers.length - 3}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}