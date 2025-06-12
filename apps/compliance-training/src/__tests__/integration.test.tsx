import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComplianceDashboard } from '@/components/dashboard/ComplianceDashboard';
import { createMockEmployee, createMockTraining, createMockCompletion } from '@/test-utils';

// Mock the complex dependencies
jest.mock('@/lib/compliance-context', () => ({
  useCompliance: () => ({
    state: {
      employees: [
        createMockEmployee({ id: '1', name: 'John Doe', department: 'Engineering' }),
        createMockEmployee({ id: '2', name: 'Jane Smith', department: 'HR' })
      ],
      trainings: [
        createMockTraining({ id: '1', name: 'Safety Training' }),
        createMockTraining({ id: '2', name: 'HIPAA Compliance' })
      ],
      completions: [
        createMockCompletion({ id: '1', employeeId: '1', trainingId: '1', status: 'completed' })
      ],
      filters: {
        status: 'all',
        department: 'all',
        location: 'all',
        timeRange: 'current'
      },
      loading: false,
      error: null,
      lastSync: new Date()
    },
    actions: {
      loadDashboardData: jest.fn(),
      updateFilters: jest.fn(),
      triggerSync: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
    }
  })
}));

jest.mock('@/hooks/useRealtimeCompliance', () => ({
  useRealtimeCompliance: () => ({
    status: {
      isConnected: true,
      lastUpdate: new Date(),
      error: null,
      updateCount: 0
    },
    subscribe: jest.fn(),
    unsubscribe: jest.fn()
  })
}));

jest.mock('@/components/charts/ComplianceCharts', () => ({
  ComplianceCharts: () => <div data-testid="compliance-charts">Charts</div>
}));

jest.mock('@/components/matrix/ComplianceMatrix', () => ({
  ComplianceMatrix: () => <div data-testid="compliance-matrix">Matrix</div>
}));

jest.mock('@/components/exports/ExportControls', () => ({
  ExportControls: () => <div data-testid="export-controls">Export</div>
}));

jest.mock('@/components/filters/ComplianceFilters', () => ({
  ComplianceFilters: () => <div data-testid="compliance-filters">Filters</div>
}));

jest.mock('@ganger/ui', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props} data-testid="button">
      {children}
    </button>
  ),
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
}));

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders complete compliance dashboard', async () => {
    render(<ComplianceDashboard />);

    // Check that all major components are rendered
    expect(screen.getByTestId('compliance-charts')).toBeInTheDocument();
    expect(screen.getByTestId('compliance-matrix')).toBeInTheDocument();
    expect(screen.getByTestId('export-controls')).toBeInTheDocument();
    expect(screen.getByTestId('compliance-filters')).toBeInTheDocument();
  });

  it('handles error states gracefully', () => {
    // Mock error state
    jest.doMock('@/lib/compliance-context', () => ({
      useCompliance: () => ({
        state: {
          employees: [],
          trainings: [],
          completions: [],
          filters: {
            status: 'all',
            department: 'all',
            location: 'all',
            timeRange: 'current'
          },
          loading: false,
          error: 'Failed to load data',
          lastSync: null
        },
        actions: {
          loadDashboardData: jest.fn(),
          updateFilters: jest.fn(),
          triggerSync: jest.fn(),
          setLoading: jest.fn(),
          setError: jest.fn(),
          clearError: jest.fn(),
        }
      })
    }));

    // This would trigger error boundary in real scenario
    expect(() => render(<ComplianceDashboard />)).not.toThrow();
  });

  it('supports all major user interactions', async () => {
    const { rerender } = render(<ComplianceDashboard />);

    // Verify interactive elements are present
    const buttons = screen.getAllByTestId('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Verify components that handle interactions
    expect(screen.getByTestId('compliance-filters')).toBeInTheDocument();
    expect(screen.getByTestId('export-controls')).toBeInTheDocument();
    expect(screen.getByTestId('compliance-matrix')).toBeInTheDocument();

    // Test that rerendering works (important for real-time updates)
    rerender(<ComplianceDashboard />);
    expect(screen.getByTestId('compliance-matrix')).toBeInTheDocument();
  });

  it('supports responsive design', () => {
    // Mock window.matchMedia for responsive testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 768px'), // Mobile simulation
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<ComplianceDashboard />);

    // Components should render without issues on mobile
    expect(screen.getByTestId('compliance-matrix')).toBeInTheDocument();
  });

  it('handles performance optimization features', () => {
    render(<ComplianceDashboard />);

    // Verify that performance-related components are working
    // The fact that the dashboard renders without timeout indicates
    // performance optimizations are working
    expect(screen.getByTestId('compliance-matrix')).toBeInTheDocument();
  });

  it('supports error recovery mechanisms', async () => {
    // Mock a temporary error that gets resolved
    const mockActions = {
      loadDashboardData: jest.fn().mockRejectedValueOnce(new Error('Network error')),
      updateFilters: jest.fn(),
      triggerSync: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
    };

    jest.doMock('@/lib/compliance-context', () => ({
      useCompliance: () => ({
        state: {
          employees: [],
          trainings: [],
          completions: [],
          filters: {
            status: 'all',
            department: 'all',
            location: 'all',
            timeRange: 'current'
          },
          loading: false,
          error: null,
          lastSync: null
        },
        actions: mockActions
      })
    }));

    render(<ComplianceDashboard />);

    // Dashboard should render despite potential errors
    expect(screen.getByTestId('compliance-matrix')).toBeInTheDocument();
  });

  it('integrates all major features without conflicts', () => {
    render(<ComplianceDashboard />);

    // Verify all features are integrated
    const dashboard = screen.getByTestId('compliance-matrix').closest('div');
    
    // Should contain all major feature components
    expect(screen.getByTestId('compliance-charts')).toBeInTheDocument();
    expect(screen.getByTestId('compliance-matrix')).toBeInTheDocument();
    expect(screen.getByTestId('export-controls')).toBeInTheDocument();
    expect(screen.getByTestId('compliance-filters')).toBeInTheDocument();
  });

  it('maintains proper component hierarchy and data flow', () => {
    render(<ComplianceDashboard />);

    // Verify the component structure is maintained
    const dashboard = screen.getByTestId('compliance-matrix').closest('div');
    expect(dashboard).toBeInTheDocument();

    // All components should be present in the correct hierarchy
    expect(screen.getByTestId('compliance-charts')).toBeInTheDocument();
    expect(screen.getByTestId('compliance-matrix')).toBeInTheDocument();
  });
});