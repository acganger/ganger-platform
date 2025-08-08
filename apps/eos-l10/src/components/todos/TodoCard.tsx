import React, { useState } from 'react';
import { Todo } from '@/types/eos';
// import { formatDistanceToNow, format, isAfter, isToday, isTomorrow } from 'date-fns';
import { 
  CheckSquare,
  Square,
  Clock,
  User,
  Calendar,
  MoreVertical,
  Edit3,
  Trash2,
  Flag,
  AlertTriangle,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react';

interface TodoCardProps {
  todo: Todo;
  onUpdate: (todoId: string, updates: Partial<Todo>) => void;
  onDelete: (todoId: string) => void;
  onClick?: () => void;
  compact?: boolean;
  dragging?: boolean;
}

const priorityConfig = {
  high: { color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', icon: AlertTriangle },
  medium: { color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', icon: Flag },
  low: { color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50', icon: Flag }
};

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Square },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Play },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  dropped: { label: 'Dropped', color: 'bg-gray-100 text-gray-500', icon: Pause }
};

export default function TodoCard({ 
  todo, 
  onUpdate, 
  onDelete, 
  onClick, 
  compact = false, 
  dragging = false 
}: TodoCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const priorityStyle = priorityConfig[todo.priority];
  const statusStyle = statusConfig[todo.status];
  const PriorityIcon = priorityStyle.icon;

  const handleStatusToggle = async () => {
    setIsUpdating(true);
    try {
      const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
      await onUpdate(todo.id, { status: newStatus });
    } catch (error) {
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: Todo['status']) => {
    setIsUpdating(true);
    try {
      await onUpdate(todo.id, { status: newStatus });
    } catch (error) {
    } finally {
      setIsUpdating(false);
      setShowActions(false);
    }
  };

  const handlePriorityChange = async (newPriority: Todo['priority']) => {
    setIsUpdating(true);
    try {
      await onUpdate(todo.id, { priority: newPriority });
    } catch (error) {
    } finally {
      setIsUpdating(false);
      setShowActions(false);
    }
  };

  const getDueDateInfo = () => {
    const dueDate = new Date(todo.due_date);
    const now = new Date();
    
    const isToday = dueDate.toDateString() === now.toDateString();
    const isTomorrow = dueDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) {
      return { text: 'Due today', color: 'text-orange-600', urgent: true };
    }
    
    if (isTomorrow) {
      return { text: 'Due tomorrow', color: 'text-yellow-600', urgent: false };
    }
    
    if (now > dueDate && todo.status !== 'completed') {
      return { 
        text: `Overdue`, 
        color: 'text-red-600', 
        urgent: true 
      };
    }
    
    return { 
      text: `Due ${dueDate.toLocaleDateString()}`, 
      color: 'text-gray-600', 
      urgent: false 
    };
  };

  const dueDateInfo = getDueDateInfo();

  const getTimestamp = () => {
    if (todo.completed_at) {
      return `Completed ${new Date(todo.completed_at).toLocaleDateString()}`;
    }
    return `Created ${new Date(todo.created_at).toLocaleDateString()}`;
  };

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-md ${
        dragging ? 'shadow-xl ring-2 ring-eos-500 ring-opacity-50' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${
        compact ? 'p-3' : 'p-4'
      } ${todo.status === 'completed' ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {/* Status Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusToggle();
            }}
            disabled={isUpdating}
            className={`mt-1 flex-shrink-0 transition-colors ${
              todo.status === 'completed'
                ? 'text-green-600 hover:text-green-700'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {todo.status === 'completed' ? (
              <CheckSquare className="h-5 w-5" />
            ) : (
              <Square className="h-5 w-5" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className={`font-medium ${compact ? 'text-sm' : 'text-base'} ${
              todo.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
            }`}>
              {todo.title}
            </h3>
            
            {/* Description */}
            {todo.description && !compact && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {todo.description}
              </p>
            )}
            
            {/* Meta Info */}
            <div className="flex items-center mt-2 space-x-3 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span className={dueDateInfo.color}>{dueDateInfo.text}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{getTimestamp()}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>Assigned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Priority & Actions */}
        <div className="flex items-center space-x-2">
          {/* Priority Indicator */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${priorityStyle.textColor} ${priorityStyle.bgColor}`}>
            <PriorityIcon className="h-3 w-3" />
            <span className="text-xs font-medium capitalize">{todo.priority}</span>
          </div>

          {/* Actions Menu */}
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
                    {Object.entries(statusConfig).map(([status, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={status}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(status as Todo['status']);
                          }}
                          disabled={todo.status === status || isUpdating}
                          className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-2 ${
                            todo.status === status ? 'bg-gray-100' : ''
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{config.label}</span>
                        </button>
                      );
                    })}
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
                          handlePriorityChange(priority as Todo['priority']);
                        }}
                        disabled={todo.priority === priority || isUpdating}
                        className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-2 ${
                          todo.priority === priority ? 'bg-gray-100' : ''
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
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this todo?')) {
                        setIsDeleting(true);
                        try {
                          await onDelete(todo.id);
                          setShowActions(false);
                        } catch (error) {
                          console.error('Failed to delete todo:', error);
                        } finally {
                          setIsDeleting(false);
                        }
                      }
                    }}
                    disabled={isDeleting || isUpdating}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-red-50 text-red-600 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <div className="h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    <span>{isDeleting ? 'Deleting...' : 'Delete Todo'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs ${statusStyle.color}`}>
            {statusStyle.label}
          </span>
          
          {dueDateInfo.urgent && (
            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
              Urgent
            </span>
          )}
        </div>

        {/* Assignment info will be populated from user data */}
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <User className="h-3 w-3" />
          <span>Assignee</span>
        </div>
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