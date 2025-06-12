import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/compliance/export';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn()
};
(createClient as jest.Mock).mockReturnValue(mockSupabase);

// Mock auth
jest.mock('@ganger/auth/server', () => ({
  withAuth: (handlerFn: any, options: any) => handlerFn,
  getUserFromToken: jest.fn()
}));

import { getUserFromToken } from '@ganger/auth/server';
const mockGetUserFromToken = getUserFromToken as jest.Mock;

// Mock audit logging
jest.mock('@ganger/utils/server', () => ({
  auditLog: jest.fn()
}));

describe('/api/compliance/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Tests', () => {
    it('should return 401 when no user token provided', async () => {
      mockGetUserFromToken.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'summary'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    });

    it('should return 403 for insufficient permissions', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        role: 'employee'
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'summary'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to export compliance data'
        }
      });
    });
  });

  describe('Authorization Tests', () => {
    it('should allow superadmin to export all data', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: [],
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'summary'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should allow hr_admin to export all data', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'hr-123',
        email: 'hr@gangerdermatology.com',
        role: 'hr_admin'
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: [],
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'summary'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should restrict manager to their department only', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'manager-123',
        email: 'manager@gangerdermatology.com',
        role: 'manager',
        department: 'dermatology'
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [
            {
              department: 'dermatology',
              totalEmployees: 10,
              avgComplianceRate: '85%'
            }
          ],
          error: null
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'summary'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()['content-type']).toBe('text/csv');
    });
  });

  describe('Method Validation', () => {
    it('should return 405 for non-GET requests', async () => {
      const { req, res } = createMocks({
        method: 'POST'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only GET method is allowed'
        }
      });
    });
  });

  describe('Parameter Validation', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should return 400 for invalid format', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'xml',
          type: 'summary'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid format. Must be csv or pdf'
        }
      });
    });

    it('should return 400 for invalid export type', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'invalid_type'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid export type'
        }
      });
    });

    it('should use default values for missing parameters', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: [],
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {}
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()['content-type']).toBe('text/csv');
    });
  });

  describe('CSV Export Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should export summary data as CSV', async () => {
      const mockData = [
        {
          department: 'dermatology',
          total_employees: 10,
          avg_compliance_rate: 85.5,
          compliant_employees: 8,
          pending_employees: 1,
          non_compliant_employees: 1,
          total_overdue_trainings: 2,
          next_department_deadline: '2025-01-15'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: mockData,
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'summary'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()['content-type']).toBe('text/csv');
      expect(res._getHeaders()['content-disposition']).toMatch(/attachment; filename="compliance_summary_\d{4}-\d{2}-\d{2}\.csv"/);
      
      const csvData = res._getData();
      expect(csvData).toContain('department,totalEmployees,avgComplianceRate');
      expect(csvData).toContain('dermatology,10,85.5%');
    });

    it('should export detailed data as CSV', async () => {
      const mockEmployeeData = [
        {
          id: 'emp-1',
          full_name: 'John Doe',
          email: 'john@gangerdermatology.com',
          department: 'dermatology',
          location: 'main-office',
          job_title: 'Dermatologist',
          start_date: '2024-01-01',
          training_completions: [
            {
              status: 'completed',
              completion_date: '2024-12-01',
              due_date: '2024-12-31',
              score: 95,
              is_required: true,
              module: {
                module_name: 'HIPAA Training',
                month_key: '2024-12'
              }
            }
          ]
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: mockEmployeeData,
            error: null
          })
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'detailed',
          includePersonalInfo: 'true'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()['content-type']).toBe('text/csv');
      
      const csvData = res._getData();
      expect(csvData).toContain('employeeName,email,department');
      expect(csvData).toContain('John Doe,john@gangerdermatology.com,dermatology');
    });

    it('should handle CSV special characters correctly', async () => {
      const mockData = [
        {
          department: 'Administration, HR',
          total_employees: 5,
          avg_compliance_rate: 90.0
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: mockData,
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'summary'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const csvData = res._getData();
      expect(csvData).toContain('"Administration, HR"'); // Should be quoted due to comma
    });
  });

  describe('PDF Export Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should export data as PDF', async () => {
      const mockData = [
        {
          department: 'dermatology',
          total_employees: 10,
          avg_compliance_rate: 85.5
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: mockData,
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'pdf',
          type: 'summary'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()['content-type']).toBe('application/pdf');
      expect(res._getHeaders()['content-disposition']).toMatch(/attachment; filename="compliance_summary_\d{4}-\d{2}-\d{2}\.pdf"/);
      
      const pdfData = res._getData();
      expect(pdfData).toContain('COMPLIANCE TRAINING REPORT');
      expect(pdfData).toContain('Type: SUMMARY');
    });
  });

  describe('Export Type Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should export overdue training data', async () => {
      const mockOverdueData = [
        {
          id: 'completion-1',
          status: 'overdue',
          due_date: '2024-12-31',
          overdue_days: 5,
          employee: {
            full_name: 'Jane Smith',
            email: 'jane@gangerdermatology.com',
            department: 'dermatology',
            location: 'main-office',
            job_title: 'Nurse'
          },
          module: {
            module_name: 'HIPAA Training',
            month_key: '2024-12',
            estimated_duration_minutes: 30
          }
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: mockOverdueData,
            error: null
          })
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'overdue',
          includePersonalInfo: 'true'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const csvData = res._getData();
      expect(csvData).toContain('employeeName,email,department');
      expect(csvData).toContain('Jane Smith,jane@gangerdermatology.com,dermatology');
      expect(csvData).toContain('HIPAA Training');
      expect(csvData).toContain('5'); // overdue days
    });

    it('should export compliance matrix data', async () => {
      const mockMatrixData = [
        {
          employee_name: 'John Doe',
          employee_email: 'john@gangerdermatology.com',
          department: 'dermatology',
          location: 'main-office',
          module_name: 'HIPAA Training',
          month_key: '2024-12',
          due_date: '2024-12-31',
          status: 'completed',
          completion_date: '2024-12-15',
          score: 95,
          overdue_days: 0
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: mockMatrixData,
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'compliance_matrix',
          includePersonalInfo: 'true'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const csvData = res._getData();
      expect(csvData).toContain('employeeName,email,department');
      expect(csvData).toContain('John Doe,john@gangerdermatology.com,dermatology');
      expect(csvData).toContain('HIPAA Training,2024-12');
      expect(csvData).toContain('completed,2024-12-15,95');
    });
  });

  describe('Data Filtering Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should filter by department', async () => {
      const mockEq = jest.fn().mockReturnValue({
        data: [],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'summary',
          department: 'dermatology'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockEq).toHaveBeenCalledWith('department', 'dermatology');
    });

    it('should filter by location', async () => {
      const mockEq = jest.fn().mockReturnValue({
        data: [],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'detailed',
          location: 'main-office'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Personal Information Handling', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'manager-123',
        email: 'manager@gangerdermatology.com',
        role: 'manager',
        department: 'dermatology'
      });
    });

    it('should exclude personal info for managers with limited access', async () => {
      const mockEmployeeData = [
        {
          id: 'emp-1',
          full_name: 'John Doe',
          email: 'john@gangerdermatology.com',
          department: 'dermatology',
          training_completions: []
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: mockEmployeeData,
            error: null
          })
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'detailed',
          includePersonalInfo: 'true' // Should be overridden for manager
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const csvData = res._getData();
      expect(csvData).not.toContain('employeeName,email'); // Personal info excluded
      expect(csvData).toContain('department,location'); // Non-personal info included
    });
  });

  describe('Error Handling Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'summary'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: 'Failed to generate export',
          details: expect.any(String)
        }
      });
    });

    it('should handle empty data gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: [],
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'summary'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getData()).toBe('No data available for export');
    });
  });

  describe('Performance Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should handle large datasets efficiently', async () => {
      // Generate large mock dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        department: `Department ${i % 10}`,
        total_employees: Math.floor(Math.random() * 50) + 10,
        avg_compliance_rate: Math.floor(Math.random() * 40) + 60
      }));

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: largeDataset,
          error: null
        })
      });

      const startTime = Date.now();

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          type: 'summary'
        }
      });

      await handler(req, res);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(res._getStatusCode()).toBe(200);
    });
  });
});