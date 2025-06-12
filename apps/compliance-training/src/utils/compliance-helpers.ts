'use client'

import type { Employee, TrainingCompletion, TrainingModule, ComplianceSummary } from '../types/compliance';
import type { ComplianceStatus } from '../types/compliance-status';

/**
 * Input validation utilities
 */
function validateArray<T>(arr: T[], name: string): T[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.filter(item => item != null); // Remove null/undefined items
}

function validateDate(date: unknown, fallback: Date = new Date()): Date {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return fallback;
}

function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') {
    return String(str || '');
  }
  // Remove potentially dangerous characters and normalize whitespace
  return str.replace(/[<>'"&]/g, '').trim().replace(/\s+/g, ' ');
}

/**
 * Calculate compliance rate for a set of employees and training completions
 * Enhanced with comprehensive validation and error handling
 */
export function calculateComplianceRate(
  employees: Employee[],
  trainings: TrainingModule[],
  completions: TrainingCompletion[]
): number {
  try {
    const validEmployees = validateArray(employees, 'employees');
    const validTrainings = validateArray(trainings, 'trainings');
    const validCompletions = validateArray(completions, 'completions');

    if (validEmployees.length === 0 || validTrainings.length === 0) {
      return 0;
    }

    // Only count required trainings
    const requiredTrainings = validTrainings.filter(t => t.isRequired);
    if (requiredTrainings.length === 0) {
      return 100; // If no required trainings, consider 100% compliant
    }

    const totalRequiredTrainings = validEmployees.length * requiredTrainings.length;
    const completedTrainings = validCompletions.filter(c => 
      c.status === 'completed' && 
      requiredTrainings.some(t => t.id === c.trainingId) &&
      validEmployees.some(e => e.id === c.employeeId)
    ).length;

    const rate = (completedTrainings / totalRequiredTrainings) * 100;
    return Math.max(0, Math.min(100, Math.round(rate))); // Clamp between 0-100
  } catch (error) {
    return 0;
  }
}

/**
 * Generate compliance summary statistics
 */
export function generateComplianceSummary(
  employees: Employee[],
  trainings: TrainingModule[],
  completions: TrainingCompletion[]
): ComplianceSummary {
  const totalEmployees = employees.length;
  const totalTrainings = trainings.length;
  const overallComplianceRate = calculateComplianceRate(employees, trainings, completions);
  
  const overdueCount = completions.filter(c => c.status === 'overdue').length;
  const dueSoonCount = completions.filter(c => c.status === 'due_soon').length;

  // Department breakdown
  const departmentMap = new Map<string, {
    employees: Employee[];
    completions: TrainingCompletion[];
  }>();

  employees.forEach(employee => {
    if (!departmentMap.has(employee.department)) {
      departmentMap.set(employee.department, {
        employees: [],
        completions: []
      });
    }
    departmentMap.get(employee.department)!.employees.push(employee);
  });

  completions.forEach(completion => {
    const employee = employees.find(e => e.id === completion.employeeId);
    if (employee) {
      departmentMap.get(employee.department)?.completions.push(completion);
    }
  });

  const byDepartment = Array.from(departmentMap.entries()).map(([department, data]) => ({
    department,
    employeeCount: data.employees.length,
    complianceRate: calculateComplianceRate(data.employees, trainings, data.completions),
    overdueCount: data.completions.filter(c => c.status === 'overdue').length,
    dueSoonCount: data.completions.filter(c => c.status === 'due_soon').length
  }));

  // Location breakdown
  const locationMap = new Map<string, {
    employees: Employee[];
    completions: TrainingCompletion[];
  }>();

  employees.forEach(employee => {
    if (!locationMap.has(employee.location)) {
      locationMap.set(employee.location, {
        employees: [],
        completions: []
      });
    }
    locationMap.get(employee.location)!.employees.push(employee);
  });

  completions.forEach(completion => {
    const employee = employees.find(e => e.id === completion.employeeId);
    if (employee) {
      locationMap.get(employee.location)?.completions.push(completion);
    }
  });

  const byLocation = Array.from(locationMap.entries()).map(([location, data]) => ({
    location,
    employeeCount: data.employees.length,
    complianceRate: calculateComplianceRate(data.employees, trainings, data.completions),
    overdueCount: data.completions.filter(c => c.status === 'overdue').length,
    dueSoonCount: data.completions.filter(c => c.status === 'due_soon').length
  }));

  return {
    totalEmployees,
    totalTrainings,
    overallComplianceRate,
    overdueCount,
    dueSoonCount,
    byDepartment,
    byLocation
  };
}

/**
 * Format compliance status for display
 */
export function formatComplianceStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'completed': 'Completed',
    'overdue': 'Overdue',
    'due_soon': 'Due Soon',
    'not_started': 'Not Started',
    'not_required': 'Not Required'
  };

  return statusMap[status] || status;
}

