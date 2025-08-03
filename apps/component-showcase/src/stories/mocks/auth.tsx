import React, { ReactNode } from 'react';

// Mock AuthProvider for Storybook stories
export const MockAuthProvider = ({ children }: { children: ReactNode }) => {
  const mockUser = {
    id: 'mock-user-123',
    email: 'mockuser@gangerdermatology.com',
    role: 'staff' as const,
    permissions: ['read:inventory', 'write:schedule', 'read:patients', 'write:forms'],
    profile: {
      firstName: 'Mock',
      lastName: 'User',
      avatar: '/mock-avatar.png',
    },
  };

  const mockAuth = {
    user: mockUser,
    loading: false,
    error: null,
    isAuthenticated: true,
    signIn: async () => Promise.resolve(),
    signOut: async () => Promise.resolve(),
    refreshToken: async () => Promise.resolve(),
  };

  return (
    <div data-testid="mock-auth-provider">
      {React.cloneElement(children as React.ReactElement, { auth: mockAuth })}
    </div>
  );
};

// Mock auth context for components that use useAuth hook
export const mockAuthContext = {
  user: {
    id: 'mock-user-123',
    email: 'mockuser@gangerdermatology.com',
    role: 'staff' as const,
    permissions: ['read:inventory', 'write:schedule', 'read:patients', 'write:forms'],
  },
  loading: false,
  error: null,
  isAuthenticated: true,
};

// Mock decorator for Storybook
export const withMockAuth = (Story: React.ComponentType) => (
  <MockAuthProvider>
    <Story />
  </MockAuthProvider>
);