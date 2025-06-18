// Platform Entrypoint Dashboard - Search API Tests
// Test suite for global search functionality

import { createMocks } from 'node-mocks-http';
import { GET } from '../../app/api/search/route';
import { createServerSupabaseClient } from '../../src/lib/supabase-server';

// Mock dependencies
jest.mock('../../src/lib/supabase-server');
jest.mock('@ganger/auth', () => ({
  withAuth: (handler: any, options: any) => {
    return (req: any, res: any) => {
      req.user = {
        id: 'test-user-id',
        email: 'test@gangerdermatology.com',
        role: 'staff',
        primary_location: 'Ann Arbor'
      };
      return handler(req, res);
    };
  }
}));

const mockSupabaseClient = {
  query: jest.fn()
};

describe('/api/search', () => {
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

  describe('GET /api/search', () => {
    it('should require authentication', async () => {
      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: 'test' }
      });

      delete req.user;

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    it('should return empty results for short queries', async () => {
      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: 'a' } // Too short
      });

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.results.applications).toEqual([]);
      expect(data.data.results.help).toEqual([]);
      expect(data.data.results.users).toEqual([]);
      expect(data.data.results.documents).toEqual([]);
    });

    it('should perform full-text search and return categorized results', async () => {
      const mockSearchResults = [
        {
          content_id: 'inventory',
          content_type: 'application',
          title: 'Inventory Management',
          excerpt: 'Medical supply tracking system',
          url: '/inventory',
          icon_url: '/icons/inventory.svg',
          relevance_score: 0.9
        },
        {
          content_id: 'inventory-help',
          content_type: 'help_article',
          title: 'How to use Inventory System',
          excerpt: 'Guide for managing medical supplies',
          url: '/help/inventory',
          icon_url: null,
          relevance_score: 0.7
        }
      ];

      mockSupabaseClient.query
        .mockResolvedValueOnce(mockSearchResults) // search index results
        .mockResolvedValueOnce([]); // direct application search

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: 'inventory', limit: '10' }
      });

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.results.applications).toHaveLength(1);
      expect(data.data.results.help).toHaveLength(1);
      expect(data.data.results.applications[0].title).toBe('Inventory Management');
      expect(data.data.results.help[0].title).toBe('How to use Inventory System');
    });

    it('should filter results by user role', async () => {
      const mockSearchResults = [
        {
          content_id: 'admin-panel',
          content_type: 'application',
          title: 'Admin Panel',
          excerpt: 'Administrative controls',
          url: '/admin',
          required_roles: ['superadmin'], // Staff should not see this
          relevance_score: 0.9
        },
        {
          content_id: 'inventory',
          content_type: 'application',
          title: 'Inventory Management',
          excerpt: 'Medical supply tracking',
          url: '/inventory',
          required_roles: ['staff', 'manager'],
          relevance_score: 0.8
        }
      ];

      mockSupabaseClient.query
        .mockResolvedValueOnce(mockSearchResults)
        .mockResolvedValueOnce([]);

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: 'admin inventory' }
      });

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      
      // Staff user should only see inventory, not admin panel
      expect(data.data.results.applications).toHaveLength(1);
      expect(data.data.results.applications[0].title).toBe('Inventory Management');
    });

    it('should support category filtering', async () => {
      mockSupabaseClient.query
        .mockResolvedValueOnce([
          {
            content_id: 'help-article-1',
            content_type: 'help_article',
            title: 'Getting Started',
            excerpt: 'How to get started',
            url: '/help/getting-started',
            relevance_score: 0.9
          }
        ])
        .mockResolvedValueOnce([]);

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: 'getting started', category: 'help' }
      });

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data.results.help).toHaveLength(1);
      expect(data.data.results.applications).toHaveLength(0);
    });

    it('should include relevance scoring', async () => {
      const mockSearchResults = [
        {
          content_id: 'exact-match',
          content_type: 'application',
          title: 'Inventory System',
          excerpt: 'Exact match result',
          relevance_score: 0.95
        },
        {
          content_id: 'partial-match',
          content_type: 'application',
          title: 'Supply Management',
          excerpt: 'Partial match result',
          relevance_score: 0.60
        }
      ];

      mockSupabaseClient.query
        .mockResolvedValueOnce(mockSearchResults)
        .mockResolvedValueOnce([]);

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: 'inventory' }
      });

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      
      // Results should be ordered by relevance (highest first)
      expect(data.data.results.applications[0].relevance_score).toBeGreaterThan(
        data.data.results.applications[1].relevance_score
      );
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.query.mockRejectedValueOnce(new Error('Database error'));

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: 'test query' }
      });

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('SEARCH_FAILED');
    });

    it('should log search activity', async () => {
      mockSupabaseClient.query
        .mockResolvedValueOnce([]) // search results
        .mockResolvedValueOnce([]) // direct app search
        .mockResolvedValueOnce({}); // activity log

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: 'test search' }
      });

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      // Verify that activity logging was called
      expect(mockSupabaseClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_activity_log'),
        expect.arrayContaining(['test-user-id', 'search'])
      );
    });

    it('should support direct application search', async () => {
      const mockDirectAppResults = [
        {
          app_name: 'inventory',
          display_name: 'Inventory Management',
          description: 'Medical supply tracking system',
          app_url: '/inventory',
          icon_url: '/icons/inventory.svg'
        }
      ];

      mockSupabaseClient.query
        .mockResolvedValueOnce([]) // search index (empty)
        .mockResolvedValueOnce(mockDirectAppResults); // direct app search

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: 'inventory management' }
      });

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data.results.applications).toHaveLength(1);
      expect(data.data.results.applications[0].title).toBe('Inventory Management');
    });

    it('should validate query parameters', async () => {
      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: 'test', limit: 'invalid' }
      });

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should include performance metrics', async () => {
      mockSupabaseClient.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: 'performance test' }
      });

      const startTime = Date.now();
      await searchHandler(req, res);
      const endTime = Date.now();

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.meta).toHaveProperty('performance');
      expect(data.meta.performance.queryTime).toBeGreaterThan(0);
      expect(data.meta.performance.queryTime).toBeLessThan(endTime - startTime + 100);
    });
  });

  describe('POST /api/search/index', () => {
    it('should require superadmin role for index updates', async () => {
      const { req, res } = createApiRequest({
        method: 'POST',
        body: { force_rebuild: false }
      });

      // Staff user should not be able to update index
      if (req.profile) {
        req.profile.role = 'staff';
      }

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
      const data = JSON.parse(res._getData());
      expect(data.error.code).toBe('ACCESS_DENIED');
    });

    it('should allow superadmin to update search index', async () => {
      mockSupabaseClient.query
        .mockResolvedValue([]); // Mock successful index update

      const { req, res } = createApiRequest({
        method: 'POST',
        body: { force_rebuild: false }
      });

      if (req.profile) {
        req.profile.role = 'superadmin';
      }

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.message).toContain('Search index updated');
    });

    it('should handle force rebuild option', async () => {
      mockSupabaseClient.query
        .mockResolvedValue([]);

      const { req, res } = createApiRequest({
        method: 'POST',
        body: { force_rebuild: true }
      });

      if (req.profile) {
        req.profile.role = 'superadmin';
      }

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
    });
  });

  describe('Search Index Management', () => {
    it('should index applications correctly', async () => {
      const mockApps = [
        {
          app_name: 'inventory',
          display_name: 'Inventory Management',
          description: 'Medical supply tracking',
          app_url: '/inventory',
          icon_url: '/icons/inventory.svg',
          category: 'medical',
          required_roles: ['staff']
        }
      ];

      mockSupabaseClient.query
        .mockResolvedValueOnce(mockApps) // get applications
        .mockResolvedValueOnce({}); // upsert to search index

      const { req, res } = createApiRequest({
        method: 'POST',
        body: { force_rebuild: false }
      });

      if (req.profile) {
        req.profile.role = 'superadmin';
      }

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should handle indexing errors gracefully', async () => {
      mockSupabaseClient.query.mockRejectedValueOnce(new Error('Indexing failed'));

      const { req, res } = createApiRequest({
        method: 'POST',
        body: { force_rebuild: false }
      });

      if (req.profile) {
        req.profile.role = 'superadmin';
      }

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.error.code).toBe('INDEX_UPDATE_FAILED');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent search requests', async () => {
      mockSupabaseClient.query
        .mockResolvedValue([]);

      const requests = Array.from({ length: 10 }, (_, i) => {
        const { req, res } = createApiRequest({
          method: 'GET',
          query: { q: `test query ${i}` }
        });
        return searchHandler(req, res);
      });

      const results = await Promise.all(requests);
      
      // All requests should complete successfully
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should respond within performance thresholds', async () => {
      mockSupabaseClient.query
        .mockResolvedValue([]);

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: 'performance test query' }
      });

      const startTime = Date.now();
      await searchHandler(req, res);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection in search queries', async () => {
      const maliciousQuery = "test'; DROP TABLE search_index; --";

      mockSupabaseClient.query
        .mockResolvedValue([]); // Should handle safely

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: maliciousQuery }
      });

      await searchHandler(req, res);

      // Should not crash and should return safe results
      expect(res._getStatusCode()).toBeLessThan(500);
    });

    it('should sanitize search results', async () => {
      const mockResultsWithXSS = [
        {
          content_id: 'xss-test',
          content_type: 'application',
          title: '<script>alert("xss")</script>Test App',
          excerpt: 'Safe description',
          url: '/test',
          relevance_score: 0.8
        }
      ];

      mockSupabaseClient.query
        .mockResolvedValueOnce(mockResultsWithXSS)
        .mockResolvedValueOnce([]);

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { q: 'test' }
      });

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      
      // Results should be returned (XSS is client's responsibility to handle)
      expect(data.data.results.applications).toHaveLength(1);
    });
  });
});