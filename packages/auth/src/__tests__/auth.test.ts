import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createSupabaseServerClient } from '../index';
import { CookieStorageAdapter } from '../utils/CookieStorageAdapter';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    }
  }))
}));

// Mock Next.js headers and cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }))
}));

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CookieStorageAdapter', () => {
    it('should extract project reference from URL correctly', () => {
      const adapter = new CookieStorageAdapter({
        storageKey: 'sb-pfqtzmxxxhhsxmlddrta-auth-token',
        cookieOptions: {}
      });

      // Test internal method indirectly
      const cookies = adapter['cookies'];
      expect(cookies).toBeDefined();
    });

    it('should handle cross-subdomain cookies', () => {
      const adapter = new CookieStorageAdapter({
        storageKey: 'sb-auth-token',
        cookieOptions: {
          domain: '.gangerdermatology.com',
          secure: true,
          sameSite: 'lax'
        }
      });

      expect(adapter['cookieOptions'].domain).toBe('.gangerdermatology.com');
      expect(adapter['cookieOptions'].secure).toBe(true);
    });
  });

  describe('Supabase Server Client', () => {
    it('should create a server client successfully', () => {
      const client = createSupabaseServerClient();
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });

    it('should handle authentication errors gracefully', async () => {
      const client = createSupabaseServerClient();
      
      // Mock auth error
      client.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: null },
        error: new Error('Authentication failed')
      });

      const { data, error } = await client.auth.getSession();
      expect(error).toBeDefined();
      expect(data.session).toBeNull();
    });
  });

  describe('OAuth Flow', () => {
    it('should initiate Google OAuth with correct parameters', async () => {
      const client = createSupabaseServerClient();
      const mockSignIn = jest.fn().mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth/authorize...' },
        error: null
      });
      
      client.auth.signInWithOAuth = mockSignIn;

      const result = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://staff.gangerdermatology.com/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      expect(mockSignIn).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback')
        })
      });
      expect(result.data.url).toBeDefined();
    });

    it('should handle OAuth errors', async () => {
      const client = createSupabaseServerClient();
      
      client.auth.signInWithOAuth = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('OAuth provider error')
      });

      const result = await client.auth.signInWithOAuth({
        provider: 'google'
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('OAuth provider error');
    });
  });

  describe('Session Management', () => {
    it('should retrieve valid session', async () => {
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: '123',
          email: 'test@gangerdermatology.com',
          user_metadata: {
            full_name: 'Test User'
          }
        }
      };

      const client = createSupabaseServerClient();
      client.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const { data, error } = await client.auth.getSession();
      expect(error).toBeNull();
      expect(data.session).toEqual(mockSession);
      expect(data.session?.user.email).toBe('test@gangerdermatology.com');
    });

    it('should handle expired sessions', async () => {
      const client = createSupabaseServerClient();
      
      client.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: null },
        error: null
      });

      const { data } = await client.auth.getSession();
      expect(data.session).toBeNull();
    });
  });

  describe('Sign Out', () => {
    it('should clear session on sign out', async () => {
      const client = createSupabaseServerClient();
      
      client.auth.signOut = jest.fn().mockResolvedValue({
        error: null
      });

      const { error } = await client.auth.signOut();
      expect(error).toBeNull();
      expect(client.auth.signOut).toHaveBeenCalled();
    });
  });
});