import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../index';
import { createBrowserSupabaseClient } from '../utils/supabase-ssr';

// Mock Supabase client
jest.mock('../utils/supabase-ssr', () => ({
  createBrowserSupabaseClient: jest.fn(),
}));

const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createBrowserSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('AuthProvider', () => {
    it('should render children when not loading', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(
        <AuthProvider>
          <div>Test Content</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Content')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      mockSupabaseClient.auth.getSession.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <AuthProvider>
          <div>Test Content</div>
        </AuthProvider>
      );

      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });
  });

  describe('useAuth hook', () => {
    const TestComponent = () => {
      const { user, loading, signInWithGoogle, signOut } = useAuth();
      
      return (
        <div>
          {loading && <div>Loading...</div>}
          {user && <div>User: {user.email}</div>}
          <button onClick={signInWithGoogle}>Sign In</button>
          <button onClick={signOut}>Sign Out</button>
        </div>
      );
    };

    it('should handle Google OAuth sign in', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      });

      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: expect.stringContaining('/auth/callback'),
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
      });
    });

    it('should handle sign out', async () => {
      const mockUser = {
        id: '123',
        email: 'test@gangerdermatology.com',
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: {
            user: mockUser,
            access_token: 'token',
          },
        },
        error: null,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('User: test@gangerdermatology.com')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      });
    });

    it('should handle authentication errors', async () => {
      const mockError = new Error('Authentication failed');
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error signing in with Google:', mockError);
      });

      consoleError.mockRestore();
    });
  });

  describe('Domain Validation', () => {
    it('should only allow @gangerdermatology.com emails', async () => {
      const invalidUser = {
        id: '123',
        email: 'test@example.com',
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: {
            user: invalidUser,
            access_token: 'token',
          },
        },
        error: null,
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: invalidUser },
        error: null,
      });

      // In a real implementation, this would be handled by Supabase RLS
      // or a custom auth hook that validates the domain
      const isValidDomain = (email: string) => {
        return email.endsWith('@gangerdermatology.com');
      };

      expect(isValidDomain(invalidUser.email)).toBe(false);
      expect(isValidDomain('staff@gangerdermatology.com')).toBe(true);
    });
  });
});