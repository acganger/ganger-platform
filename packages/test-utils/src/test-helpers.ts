import { waitFor } from '@testing-library/react';
import { mockUser } from './mock-data';

/**
 * Wait for async operations to complete with better error messages
 */
export async function waitForAsync(callback: () => void | Promise<void>) {
  await waitFor(callback, {
    timeout: 5000,
    onTimeout: (error) => {
      console.error('waitForAsync timeout:', error);
      return error;
    }
  });
}

/**
 * Mock fetch response helper
 */
export function mockFetch(data: any, options: { status?: number; ok?: boolean } = {}) {
  const { status = 200, ok = true } = options;
  
  return jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({
      'content-type': 'application/json'
    })
  });
}

/**
 * Mock API response with error
 */
export function mockFetchError(message = 'Network error', status = 500) {
  return jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ error: message }),
    text: async () => message,
    headers: new Headers({
      'content-type': 'application/json'
    })
  });
}

/**
 * Mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ 
        data: { user: mockUser() }, 
        error: null 
      }),
      signInWithOAuth: jest.fn().mockResolvedValue({ 
        data: {}, 
        error: null 
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: {}, error: null }),
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null })
          })
        }),
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      }),
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null })
      })
    })
  };
}

/**
 * Utility to test async hooks
 */
export async function testHook<T>(
  hookFn: () => T,
  wrapper?: React.ComponentType<{ children: React.ReactNode }>
): Promise<{ result: T }> {
  let result: T;
  
  function TestComponent() {
    result = hookFn();
    return null;
  }
  
  const { render } = await import('./render');
  
  if (wrapper) {
    render(<TestComponent />, { wrapper });
  } else {
    render(<TestComponent />);
  }
  
  return { result: result! };
}

/**
 * Generate random test data
 */
export const testData = {
  randomId: () => `test-${Math.random().toString(36).substr(2, 9)}`,
  randomEmail: () => `test-${Date.now()}@gangerdermatology.com`,
  randomPhone: () => `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
  randomDate: (daysFromNow = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  }
};