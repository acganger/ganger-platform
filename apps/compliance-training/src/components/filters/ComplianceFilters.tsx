'use client'

import React, { useState, useMemo } from 'react';
import { Card, Button, Select, Input } from '../ui/ComponentWrappers';
import { Search, X, Filter, Calendar, Users, MapPin, Clock } from 'lucide-react';
import type { FilterOptions, Employee } from '@/types/compliance';

interface ComplianceFiltersProps {
  filters: FilterOptions;
  employees: Employee[];
  onFilterChange: (filters: FilterOptions) => void;
}

export function ComplianceFilters({ filters, employees, onFilterChange }: ComplianceFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);

  // Advanced filter options with counts
  const filterStats = useMemo(() => {
    const departments = new Map<string, number>();
    const locations = new Map<string, number>();
    const roles = new Map<string, number>();

    employees.forEach(emp => {
      departments.set(emp.department, (departments.get(emp.department) || 0) + 1);
      locations.set(emp.location, (locations.get(emp.location) || 0) + 1);
      roles.set(emp.role, (roles.get(emp.role) || 0) + 1);
    });

    return {
      departments: Array.from(departments.entries()).sort(),
      locations: Array.from(locations.entries()).sort(),
      roles: Array.from(roles.entries()).sort(),
      totalEmployees: employees.length
    };
  }, [employees]);

  const handleFilterUpdate = (key: keyof FilterOptions, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFilterChange({
      status: 'all',
      department: 'all',
      location: 'all',
      timeRange: 'current',
      searchTerm: '',
      role: 'all'
    });
  };

  const clearIndividualFilter = (key: keyof FilterOptions) => {
    const defaultValues: Partial<FilterOptions> = {
      status: 'all',
      department: 'all',
      location: 'all',
      timeRange: 'current',
      searchTerm: '',
      role: 'all'
    };
    
    handleFilterUpdate(key, defaultValues[key]);
  };

  const hasActiveFilters = 
    filters.status !== 'all' ||
    filters.department !== 'all' ||
    filters.location !== 'all' ||
    filters.timeRange !== 'current' ||
    !!filters.searchTerm ||
    filters.role !== 'all';

  const activeFilterCount = [
    filters.status !== 'all',
    filters.department !== 'all', 
    filters.location !== 'all',
    filters.timeRange !== 'current',
    !!filters.searchTerm,
    filters.role !== 'all'
  ].filter(Boolean).length;

  return (
    <Card className="filter-panel">
      {/* Header with expand/collapse */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filter Options</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
              {activeFilterCount} active
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              leftIcon={<X className="h-4 w-4" />}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Quick Search Bar - Always Visible */}
      <div className="mb-4">
        <div className={`relative transition-all duration-200 ${searchFocus ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search employees by name, email, department, or role..."
            value={filters.searchTerm || ''}
            onChange={(value) => handleFilterUpdate('searchTerm', value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            className="pl-10 text-sm"
          />
          {filters.searchTerm && (
            <button
              onClick={() => clearIndividualFilter('searchTerm')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Filter Section */}
      {isExpanded && (
        <div className="space-y-6">
          {/* Primary Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Compliance Status */}
            <div className="filter-section">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Compliance Status</label>
              </div>
              <Select
                value={filters.status}
                onChange={(value) => handleFilterUpdate('status', value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'overdue', label: 'Overdue' },
                  { value: 'due_soon', label: 'Due Soon' },
                  { value: 'not_started', label: 'Not Started' }
                ]}
              />
            </div>

            {/* Department */}
            <div className="filter-section">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Department</label>
              </div>
              <Select
                value={filters.department}
                onChange={(value) => handleFilterUpdate('department', value)}
                options={[
                  { value: 'all', label: `All Departments (${filterStats.totalEmployees})` },
                  ...filterStats.departments.map(([dept, count]) => ({
                    value: dept,
                    label: `${dept} (${count})`
                  }))
                ]}
              />
            </div>

            {/* Location */}
            <div className="filter-section">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Location</label>
              </div>
              <Select
                value={filters.location}
                onChange={(value) => handleFilterUpdate('location', value)}
                options={[
                  { value: 'all', label: `All Locations (${filterStats.totalEmployees})` },
                  ...filterStats.locations.map(([loc, count]) => ({
                    value: loc,
                    label: `${loc} (${count})`
                  }))
                ]}
              />
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            {/* Role Filter */}
            <div className="filter-section">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Job Role</label>
              </div>
              <Select
                value={filters.role || 'all'}
                onChange={(value) => handleFilterUpdate('role', value)}
                options={[
                  { value: 'all', label: `All Roles (${filterStats.totalEmployees})` },
                  ...filterStats.roles.map(([role, count]) => ({
                    value: role,
                    label: `${role} (${count})`
                  }))
                ]}
              />
            </div>

            {/* Time Range */}
            <div className="filter-section">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Time Range</label>
              </div>
              <Select
                value={filters.timeRange}
                onChange={(value) => handleFilterUpdate('timeRange', value)}
                options={[
                  { value: 'current', label: 'Current Period' },
                  { value: 'last_3_months', label: 'Last 3 Months' },
                  { value: 'last_6_months', label: 'Last 6 Months' },
                  { value: 'custom', label: 'Custom Range' }
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Active filters:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.status !== 'all' && (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Status: {filters.status.replace('_', ' ')}
                  <button
                    onClick={() => clearIndividualFilter('status')}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {filters.department !== 'all' && (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Department: {filters.department}
                  <button
                    onClick={() => clearIndividualFilter('department')}
                    className="ml-1 hover:text-green-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {filters.location !== 'all' && (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  Location: {filters.location}
                  <button
                    onClick={() => clearIndividualFilter('location')}
                    className="ml-1 hover:text-purple-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {filters.role !== 'all' && (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                  Role: {filters.role}
                  <button
                    onClick={() => clearIndividualFilter('role')}
                    className="ml-1 hover:text-orange-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {filters.searchTerm && (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                  Search: &quot;{filters.searchTerm}&quot;
                  <button
                    onClick={() => clearIndividualFilter('searchTerm')}
                    className="ml-1 hover:text-yellow-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}