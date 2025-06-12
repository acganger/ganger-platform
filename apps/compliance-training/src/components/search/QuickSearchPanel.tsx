'use client'

import React from 'react';
import { Card, Button } from '../ui/ComponentWrappers';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Users, 
  MapPin, 
  Zap 
} from 'lucide-react';
import type { FilterOptions } from '@/types/compliance';

interface QuickSearchPanelProps {
  onFilterChange: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  statsData?: {
    overdueCount: number;
    dueSoonCount: number;
    completedCount: number;
    notStartedCount: number;
  };
}

interface QuickFilter {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  filters: Partial<FilterOptions>;
  color: string;
  count?: number;
}

export function QuickSearchPanel({ 
  onFilterChange, 
  currentFilters, 
  statsData 
}: QuickSearchPanelProps) {
  const quickFilters: QuickFilter[] = [
    {
      id: 'overdue',
      label: 'Overdue Training',
      description: 'Employees with expired training',
      icon: <AlertTriangle className="h-4 w-4" />,
      filters: { status: 'overdue' },
      color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
      count: statsData?.overdueCount
    },
    {
      id: 'due_soon',
      label: 'Due Soon',
      description: 'Training expiring within 30 days',
      icon: <Clock className="h-4 w-4" />,
      filters: { status: 'due_soon' },
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
      count: statsData?.dueSoonCount
    },
    {
      id: 'completed',
      label: 'Up to Date',
      description: 'All training completed and current',
      icon: <CheckCircle className="h-4 w-4" />,
      filters: { status: 'completed' },
      color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
      count: statsData?.completedCount
    },
    {
      id: 'not_started',
      label: 'Not Started',
      description: 'Training never attempted',
      icon: <Users className="h-4 w-4" />,
      filters: { status: 'not_started' },
      color: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
      count: statsData?.notStartedCount
    },
    {
      id: 'ann_arbor',
      label: 'Ann Arbor',
      description: 'Employees at Ann Arbor location',
      icon: <MapPin className="h-4 w-4" />,
      filters: { location: 'Ann Arbor' },
      color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
    },
    {
      id: 'recent',
      label: 'Recent Activity',
      description: 'Training completed in last 3 months',
      icon: <Zap className="h-4 w-4" />,
      filters: { timeRange: 'last_3_months' },
      color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
    }
  ];

  const handleQuickFilter = (quickFilter: QuickFilter) => {
    // Merge with current filters, but reset conflicting ones
    const newFilters: FilterOptions = {
      ...currentFilters,
      ...quickFilter.filters
    };

    // If applying a status filter, clear other status-related filters
    if (quickFilter.filters.status) {
      newFilters.searchTerm = '';
    }

    onFilterChange(newFilters);
  };

  const isFilterActive = (quickFilter: QuickFilter): boolean => {
    return Object.entries(quickFilter.filters).every(([key, value]) => {
      return currentFilters[key as keyof FilterOptions] === value;
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Quick Filters</h3>
        <span className="text-xs text-gray-500">Click to apply common filters</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {quickFilters.map((filter) => {
          const isActive = isFilterActive(filter);
          
          return (
            <button
              key={filter.id}
              onClick={() => handleQuickFilter(filter)}
              className={`
                relative p-2 sm:p-3 rounded-lg border transition-all duration-200 text-left
                ${isActive 
                  ? filter.color.replace('hover:', '') + ' ring-2 ring-opacity-50 ' + filter.color.split(' ')[2].replace('text-', 'ring-')
                  : filter.color
                }
              `}
              title={filter.description}
            >
              <div className="flex items-center justify-between mb-2">
                {filter.icon}
                {filter.count !== undefined && (
                  <span className="text-xs font-medium px-1.5 py-0.5 bg-white bg-opacity-80 rounded">
                    {filter.count}
                  </span>
                )}
              </div>
              
              <div className="text-xs font-medium mb-1">
                {filter.label}
              </div>
              
              <div className="text-xs opacity-75 line-clamp-2 hidden sm:block">
                {filter.description}
              </div>

              {isActive && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-current rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}