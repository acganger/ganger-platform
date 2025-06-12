'use client'

import React, { useState, useMemo, useCallback, memo } from 'react';
import { LoadingSpinner } from '@ganger/ui';
import { Button } from '../ui/ComponentWrappers';
import { ComplianceStatusBadge } from '@/components/shared/ComplianceStatusBadge';
import { VirtualizedMatrix } from '@/components/performance/VirtualizedList';
import { ProgressiveLoading, MatrixSkeleton } from '@/components/performance/LoadingStates';
import { usePerformanceMonitor, useDebounce, useOptimizedFilter } from '@/hooks/usePerformance';
import { ChevronDown, ChevronRight, User, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { determineTrainingStatus, calculateDaysUntilDue } from '@/utils/compliance-helpers';
import type { Employee, TrainingModule, TrainingCompletion } from '@/types/compliance';

interface OptimizedComplianceMatrixProps {
  employees: Employee[];
  trainings: TrainingModule[];
  completions: TrainingCompletion[];
  loading?: boolean;
  onEmployeeClick?: (employee: Employee) => void;
  onCellClick?: (employee: Employee, training: TrainingModule, completion?: TrainingCompletion) => void;
  virtualized?: boolean;
  maxRows?: number;
}

// Memoized cell component to prevent unnecessary re-renders
const ComplianceCell = memo(({ 
  employee, 
  training, 
  completion, 
  onClick 
}: {
  employee: Employee;
  training: TrainingModule;
  completion?: TrainingCompletion;
  onClick?: () => void;
}) => {
  const status = determineTrainingStatus(completion, training);
  
  return (
    <td className="compliance-status-cell relative p-2">
      <button
        onClick={onClick}
        className="w-full h-full flex items-center justify-center hover:bg-gray-100 rounded transition-colors min-h-[32px]"
        title={
          completion 
            ? `Completed: ${completion.completedAt.toLocaleDateString()}\nExpires: ${completion.expiresAt.toLocaleDateString()}`
            : `Training: ${training.name}\nNot started`
        }
      >
        <ComplianceStatusBadge 
          status={status} 
          size="sm" 
          showIcon={true} 
          showText={false}
        />
        {status === 'due_soon' && completion && (
          <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {calculateDaysUntilDue(completion.expiresAt)}
          </div>
        )}
      </button>
    </td>
  );
});

ComplianceCell.displayName = 'ComplianceCell';

// Memoized employee row component
const EmployeeRow = memo(({ 
  employee, 
  trainings, 
  completionMap, 
  onEmployeeClick, 
  onCellClick,
  isGrouped = false 
}: {
  employee: Employee;
  trainings: TrainingModule[];
  completionMap: Map<string, TrainingCompletion>;
  onEmployeeClick?: (employee: Employee) => void;
  onCellClick?: (employee: Employee, training: TrainingModule, completion?: TrainingCompletion) => void;
  isGrouped?: boolean;
}) => {
  const handleEmployeeClick = useCallback(() => {
    onEmployeeClick?.(employee);
  }, [onEmployeeClick, employee]);

  const renderCell = useCallback((training: TrainingModule) => {
    const key = `${employee.id}-${training.id}`;
    const completion = completionMap.get(key);
    
    return (
      <ComplianceCell
        key={training.id}
        employee={employee}
        training={training}
        completion={completion}
        onClick={() => onCellClick?.(employee, training, completion)}
      />
    );
  }, [employee, completionMap, onCellClick]);

  return (
    <tr className="compliance-matrix-row hover:bg-gray-50">
      <td className={`px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-200 ${isGrouped ? 'pl-8' : ''}`}>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleEmployeeClick}
            className="flex items-center space-x-2 text-left hover:bg-gray-50 rounded p-1 -m-1"
          >
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
              <div className="text-xs text-gray-500">
                {employee.department} • {employee.location} • {employee.role}
              </div>
            </div>
          </button>
        </div>
      </td>
      {trainings.map(renderCell)}
    </tr>
  );
});

EmployeeRow.displayName = 'EmployeeRow';

