import React from 'react';
import { MeetingParticipant } from '@/types/eos';
import { Users, Circle } from 'lucide-react';

interface MeetingParticipantsProps {
  participants: MeetingParticipant[];
  className?: string;
}

export default function MeetingParticipants({ participants, className = '' }: MeetingParticipantsProps) {
  const getStatusColor = (status: MeetingParticipant['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600">{participants.length}</span>
      </div>
      
      <div className="flex items-center space-x-1">
        {participants.slice(0, 5).map((participant) => (
          <div
            key={participant.id}
            className="relative"
            title={`${(participant as any).user?.full_name || 'Anonymous'} (${participant.status})`}
          >
            {(participant as any).user?.avatar_url ? (
              <img
                src={(participant as any).user.avatar_url}
                alt={(participant as any).user.full_name}
                className="w-8 h-8 rounded-full border-2 border-white"
              />
            ) : (
              <div className="w-8 h-8 bg-eos-600 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {getInitials((participant as any).user?.full_name || 'Unknown')}
                </span>
              </div>
            )}
            
            {/* Status indicator */}
            <div className="absolute -bottom-0.5 -right-0.5">
              <Circle 
                className={`h-3 w-3 border border-white rounded-full ${getStatusColor(participant.status)}`}
                fill="currentColor"
              />
            </div>
          </div>
        ))}
        
        {participants.length > 5 && (
          <div className="w-8 h-8 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              +{participants.length - 5}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}