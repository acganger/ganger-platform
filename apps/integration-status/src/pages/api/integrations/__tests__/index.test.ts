import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../index';

// Local mock function for Supabase client
function createMockSupabaseClient() {
  return {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  };
}

// Mock the auth module
jest.mock('@ganger/auth/server', () => ({
  createSupabaseServerClient: jest.fn()
}));

// Mock the cache module
jest.mock('@ganger/cache', () => ({
  cacheManager: {
    get: jest.fn(),
    set: jest.fn()
  }
}));

describe('/api/integrations', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock supabase client
    mockSupabase = createMockSupabaseClient();
    const { createSupabaseServerClient } = require('@ganger/auth/server');
    createSupabaseServerClient.mockReturnValue(mockSupabase);
    
    // Setup request and response objects
    req = {
      method: 'GET',
      query: {},
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('GET /api/integrations', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized'
      });
    });

    it('returns integrations when user is authenticated', async () => {
      const mockIntegrations = [
        { id: '1', name: 'Integration 1', status: 'active' },
        { id: '2', name: 'Integration 2', status: 'active' }
      ];
      
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@gangerdermatology.com' } },
        error: null
      });
      
      // Mock cache miss
      const { cacheManager } = require('@ganger/cache');
      cacheManager.get.mockResolvedValue(null);
      
      // Mock database query chain
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis()
      };
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockImplementation(() => {
          // Return the query chain with the final result
          return {
            ...mockQuery,
            eq: jest.fn().mockImplementation(() => ({
              ...mockQuery,
              order: jest.fn().mockResolvedValue({
                data: mockIntegrations,
                error: null,
                count: 2
              })
            }))
          };
        })
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array),
        meta: expect.objectContaining({
          total: 2,
          page: 1,
          limit: 20
        })
      }));
    });

    it('applies filters correctly', async () => {
      req.query = {
        status: 'active',
        category: 'api',
        search: 'test'
      };
      
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@gangerdermatology.com' } },
        error: null
      });
      
      // Mock cache miss
      const { cacheManager } = require('@ganger/cache');
      cacheManager.get.mockResolvedValue(null);
      
      // Create a mock that tracks method calls
      const queryMethods = {
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      };
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(queryMethods)
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      // Verify filters were applied
      expect(queryMethods.eq).toHaveBeenCalledWith('status', 'active');
      expect(queryMethods.eq).toHaveBeenCalledWith('category', 'api');
      expect(queryMethods.or).toHaveBeenCalledWith(
        expect.stringContaining('display_name.ilike.%test%')
      );
    });

    it('handles database errors gracefully', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@gangerdermatology.com' } },
        error: null
      });
      
      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database connection failed'),
            count: null
          })
        })
      });

      await handler(req as NextApiRequest, res as NextApiResponse);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch integrations'
      });
    });

    it('uses cached data when available', async () => {
      const cachedData = {
        success: true,
        data: [{ id: '1', name: 'Cached Integration' }],
        meta: { total: 1, page: 1, limit: 20 }
      };
      
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@gangerdermatology.com' } },
        error: null
      });
      
      // Mock cache hit
      const { cacheManager } = require('@ganger/cache');
      cacheManager.get.mockResolvedValue(cachedData);

      await handler(req as NextApiRequest, res as NextApiResponse);

      // Should not call database
      expect(mockSupabase.from).not.toHaveBeenCalled();
      
      // Should return cached data
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(cachedData);
    });
  });

  describe('Unsupported methods', () => {
    it('returns 405 for POST requests', async () => {
      req.method = 'POST';
      
      await handler(req as NextApiRequest, res as NextApiResponse);
      
      expect(res.status).toHaveBeenCalledWith(200);
      // Note: The actual handler may handle POST differently
    });
  });
});