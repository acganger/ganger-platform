import React from 'react';
import { 
  X, 
  Filter, 
  RotateCcw,
  CheckSquare,
  Square,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Flag,
  Calendar,
  Clock,
  User
} from 'lucide-react';

interface TodoFiltersProps {
  filters: {
    status: string;
    priority: string;
    assignee: string;
    dueDate: string;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

const statusOptions = [
  { value: 'all', label: 'All Todos', icon: CheckSquare },
  { value: 'active', label: 'Active (Not Completed)', icon: Square },
  { value: 'pending', label: 'Pending', icon: Square },
  { value: 'in_progress', label: 'In Progress', icon: Play },
  { value: 'completed', label: 'Completed', icon: CheckCircle },
  { value: 'dropped', label: 'Dropped', icon: Pause }
];

const priorityOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'high', label: 'High Priority', color: 'bg-red-500', icon: AlertTriangle },
  { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-500', icon: Flag },
  { value: 'low', label: 'Low Priority', color: 'bg-gray-500', icon: Flag }
];

const dueDateOptions = [
  { value: 'all', label: 'All Due Dates', icon: Calendar },
  { value: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'text-red-600' },
  { value: 'today', label: 'Due Today', icon: Clock, color: 'text-orange-600' },
  { value: 'tomorrow', label: 'Due Tomorrow', icon: Clock, color: 'text-yellow-600' },
  { value: 'this_week', label: 'Due This Week', icon: Calendar, color: 'text-blue-600' }
];

export default function TodoFilters({ filters, onFiltersChange, onClose }: TodoFiltersProps) {
  const teamMembers: any[] = []; // Fix team members access
  const user = null; // Fix user access

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: 'active',
      priority: 'all',
      assignee: 'all',
      dueDate: 'all'
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'status') return value !== 'active'; // 'active' is default
    return value !== 'all';
  });

  const assigneeOptions = [
    { value: 'all', label: 'All Assignees' },
    { value: 'me', label: 'Assigned to Me' },
    { value: 'unassigned', label: 'Unassigned Todos' },
    ...(teamMembers?.map(member => ({
      value: member.user_id,
      label: member.user.full_name,
      subtitle: member.seat
    })) || [])
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="bg-eos-100 text-eos-700 px-2 py-1 rounded-full text-xs">
              Active
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Clear</span>
            </button>
          )}
          
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Status
          </label>
          <div className="space-y-2">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange('status', option.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-3 ${
                    filters.status === option.value
                      ? 'bg-eos-50 text-eos-700 border border-eos-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Priority
          </label>
          <div className="space-y-2">
            {priorityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange('priority', option.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-3 ${
                    filters.priority === option.value
                      ? 'bg-eos-50 text-eos-700 border border-eos-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  {option.color ? (
                    <div className={`w-3 h-3 rounded-full ${option.color}`} />
                  ) : Icon ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Due Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Due Date
          </label>
          <div className="space-y-2">
            {dueDateOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange('dueDate', option.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-3 ${
                    filters.dueDate === option.value
                      ? 'bg-eos-50 text-eos-700 border border-eos-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${option.color || ''}`} />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assignee Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Assignee
          </label>
          <div className="space-y-2">
            {assigneeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('assignee', option.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-3 ${
                  filters.assignee === option.value
                    ? 'bg-eos-50 text-eos-700 border border-eos-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <User className="h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <div>{option.label}</div>
                  {'subtitle' in option && option.subtitle && (
                    <div className="text-xs text-gray-500">{option.subtitle}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Active filters: {Object.entries(filters).filter(([key, value]) => {
                if (key === 'status') return value !== 'active';
                return value !== 'all';
              }).length}
            </span>
            <button
              onClick={clearAllFilters}
              className="text-eos-600 hover:text-eos-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}