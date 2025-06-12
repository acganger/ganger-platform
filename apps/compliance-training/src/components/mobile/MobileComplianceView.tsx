'use client'

import React, { useState } from 'react';
import { Card, Button } from '../ui/ComponentWrappers';
import { 
  Menu,
  X,
  Filter,
  Search,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { ComplianceStatusBadge } from '@/components/shared/ComplianceStatusBadge';
import type { Employee, TrainingModule, TrainingCompletion, FilterOptions } from '@/types/compliance';

interface MobileComplianceViewProps {
  employees: Employee[];
  trainings: TrainingModule[];
  completions: TrainingCompletion[];
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onRefresh: () => void;
  onExport: () => void;
}

interface EmployeeSummary {
  employee: Employee;
  completedCount: number;
  overdueCount: number;
  dueSoonCount: number;
  totalRequired: number;
  complianceRate: number;
}

export function MobileComplianceView({
  employees,
  trainings,
  completions,
  filters,
  onFilterChange,
  onRefresh,
  onExport
}: MobileComplianceViewProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'employees' | 'trainings'>('employees');

  // Calculate employee summaries
  const employeeSummaries: EmployeeSummary[] = employees.map(employee => {
    const employeeCompletions = completions.filter(c => c.employeeId === employee.id);
    const completedCount = employeeCompletions.filter(c => c.status === 'completed').length;
    const overdueCount = employeeCompletions.filter(c => c.status === 'overdue').length;
    const dueSoonCount = employeeCompletions.filter(c => c.status === 'due_soon').length;
    const totalRequired = trainings.length;
    const complianceRate = totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0;

    return {
      employee,
      completedCount,
      overdueCount,
      dueSoonCount,
      totalRequired,
      complianceRate
    };
  });

  // Sort employees by compliance priority
  const sortedEmployeeSummaries = employeeSummaries.sort((a, b) => {
    if (a.overdueCount !== b.overdueCount) {
      return b.overdueCount - a.overdueCount; // Overdue first
    }
    if (a.dueSoonCount !== b.dueSoonCount) {
      return b.dueSoonCount - a.dueSoonCount; // Due soon second
    }
    return a.complianceRate - b.complianceRate; // Lower compliance rates first
  });

  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'overdue': return 'text-red-600';
      case 'due_soon': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      case 'due_soon': return <Clock className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const renderEmployeeCard = (summary: EmployeeSummary) => {
    const { employee, completedCount, overdueCount, dueSoonCount, totalRequired, complianceRate } = summary;
    const isExpanded = expandedEmployee === employee.id;
    const employeeCompletions = completions.filter(c => c.employeeId === employee.id);

    return (
      <Card key={employee.id} className="mb-3">
        <div 
          className="p-4 cursor-pointer"
          onClick={() => toggleEmployeeExpansion(employee.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {employee.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {employee.department} • {employee.location}
                  </p>
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                <div className="flex space-x-4 text-xs">
                  <span className="text-green-600">✓ {completedCount}</span>
                  {overdueCount > 0 && (
                    <span className="text-red-600">⚠ {overdueCount}</span>
                  )}
                  {dueSoonCount > 0 && (
                    <span className="text-yellow-600">⏰ {dueSoonCount}</span>
                  )}
                </div>
                <div className="text-xs font-medium">
                  {complianceRate}% complete
                </div>
              </div>
              
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    complianceRate >= 90 ? 'bg-green-500' :
                    complianceRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${complianceRate}%` }}
                />
              </div>
            </div>
            
            <div className="ml-3">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Training Status</h4>
            <div className="space-y-2">
              {trainings.map(training => {
                const completion = employeeCompletions.find(c => c.trainingId === training.id);
                const status = completion?.status || 'not_started';
                
                return (
                  <div key={training.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {training.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {training.category} • {training.durationMinutes}min
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <ComplianceStatusBadge status={status as any} size="sm" showText={false} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderTrainingCard = (training: TrainingModule) => {
    const trainingCompletions = completions.filter(c => c.trainingId === training.id);
    const completedCount = trainingCompletions.filter(c => c.status === 'completed').length;
    const overdueCount = trainingCompletions.filter(c => c.status === 'overdue').length;
    const dueSoonCount = trainingCompletions.filter(c => c.status === 'due_soon').length;
    const totalEmployees = employees.length;
    const complianceRate = totalEmployees > 0 ? Math.round((completedCount / totalEmployees) * 100) : 0;

    return (
      <Card key={training.id} className="mb-3 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {training.name}
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              {training.category} • {training.durationMinutes} minutes
            </p>
            
            <div className="flex space-x-4 text-xs mb-2">
              <span className="text-green-600">✓ {completedCount}</span>
              {overdueCount > 0 && (
                <span className="text-red-600">⚠ {overdueCount}</span>
              )}
              {dueSoonCount > 0 && (
                <span className="text-yellow-600">⏰ {dueSoonCount}</span>
              )}
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full ${
                  complianceRate >= 90 ? 'bg-green-500' :
                  complianceRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${complianceRate}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {complianceRate}% of {totalEmployees} employees
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">
              Compliance Training
            </h1>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="h-4 w-4" />}
              >
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onExport}
                leftIcon={<Download className="h-4 w-4" />}
              >
              </Button>
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="mt-3 flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('employees')}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'employees'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              By Employee ({employees.length})
            </button>
            <button
              onClick={() => setViewMode('trainings')}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'trainings'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              By Training ({trainings.length})
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              leftIcon={<X className="h-4 w-4" />}
            >
            </Button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search employees..."
                value={filters.searchTerm || ''}
                onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => onFilterChange({ ...filters, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                  <option value="due_soon">Due Soon</option>
                  <option value="not_started">Not Started</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => onFilterChange({ ...filters, department: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Departments</option>
                  {Array.from(new Set(employees.map(e => e.department))).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {viewMode === 'employees' ? (
          <div>
            {sortedEmployeeSummaries.map(renderEmployeeCard)}
          </div>
        ) : (
          <div>
            {trainings.map(renderTrainingCard)}
          </div>
        )}
        
        {(viewMode === 'employees' ? employees.length : trainings.length) === 0 && (
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No data found</p>
          </div>
        )}
      </div>
    </div>
  );
}