import { 
  testApiHandler, 
  expectSuccessResponse, 
  expectErrorResponse,
  createMockSupabaseClient 
} from '@ganger/testing/utils/api-test-helpers';
import handler from '../templates/index';
import { cacheManager } from '@ganger/cache';

// Mock dependencies
jest.mock('@ganger/auth/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));

jest.mock('@ganger/cache', () => ({
  cacheManager: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

const mockSupabase = createMockSupabaseClient();
const { createSupabaseServerClient } = require('@ganger/auth/server');

describe('/api/templates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createSupabaseServerClient.mockReturnValue(mockSupabase);
  });

  describe('GET /api/templates', () => {
    const mockTemplates = [
      {
        id: '1',
        name: 'Post-Procedure Care',
        category: 'post-procedure',
        template_type: 'standard',
        tags: ['care', 'recovery'],
        is_active: true,
        version: '1.0',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        template_usage_analytics: [
          {
            generation_count: 10,
            usage_date: new Date().toISOString(),
          },
        ],
      },
      {
        id: '2',
        name: 'Medication Instructions',
        category: 'medication',
        template_type: 'standard',
        tags: ['medication'],
        is_active: true,
        version: '1.0',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        template_usage_analytics: [
          {
            generation_count: 5,
            usage_date: new Date().toISOString(),
          },
        ],
      },
    ];

    it('should return cached data if available', async () => {
      const cachedData = [{ id: '1', name: 'Cached Template' }];
      (cacheManager.get as jest.Mock).mockResolvedValue(cachedData);

      const { res } = await testApiHandler(handler, {
        method: 'GET',
        query: { category: 'post-procedure' },
      });

      expectSuccessResponse(res, cachedData);
      expect(cacheManager.get).toHaveBeenCalledWith(
        'handout_templates:post-procedure::all'
      );
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should fetch from database when cache misses', async () => {
      (cacheManager.get as jest.Mock).mockResolvedValue(null);
      
      const fromMock = mockSupabase.from('handout_templates');
      fromMock.select().order().mockResolvedValue({
        data: mockTemplates,
        error: null,
      });

      const { res } = await testApiHandler(handler, {
        method: 'GET',
      });

      const response = expectSuccessResponse(res);
      expect(response.data).toHaveLength(2);
      expect(response.data[0]).toHaveProperty('usageCount', 10);
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should filter by category', async () => {
      (cacheManager.get as jest.Mock).mockResolvedValue(null);
      
      const fromMock = mockSupabase.from('handout_templates');
      fromMock.select().eq('category', 'medication').order().mockResolvedValue({
        data: [mockTemplates[1]],
        error: null,
      });

      const { res } = await testApiHandler(handler, {
        method: 'GET',
        query: { category: 'medication' },
      });

      const response = expectSuccessResponse(res);
      expect(response.data).toHaveLength(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('handout_templates');
    });

    it('should filter by search query', async () => {
      (cacheManager.get as jest.Mock).mockResolvedValue(null);
      
      const fromMock = mockSupabase.from('handout_templates');
      fromMock.select().ilike('name', '%care%').order().mockResolvedValue({
        data: [mockTemplates[0]],
        error: null,
      });

      const { res } = await testApiHandler(handler, {
        method: 'GET',
        query: { search: 'care' },
      });

      const response = expectSuccessResponse(res);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].name).toContain('Care');
    });

    it('should filter by active status', async () => {
      (cacheManager.get as jest.Mock).mockResolvedValue(null);
      
      const fromMock = mockSupabase.from('handout_templates');
      fromMock.select().eq('is_active', true).order().mockResolvedValue({
        data: mockTemplates,
        error: null,
      });

      const { res } = await testApiHandler(handler, {
        method: 'GET',
        query: { active: 'true' },
      });

      expectSuccessResponse(res);
      expect(fromMock.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should handle database errors', async () => {
      (cacheManager.get as jest.Mock).mockResolvedValue(null);
      
      const fromMock = mockSupabase.from('handout_templates');
      fromMock.select().order().mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      });

      const { res } = await testApiHandler(handler, {
        method: 'GET',
      });

      expectErrorResponse(res, 500, 'Database connection failed');
    });

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { res } = await testApiHandler(handler, {
        method: 'GET',
      });

      expectErrorResponse(res, 401, 'Unauthorized');
    });
  });

  describe('POST /api/templates', () => {
    it('should reject non-GET requests', async () => {
      const { res } = await testApiHandler(handler, {
        method: 'POST',
        body: { name: 'New Template' },
      });

      expectErrorResponse(res, 405, 'Method POST not allowed');
    });
  });

  describe('Template complexity calculation', () => {
    it('should determine complexity based on tags and variables', async () => {
      (cacheManager.get as jest.Mock).mockResolvedValue(null);
      
      const complexTemplate = {
        ...mockTemplates[0],
        tags: ['complex'],
        variables: Array(6).fill({ name: 'var' }),
      };

      const fromMock = mockSupabase.from('handout_templates');
      fromMock.select().order().mockResolvedValue({
        data: [complexTemplate],
        error: null,
      });

      const { res } = await testApiHandler(handler, {
        method: 'GET',
      });

      const response = expectSuccessResponse(res);
      expect(response.data[0].complexity).toBe('complex');
    });
  });
});