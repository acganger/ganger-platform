import { useState } from 'react';
import { useAuth } from '@/lib/auth-eos';
import { ChevronDown, Check, Users } from 'lucide-react';

export default function TeamSelector() {
  const { userTeams, activeTeam, setActiveTeam } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (userTeams.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eos-500"
      >
        <Users className="h-4 w-4 mr-2 text-gray-500" />
        <span className="max-w-32 truncate">
          {activeTeam?.name || 'Select Team'}
        </span>
        <ChevronDown className="h-4 w-4 ml-2 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Your Teams
            </p>
          </div>
          
          {userTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => {
                setActiveTeam(team);
                setIsOpen(false);
              }}
              className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {team.name}
                </p>
                {team.description && (
                  <p className="text-xs text-gray-500 truncate">
                    {team.description}
                  </p>
                )}
              </div>
              
              {activeTeam?.id === team.id && (
                <Check className="h-4 w-4 text-eos-600 ml-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}