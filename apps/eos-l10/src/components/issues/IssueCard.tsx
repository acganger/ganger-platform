import React, { useState } from 'react';
import { Issue } from '@/types/eos';
import { formatDistanceToNow } from 'date-fns';
import { 
  AlertTriangle,
  User,
  Clock,
  MessageSquare,
  CheckCircle,
  MoreVertical,
  Edit3,
  Trash2,
  UserCheck,
  Flag
} from 'lucide-react';

interface IssueCardProps {
  issue: Issue;
  onUpdate: (issueId: string, updates: Partial<Issue>) => void;
  onClick?: () => void;
  compact?: boolean;
  dragging?: boolean;
}

const priorityConfig = {
  critical: { color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  high: { color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
  medium: { color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  low: { color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50' }
};

const typeConfig = {
  obstacle: { icon: AlertTriangle, label: 'Obstacle', color: 'text-red-600' },
  opportunity: { icon: Flag, label: 'Opportunity', color: 'text-green-600' },
  process: { icon: CheckCircle, label: 'Process', color: 'text-blue-600' },
  people: { icon: User, label: 'People', color: 'text-purple-600' },
  other: { icon: MessageSquare, label: 'Other', color: 'text-gray-600' }
};

const statusConfig = {
  identified: { label: 'Identified', color: 'bg-gray-100 text-gray-700' },
  discussing: { label: 'Discussing', color: 'bg-blue-100 text-blue-700' },
  solved: { label: 'Solved', color: 'bg-green-100 text-green-700' },
  dropped: { label: 'Dropped', color: 'bg-gray-100 text-gray-500' }
};

export default function IssueCard({ 
  issue, 
  onUpdate, 
  onClick, 
  compact = false, 
  dragging = false 
}: IssueCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const priorityStyle = priorityConfig[issue.priority];
  const typeStyle = typeConfig[issue.type];
  const statusStyle = statusConfig[issue.status];
  const TypeIcon = typeStyle.icon;

  const handleStatusChange = async (newStatus: Issue['status']) => {
    setIsUpdating(true);
    try {
      const updates: Partial<Issue> = { status: newStatus };
      if (newStatus === 'solved' && issue.status !== 'solved') {
        updates.solved_at = new Date().toISOString();
      }
      await onUpdate(issue.id, updates);
    } catch (error) {
    } finally {
      setIsUpdating(false);
      setShowActions(false);
    }
  };

  const handlePriorityChange = async (newPriority: Issue['priority']) => {
    setIsUpdating(true);
    try {
      await onUpdate(issue.id, { priority: newPriority });
    } catch (error) {
    } finally {
      setIsUpdating(false);
      setShowActions(false);
    }
  };

  const getTimestamp = () => {
    if (issue.solved_at) {
      return `Solved ${formatDistanceToNow(new Date(issue.solved_at))} ago`;
    }
    return `Created ${formatDistanceToNow(new Date(issue.created_at))} ago`;
  };

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-md ${
        dragging ? 'shadow-xl ring-2 ring-eos-500 ring-opacity-50' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${
        compact ? 'p-3' : 'p-4'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {/* Priority Indicator */}
          <div className={`w-1 h-12 ${priorityStyle.color} rounded-full flex-shrink-0`} />
          
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              {issue.title}
            </h3>
            
            {/* Description */}
            {issue.description && !compact && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {issue.description}
              </p>
            )}
            
            {/* Meta Info */}
            <div className="flex items-center mt-2 space-x-3 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <TypeIcon className={`h-3 w-3 ${typeStyle.color}`} />
                <span>{typeStyle.label}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{getTimestamp()}</span>
              </div>
              
              {issue.owner_id && (
                <div className="flex items-center space-x-1">
                  <UserCheck className="h-3 w-3" />
                  <span>Assigned</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            disabled={isUpdating}
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-8 bg-white shadow-lg border border-gray-200 rounded-lg py-1 z-10 min-w-48">
              {/* Status Changes */}
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">CHANGE STATUS</p>
                <div className="space-y-1">
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <button
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(status as Issue['status']);
                      }}
                      disabled={issue.status === status || isUpdating}
                      className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 disabled:opacity-50 ${
                        issue.status === status ? 'bg-gray-100' : ''
                      }`}
                    >
                      <span className={`inline-block px-2 py-1 rounded-full ${config.color}`}>
                        {config.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Changes */}
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">CHANGE PRIORITY</p>
                <div className="space-y-1">
                  {Object.entries(priorityConfig).map(([priority, config]) => (
                    <button
                      key={priority}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePriorityChange(priority as Issue['priority']);
                      }}
                      disabled={issue.priority === priority || isUpdating}
                      className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-2 ${
                        issue.priority === priority ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${config.color}`} />
                      <span className="capitalize">{priority}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Other Actions */}
              <div className="px-3 py-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(false);
                    onClick?.();
                  }}
                  className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Edit Details</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this issue?')) {
                      // Handle delete - would need to be passed as prop
                      setShowActions(false);
                    }
                  }}
                  className="w-full text-left px-2 py-1 text-xs rounded hover:bg-red-50 text-red-600 flex items-center space-x-2"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete Issue</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs ${statusStyle.color}`}>
            {statusStyle.label}
          </span>
          
          <span className={`px-2 py-1 rounded-full text-xs ${priorityStyle.textColor} ${priorityStyle.bgColor}`}>
            {issue.priority}
          </span>
        </div>

        {issue.solution && (
          <div className="flex items-center space-x-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span className="text-xs">Has Solution</span>
          </div>
        )}
      </div>

      {/* Click overlay to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
}