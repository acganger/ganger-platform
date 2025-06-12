/**
 * Validation and type safety utilities for Compliance Training Frontend
 * 
 * This module provides comprehensive type guards, validators, and schemas
 * to ensure data integrity and prevent runtime errors.
 */

import type { ComplianceStatus } from './compliance-status';
import type { Employee, TrainingModule, TrainingCompletion, FilterOptions } from './compliance';

// Base validation types
export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

export interface ValidationOptions {
  strict?: boolean;
  allowPartial?: boolean;
  maxErrors?: number;
}

/**
 * Type guards for runtime type checking
 */
export const TypeGuards = {
  isString: (value: unknown): value is string => typeof value === 'string',
  
  isNumber: (value: unknown): value is number => 
    typeof value === 'number' && !isNaN(value) && isFinite(value),
  
  isBoolean: (value: unknown): value is boolean => typeof value === 'boolean',
  
  isDate: (value: unknown): value is Date => 
    value instanceof Date && !isNaN(value.getTime()),
  
  isValidEmail: (value: unknown): value is string => {
    if (!TypeGuards.isString(value)) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  isValidId: (value: unknown): value is string => {
    if (!TypeGuards.isString(value)) return false;
    return value.length > 0 && value.length <= 255 && /^[a-zA-Z0-9_-]+$/.test(value);
  },
  
  isComplianceStatus: (value: unknown): value is ComplianceStatus => {
    const validStatuses: ComplianceStatus[] = ['completed', 'overdue', 'due_soon', 'not_started', 'not_required'];
    return TypeGuards.isString(value) && validStatuses.includes(value as ComplianceStatus);
  },
  
  isEmployee: (value: unknown): value is Employee => {
    if (!value || typeof value !== 'object') return false;
    const obj = value as Record<string, unknown>;
    
    return (
      TypeGuards.isValidId(obj.id) &&
      TypeGuards.isString(obj.name) &&
      TypeGuards.isValidEmail(obj.email) &&
      TypeGuards.isString(obj.department) &&
      TypeGuards.isString(obj.location) &&
      TypeGuards.isString(obj.role) &&
      TypeGuards.isBoolean(obj.active) &&
      TypeGuards.isDate(obj.hireDate)
    );
  },
  
  isTrainingModule: (value: unknown): value is TrainingModule => {
    if (!value || typeof value !== 'object') return false;
    const obj = value as Record<string, unknown>;
    
    return (
      TypeGuards.isValidId(obj.id) &&
      TypeGuards.isString(obj.name) &&
      TypeGuards.isString(obj.description) &&
      TypeGuards.isString(obj.category) &&
      TypeGuards.isNumber(obj.durationMinutes) &&
      TypeGuards.isNumber(obj.validityPeriodDays) &&
      TypeGuards.isBoolean(obj.isRequired) &&
      TypeGuards.isBoolean(obj.active) &&
      TypeGuards.isDate(obj.createdAt) &&
      TypeGuards.isDate(obj.updatedAt)
    );
  },
  
  isTrainingCompletion: (value: unknown): value is TrainingCompletion => {
    if (!value || typeof value !== 'object') return false;
    const obj = value as Record<string, unknown>;
    
    return (
      TypeGuards.isValidId(obj.id) &&
      TypeGuards.isValidId(obj.employeeId) &&
      TypeGuards.isValidId(obj.trainingId) &&
      TypeGuards.isComplianceStatus(obj.status) &&
      TypeGuards.isDate(obj.completedAt) &&
      TypeGuards.isDate(obj.expiresAt) &&
      (obj.score === undefined || TypeGuards.isNumber(obj.score)) &&
      (obj.certificateUrl === undefined || TypeGuards.isString(obj.certificateUrl)) &&
      TypeGuards.isDate(obj.createdAt) &&
      TypeGuards.isDate(obj.updatedAt)
    );
  }
};

/**
 * Sanitization utilities
 */
export const Sanitizers = {
  string: (value: unknown, maxLength = 1000): string => {
    if (!TypeGuards.isString(value)) return '';
    
    return value
      .trim()
      .slice(0, maxLength)
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  },
  
  email: (value: unknown): string => {
    const sanitized = Sanitizers.string(value, 254); // RFC 5321 limit
    return TypeGuards.isValidEmail(sanitized) ? sanitized.toLowerCase() : '';
  },
  
  id: (value: unknown): string => {
    const sanitized = Sanitizers.string(value, 255);
    return TypeGuards.isValidId(sanitized) ? sanitized : '';
  },
  
  number: (value: unknown, min?: number, max?: number): number => {
    let num: number;
    
    if (TypeGuards.isNumber(value)) {
      num = value;
    } else if (TypeGuards.isString(value)) {
      num = parseFloat(value);
    } else {
      return 0;
    }
    
    if (!TypeGuards.isNumber(num)) return 0;
    
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;
    
    return num;
  },
  
  date: (value: unknown): Date => {
    if (TypeGuards.isDate(value)) return value;
    
    if (TypeGuards.isString(value)) {
      const parsed = new Date(value);
      if (TypeGuards.isDate(parsed)) return parsed;
    }
    
    return new Date(); // Fallback to current date
  }
};

/**
 * Comprehensive validators for domain objects
 */
export const Validators = {
  employee: (value: unknown, _options: ValidationOptions = {}): ValidationResult<Employee> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!value || typeof value !== 'object') {
      return { isValid: false, errors: ['Employee must be an object'], warnings: [] };
    }
    
    const obj = value as Record<string, unknown>;
    
    // Validate required fields
    if (!TypeGuards.isValidId(obj.id)) {
      errors.push('Employee ID is required and must be valid');
    }
    
    if (!TypeGuards.isString(obj.name) || obj.name.length < 1) {
      errors.push('Employee name is required');
    }
    
    if (!TypeGuards.isValidEmail(obj.email)) {
      errors.push('Valid email address is required');
    }
    
    if (!TypeGuards.isString(obj.department) || obj.department.length < 1) {
      errors.push('Department is required');
    }
    
    if (!TypeGuards.isString(obj.location) || obj.location.length < 1) {
      errors.push('Location is required');
    }
    
    if (!TypeGuards.isString(obj.role) || obj.role.length < 1) {
      errors.push('Role is required');
    }
    
    if (!TypeGuards.isBoolean(obj.active)) {
      warnings.push('Active status should be boolean, defaulting to true');
    }
    
    if (!TypeGuards.isDate(obj.hireDate)) {
      errors.push('Valid hire date is required');
    } else if (obj.hireDate > new Date()) {
      warnings.push('Hire date is in the future');
    }
    
    // Create sanitized employee object
    const sanitizedLocation = Sanitizers.string(obj.location, 50);
    const validLocation = (sanitizedLocation === 'Ann Arbor' || sanitizedLocation === 'Wixom' || sanitizedLocation === 'Plymouth') 
      ? sanitizedLocation as 'Ann Arbor' | 'Wixom' | 'Plymouth'
      : 'Ann Arbor' as const;
      
    const sanitizedEmployee: Employee = {
      id: Sanitizers.id(obj.id),
      name: Sanitizers.string(obj.name, 100),
      email: Sanitizers.email(obj.email),
      department: Sanitizers.string(obj.department, 50),
      location: validLocation,
      role: Sanitizers.string(obj.role, 50),
      active: TypeGuards.isBoolean(obj.active) ? obj.active : true,
      hireDate: Sanitizers.date(obj.hireDate)
    };
    
    return {
      isValid: errors.length === 0,
      data: sanitizedEmployee,
      errors,
      warnings
    };
  },
  
  trainingModule: (value: unknown, _options: ValidationOptions = {}): ValidationResult<TrainingModule> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!value || typeof value !== 'object') {
      return { isValid: false, errors: ['Training module must be an object'], warnings: [] };
    }
    
    const obj = value as Record<string, unknown>;
    
    // Validate required fields
    if (!TypeGuards.isValidId(obj.id)) {
      errors.push('Training ID is required and must be valid');
    }
    
    if (!TypeGuards.isString(obj.name) || obj.name.length < 1) {
      errors.push('Training name is required');
    }
    
    if (!TypeGuards.isString(obj.description)) {
      warnings.push('Training description is recommended');
    }
    
    if (!TypeGuards.isString(obj.category) || obj.category.length < 1) {
      errors.push('Training category is required');
    }
    
    if (!TypeGuards.isNumber(obj.durationMinutes) || obj.durationMinutes <= 0) {
      errors.push('Duration must be a positive number');
    }
    
    if (!TypeGuards.isNumber(obj.validityPeriodDays) || obj.validityPeriodDays <= 0) {
      errors.push('Validity period must be a positive number');
    }
    
    if (!TypeGuards.isBoolean(obj.isRequired)) {
      warnings.push('isRequired should be boolean, defaulting to true');
    }
    
    if (!TypeGuards.isBoolean(obj.active)) {
      warnings.push('Active status should be boolean, defaulting to true');
    }
    
    // Create sanitized training module
    const sanitizedCategory = Sanitizers.string(obj.category, 50);
    const validCategory = (sanitizedCategory === 'HIPAA' || sanitizedCategory === 'Safety' || sanitizedCategory === 'Clinical' || sanitizedCategory === 'Administrative')
      ? sanitizedCategory as 'HIPAA' | 'Safety' | 'Clinical' | 'Administrative'
      : 'Administrative' as const;
      
    const sanitizedTraining: TrainingModule = {
      id: Sanitizers.id(obj.id),
      name: Sanitizers.string(obj.name, 100),
      description: Sanitizers.string(obj.description, 500),
      category: validCategory,
      durationMinutes: Sanitizers.number(obj.durationMinutes, 1, 1440), // Max 24 hours
      validityPeriodDays: Sanitizers.number(obj.validityPeriodDays, 1, 3650), // Max 10 years
      isRequired: TypeGuards.isBoolean(obj.isRequired) ? obj.isRequired : true,
      active: TypeGuards.isBoolean(obj.active) ? obj.active : true,
      createdAt: Sanitizers.date(obj.createdAt),
      updatedAt: Sanitizers.date(obj.updatedAt)
    };
    
    return {
      isValid: errors.length === 0,
      data: sanitizedTraining,
      errors,
      warnings
    };
  },
  
  trainingCompletion: (value: unknown, _options: ValidationOptions = {}): ValidationResult<TrainingCompletion> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!value || typeof value !== 'object') {
      return { isValid: false, errors: ['Training completion must be an object'], warnings: [] };
    }
    
    const obj = value as Record<string, unknown>;
    
    // Validate required fields
    if (!TypeGuards.isValidId(obj.id)) {
      errors.push('Completion ID is required and must be valid');
    }
    
    if (!TypeGuards.isValidId(obj.employeeId)) {
      errors.push('Employee ID is required and must be valid');
    }
    
    if (!TypeGuards.isValidId(obj.trainingId)) {
      errors.push('Training ID is required and must be valid');
    }
    
    if (!TypeGuards.isComplianceStatus(obj.status)) {
      errors.push('Valid compliance status is required');
    }
    
    if (!TypeGuards.isDate(obj.completedAt)) {
      errors.push('Valid completion date is required');
    } else if (obj.completedAt > new Date()) {
      warnings.push('Completion date is in the future');
    }
    
    if (!TypeGuards.isDate(obj.expiresAt)) {
      errors.push('Valid expiry date is required');
    }
    
    if (obj.score !== undefined && (!TypeGuards.isNumber(obj.score) || obj.score < 0 || obj.score > 100)) {
      warnings.push('Score should be between 0 and 100');
    }
    
    // Create sanitized completion
    const validStatus = TypeGuards.isComplianceStatus(obj.status) ? obj.status : 'not_started';
    const sanitizedCompletion: TrainingCompletion = {
      id: Sanitizers.id(obj.id),
      employeeId: Sanitizers.id(obj.employeeId),
      trainingId: Sanitizers.id(obj.trainingId),
      status: validStatus,
      completedAt: Sanitizers.date(obj.completedAt),
      expiresAt: Sanitizers.date(obj.expiresAt),
      score: obj.score !== undefined ? Sanitizers.number(obj.score, 0, 100) : undefined,
      certificateUrl: obj.certificateUrl ? Sanitizers.string(obj.certificateUrl, 500) : undefined,
      createdAt: Sanitizers.date(obj.createdAt),
      updatedAt: Sanitizers.date(obj.updatedAt)
    };
    
    return {
      isValid: errors.length === 0,
      data: sanitizedCompletion,
      errors,
      warnings
    };
  },
  
  filterOptions: (value: unknown): ValidationResult<FilterOptions> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!value || typeof value !== 'object') {
      return { isValid: false, errors: ['Filter options must be an object'], warnings: [] };
    }
    
    const obj = value as Record<string, unknown>;
    
    const sanitizedStatus = TypeGuards.isString(obj.status) ? obj.status : 'all';
    const validFilterStatus = (sanitizedStatus === 'all' || sanitizedStatus === 'completed' || sanitizedStatus === 'overdue' || sanitizedStatus === 'due_soon' || sanitizedStatus === 'not_started')
      ? sanitizedStatus as 'all' | 'completed' | 'overdue' | 'due_soon' | 'not_started'
      : 'all' as const;
      
    const sanitizedTimeRange = TypeGuards.isString(obj.timeRange) ? obj.timeRange : 'current';
    const validTimeRange = (sanitizedTimeRange === 'current' || sanitizedTimeRange === 'last_3_months' || sanitizedTimeRange === 'last_6_months' || sanitizedTimeRange === 'custom')
      ? sanitizedTimeRange as 'current' | 'last_3_months' | 'last_6_months' | 'custom'
      : 'current' as const;
      
    const sanitizedFilters: FilterOptions = {
      status: validFilterStatus,
      department: TypeGuards.isString(obj.department) ? obj.department : 'all',
      location: TypeGuards.isString(obj.location) ? obj.location : 'all',
      timeRange: validTimeRange,
      searchTerm: obj.searchTerm ? Sanitizers.string(obj.searchTerm, 100) : undefined,
      role: obj.role ? Sanitizers.string(obj.role, 50) : undefined
    };
    
    return {
      isValid: true,
      data: sanitizedFilters,
      errors,
      warnings
    };
  }
};

