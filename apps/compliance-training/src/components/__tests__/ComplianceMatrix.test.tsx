import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComplianceMatrix } from '@/components/matrix/ComplianceMatrix';
import type { Employee, TrainingModule, TrainingCompletion } from '@/types/compliance';

// Mock the compliance helpers
jest.mock('@/utils/compliance-helpers', () => ({
  determineTrainingStatus: jest.fn((completion) => completion?.status || 'not_started'),
  calculateDaysUntilDue: jest.fn(() => 30),
}));

// Mock @ganger/ui components
jest.mock('@ganger/ui', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  Modal: ({ children, isOpen }: any) => isOpen ? <div data-testid="modal">{children}</div> : null,
}));

// Mock the status badge component
jest.mock('@/components/shared/ComplianceStatusBadge', () => ({
  ComplianceStatusBadge: ({ status }: { status: string }) => (
    <span data-testid={`status-badge-${status}`}>{status}</span>
  ),
}));

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    department: 'Engineering',
    location: 'Office A',
    role: 'Developer',
    active: true,
    hireDate: new Date('2023-01-01'),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    department: 'HR',
    location: 'Office B',
    role: 'Manager',
    active: true,
    hireDate: new Date('2022-01-01'),
  },
];

const mockTrainings: TrainingModule[] = [
  {
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
  },
  {
    id: '2',
    name: 'HIPAA Training',
    description: 'Privacy regulations',
    category: 'Compliance',
    durationMinutes: 90,
    validityPeriodDays: 365,
    isRequired: true,
    active: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
];

const mockCompletions: TrainingCompletion[] = [
  {
    id: '1',
    employeeId: '1',
    trainingId: '1',
    status: 'completed',
    completedAt: new Date('2023-06-01'),
    expiresAt: new Date('2024-06-01'),
    score: 95,
    certificateUrl: 'https://example.com/cert1',
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-01'),
  },
];

describe('ComplianceMatrix', () => {
  it('renders loading state', () => {
    render(
      <ComplianceMatrix
        employees={[]}
        trainings={[]}
        completions={[]}
        loading={true}
      />
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders matrix with employees and trainings', () => {
    render(
      <ComplianceMatrix
        employees={mockEmployees}
        trainings={mockTrainings}
        completions={mockCompletions}
        loading={false}
      />
    );

    // Check for employee names
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Check for training names
    expect(screen.getByText('Safety Training')).toBeInTheDocument();
    expect(screen.getByText('HIPAA Training')).toBeInTheDocument();
  });

  it('handles employee click', () => {
    const onEmployeeClick = jest.fn();
    render(
      <ComplianceMatrix
        employees={mockEmployees}
        trainings={mockTrainings}
        completions={mockCompletions}
        onEmployeeClick={onEmployeeClick}
      />
    );

    const employeeElement = screen.getByText('John Doe');
    fireEvent.click(employeeElement);

    expect(onEmployeeClick).toHaveBeenCalledWith(mockEmployees[0]);
  });

  it('handles cell click', () => {
    const onCellClick = jest.fn();
    render(
      <ComplianceMatrix
        employees={mockEmployees}
        trainings={mockTrainings}
        completions={mockCompletions}
        onCellClick={onCellClick}
      />
    );

    // Find and click a compliance status badge
    const statusBadge = screen.getByTestId('status-badge-completed');
    fireEvent.click(statusBadge.closest('button') || statusBadge);

    expect(onCellClick).toHaveBeenCalled();
  });

  it('switches between flat and grouped view modes', () => {
    render(
      <ComplianceMatrix
        employees={mockEmployees}
        trainings={mockTrainings}
        completions={mockCompletions}
      />
    );

    // Find view mode buttons
    const flatViewButton = screen.getByText('Flat View');
    const groupedViewButton = screen.getByText('By Department');

    expect(flatViewButton).toBeInTheDocument();
    expect(groupedViewButton).toBeInTheDocument();

    // Click grouped view
    fireEvent.click(groupedViewButton);

    // Should now show department headers
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('HR')).toBeInTheDocument();
  });

  it('expands and collapses departments in grouped view', async () => {
    render(
      <ComplianceMatrix
        employees={mockEmployees}
        trainings={mockTrainings}
        completions={mockCompletions}
      />
    );

    // Switch to grouped view
    const groupedViewButton = screen.getByText('By Department');
    fireEvent.click(groupedViewButton);

    // Find department header
    const engineeringHeader = screen.getByText('Engineering');
    fireEvent.click(engineeringHeader);

    // Should show the employee under that department
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('shows correct compliance status badges', () => {
    render(
      <ComplianceMatrix
        employees={mockEmployees}
        trainings={mockTrainings}
        completions={mockCompletions}
      />
    );

    // Should show completed status for the completion we have
    expect(screen.getByTestId('status-badge-completed')).toBeInTheDocument();

    // Should show not_started status for missing completions
    expect(screen.getAllByTestId('status-badge-not_started')).toHaveLength(3); // 2x2 matrix - 1 completed = 3 not started
  });

  it('displays employee department and location info', () => {
    render(
      <ComplianceMatrix
        employees={mockEmployees}
        trainings={mockTrainings}
        completions={mockCompletions}
      />
    );

    expect(screen.getByText(/Engineering • Office A • Developer/)).toBeInTheDocument();
    expect(screen.getByText(/HR • Office B • Manager/)).toBeInTheDocument();
  });

  it('displays training category and duration', () => {
    render(
      <ComplianceMatrix
        employees={mockEmployees}
        trainings={mockTrainings}
        completions={mockCompletions}
      />
    );

    expect(screen.getByText('Safety')).toBeInTheDocument();
    expect(screen.getByText('60min')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
    expect(screen.getByText('90min')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(
      <ComplianceMatrix
        employees={[]}
        trainings={[]}
        completions={[]}
        loading={false}
      />
    );

    // Should render the matrix structure without errors
    expect(screen.getByText('Employee')).toBeInTheDocument();
  });

  it('creates correct completion lookup map', () => {
    render(
      <ComplianceMatrix
        employees={mockEmployees}
        trainings={mockTrainings}
        completions={mockCompletions}
      />
    );

    // The completion should be mapped correctly (employee 1, training 1 = completed)
    expect(screen.getByTestId('status-badge-completed')).toBeInTheDocument();
  });
});