/**
 * Get compliance status color class
 */
export function getComplianceStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'completed': 'text-emerald-600 bg-emerald-100',
    'overdue': 'text-red-600 bg-red-100',
    'due_soon': 'text-yellow-600 bg-yellow-100',
    'not_started': 'text-gray-600 bg-gray-100',
    'not_required': 'text-gray-400 bg-gray-50'
  };

  return colorMap[status] || 'text-gray-600 bg-gray-100';
}

/**
 * Calculate days until training expires or is due
 * Enhanced with validation and timezone handling
 */
export function calculateDaysUntilDue(expiresAt: Date | string | unknown): number {
  try {
    const validExpiresAt = validateDate(expiresAt);
    const now = new Date();
    
    // Normalize to start of day for consistent calculations
    const expiryDate = new Date(validExpiresAt.getFullYear(), validExpiresAt.getMonth(), validExpiresAt.getDate());
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffInMs = expiryDate.getTime() - currentDate.getTime();
    const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    
    // Sanity check: don't return extremely large numbers
    return Math.max(-3650, Math.min(3650, days)); // ±10 years max
  } catch (error) {
    return 0;
  }
}

/**
 * Determine training status based on completion and expiration dates
 * Enhanced with comprehensive validation and business rules
 */
export function determineTrainingStatus(
  completion: TrainingCompletion | undefined | null,
  training: TrainingModule | undefined | null
): ComplianceStatus {
  try {
    // Validate inputs
    if (!training) {
      return 'not_started';
    }

    if (!completion) {
      return training.isRequired ? 'not_started' : 'not_required';
    }

    // If completion has explicit status, validate and use it
    if (completion.status) {
      const validStatuses: ComplianceStatus[] = ['completed', 'overdue', 'due_soon', 'not_started', 'not_required'];
      if (validStatuses.includes(completion.status as ComplianceStatus)) {
        return completion.status as ComplianceStatus;
      }
    }

    // Calculate status from dates
    const daysUntilExpiry = calculateDaysUntilDue(completion.expiresAt);
    const completedAt = validateDate(completion.completedAt);
    const now = new Date();

    // Check if completion is too old to be valid
    if (completedAt > now) {
      return 'not_started';
    }

    // Determine status based on expiry
    if (daysUntilExpiry < 0) {
      return 'overdue';
    } else if (daysUntilExpiry <= 30) {
      return 'due_soon';
    } else {
      return 'completed';
    }
  } catch (error) {
    return 'not_started';
  }
}

/**
 * Validate and sanitize compliance status
 */
export function validateComplianceStatus(status: unknown): ComplianceStatus {
  const validStatuses: ComplianceStatus[] = ['completed', 'overdue', 'due_soon', 'not_started', 'not_required'];
  
  if (typeof status === 'string' && validStatuses.includes(status as ComplianceStatus)) {
    return status as ComplianceStatus;
  }
  
  return 'not_started';
}

/**
 * Check if a training is critical (overdue or due very soon)
 */
