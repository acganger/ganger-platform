'use client'

import type { 
  DashboardData, 
  Employee, 
  TrainingModule, 
  TrainingCompletion,
  ComplianceMatrix,
  DepartmentSummary,
  ExportData,
  SyncResponse,
  FilterOptions
} from '@/types/compliance';

/**
 * Frontend API client for compliance training data
 * Mock implementation for static export
 */
export class ComplianceAPIClient {
  private static readonly BASE_URL = '/api/compliance';

  /**
   * Fetch complete dashboard data with matrix and summaries
   */
  static async getDashboardData(filters?: FilterOptions): Promise<DashboardData> {
    // Mock data for static export
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
    
    return {
      matrix: {
        employees: [],
        trainings: [],
        completions: {},
        summary: {
          totalEmployees: 0,
          totalTrainings: 0,
          overallComplianceRate: 0,
          overdueCount: 0,
          dueSoonCount: 0,
          byDepartment: [],
          byLocation: []
        }
      },
      departments: [],
      locations: [],
      overallStats: {
        totalCompletions: 0,
        overdueTrainings: 0,
        dueSoonTrainings: 0,
        complianceRate: 0,
        trendsData: []
      },
      lastSync: new Date()
    };
  }

  /**
   * Fetch all employees with their basic info
   */
  static async getEmployees(): Promise<Employee[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  }

  /**
   * Fetch detailed employee data including training history
   */
  static async getEmployeeDetails(employeeId: string): Promise<Employee> {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error('Employee not found');
  }

  /**
   * Trigger sync with external HR systems
   */
  static async triggerSync(): Promise<SyncResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      lastSync: new Date(),
      recordsUpdated: 0
    };
  }

  /**
   * Export compliance data in specified format
   */
  static async exportData(format: 'csv' | 'pdf' | 'excel', filters?: FilterOptions): Promise<ExportData> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      format: format === 'excel' ? 'csv' : format as 'csv' | 'pdf',
      data: [],
      filename: `compliance-export.${format}`,
      generatedAt: new Date()
    };
  }

  /**
   * Export compliance data - alias for exportData
   */
  static async exportCompliance(format: 'csv' | 'pdf' | 'excel', filters?: FilterOptions): Promise<ExportData> {
    return this.exportData(format, filters);
  }
}