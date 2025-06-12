import { createMocks } from 'node-mocks-http';
import handler from '../../../../pages/api/compliance/employee/[id]';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn()
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

describe('/api/compliance/employee/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Tests', () => {
    it('should return 401 when no user token provided', async () => {
      mockGetUserFromToken.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'emp-123' }
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
        query: { id: 'emp-123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access employee compliance data'
        }
      });
    });
  });

  describe('Authorization Tests', () => {
    it('should allow superadmin to access any employee data', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });

      const mockEmployeeData = {
        id: 'emp-123',
        full_name: 'John Doe',
        email: 'john@gangerdermatology.com',
        department: 'dermatology',
        location: 'main-office',
        job_title: 'Dermatologist',
        start_date: '2024-01-01',
        status: 'active'
      };

      const mockCompletionsData = [
        {
          id: 'completion-1',
          status: 'completed',
          completion_date: '2024-12-15',
          due_date: '2024-12-31',
          score: 95,
          is_required: true,
          module: {
            module_name: 'HIPAA Training',
            month_key: '2024-12'
          }
        }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockReturnValue({
                  data: mockEmployeeData,
                  error: null
                })
              })
            })
          };
        }
        if (table === 'training_completions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: mockCompletionsData,
                error: null
              })
            })
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            data: [],
            error: null
          })
        };
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'emp-123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should allow hr_admin to access any employee data', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'hr-123',
        email: 'hr@gangerdermatology.com',
        role: 'hr_admin'
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: { id: 'emp-123', department: 'dermatology' },
              error: null
            })
          })
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'emp-123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should restrict manager to employees in their department', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'manager-123',
        email: 'manager@gangerdermatology.com',
        role: 'manager',
        department: 'dermatology'
      });

      const mockEmployeeData = {
        id: 'emp-123',
        full_name: 'John Doe',
        department: 'dermatology', // Same department as manager
        location: 'main-office'
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: mockEmployeeData,
              error: null
            })
          })
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'emp-123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should deny manager access to employees outside their department', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'manager-123',
        email: 'manager@gangerdermatology.com',
        role: 'manager',
        department: 'dermatology'
      });

      const mockEmployeeData = {
        id: 'emp-123',
        full_name: 'Jane Smith',
        department: 'administration', // Different department
        location: 'main-office'
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: mockEmployeeData,
              error: null
            })
          })
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'emp-123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'DEPARTMENT_ACCESS_DENIED',
          message: 'You can only access employees in your department'
        }
      });
    });

    it('should allow employees to access their own data', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'emp-123',
        email: 'john@gangerdermatology.com',
        role: 'employee'
      });

      const mockEmployeeData = {
        id: 'emp-123',
        full_name: 'John Doe',
        email: 'john@gangerdermatology.com',
        department: 'dermatology'
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: mockEmployeeData,
              error: null
            })
          })
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'emp-123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should deny employees access to other employee data', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'emp-456',
        email: 'jane@gangerdermatology.com',
        role: 'employee'
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'emp-123' } // Different employee ID
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('Method Validation', () => {
    it('should return 405 for non-GET requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'emp-123' }
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

    it('should return 400 for missing employee ID', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {}
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'MISSING_EMPLOYEE_ID',
          message: 'Employee ID is required'
        }
      });
    });

    it('should return 400 for invalid UUID format', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'invalid-uuid' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'INVALID_EMPLOYEE_ID',
          message: 'Invalid employee ID format'
        }
      });
    });
  });

  describe('Data Fetching Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should return comprehensive employee compliance data', async () => {
      const mockEmployeeData = {
        id: 'emp-123',
        full_name: 'John Doe',
        email: 'john@gangerdermatology.com',
        department: 'dermatology',
        location: 'main-office',
        job_title: 'Dermatologist',
        start_date: '2024-01-01',
        status: 'active'
      };

      const mockCompletionsData = [
        {
          id: 'completion-1',
          status: 'completed',
          completion_date: '2024-12-15',
          due_date: '2024-12-31',
          score: 95,
          is_required: true,
          time_spent_minutes: 45,
          attempts_count: 1,
          module: {
            id: 'module-1',
            module_name: 'HIPAA Training',
            month_key: '2024-12',
            estimated_duration_minutes: 30
          }
        },
        {
          id: 'completion-2',
          status: 'overdue',
          completion_date: null,
          due_date: '2024-11-30',
          score: null,
          is_required: true,
          overdue_days: 15,
          module: {
            id: 'module-2',
            module_name: 'Safety Training',
            month_key: '2024-11',
            estimated_duration_minutes: 60
          }
        }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockReturnValue({
                  data: mockEmployeeData,
                  error: null
                })
              })
            })
          };
        }
        if (table === 'training_completions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: mockCompletionsData,
                error: null
              })
            })
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            data: [],
            error: null
          })
        };
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'emp-123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveProperty('employee');
      expect(responseData.data).toHaveProperty('complianceStats');
      expect(responseData.data).toHaveProperty('trainingCompletions');
      expect(responseData.data).toHaveProperty('upcomingDeadlines');
      
      expect(responseData.data.employee).toEqual(mockEmployeeData);
      expect(responseData.data.complianceStats).toHaveProperty('totalTrainings');
      expect(responseData.data.complianceStats).toHaveProperty('completedTrainings');
      expect(responseData.data.complianceStats).toHaveProperty('overdueTrainings');
      expect(responseData.data.complianceStats).toHaveProperty('complianceRate');
      
      expect(responseData.data.trainingCompletions).toHaveLength(2);
      expect(responseData.data.complianceStats.overdueTrainings).toBe(1);
      expect(responseData.data.complianceStats.completedTrainings).toBe(1);
    });

    it('should return 404 for non-existent employee', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: null,
              error: { code: 'PGRST116', message: 'Row not found' }
            })
          })
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'non-existent-id' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'EMPLOYEE_NOT_FOUND',
          message: 'Employee not found'
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'emp-123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch employee data'
        }
      });
    });
  });

  describe('Query Parameter Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: {
                id: 'emp-123',
                full_name: 'John Doe',
                department: 'dermatology'
              },
              error: null
            })
          })
        })
      });
    });

    it('should include compliance history when requested', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          id: 'emp-123',
          includeHistory: 'true'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.data).toHaveProperty('complianceHistory');
    });

    it('should filter by training status when specified', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          id: 'emp-123',
          status: 'overdue'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should limit results when limit parameter is provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { 
          id: 'emp-123',
          limit: '5'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Compliance Calculations', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should correctly calculate compliance statistics', async () => {
      const mockEmployeeData = {
        id: 'emp-123',
        full_name: 'John Doe',
        department: 'dermatology'
      };

      const mockCompletionsData = [
        { status: 'completed', is_required: true, score: 95 },
        { status: 'completed', is_required: true, score: 88 },
        { status: 'overdue', is_required: true, score: null },
        { status: 'not_started', is_required: true, score: null },
        { status: 'completed', is_required: false, score: 92 } // Optional training
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockReturnValue({
                  data: mockEmployeeData,
                  error: null
                })
              })
            })
          };
        }
        if (table === 'training_completions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: mockCompletionsData,
                error: null
              })
            })
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            data: [],
            error: null
          })
        };
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'emp-123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.data.complianceStats.totalTrainings).toBe(5);
      expect(responseData.data.complianceStats.requiredTrainings).toBe(4);
      expect(responseData.data.complianceStats.completedTrainings).toBe(2);
      expect(responseData.data.complianceStats.overdueTrainings).toBe(1);
      expect(responseData.data.complianceStats.pendingTrainings).toBe(1);
      expect(responseData.data.complianceStats.complianceRate).toBe(50); // 2/4 * 100
      expect(responseData.data.complianceStats.averageScore).toBe(91.5); // (95+88+92)/3
    });

    it('should handle edge case with no training completions', async () => {
      const mockEmployeeData = {
        id: 'emp-123',
        full_name: 'New Employee',
        department: 'dermatology'
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockReturnValue({
                  data: mockEmployeeData,
                  error: null
                })
              })
            })
          };
        }
        if (table === 'training_completions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: [],
                error: null
              })
            })
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            data: [],
            error: null
          })
        };
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'emp-123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.data.complianceStats.totalTrainings).toBe(0);
      expect(responseData.data.complianceStats.complianceRate).toBe(100); // Default to 100% when no required trainings
      expect(responseData.data.complianceStats.averageScore).toBe(null);
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

    it('should complete within reasonable time limit', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: { id: 'emp-123', full_name: 'John Doe' },
              error: null
            })
          })
        })
      });

      const startTime = Date.now();
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'emp-123' }
      });

      await handler(req, res);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      expect(res._getStatusCode()).toBe(200);
    });
  });
});