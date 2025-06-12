import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/compliance/sync';
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

// Mock sync services
jest.mock('../../../../../packages/integrations/server/zenefits/ZenefitsComplianceSync', () => ({
  ZenefitsComplianceSync: jest.fn().mockImplementation(() => ({
    syncEmployees: jest.fn()
  }))
}));

jest.mock('../../../../../packages/integrations/server/google-classroom/GoogleClassroomComplianceSync', () => ({
  GoogleClassroomComplianceSync: jest.fn().mockImplementation(() => ({
    syncCompletions: jest.fn()
  }))
}));

// Mock audit logging
jest.mock('@ganger/utils/server', () => ({
  auditLog: jest.fn()
}));

import { ZenefitsComplianceSync } from '../../../../../packages/integrations/server/zenefits/ZenefitsComplianceSync';
import { GoogleClassroomComplianceSync } from '../../../../../packages/integrations/server/google-classroom/GoogleClassroomComplianceSync';

describe('/api/compliance/sync', () => {
  let mockZenefitsSync: any;
  let mockClassroomSync: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockZenefitsSync = {
      syncEmployees: jest.fn()
    };
    mockClassroomSync = {
      syncCompletions: jest.fn()
    };

    (ZenefitsComplianceSync as jest.Mock).mockImplementation(() => mockZenefitsSync);
    (GoogleClassroomComplianceSync as jest.Mock).mockImplementation(() => mockClassroomSync);
  });

  describe('Authentication Tests', () => {
    it('should return 401 when no user token provided', async () => {
      mockGetUserFromToken.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST'
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
        method: 'POST'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to trigger synchronization'
        }
      });
    });
  });

  describe('Authorization Tests', () => {
    it('should allow superadmin to trigger sync', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });

      // Mock sync log creation
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: { id: 'sync-123' },
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });

      mockZenefitsSync.syncEmployees.mockResolvedValue({
        processed: 10,
        total: 10,
        added: 2,
        updated: 8,
        errors: []
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          syncType: 'zenefits_employees'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should allow hr_admin to trigger sync', async () => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'hr-123',
        email: 'hr@gangerdermatology.com',
        role: 'hr_admin'
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: { id: 'sync-123' },
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });

      mockZenefitsSync.syncEmployees.mockResolvedValue({
        processed: 5,
        total: 5,
        added: 1,
        updated: 4,
        errors: []
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          syncType: 'zenefits_employees'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Method Validation', () => {
    it('should return 405 for non-POST requests', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed'
        }
      });
    });
  });

  describe('Sync Type Validation', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should return 400 for missing syncType', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'INVALID_SYNC_TYPE',
          message: 'syncType is required and must be one of: zenefits_employees, google_classroom_completions, both'
        }
      });
    });

    it('should return 400 for invalid syncType', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          syncType: 'invalid_type'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'INVALID_SYNC_TYPE',
          message: 'syncType is required and must be one of: zenefits_employees, google_classroom_completions, both'
        }
      });
    });
  });

  describe('Zenefits Sync Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: { id: 'sync-123' },
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });
    });

    it('should successfully sync Zenefits employees', async () => {
      const mockSyncResult = {
        processed: 15,
        total: 15,
        added: 3,
        updated: 12,
        skipped: 0,
        errors: [],
        summary: 'Sync completed successfully'
      };

      mockZenefitsSync.syncEmployees.mockResolvedValue(mockSyncResult);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          syncType: 'zenefits_employees',
          options: {
            batchSize: 50,
            skipExisting: false
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveProperty('syncLogId');
      expect(responseData.data).toHaveProperty('results');
      expect(responseData.data.results.zenefits).toEqual(mockSyncResult);
    });

    it('should handle Zenefits sync errors', async () => {
      mockZenefitsSync.syncEmployees.mockRejectedValue(new Error('API connection failed'));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          syncType: 'zenefits_employees'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: 'Synchronization failed',
          details: expect.any(String)
        }
      });
    });
  });

  describe('Google Classroom Sync Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: { id: 'sync-123' },
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });
    });

    it('should successfully sync Google Classroom completions', async () => {
      const mockSyncResult = {
        processed: 25,
        total: 25,
        coursesProcessed: 5,
        completionsFound: 25,
        gradesUpdated: 20,
        errors: [],
        summary: 'Classroom sync completed'
      };

      mockClassroomSync.syncCompletions.mockResolvedValue(mockSyncResult);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          syncType: 'google_classroom_completions',
          options: {
            daysSince: 7
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      expect(responseData.data.results.classroom).toEqual(mockSyncResult);
    });

    it('should handle Google Classroom sync errors', async () => {
      mockClassroomSync.syncCompletions.mockRejectedValue(new Error('Authentication failed'));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          syncType: 'google_classroom_completions'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });
  });

  describe('Combined Sync Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: { id: 'sync-123' },
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });
    });

    it('should successfully run both syncs when syncType is "both"', async () => {
      const mockZenefitsResult = {
        processed: 10,
        total: 10,
        added: 2,
        updated: 8,
        errors: []
      };

      const mockClassroomResult = {
        processed: 15,
        total: 15,
        coursesProcessed: 3,
        completionsFound: 15,
        errors: []
      };

      mockZenefitsSync.syncEmployees.mockResolvedValue(mockZenefitsResult);
      mockClassroomSync.syncCompletions.mockResolvedValue(mockClassroomResult);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          syncType: 'both'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(true);
      expect(responseData.data.results.zenefits).toEqual(mockZenefitsResult);
      expect(responseData.data.results.classroom).toEqual(mockClassroomResult);
    });

    it('should handle partial failures in combined sync', async () => {
      mockZenefitsSync.syncEmployees.mockResolvedValue({
        processed: 10,
        total: 10,
        added: 2,
        updated: 8,
        errors: []
      });

      mockClassroomSync.syncCompletions.mockRejectedValue(new Error('Classroom API error'));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          syncType: 'both'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(207); // Partial success
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.success).toBe(false);
      expect(responseData.data.results.zenefits).toBeDefined();
      expect(responseData.data.errors).toContain('Classroom sync failed: Classroom API error');
    });
  });

  describe('Concurrent Sync Prevention', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });
    });

    it('should prevent concurrent syncs of the same type', async () => {
      // Mock an existing sync in progress
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { id: 'existing-sync' },
                error: null
              })
            })
          })
        })
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          syncType: 'zenefits_employees'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(409);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          code: 'SYNC_IN_PROGRESS',
          message: 'A sync of this type is already in progress'
        }
      });
    });
  });

  describe('Performance Tests', () => {
    beforeEach(() => {
      mockGetUserFromToken.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@gangerdermatology.com',
        role: 'superadmin'
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: { id: 'sync-123' },
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });
    });

    it('should handle large dataset sync efficiently', async () => {
      const largeSyncResult = {
        processed: 1000,
        total: 1000,
        added: 100,
        updated: 900,
        errors: []
      };

      mockZenefitsSync.syncEmployees.mockResolvedValue(largeSyncResult);

      const startTime = Date.now();

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          syncType: 'zenefits_employees',
          options: {
            batchSize: 100
          }
        }
      });

      await handler(req, res);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds for mock
      expect(res._getStatusCode()).toBe(200);
    });
  });
});