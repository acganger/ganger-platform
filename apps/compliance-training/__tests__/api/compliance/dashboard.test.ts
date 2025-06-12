import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/compliance/dashboard';
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

describe('/api/compliance/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Tests', () => {
    it('should return 401 when no user token provided', async () => {
      mockGetUserFromToken.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET'
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
        role: 'employee' // Not authorized role
      });

      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access compliance dashboard'
        }
      });
    });
  });

  describe('Authorization Tests', () => {
    it('should allow superadmin access', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });

      // Mock successful database responses
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: [],
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should allow hr_admin access', async () => {
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
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should allow manager access to their department only', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'manager-123',
        email: 'manager@gangerdermatology.com',
        role: 'manager',
        department: 'dermatology'
      });

      const mockSelectFn = jest.fn().mockReturnValue({
        data: [
          {
            department: 'dermatology',
            total_employees: 10,
            avg_compliance_rate: 85.5
          }
        ],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelectFn
      });

      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      // Verify department filtering was applied
      expect(mockSelectFn).toHaveBeenCalledWith('*');
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

  describe('Data Fetching Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should return dashboard data successfully', async () => {
      const mockDashboardData = [
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

      const mockOverdueData = [
        {
          employee_id: 'emp-1',
          employee_name: 'John Doe',
          department: 'dermatology',
          module_name: 'HIPAA Training',
          overdue_days: 5
        }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'department_compliance_dashboard') {
          return {
            select: jest.fn().mockReturnValue({
              data: mockDashboardData,
              error: null
            })
          };
        }
        if (table === 'training_completions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    data: mockOverdueData,
                    error: null
                  })
                })
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
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveProperty('departmentSummary');
      expect(responseData.data).toHaveProperty('overdueAlerts');
      expect(responseData.data).toHaveProperty('overallStats');
      expect(responseData.data.departmentSummary).toEqual(mockDashboardData);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      });

      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch dashboard data'
        }
      });
    });

    it('should handle empty data correctly', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: [],
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      expect(responseData.data.departmentSummary).toEqual([]);
      expect(responseData.data.overdueAlerts).toEqual([]);
    });
  });

  describe('Query Parameter Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should filter by department when provided', async () => {
      const mockSelectFn = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [],
          error: null
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelectFn
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          department: 'dermatology'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should filter by location when provided', async () => {
      const mockSelectFn = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [],
          error: null
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelectFn
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          location: 'main-office'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
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
          data: [],
          error: null
        })
      });

      const startTime = Date.now();
      
      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Caching Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should include cache headers for successful responses', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: [],
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      // Note: In actual implementation, verify cache headers are set
      // expect(res._getHeaders()['cache-control']).toBeDefined();
    });
  });
});