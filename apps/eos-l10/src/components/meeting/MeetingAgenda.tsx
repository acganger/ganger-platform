import React from 'react';
import { L10Agenda } from '@/types/eos';
import { 
  MessageSquare,
  BarChart3,
  Target,
  Users,
  CheckSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Check
} from 'lucide-react';

interface MeetingAgendaProps {
  agenda: L10Agenda;
  currentSegment: keyof L10Agenda;
  onSegmentClick: (segment: keyof L10Agenda) => void;
}

const agendaItems = [
  {
    key: 'segue' as const,
    title: 'Segue',
    description: 'Good news & personal/business best',
    icon: MessageSquare,
    color: 'bg-blue-500'
  },
  {
    key: 'scorecard' as const,
    title: 'Scorecard',
    description: 'Review weekly metrics',
    icon: BarChart3,
    color: 'bg-green-500'
  },
  {
    key: 'rock_review' as const,
    title: 'Rock Review',
    description: 'Quarterly goals progress',
    icon: Target,
    color: 'bg-purple-500'
  },
  {
    key: 'customer_employee_headlines' as const,
    title: 'Headlines',
    description: 'Customer & employee updates',
    icon: Users,
    color: 'bg-orange-500'
  },
  {
    key: 'todo_review' as const,
    title: 'To-Do Review',
    description: 'Previous week assignments',
    icon: CheckSquare,
    color: 'bg-indigo-500'
  },
  {
    key: 'ids' as const,
    title: 'IDS',
    description: 'Identify, Discuss, Solve',
    icon: AlertCircle,
    color: 'bg-red-500'
  },
  {
    key: 'conclude' as const,
    title: 'Conclude',
    description: 'Recap & next steps',
    icon: CheckCircle,
    color: 'bg-gray-500'
  }
];

export default function MeetingAgenda({ agenda, currentSegment, onSegmentClick }: MeetingAgendaProps) {
  const getSegmentStatus = (key: keyof L10Agenda) => {
    if (agenda[key].completed) return 'completed';
    if (key === currentSegment) return 'current';
    
    // Check if this segment should be available (all previous completed)
    const currentIndex = agendaItems.findIndex(item => item.key === currentSegment);
    const segmentIndex = agendaItems.findIndex(item => item.key === key);
    
    if (segmentIndex < currentIndex) return 'completed';
    if (segmentIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const totalDuration = Object.values(agenda).reduce((sum, segment) => sum + segment.duration, 0);
  const completedDuration = Object.values(agenda)
    .filter(segment => segment.completed)
    .reduce((sum, segment) => sum + segment.duration, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Meeting Agenda</h3>
        <div className="text-sm text-gray-600 mb-4">
          Progress: {completedDuration} / {totalDuration} minutes
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-eos-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedDuration / totalDuration) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {agendaItems.map((item, index) => {
          const Icon = item.icon;
          const status = getSegmentStatus(item.key);
          const segment = agenda[item.key];
          
          return (
            <button
              key={item.key}
              onClick={() => onSegmentClick(item.key)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                status === 'current'
                  ? 'bg-eos-50 border-2 border-eos-200 shadow-sm'
                  : status === 'completed'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
              disabled={status === 'upcoming'}
            >
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  status === 'completed' 
                    ? 'bg-green-100' 
                    : status === 'current'
                    ? 'bg-eos-100'
                    : 'bg-gray-100'
                }`}>
                  {status === 'completed' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : status === 'current' ? (
                    <Play className="h-4 w-4 text-eos-600" />
                  ) : (
                    <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${
                      status === 'current' 
                        ? 'text-eos-700' 
                        : status === 'completed'
                        ? 'text-green-700'
                        : 'text-gray-900'
                    }`}>
                      {item.title}
                    </h4>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{segment.duration}m</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Meeting controls */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>Tip: Click on segments to navigate</p>
          <p>Stay focused and keep time</p>
        </div>
      </div>
    </div>
  );
}