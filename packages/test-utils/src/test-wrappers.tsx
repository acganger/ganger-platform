import React from 'react';
import { ErrorBoundary } from '@ganger/ui';

interface TestProvidersProps {
  children: React.ReactNode;
  user?: any;
}

/**
 * Wrapper component that includes all necessary providers for testing
 */
export function AllTheProviders({ children, user }: TestProvidersProps) {
  return (
    <ErrorBoundary>
      {/* Add other providers as needed (Theme, Auth, etc.) */}
      {children}
    </ErrorBoundary>
  );
}

/**
 * Mock auth provider for testing authenticated components
 */
export function MockAuthProvider({ 
  children, 
  user = { 
    id: 'test-user-id',
    email: 'test@gangerdermatology.com',
    name: 'Test User',
    role: 'staff'
  } 
}: TestProvidersProps) {
  const authContext = {
    user,
    isLoading: false,
    isAuthenticated: !!user,
    login: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
  };

  // Mock the auth context
  const AuthContext = React.createContext(authContext);
  
  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
}