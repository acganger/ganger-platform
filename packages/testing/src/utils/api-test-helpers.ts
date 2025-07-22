import { createMocks, RequestMethod } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';

interface MockRequestOptions {
  method?: RequestMethod;
  headers?: Record<string, string>;
  query?: Record<string, string | string[]>;
  body?: any;
  cookies?: Record<string, string>;
}

export function createMockRequest(options: MockRequestOptions = {}) {
  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
    method: options.method || 'GET',
    headers: {
      'content-type': 'application/json',
      ...options.headers,
    },
    query: options.query || {},
    body: options.body || {},
    cookies: options.cookies || {},
  });

  return { req, res };
}

export function createAuthenticatedRequest(
  userId: string,
  options: MockRequestOptions = {}
) {
  return createMockRequest({
    ...options,
    headers: {
      ...options.headers,
      authorization: `Bearer mock-token-${userId}`,
    },
  });
}

export async function testApiHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: MockRequestOptions = {}
) {
  const { req, res } = createMockRequest(options);
  await handler(req, res);
  return { req, res };
}

export function expectSuccessResponse(res: any, data?: any) {
  expect(res._getStatusCode()).toBe(200);
  const json = JSON.parse(res._getData());
  expect(json.success).toBe(true);
  if (data !== undefined) {
    expect(json.data).toEqual(data);
  }
  return json;
}

export function expectErrorResponse(res: any, statusCode: number, errorMessage?: string) {
  expect(res._getStatusCode()).toBe(statusCode);
  const json = JSON.parse(res._getData());
  expect(json.success).toBe(false);
  if (errorMessage) {
    expect(json.error).toContain(errorMessage);
  }
  return json;
}

// Mock Supabase client for testing
export function createMockSupabaseClient() {
  const mockClient = {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@gangerdermatology.com',
          },
        },
        error: null,
      }),
    },
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
    })),
  };

  return mockClient;
}