export function isCriticalTraining(completion: TrainingCompletion | undefined, training: TrainingModule): boolean {
  const status = determineTrainingStatus(completion, training);
  return status === 'overdue' || (status === 'due_soon' && calculateDaysUntilDue(completion?.expiresAt) <= 7);
}

/**
 * Get priority score for sorting (higher = more urgent)
 */
export function getTrainingPriorityScore(completion: TrainingCompletion | undefined, training: TrainingModule): number {
  const status = determineTrainingStatus(completion, training);
  const statusPriority = {
    'overdue': 100,
    'due_soon': 50,
    'not_started': 25,
    'completed': 0,
    'not_required': 0
  };
  
  let score = statusPriority[status];
  
  // Add urgency bonus for due soon items
  if (status === 'due_soon' && completion) {
    const daysUntilDue = calculateDaysUntilDue(completion.expiresAt);
    score += Math.max(0, 30 - daysUntilDue); // More urgent if fewer days
  }
  
  // Add criticality bonus for overdue items
  if (status === 'overdue' && completion) {
    const daysOverdue = Math.abs(calculateDaysUntilDue(completion.expiresAt));
    score += daysOverdue; // More urgent if more overdue
  }
  
  return score;
}

/**
 * Sort employees by compliance priority (overdue first, then due soon, etc.)
 */