export function OptimizedComplianceMatrix({ 
  employees, 
  trainings, 
  completions, 
  loading = false,
  onEmployeeClick,
  onCellClick,
  virtualized = false,
  maxRows = 1000
}: OptimizedComplianceMatrixProps) {
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat');
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { start, end } = usePerformanceMonitor('ComplianceMatrix');

  // Memoized completion map for O(1) lookups
  const completionMap = useMemo(() => {
    start();
    const map = new Map<string, TrainingCompletion>();
    completions.forEach(completion => {
      const key = `${completion.employeeId}-${completion.trainingId}`;
      map.set(key, completion);
    });
    end();
    return map;
  }, [completions, start, end]);

  // Optimized employee filtering
  const filteredEmployees = useOptimizedFilter(
    employees,
    useCallback((employee: Employee) => {
      if (!debouncedSearchTerm) return true;
      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        employee.name.toLowerCase().includes(searchLower) ||
        employee.email.toLowerCase().includes(searchLower) ||
        employee.department.toLowerCase().includes(searchLower) ||
        employee.role.toLowerCase().includes(searchLower)
      );
    }, [debouncedSearchTerm]),
    [debouncedSearchTerm]
  );

  // Group employees by department with memoization
  const employeesByDepartment = useMemo(() => {
    const grouped = new Map<string, Employee[]>();
    filteredEmployees.forEach(employee => {
      if (!grouped.has(employee.department)) {
        grouped.set(employee.department, []);
      }
      grouped.get(employee.department)!.push(employee);
    });
    return grouped;
  }, [filteredEmployees]);

  const toggleDepartment = useCallback((department: string) => {
    setExpandedDepartments(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(department)) {
        newExpanded.delete(department);
      } else {
        newExpanded.add(department);
      }
      return newExpanded;
    });
  }, []);

  const renderDepartmentHeader = useCallback((department: string, employeeCount: number) => {
    const isExpanded = expandedDepartments.has(department);
    
    return (
      <tr key={`dept-${department}`} className="bg-gray-50 border-t-2 border-gray-200">
        <td className="px-4 py-2 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
          <button
            onClick={() => toggleDepartment(department)}
            className="flex items-center space-x-2 font-medium text-gray-900 hover:text-gray-700"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span>{department}</span>
            <span className="text-sm text-gray-500">({employeeCount} employees)</span>
          </button>
        </td>
        {trainings.map(training => (
          <td key={training.id} className="px-3 py-2 text-center bg-gray-50">
            {/* Department summary could go here */}
          </td>
        ))}
      </tr>
    );
  }, [expandedDepartments, trainings, toggleDepartment]);

  const renderEmployeeRow = useCallback((employee: Employee, isGrouped = false) => (
    <EmployeeRow
      key={employee.id}
      employee={employee}
      trainings={trainings}
      completionMap={completionMap}
      onEmployeeClick={onEmployeeClick}
      onCellClick={onCellClick}
      isGrouped={isGrouped}
    />
  ), [trainings, completionMap, onEmployeeClick, onCellClick]);

  const renderHeader = useCallback(() => (
    <thead className="compliance-matrix-header sticky top-0 bg-gray-50 z-20">
      <tr>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10 min-w-[250px]">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Employee</span>
          </div>
        </th>
        {trainings.map(training => (
          <th
            key={training.id}
            className="px-3 py-3 text-center text-sm font-medium text-gray-900 min-w-[120px] border-l border-gray-200"
            title={training.description}
          >
            <div className="space-y-1">
              <div className="truncate font-medium">{training.name}</div>
              <div className="text-xs text-gray-500">{training.category}</div>
              <div className="text-xs text-gray-400">{training.durationMinutes}min</div>
            </div>
          </th>
        ))}
      </tr>
    </thead>
  ), [trainings]);

  const renderTableContent = useCallback(() => {
    if (viewMode === 'flat') {
      const displayEmployees = virtualized && filteredEmployees.length > maxRows 
        ? filteredEmployees.slice(0, maxRows)
        : filteredEmployees;
      
      return displayEmployees.map(employee => renderEmployeeRow(employee));
    } else {
      return Array.from(employeesByDepartment.entries()).map(([department, deptEmployees]) => [
        renderDepartmentHeader(department, deptEmployees.length),
        ...(expandedDepartments.has(department) 
          ? deptEmployees.map(employee => renderEmployeeRow(employee, true))
          : []
        )
      ]).flat();
    }
  }, [viewMode, filteredEmployees, employeesByDepartment, expandedDepartments, virtualized, maxRows, renderEmployeeRow, renderDepartmentHeader]);

  if (loading) {
    return (
      <ProgressiveLoading
        isLoading={true}
        hasError={false}
        isEmpty={false}
        skeleton={<MatrixSkeleton rows={5} columns={trainings.length} />}
      >
        <div />
      </ProgressiveLoading>
    );
  }

  if (filteredEmployees.length > maxRows && !virtualized) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Large Dataset Detected
        </h3>
        <p className="text-gray-600 mb-4">
          You have {filteredEmployees.length} employees. Consider using filters to reduce the dataset for better performance.
        </p>
        <Button
          variant="primary"
          onClick={() => setViewMode('grouped')}
        >
          Switch to Grouped View
        </Button>
      </div>
    );
  }

  return (
    <div className="compliance-matrix">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <span className="text-sm font-medium text-gray-700">View:</span>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'flat' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('flat')}
            >
              Flat View
            </Button>
            <Button
              variant={viewMode === 'grouped' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grouped')}
            >
              By Department
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-xs text-gray-500">
            {filteredEmployees.length} employees
          </span>
        </div>
      </div>

      {/* Matrix Table */}
      <ProgressiveLoading
        isLoading={false}
        hasError={false}
        isEmpty={filteredEmployees.length === 0}
        emptyMessage="No employees found matching the current search."
        emptyIcon={<User className="h-12 w-12 mx-auto text-gray-300" />}
      >
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full">
            {renderHeader()}
            <tbody>
              {renderTableContent()}
            </tbody>
          </table>
        </div>
      </ProgressiveLoading>
      
      {/* Performance Warning */}
      {filteredEmployees.length > 500 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              Large dataset ({filteredEmployees.length} employees). Performance may be impacted.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}