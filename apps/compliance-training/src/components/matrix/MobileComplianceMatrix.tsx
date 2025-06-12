'use client'

import React, { useState } from 'react';
import { LoadingSpinner } from '@ganger/ui';
import { Card, Button } from '../ui/ComponentWrappers';
import { ComplianceStatusBadge } from '@/components/shared/ComplianceStatusBadge';
import { 
  ChevronDown, 
  ChevronRight, 
  User, 
  Calendar, 
  FileText, 
  MoreHorizontal,
  Eye,
  Filter
} from 'lucide-react';
import { determineTrainingStatus, calculateDaysUntilDue } from '@/utils/compliance-helpers';
import type { Employee, TrainingModule, TrainingCompletion } from '@/types/compliance';

interface MobileComplianceMatrixProps {
  employees: Employee[];
  trainings: TrainingModule[];
  completions: TrainingCompletion[];
  loading?: boolean;
  onEmployeeClick?: (employee: Employee) => void;
  onCellClick?: (employee: Employee, training: TrainingModule, completion?: TrainingCompletion) => void;
}

interface EmployeeTrainingData {
  employee: Employee;
  trainings: {
    training: TrainingModule;
    completion?: TrainingCompletion;
    status: string;
  }[];
  complianceRate: number;
  priorityScore: number; // For sorting by urgency
}

export function MobileComplianceMatrix({ 
  employees, 
  trainings, 
  completions, 
  loading = false,
  onEmployeeClick,
  onCellClick
}: MobileComplianceMatrixProps) {
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'compliance' | 'priority'>('priority');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  // Create a map for quick completion lookups
  const completionMap = new Map<string, TrainingCompletion>();
  completions.forEach(completion => {
    const key = `${completion.employeeId}-${completion.trainingId}`;
    completionMap.set(key, completion);
  });

  // Prepare employee data with training statuses
  const employeeData: EmployeeTrainingData[] = employees.map(employee => {
    const employeeTrainings = trainings.map(training => {
      const key = `${employee.id}-${training.id}`;
      const completion = completionMap.get(key);
      const status = determineTrainingStatus(completion, training);
      
      return {
        training,
        completion,
        status
      };
    });

    const completedCount = employeeTrainings.filter(t => t.status === 'completed').length;
    const complianceRate = trainings.length > 0 ? Math.round((completedCount / trainings.length) * 100) : 0;
    
    // Priority score for sorting (higher = more urgent)
    const overdueCount = employeeTrainings.filter(t => t.status === 'overdue').length;
    const dueSoonCount = employeeTrainings.filter(t => t.status === 'due_soon').length;
    const priorityScore = overdueCount * 100 + dueSoonCount * 10 + (100 - complianceRate);

    return {
      employee,
      trainings: employeeTrainings,
      complianceRate,
      priorityScore
    };
  });

  // Sort employee data
  const sortedEmployeeData = [...employeeData].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.employee.name.localeCompare(b.employee.name);
      case 'compliance':
        return a.complianceRate - b.complianceRate; // Lower compliance first
      case 'priority':
        return b.priorityScore - a.priorityScore; // Higher priority first
      default:
        return 0;
    }
  });

  const toggleEmployee = (employeeId: string) => {
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId);
  };

  const handleEmployeeClick = (employee: Employee) => {
    onEmployeeClick?.(employee);
  };

  const handleTrainingClick = (employee: Employee, training: TrainingModule, completion?: TrainingCompletion) => {
    onCellClick?.(employee, training, completion);
  };

  const renderCompactView = () => (
    <div className="space-y-2">
      {sortedEmployeeData.map((data) => (
        <Card key={data.employee.id} className="p-3">
          <div className="flex items-center justify-between">
            <div 
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => handleEmployeeClick(data.employee)}
            >
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {data.employee.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {data.employee.department} • {data.employee.location}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="ml-3 flex items-center space-x-2">
              <div className="text-right">
                <div className="text-xs font-medium text-gray-900">
                  {data.complianceRate}%
                </div>
                <div className="flex space-x-1">
                  {data.trainings.slice(0, 4).map((t, index) => (
                    <ComplianceStatusBadge
                      key={index}
                      status={t.status as any}
                      size="sm"
                      showIcon={true}
                      showText={false}
                      className="w-4 h-4"
                    />
                  ))}
                  {data.trainings.length > 4 && (
                    <span className="text-xs text-gray-400">+{data.trainings.length - 4}</span>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleEmployee(data.employee.id)}
                leftIcon={expandedEmployee === data.employee.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3">
      {sortedEmployeeData.map((data) => {
        const isExpanded = expandedEmployee === data.employee.id;
        
        return (
          <Card key={data.employee.id}>
            <div className="p-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleEmployee(data.employee.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {data.employee.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {data.employee.department} • {data.employee.location} • {data.employee.role}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex space-x-4 text-xs">
                      <span className="text-green-600">
                        ✓ {data.trainings.filter(t => t.status === 'completed').length}
                      </span>
                      {data.trainings.filter(t => t.status === 'overdue').length > 0 && (
                        <span className="text-red-600">
                          ⚠ {data.trainings.filter(t => t.status === 'overdue').length}
                        </span>
                      )}
                      {data.trainings.filter(t => t.status === 'due_soon').length > 0 && (
                        <span className="text-yellow-600">
                          ⏰ {data.trainings.filter(t => t.status === 'due_soon').length}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium">
                      {data.complianceRate}% complete
                    </div>
                  </div>
                  
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        data.complianceRate >= 90 ? 'bg-green-500' :
                        data.complianceRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${data.complianceRate}%` }}
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
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Training Details</h4>
                  <div className="space-y-2">
                    {data.trainings.map((trainingData) => (
                      <div
                        key={trainingData.training.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50"
                        onClick={() => handleTrainingClick(data.employee, trainingData.training, trainingData.completion)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div className="min-w-0 flex-1">
                              <h5 className="text-sm font-medium text-gray-900 truncate">
                                {trainingData.training.name}
                              </h5>
                              <p className="text-xs text-gray-500">
                                {trainingData.training.category} • {trainingData.training.durationMinutes}min
                              </p>
                              {trainingData.completion && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Completed: {trainingData.completion.completedAt.toLocaleDateString()}
                                  {trainingData.status === 'due_soon' && (
                                    <span className="text-yellow-600 ml-2">
                                      • Due in {calculateDaysUntilDue(trainingData.completion.expiresAt)} days
                                    </span>
                                  )}
                                  {trainingData.status === 'overdue' && (
                                    <span className="text-red-600 ml-2">
                                      • Overdue by {Math.abs(calculateDaysUntilDue(trainingData.completion.expiresAt))} days
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-3 flex items-center space-x-2">
                          {trainingData.completion?.score && (
                            <span className="text-xs font-medium text-gray-600">
                              {trainingData.completion.score}%
                            </span>
                          )}
                          <ComplianceStatusBadge 
                            status={trainingData.status as any} 
                            size="sm" 
                            showText={false}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="mobile-compliance-matrix">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">View:</span>
          <div className="flex bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'compact'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Compact
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="priority">Priority</option>
            <option value="name">Name</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? renderListView() : renderCompactView()}

      {/* Empty State */}
      {employees.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">No employees found matching the current filters.</p>
        </div>
      )}
    </div>
  );
}