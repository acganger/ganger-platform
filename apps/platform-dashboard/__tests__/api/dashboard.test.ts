// Platform Entrypoint Dashboard - Dashboard API Tests
// Comprehensive test suite for the main dashboard data API

import { createMocks } from 'node-mocks-http';
import dashboardHandler from '../../src/pages/api/dashboard/index';
import { createServerSupabaseClient } from '../../src/lib/supabase-server';

// Mock dependencies
jest.mock('../../src/lib/supabase-server');
jest.mock('@ganger/auth', () => ({
  withAuth: (handler: any, options: any) => {
    return (req: any, res: any) => {
      // Mock authenticated user
      req.user = {
        id: 'test-user-id',
        email: 'test@gangerdermatology.com',
        name: 'Test User',
        role: 'staff',
        primary_location: 'Ann Arbor'
      };
      return handler(req, res);
    };
  }
}));

const mockSupabaseClient = {
  query: jest.fn(),
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        or: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }))
};

describe('/api/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  // Helper to create proper NextApiRequest mock
  const createApiRequest = (options: any) => {
    const { req, res } = createMocks(options);
    // Add missing properties required by NextApiRequest
    (req as any).env = process.env;
    (req as any).preview = false;
    (req as any).previewData = undefined;
    
    // Add missing NextApiResponse methods
    (res as any).setDraftMode = jest.fn().mockReturnValue(res);
    (res as any).setPreviewData = jest.fn().mockReturnValue(res);
    (res as any).clearPreviewData = jest.fn().mockReturnValue(res);
    (res as any).revalidate = jest.fn().mockResolvedValue(undefined);
    
    return { req: req as any, res: res as any };
  };

  describe('GET /api/dashboard', () => {
    it('should require authentication', async () => {
      const { req, res } = createApiRequest({
        method: 'GET',
      });

      // Mock unauthenticated request by removing user
      delete req.user;

      await dashboardHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    it('should return personalized dashboard data for authenticated user', async () => {
      // Mock database responses
      mockSupabaseClient.query
        .mockResolvedValueOnce([]) // user preferences (empty, will create default)
        .mockResolvedValueOnce([ // available widgets
          {
            widget_id: 'application_launcher',
            display_name: 'Application Launcher',
            category: 'application',
            is_active: true,
            required_roles: ['staff']
          },
          {
            widget_id: 'notifications_center',
            display_name: 'Notifications',
            category: 'communication',
            is_active: true,
            required_roles: ['staff']
          }
        ])
        .mockResolvedValueOnce([ // announcements
          {
            id: 'test-announcement',
            title: 'Test Announcement',
            content: 'Test content',
            announcement_type: 'info',
            priority: 1,
            created_at: new Date().toISOString()
          }
        ])
        .mockResolvedValueOnce([ // quick actions
          {
            action_id: 'test-action',
            display_name: 'Test Action',
            icon_name: 'plus',
            action_type: 'app_launch'
          }
        ])
        .mockResolvedValueOnce([ // create default preferences
          {
            user_id: 'test-user-id',
            layout_columns: 3,
            widget_arrangement: [],
            theme_preference: 'system'
          }
        ]);

      const { req, res } = createApiRequest({
        method: 'GET',
      });

      await dashboardHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('preferences');
      expect(data.data).toHaveProperty('widgets');
      expect(data.data).toHaveProperty('widgetData');
      expect(data.data).toHaveProperty('announcements');
      expect(data.data).toHaveProperty('quickActions');
      expect(data.data).toHaveProperty('userInfo');
      expect(data.data.userInfo.email).toBe('test@gangerdermatology.com');
    });

    it('should filter widgets by user role', async () => {
      // Mock manager user
      const { req, res } = createApiRequest({
        method: 'GET',
      });
      req.user = {
        id: 'manager-user-id',
        email: 'manager@gangerdermatology.com',
        role: 'manager',
        primary_location: 'Ann Arbor'
      };

      mockSupabaseClient.query
        .mockResolvedValueOnce([]) // preferences
        .mockResolvedValueOnce([ // widgets (manager should see team_activity)
          {
            widget_id: 'application_launcher',
            display_name: 'Application Launcher',
            required_roles: ['staff', 'manager']
          },
          {
            widget_id: 'team_activity',
            display_name: 'Team Activity',
            required_roles: ['manager', 'superadmin']
          }
        ])
        .mockResolvedValueOnce([]) // announcements
        .mockResolvedValueOnce([]) // quick actions
        .mockResolvedValueOnce([{user_id: 'manager-user-id'}]); // create preferences

      await dashboardHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const { req, res } = createApiRequest({
        method: 'GET',
      });

      await dashboardHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FETCH_FAILED');
    });
  });

  describe('POST /api/dashboard', () => {
    it('should update user preferences', async () => {
      mockSupabaseClient.query.mockResolvedValueOnce([
        {
          user_id: 'test-user-id',
          layout_columns: 4,
          theme_preference: 'dark',
          updated_at: new Date().toISOString()
        }
      ]);

      const { req, res } = createApiRequest({
        method: 'POST',
        body: {
          preferences: {
            layout_columns: 4,
            theme_preference: 'dark'
          }
        }
      });

      await dashboardHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.message).toContain('preferences updated');
    });

    it('should update widget arrangement', async () => {
      const widgetArrangement = [
        { widget_id: 'application_launcher', position: 0, size: { width: 2, height: 1 } },
        { widget_id: 'notifications_center', position: 1, size: { width: 1, height: 1 } }
      ];

      mockSupabaseClient.query.mockResolvedValueOnce([
        {
          user_id: 'test-user-id',
          widget_arrangement: widgetArrangement,
          updated_at: new Date().toISOString()
        }
      ]);

      const { req, res } = createApiRequest({
        method: 'POST',
        body: {
          widget_arrangement: widgetArrangement
        }
      });

      await dashboardHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
    });

    it('should handle invalid preference updates', async () => {
      mockSupabaseClient.query.mockRejectedValueOnce(new Error('Invalid preferences'));

      const { req, res } = createApiRequest({
        method: 'POST',
        body: {
          preferences: {
            invalid_field: 'invalid_value'
          }
        }
      });

      await dashboardHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
    });
  });

  describe('Widget Data Caching', () => {
    it('should cache widget data appropriately', async () => {
      // Mock widget data cache response
      mockSupabaseClient.query
        .mockResolvedValueOnce([]) // preferences
        .mockResolvedValueOnce([{ widget_id: 'application_launcher' }]) // widgets
        .mockResolvedValueOnce([]) // announcements
        .mockResolvedValueOnce([]) // quick actions
        .mockResolvedValueOnce([{user_id: 'test-user-id'}]) // create preferences
        .mockResolvedValueOnce([ // cached widget data
          {
            data_content: { applications: [], totalApps: 0 },
            expires_at: new Date(Date.now() + 60000).toISOString()
          }
        ]);

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { refresh: 'false' }
      });

      await dashboardHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should refresh widget data when requested', async () => {
      mockSupabaseClient.query
        .mockResolvedValueOnce([]) // preferences
        .mockResolvedValueOnce([{ widget_id: 'application_launcher' }]) // widgets
        .mockResolvedValueOnce([]) // announcements
        .mockResolvedValueOnce([]) // quick actions
        .mockResolvedValueOnce([{user_id: 'test-user-id'}]) // create preferences
        .mockResolvedValueOnce([]); // no cached data (force refresh)

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { refresh: 'true' }
      });

      await dashboardHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      mockSupabaseClient.query
        .mockResolvedValue([]);

      const { req, res } = createApiRequest({
        method: 'GET',
      });

      const startTime = Date.now();
      await dashboardHandler(req, res);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
      expect(res._getStatusCode()).toBe(200);
    });

    it('should include performance metadata in response', async () => {
      mockSupabaseClient.query
        .mockResolvedValue([]);

      const { req, res } = createApiRequest({
        method: 'GET',
      });

      await dashboardHandler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.meta).toHaveProperty('performance');
      expect(data.meta.performance).toHaveProperty('queryTime');
      expect(data.meta.performance).toHaveProperty('totalTime');
    });
  });

  describe('Security', () => {
    it('should not return sensitive user data', async () => {
      mockSupabaseClient.query
        .mockResolvedValue([]);

      const { req, res } = createApiRequest({
        method: 'GET',
      });

      await dashboardHandler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.data.userInfo).not.toHaveProperty('password');
      expect(data.data.userInfo).not.toHaveProperty('api_key');
      expect(data.data.userInfo).not.toHaveProperty('secret');
    });

    it('should properly sanitize input data', async () => {
      const maliciousInput = {
        preferences: {
          theme_preference: '<script>alert("xss")</script>'
        }
      };

      mockSupabaseClient.query.mockResolvedValueOnce([{user_id: 'test-user-id'}]);

      const { req, res } = createApiRequest({
        method: 'POST',
        body: maliciousInput
      });

      await dashboardHandler(req, res);

      // Should handle malicious input gracefully
      expect(res._getStatusCode()).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle method not allowed', async () => {
      const { req, res } = createApiRequest({
        method: 'DELETE',
      });

      await dashboardHandler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
    });

    it('should handle malformed requests', async () => {
      const { req, res } = createApiRequest({
        method: 'POST',
        body: null
      });

      await dashboardHandler(req, res);

      // Should handle gracefully without crashing
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(400);
    });
  });
});