/**
 * Batch validation utility
 */
export function validateBatch<T>(
  items: unknown[],
  validator: (item: unknown) => ValidationResult<T>,
  options: ValidationOptions = {}
): ValidationResult<T[]> {
  const results = items.map(validator);
  const validItems = results.filter(r => r.isValid).map(r => r.data!);
  const allErrors = results.flatMap(r => r.errors);
  const allWarnings = results.flatMap(r => r.warnings);
  
  const maxErrors = options.maxErrors || 100;
  const limitedErrors = allErrors.slice(0, maxErrors);
  
  return {
    isValid: options.allowPartial ? validItems.length > 0 : allErrors.length === 0,
    data: validItems,
    errors: limitedErrors,
    warnings: allWarnings.slice(0, maxErrors)
  };
}

/**
 * Security validation for user inputs
 */
export const SecurityValidators = {
  searchTerm: (value: unknown): string => {
    const sanitized = Sanitizers.string(value, 100);
    
    // Remove SQL injection patterns
    const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi;
    const cleaned = sanitized.replace(sqlPatterns, '');
    
    // Remove script injection patterns
    const scriptPatterns = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    return cleaned.replace(scriptPatterns, '');
  },
  
  fileName: (value: unknown): string => {
    const sanitized = Sanitizers.string(value, 255);
    
    // Remove dangerous file path characters
    return sanitized.replace(/[<>:"/\\|?*]/g, '').replace(/\.\./g, '');
  }
};