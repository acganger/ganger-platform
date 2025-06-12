import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ComplianceProvider } from '@/lib/compliance-context';
import { RealtimeProvider } from '@/providers/RealtimeProvider';
import { ErrorToastProvider } from '@/components/errors/ErrorToast';

// Mock @ganger/auth
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="mock-auth-provider">
      {children}
    </div>
  );
};

// Mock compliance context with test data
const mockComplianceState = {
  employees: [],
  trainings: [],
  completions: [],
  filters: {
    status: 'all' as const,
    department: 'all',
    location: 'all',
    timeRange: 'current' as const
  },
  loading: false,
  error: null,
  lastSync: null
};

const mockComplianceActions = {
  loadDashboardData: jest.fn(),
  updateFilters: jest.fn(),
  triggerSync: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
};

// Mock ComplianceProvider
jest.mock('@/lib/compliance-context', () => ({
  ComplianceProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-compliance-provider">{children}</div>
  ),
  useCompliance: () => ({
    state: mockComplianceState,
    actions: mockComplianceActions
  })
}));

// Mock RealtimeProvider
jest.mock('@/providers/RealtimeProvider', () => ({
  RealtimeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-realtime-provider">{children}</div>
  ),
}));

// Complete provider setup for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorToastProvider>
      <MockAuthProvider>
        <ComplianceProvider>
          <RealtimeProvider enableNotifications={false}>
            {children}
          </RealtimeProvider>
        </ComplianceProvider>
      </MockAuthProvider>
    </ErrorToastProvider>
  );
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockEmployee = (overrides = {}) => ({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  department: 'Engineering',
  location: 'Office A',
  role: 'Developer',
  active: true,
  hireDate: new Date('2023-01-01'),
  ...overrides
});

export const createMockTraining = (overrides = {}) => ({
  id: '1',
  name: 'Safety Training',
  description: 'Basic safety procedures',
  category: 'Safety',
  durationMinutes: 60,
  validityPeriodDays: 365,
  isRequired: true,
  active: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides
});

export const createMockCompletion = (overrides = {}) => ({
  id: '1',
  employeeId: '1',
  trainingId: '1',
  status: 'completed' as const,
  completedAt: new Date('2023-06-01'),
  expiresAt: new Date('2024-06-01'),
  score: 95,
  certificateUrl: 'https://example.com/cert1',
  createdAt: new Date('2023-06-01'),
  updatedAt: new Date('2023-06-01'),
  ...overrides
});

// Test helpers
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

export const mockImplementationOnce = (fn: jest.Mock, implementation: any) => {
  fn.mockImplementationOnce(implementation);
};

export const mockResolvedValueOnce = (fn: jest.Mock, value: any) => {
  fn.mockResolvedValueOnce(value);
};

export const mockRejectedValueOnce = (fn: jest.Mock, error: any) => {
  fn.mockRejectedValueOnce(error);
};

// Custom matchers for compliance-specific testing
export const complianceMatchers = {
  toHaveComplianceStatus: (received: HTMLElement, expectedStatus: string) => {
    const statusElement = received.querySelector(`[data-testid="status-badge-${expectedStatus}"]`);
    if (statusElement) {
      return {
        message: () => `expected element not to have compliance status "${expectedStatus}"`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have compliance status "${expectedStatus}"`,
        pass: false,
      };
    }
  },
  
  toHaveErrorBoundary: (received: HTMLElement) => {
    const errorBoundary = received.querySelector('[data-testid*="error"]');
    if (errorBoundary) {
      return {
        message: () => 'expected element not to have error boundary',
        pass: true,
      };
    } else {
      return {
        message: () => 'expected element to have error boundary',
        pass: false,
      };
    }
  }
};

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  await waitForLoadingToFinish();
  const end = performance.now();
  return end - start;
};

export const expectPerformantRender = async (renderFn: () => void, maxTime = 100) => {
  const renderTime = await measureRenderTime(renderFn);
  expect(renderTime).toBeLessThan(maxTime);
};

// Mock API responses
export const mockApiSuccess = (data: any) => ({
  ok: true,
  json: () => Promise.resolve(data),
  status: 200,
  statusText: 'OK'
});

export const mockApiError = (status: number, message: string) => ({
  ok: false,
  json: () => Promise.resolve({ error: message }),
  status,
  statusText: message
});

// Setup and teardown helpers
export const setupTest = () => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
  
  // Reset fetch mock
  global.fetch = jest.fn();
  
  return {
    mockLocalStorage,
    mockFetch: global.fetch as jest.Mock
  };
};

export const teardownTest = () => {
  jest.restoreAllMocks();
};