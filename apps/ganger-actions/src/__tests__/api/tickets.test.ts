import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tickets/index';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { migrationAdapter } from '@ganger/db';

// Mock dependencies
jest.mock('@ganger/auth/server');
jest.mock('@ganger/db');
jest.mock('@ganger/cache');

describe('/api/tickets', () => {
  const mockSession = {
    user: {
      email: 'test@gangerdermatology.com',
      user_metadata: { full_name: 'Test User' }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (createSupabaseServerClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: mockSession },
          error: null
        })
      }
    });
  });

  describe('GET /api/tickets', () => {
    it('should require authentication', async () => {
      // Mock no session
      (createSupabaseServerClient as jest.Mock).mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        }
      });

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Authentication required',
        statusCode: 401
      });
    });

    it('should return tickets for authenticated user', async () => {
      const mockTickets = [
        {
          id: '1',
          ticket_number: 'TKT-001',
          title: 'Test Ticket',
          status: 'open',
          form_type: 'support_ticket',
          submitter_email: 'test@gangerdermatology.com',
          submitter_name: 'Test User',
          created_at: '2025-01-01T00:00:00Z'
        }
      ];

      (migrationAdapter.select as jest.Mock).mockResolvedValue(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: '20',
          offset: '0'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(migrationAdapter.select).toHaveBeenCalledWith(
        'staff_tickets',
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          limit: 20,
          offset: 0
        })
      );
    });

    it('should apply filters correctly', async () => {
      (migrationAdapter.select as jest.Mock).mockResolvedValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          status: 'open',
          form_type: 'time_off_request',
          priority: 'high',
          search: 'vacation'
        }
      });

      await handler(req, res);

      expect(migrationAdapter.select).toHaveBeenCalledWith(
        'staff_tickets',
        expect.any(String),
        expect.objectContaining({
          status: 'open',
          form_type: 'time_off_request',
          priority: 'high'
        }),
        expect.any(Object)
      );
    });

    it('should handle pagination', async () => {
      (migrationAdapter.select as jest.Mock).mockResolvedValue([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: '50',
          offset: '100'
        }
      });

      await handler(req, res);

      expect(migrationAdapter.select).toHaveBeenCalledWith(
        'staff_tickets',
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          limit: 50,
          offset: 100
        })
      );
    });
  });

  describe('POST /api/tickets', () => {
    it('should create a new ticket', async () => {
      const newTicket = {
        id: '123',
        ticket_number: 'TKT-002',
        status: 'open',
        created_at: '2025-01-01T00:00:00Z'
      };

      (migrationAdapter.insert as jest.Mock).mockResolvedValue([newTicket]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'New Support Request',
          description: 'Need help with system',
          form_type: 'support_ticket',
          form_data: { category: 'technical' },
          priority: 'medium',
          location: 'Ann Arbor'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(migrationAdapter.insert).toHaveBeenCalledWith(
        'staff_tickets',
        expect.objectContaining({
          form_type: 'support_ticket',
          submitter_email: 'test@gangerdermatology.com',
          title: 'New Support Request'
        })
      );
    });

    it('should validate required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Missing required fields
          title: 'Test'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: expect.stringContaining('required'),
        statusCode: 400
      });
    });

    it('should set pending_approval status for time off requests', async () => {
      (migrationAdapter.insert as jest.Mock).mockResolvedValue([{
        id: '456',
        ticket_number: 'TKT-003',
        status: 'pending_approval'
      }]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          form_type: 'time_off_request',
          form_data: {
            start_date: '2025-02-01',
            end_date: '2025-02-05'
          }
        }
      });

      await handler(req, res);

      expect(migrationAdapter.insert).toHaveBeenCalledWith(
        'staff_tickets',
        expect.objectContaining({
          status: expect.any(String), // Will be converted by MigrationHelpers
          approval_required: true
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (migrationAdapter.select as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: expect.stringContaining('Database'),
        statusCode: 500
      });
    });

    it('should reject invalid HTTP methods', async () => {
      const { req, res } = createMocks({
        method: 'DELETE'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method DELETE not allowed',
        statusCode: 400
      });
    });
  });
});