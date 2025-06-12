'use client'

import React, { useState, useMemo } from 'react';
import { LoadingSpinner } from '@ganger/ui';
import { Button, Modal } from '../ui/ComponentWrappers';
import { ComplianceStatusBadge } from '@/components/shared/ComplianceStatusBadge';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { ErrorFallback } from '@/components/errors/ErrorFallback';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ChevronDown, ChevronRight, User, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { determineTrainingStatus, calculateDaysUntilDue } from '@/utils/compliance-helpers';
import type { Employee, TrainingModule, TrainingCompletion } from '@/types/compliance';

interface ComplianceMatrixProps {
  employees: Employee[];
  trainings: TrainingModule[];
  completions: TrainingCompletion[];
  loading?: boolean;
  onEmployeeClick?: (employee: Employee) => void;
  onCellClick?: (employee: Employee, training: TrainingModule, completion?: TrainingCompletion) => void;
}

export function ComplianceMatrix({ 
  employees, 
  trainings, 
  completions, 
  loading = false,
  onEmployeeClick,
  onCellClick
}: ComplianceMatrixProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<TrainingModule | null>(null);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat');
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Create a map for quick completion lookups - MUST be before any early returns
  const completionMap = useMemo(() => {
    const map = new Map<string, TrainingCompletion>();
    completions.forEach(completion => {
      const key = `${completion.employeeId}-${completion.trainingId}`;
      map.set(key, completion);
    });
    return map;
  }, [completions]);

  // Group employees by department for grouped view - MUST be before any early returns
  const employeesByDepartment = useMemo(() => {
    const grouped = new Map<string, Employee[]>();
    employees.forEach(employee => {
      if (!grouped.has(employee.department)) {
        grouped.set(employee.department, []);
      }
      grouped.get(employee.department)!.push(employee);
    });
    return grouped;
  }, [employees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  const handleCellClick = (employee: Employee, training: TrainingModule, completion?: TrainingCompletion) => {
    setSelectedEmployee(employee);
    setSelectedTraining(training);
    setShowDetailModal(true);
    onCellClick?.(employee, training, completion);
  };

  const handleEmployeeClick = (employee: Employee) => {
    onEmployeeClick?.(employee);
  };

  const toggleDepartment = (department: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(department)) {
      newExpanded.delete(department);
    } else {
      newExpanded.add(department);
    }
    setExpandedDepartments(newExpanded);
  };

  const renderEmployeeRow = (employee: Employee, isGrouped = false) => (
    <tr key={employee.id} className="compliance-matrix-row">
      <td className={`px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-200 ${isGrouped ? 'pl-8' : ''}`}>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleEmployeeClick(employee)}
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
      {trainings.map(training => {
        const key = `${employee.id}-${training.id}`;
        const completion = completionMap.get(key);
        const status = determineTrainingStatus(completion, training);
        
        return (
          <td
            key={training.id}
            className="compliance-status-cell relative"
          >
            <button
              onClick={() => handleCellClick(employee, training, completion)}
              className="w-full h-full flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
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
      })}
    </tr>
  );

  const renderDepartmentHeader = (department: string, employeeCount: number) => {
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
  };

  return (
    <div className="compliance-matrix">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
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
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <ComplianceStatusBadge status="completed" size="sm" showText={false} />
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <ComplianceStatusBadge status="overdue" size="sm" showText={false} />
            <span>Overdue</span>
          </div>
          <div className="flex items-center space-x-2">
            <ComplianceStatusBadge status="due_soon" size="sm" showText={false} />
            <span>Due Soon</span>
          </div>
          <div className="flex items-center space-x-2">
            <ComplianceStatusBadge status="not_started" size="sm" showText={false} />
            <span>Not Started</span>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full">
          <thead className="compliance-matrix-header">
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
          <tbody>
            {viewMode === 'flat' ? (
              employees.map(employee => renderEmployeeRow(employee))
            ) : (
              Array.from(employeesByDepartment.entries()).map(([department, deptEmployees]) => [
                renderDepartmentHeader(department, deptEmployees.length),
                ...(expandedDepartments.has(department) 
                  ? deptEmployees.map(employee => renderEmployeeRow(employee, true))
                  : []
                )
              ]).flat()
            )}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {employees.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No employees found matching the current filters.</p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEmployee && selectedTraining && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Training Details: ${selectedTraining.name}`}
        >
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Employee</h4>
              <div className="space-y-1 text-sm">
                <div><strong>Name:</strong> {selectedEmployee.name}</div>
                <div><strong>Email:</strong> {selectedEmployee.email}</div>
                <div><strong>Department:</strong> {selectedEmployee.department}</div>
                <div><strong>Location:</strong> {selectedEmployee.location}</div>
                <div><strong>Role:</strong> {selectedEmployee.role}</div>
              </div>
            </div>

            {/* Training Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Training Module</h4>
              <div className="space-y-1 text-sm">
                <div><strong>Name:</strong> {selectedTraining.name}</div>
                <div><strong>Category:</strong> {selectedTraining.category}</div>
                <div><strong>Duration:</strong> {selectedTraining.durationMinutes} minutes</div>
                <div><strong>Description:</strong> {selectedTraining.description}</div>
              </div>
            </div>

            {/* Completion Status */}
            {(() => {
              const key = `${selectedEmployee.id}-${selectedTraining.id}`;
              const completion = completionMap.get(key);
              const status = determineTrainingStatus(completion, selectedTraining);
              
              return (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Completion Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <ComplianceStatusBadge status={status} />
                    </div>
                    
                    {completion && (
                      <div className="space-y-1 text-sm">
                        <div><strong>Completed:</strong> {completion.completedAt.toLocaleDateString()}</div>
                        <div><strong>Expires:</strong> {completion.expiresAt.toLocaleDateString()}</div>
                        {completion.score && <div><strong>Score:</strong> {completion.score}%</div>}
                        {completion.certificateUrl && (
                          <div>
                            <strong>Certificate:</strong> 
                            <a 
                              href={completion.certificateUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:underline"
                            >
                              View Certificate
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!completion && (
                      <div className="text-sm text-gray-600">
                        This training has not been started yet.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </Modal>
      )}
    </div>
  );
}