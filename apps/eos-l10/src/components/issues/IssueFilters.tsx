import React from 'react';
import { useAuth } from '@/lib/auth-eos';
import { 
  X, 
  Filter, 
  RotateCcw,
  AlertTriangle,
  User,
  CheckCircle,
  Flag,
  MessageSquare
} from 'lucide-react';

interface IssueFiltersProps {
  filters: {
    status: string;
    priority: string;
    type: string;
    owner: string;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'identified', label: 'Identified' },
  { value: 'discussing', label: 'Discussing' },
  { value: 'solved', label: 'Solved' },
  { value: 'dropped', label: 'Dropped' }
];

const priorityOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low', color: 'bg-gray-500' }
];

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'obstacle', label: 'Obstacle', icon: AlertTriangle, color: 'text-red-600' },
  { value: 'opportunity', label: 'Opportunity', icon: Flag, color: 'text-green-600' },
  { value: 'process', label: 'Process', icon: CheckCircle, color: 'text-blue-600' },
  { value: 'people', label: 'People', icon: User, color: 'text-purple-600' },
  { value: 'other', label: 'Other', icon: MessageSquare, color: 'text-gray-600' }
];

export default function IssueFilters({ filters, onFiltersChange, onClose }: IssueFiltersProps) {
  const teamMembers: any[] = []; // Fix team members access

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: 'all',
      priority: 'all',
      type: 'all',
      owner: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== 'all');

  const ownerOptions = [
    { value: 'all', label: 'All Owners' },
    { value: 'unassigned', label: 'Unassigned Issues' },
    ...(teamMembers?.map(member => ({
      value: member.user_id,
      label: member.user.full_name
    })) || [])
  ];

  return (
    <div className="bg-white border-b border-gray-200 p-4">
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
      <div className="space-y-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('status', option.value)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filters.status === option.value
                    ? 'bg-eos-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <div className="flex flex-wrap gap-2">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('priority', option.value)}
                className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center space-x-2 ${
                  filters.priority === option.value
                    ? 'bg-eos-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.color && option.value !== 'all' && (
                  <div className={`w-2 h-2 rounded-full ${
                    filters.priority === option.value ? 'bg-white' : option.color
                  }`} />
                )}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange('type', option.value)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center space-x-2 ${
                    filters.type === option.value
                      ? 'bg-eos-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {Icon && (
                    <Icon className={`h-3 w-3 ${
                      filters.type === option.value ? 'text-white' : option.color
                    }`} />
                  )}
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Owner Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Owner
          </label>
          <div className="flex flex-wrap gap-2">
            {ownerOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('owner', option.value)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filters.owner === option.value
                    ? 'bg-eos-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Active filters: {Object.values(filters).filter(f => f !== 'all').length}
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