'use client'

import { useMemo } from 'react';
import type { Employee, TrainingCompletion, FilterOptions } from '@/types/compliance';

export function useComplianceFilters(
  employees: Employee[],
  completions: TrainingCompletion[],
  filters: FilterOptions
) {
  const filteredData = useMemo(() => {
    let filteredEmployees = employees;
    let filteredCompletions = completions;

    // Apply department filter
    if (filters.department !== 'all') {
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.department === filters.department
      );
    }

    // Apply location filter
    if (filters.location !== 'all') {
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.location === filters.location
      );
    }

    // Apply role filter
    if (filters.role && filters.role !== 'all') {
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.role === filters.role
      );
    }

    // Apply search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredEmployees = filteredEmployees.filter(emp =>
        emp.name.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.department.toLowerCase().includes(searchLower) ||
        emp.role.toLowerCase().includes(searchLower)
      );
    }

    // Filter completions to match filtered employees
    const employeeIds = new Set(filteredEmployees.map(emp => emp.id));
    filteredCompletions = filteredCompletions.filter(completion =>
      employeeIds.has(completion.employeeId)
    );

    // Apply status filter to completions
    if (filters.status !== 'all') {
      filteredCompletions = filteredCompletions.filter(completion =>
        completion.status === filters.status
      );
    }

    // Apply time range filter
    if (filters.timeRange !== 'current') {
      const now = new Date();
      let startDate: Date;

      switch (filters.timeRange) {
        case 'last_3_months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case 'last_6_months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case 'custom':
          startDate = filters.customStartDate || new Date(0);
          break;
        default:
          startDate = new Date(0);
      }

      const endDate = filters.timeRange === 'custom' 
        ? filters.customEndDate || now
        : now;

      filteredCompletions = filteredCompletions.filter(completion =>
        completion.completedAt >= startDate && completion.completedAt <= endDate
      );
    }

    return {
      employees: filteredEmployees,
      completions: filteredCompletions
    };
  }, [employees, completions, filters]);

  // Calculate filter summary stats
  const filterStats = useMemo(() => {
    const originalCount = employees.length;
    const filteredCount = filteredData.employees.length;
    const reductionPercentage = originalCount > 0 
      ? Math.round(((originalCount - filteredCount) / originalCount) * 100)
      : 0;

    return {
      originalCount,
      filteredCount,
      reductionPercentage,
      isFiltered: originalCount !== filteredCount
    };
  }, [employees.length, filteredData.employees.length]);

  // Get available filter options
  const filterOptions = useMemo(() => {
    const departments = Array.from(new Set(employees.map(emp => emp.department))).sort();
    const locations = Array.from(new Set(employees.map(emp => emp.location))).sort();
    const roles = Array.from(new Set(employees.map(emp => emp.role))).sort();

    return {
      departments,
      locations,
      roles
    };
  }, [employees]);

  return {
    filteredData,
    filterStats,
    filterOptions
  };
}