export function sortEmployeesByCompliancePriority(
  employees: Employee[],
  completions: TrainingCompletion[]
): Employee[] {
  return employees.sort((a, b) => {
    const aCompletions = completions.filter(c => c.employeeId === a.id);
    const bCompletions = completions.filter(c => c.employeeId === b.id);

    const aOverdue = aCompletions.filter(c => c.status === 'overdue').length;
    const bOverdue = bCompletions.filter(c => c.status === 'overdue').length;

    const aDueSoon = aCompletions.filter(c => c.status === 'due_soon').length;
    const bDueSoon = bCompletions.filter(c => c.status === 'due_soon').length;

    // Sort by overdue count first, then due soon count
    if (aOverdue !== bOverdue) {
      return bOverdue - aOverdue; // Descending
    }

    if (aDueSoon !== bDueSoon) {
      return bDueSoon - aDueSoon; // Descending
    }

    // Finally sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sanitize CSV cell content to prevent CSV injection attacks
 */
function sanitizeCSVCell(value: unknown): string {
  let str = sanitizeString(value);
  
  // Remove or escape potentially dangerous CSV injection patterns
  str = str.replace(/^[=+\-@]/, ''); // Remove leading formula characters
  str = str.replace(/"/g, '""'); // Escape quotes
  
  // Additional safety: remove control characters
  str = str.replace(/[\x00-\x1f\x7f]/g, '');
  
  return str;
}

/**
 * Export compliance data to CSV format with security enhancements
 */
export function exportToCSV(
  employees: Employee[],
  trainings: TrainingModule[],
  completions: TrainingCompletion[],
  options: {
    includePersonalInfo?: boolean;
    includeDates?: boolean;
    maxRows?: number;
  } = {}
): string {
  try {
    const validEmployees = validateArray(employees, 'employees').slice(0, options.maxRows || 10000);
    const validTrainings = validateArray(trainings, 'trainings');
    const validCompletions = validateArray(completions, 'completions');

    if (validEmployees.length === 0) {
      throw new Error('No valid employees to export');
    }

    // Build headers based on options
    const headers = ['Employee Name'];
    
    if (options.includePersonalInfo) {
      headers.push('Email', 'Department', 'Location', 'Role');
    } else {
      headers.push('Department', 'Location');
    }
    
    headers.push(...validTrainings.map(t => sanitizeCSVCell(t.name)));
    
    const rows = validEmployees.map(employee => {
      const row = [sanitizeCSVCell(employee.name)];
      
      if (options.includePersonalInfo) {
        row.push(
          sanitizeCSVCell(employee.email),
          sanitizeCSVCell(employee.department),
          sanitizeCSVCell(employee.location),
          sanitizeCSVCell(employee.role)
        );
      } else {
        row.push(
          sanitizeCSVCell(employee.department),
          sanitizeCSVCell(employee.location)
        );
      }
      
      validTrainings.forEach(training => {
        const completion = validCompletions.find(
          c => c.employeeId === employee.id && c.trainingId === training.id
        );
        
        if (completion) {
          const status = validateComplianceStatus(completion.status);
          let cellValue = formatComplianceStatus(status);
          
          if (options.includeDates && completion.completedAt) {
            const completedAt = validateDate(completion.completedAt);
            cellValue += ` (${completedAt.toLocaleDateString()})`;
          }
          
          row.push(sanitizeCSVCell(cellValue));
        } else {
          row.push(sanitizeCSVCell('Not Started'));
        }
      });
      
      return row;
    });

    // Generate CSV with proper escaping
    const csvLines = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    );
    
    // Add BOM for Excel compatibility
    return '\ufeff' + csvLines.join('\n');
  } catch (error) {
    throw new Error('Failed to export compliance data to CSV');
  }
}

/**
 * Export compliance summary statistics
 */
export function exportSummaryToCSV(
  employees: Employee[],
  trainings: TrainingModule[],
  completions: TrainingCompletion[]
): string {
  try {
    const summary = generateComplianceSummary(employees, trainings, completions);
    
    const rows = [
      ['Metric', 'Value'],
      ['Total Employees', summary.totalEmployees.toString()],
      ['Total Trainings', summary.totalTrainings.toString()],
      ['Overall Compliance Rate', `${summary.overallComplianceRate}%`],
      ['Overdue Count', summary.overdueCount.toString()],
      ['Due Soon Count', summary.dueSoonCount.toString()],
      [''],
      ['Department Breakdown', ''],
      ['Department', 'Employees', 'Compliance Rate', 'Overdue', 'Due Soon'],
      ...summary.byDepartment.map(dept => [
        sanitizeCSVCell(dept.department),
        dept.employeeCount.toString(),
        `${dept.complianceRate}%`,
        dept.overdueCount.toString(),
        dept.dueSoonCount.toString()
      ]),
      [''],
      ['Location Breakdown', ''],
      ['Location', 'Employees', 'Compliance Rate', 'Overdue', 'Due Soon'],
      ...summary.byLocation.map(loc => [
        sanitizeCSVCell(loc.location),
        loc.employeeCount.toString(),
        `${loc.complianceRate}%`,
        loc.overdueCount.toString(),
        loc.dueSoonCount.toString()
      ])
    ];

    return '\ufeff' + rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  } catch (error) {
    throw new Error('Failed to export compliance summary to CSV');
  }
}

/**
 * Generate audit trail export with security considerations
 */
export function exportAuditTrail(
  completions: TrainingCompletion[],
  employees: Employee[],
  trainings: TrainingModule[]
): string {
  try {
    const validCompletions = validateArray(completions, 'completions');
    const validEmployees = validateArray(employees, 'employees');
    const validTrainings = validateArray(trainings, 'trainings');

    const headers = [
      'Timestamp',
      'Employee Name',
      'Training Name',
      'Action',
      'Status',
      'Completion Date',
      'Expiry Date',
      'Certificate URL'
    ];

    const rows = validCompletions.map(completion => {
      const employee = validEmployees.find(e => e.id === completion.employeeId);
      const training = validTrainings.find(t => t.id === completion.trainingId);
      
      return [
        new Date().toISOString(),
        sanitizeCSVCell(employee?.name || 'Unknown Employee'),
        sanitizeCSVCell(training?.name || 'Unknown Training'),
        'Completion Record',
        sanitizeCSVCell(validateComplianceStatus(completion.status)),
        completion.completedAt ? validateDate(completion.completedAt).toISOString() : '',
        completion.expiresAt ? validateDate(completion.expiresAt).toISOString() : '',
        completion.certificateUrl ? sanitizeCSVCell(completion.certificateUrl) : ''
      ];
    });

    return '\ufeff' + [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  } catch (error) {
    throw new Error('Failed to export audit trail');
  }
}