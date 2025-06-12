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
 * All API calls go through Next.js API routes handled by backend terminal
 */
export class ComplianceAPIClient {
  private static readonly BASE_URL = '/api/compliance';

  /**
   * Fetch complete dashboard data with matrix and summaries
   */
  static async getDashboardData(filters?: FilterOptions): Promise<DashboardData> {
    const queryParams = filters ? new URLSearchParams({
      ...(filters.status !== 'all' && { status: filters.status }),
      ...(filters.department !== 'all' && { department: filters.department }),
      ...(filters.location !== 'all' && { location: filters.location }),
      ...(filters.timeRange !== 'current' && { timeRange: filters.timeRange }),
      ...(filters.searchTerm && { search: filters.searchTerm })
    }).toString() : '';

    const url = queryParams ? `${this.BASE_URL}/dashboard?${queryParams}` : `${this.BASE_URL}/dashboard`;
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Fetch all employees with their basic info
   */
  static async getEmployees(): Promise<Employee[]> {
    const response = await fetch(`${this.BASE_URL}/employees`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch employees: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Fetch all training modules
   */
  static async getTrainingModules(): Promise<TrainingModule[]> {
    const response = await fetch(`${this.BASE_URL}/training-modules`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch training modules: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Fetch training completions with optional filtering
   */
  static async getCompletions(filters?: FilterOptions): Promise<TrainingCompletion[]> {
    const queryParams = filters ? new URLSearchParams({
      ...(filters.status !== 'all' && { status: filters.status }),
      ...(filters.department !== 'all' && { department: filters.department }),
      ...(filters.location !== 'all' && { location: filters.location })
    }).toString() : '';

    const url = queryParams ? `${this.BASE_URL}/completions?${queryParams}` : `${this.BASE_URL}/completions`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch completions: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Fetch compliance matrix (employees vs trainings grid)
   */
  static async getComplianceMatrix(filters?: FilterOptions): Promise<ComplianceMatrix> {
    const queryParams = filters ? new URLSearchParams({
      ...(filters.status !== 'all' && { status: filters.status }),
      ...(filters.department !== 'all' && { department: filters.department }),
      ...(filters.location !== 'all' && { location: filters.location })
    }).toString() : '';

    const url = queryParams ? `${this.BASE_URL}/matrix?${queryParams}` : `${this.BASE_URL}/matrix`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch compliance matrix: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Fetch department-specific compliance data
   */
  static async getDepartmentData(department: string): Promise<DepartmentSummary> {
    const response = await fetch(`${this.BASE_URL}/department/${encodeURIComponent(department)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch department data: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Fetch individual employee compliance details
   */
  static async getEmployeeDetail(employeeId: string): Promise<Employee & { completions: TrainingCompletion[] }> {
    const response = await fetch(`${this.BASE_URL}/employee/${employeeId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch employee details: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Trigger manual sync with external systems (Google Classroom, Zenefits)
   */
  static async triggerSync(): Promise<SyncResponse> {
    const response = await fetch(`${this.BASE_URL}/sync`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to trigger sync: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Export compliance data in specified format
   */
  static async exportCompliance(format: 'csv' | 'pdf', filters?: FilterOptions): Promise<ExportData> {
    const body = {
      format,
      filters: filters || {},
      timestamp: new Date().toISOString()
    };

    const response = await fetch(`${this.BASE_URL}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to export compliance data: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Set training exemption for an employee
   */
  static async setExemption(employeeId: string, trainingId: string, reason: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.BASE_URL}/exemption/${employeeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trainingId,
        reason,
        exemptedAt: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to set exemption: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Remove training exemption for an employee
   */
  static async removeExemption(employeeId: string, trainingId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.BASE_URL}/exemption/${employeeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trainingId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove exemption: ${response.statusText}`);
    }
    
    return response.json();
  }
}