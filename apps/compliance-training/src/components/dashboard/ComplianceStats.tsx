'use client'

import React, { useMemo } from 'react';
import { StatCard } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { Users, CheckCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import type { Employee, TrainingModule, TrainingCompletion } from '@/types/compliance';

interface ComplianceStatsProps {
  employees: Employee[];
  trainings: TrainingModule[];
  completions: TrainingCompletion[];
}

export function ComplianceStats({ employees, trainings, completions }: ComplianceStatsProps) {
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const totalTrainings = trainings.length;
    const totalCompletions = completions.filter(c => c.status === 'completed').length;
    const overdueCount = completions.filter(c => c.status === 'overdue').length;
    const dueSoonCount = completions.filter(c => c.status === 'due_soon').length;
    
    // Calculate overall compliance rate
    const totalRequiredTrainings = totalEmployees * totalTrainings;
    const complianceRate = totalRequiredTrainings > 0 
      ? Math.round((totalCompletions / totalRequiredTrainings) * 100) 
      : 0;

    // Department breakdown
    const departmentStats = employees.reduce((acc, employee) => {
      if (!acc[employee.department]) {
        acc[employee.department] = {
          employees: 0,
          completions: 0,
          overdue: 0
        };
      }
      acc[employee.department].employees++;
      
      const empCompletions = completions.filter(c => c.employeeId === employee.id);
      acc[employee.department].completions += empCompletions.filter(c => c.status === 'completed').length;
      acc[employee.department].overdue += empCompletions.filter(c => c.status === 'overdue').length;
      
      return acc;
    }, {} as Record<string, { employees: number; completions: number; overdue: number }>);

    // Calculate trend (mock data for now - would come from API in real implementation)
    const trend = complianceRate > 85 ? 'up' : complianceRate < 70 ? 'down' : 'stable';
    const trendValue = Math.floor(Math.random() * 10) + 1; // Mock trend percentage

    return {
      totalEmployees,
      totalTrainings,
      totalCompletions,
      overdueCount,
      dueSoonCount,
      complianceRate,
      departmentStats,
      trend,
      trendValue
    };
  }, [employees, trainings, completions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Employees */}
      <StatCard
        title="Total Employees"
        value={stats.totalEmployees}
        icon="👥"
        variant="default"
      />

      {/* Overall Compliance Rate */}
      <StatCard
        title="Compliance Rate"
        value={`${stats.complianceRate}%`}
        icon="✅"
        trend={stats.trend !== 'stable' ? {
          direction: stats.trend as 'up' | 'down',
          value: stats.trendValue
        } : undefined}
        variant={
          stats.complianceRate >= 90 
            ? 'success' 
            : stats.complianceRate >= 75 
            ? 'warning'
            : 'danger'
        }
      />

      {/* Overdue Trainings */}
      <StatCard
        title="Overdue Trainings"
        value={stats.overdueCount}
        icon="⚠️"
        variant={stats.overdueCount > 0 ? 'danger' : 'default'}
      />

      {/* Due Soon */}
      <StatCard
        title="Due Soon"
        value={stats.dueSoonCount}
        icon="⏰"
        variant={stats.dueSoonCount > 0 ? 'warning' : 'default'}
      />

      {/* Department Breakdown */}
      <Card className="md:col-span-2 lg:col-span-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Department Breakdown</h3>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.departmentStats).map(([department, deptStats]) => {
            const deptComplianceRate = deptStats.employees > 0 
              ? Math.round((deptStats.completions / (deptStats.employees * stats.totalTrainings)) * 100) 
              : 0;
            
            return (
              <div key={department} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{department}</h4>
                  <span className={`text-sm font-medium ${
                    deptComplianceRate >= 90 
                      ? 'text-green-600' 
                      : deptComplianceRate >= 75 
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {deptComplianceRate}%
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Employees:</span>
                    <span className="font-medium">{deptStats.employees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completions:</span>
                    <span className="font-medium">{deptStats.completions}</span>
                  </div>
                  {deptStats.overdue > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Overdue:</span>
                      <span className="font-medium">{deptStats.overdue}</span>
                    </div>
                  )}
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        deptComplianceRate >= 90 
                          ? 'bg-green-500' 
                          : deptComplianceRate >= 75 
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(deptComplianceRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}