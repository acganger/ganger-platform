import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import HomePage from '../../pages/index';
import { useRouter } from 'next/router';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

// Mock Supabase
jest.mock('@ganger/auth', () => ({
  getSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'session-123' },
            error: null
          }))
        }))
      }))
    }))
  }))
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Patient Check-in E2E Flow', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      pathname: '/',
      query: {}
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should complete full check-in flow', async () => {
    render(<HomePage />);

    // Step 1: Welcome screen
    expect(screen.getByText(/Welcome to Ganger Dermatology/i)).toBeInTheDocument();
    const startButton = screen.getByRole('button', { name: /start check-in/i });
    expect(startButton).toBeInTheDocument();

    // Click start
    fireEvent.click(startButton);

    // Step 2: Enter confirmation number
    await waitFor(() => {
      expect(screen.getByText(/enter your confirmation/i)).toBeInTheDocument();
    });

    const confirmationInput = screen.getByPlaceholderText(/confirmation number/i);
    fireEvent.change(confirmationInput, { target: { value: 'ABC123' } });

    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    // Mock API response for appointment lookup
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        appointment: {
          id: 'apt-123',
          patientName: 'John Doe',
          appointmentTime: '2025-01-20T14:00:00Z',
          provider: 'Dr. Smith'
        }
      })
    });

    // Step 3: Verify patient info
    await waitFor(() => {
      expect(screen.getByText(/verify your information/i)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    const verifyButton = screen.getByRole('button', { name: /yes, this is me/i });
    fireEvent.click(verifyButton);

    // Step 4: Insurance verification
    await waitFor(() => {
      expect(screen.getByText(/insurance information/i)).toBeInTheDocument();
    });

    const insuranceConfirmButton = screen.getByRole('button', { name: /insurance is current/i });
    fireEvent.click(insuranceConfirmButton);

    // Step 5: Forms completion
    await waitFor(() => {
      expect(screen.getByText(/please review and sign/i)).toBeInTheDocument();
    });

    // Simulate form completion
    const formCheckboxes = screen.getAllByRole('checkbox');
    formCheckboxes.forEach(checkbox => {
      fireEvent.click(checkbox);
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Step 6: Payment (if copay required)
    await waitFor(() => {
      expect(screen.getByText(/payment required/i)).toBeInTheDocument();
    });

    // Mock Stripe Elements
    const payButton = screen.getByRole('button', { name: /pay \$25/i });
    
    // Mock successful payment
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        clientSecret: 'pi_test_secret'
      })
    });

    fireEvent.click(payButton);

    // Step 7: Completion
    await waitFor(() => {
      expect(screen.getByText(/check-in complete/i)).toBeInTheDocument();
      expect(screen.getByText(/please have a seat/i)).toBeInTheDocument();
    });
  });

  it('should handle appointment not found', async () => {
    render(<HomePage />);

    // Navigate to confirmation entry
    fireEvent.click(screen.getByRole('button', { name: /start check-in/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/confirmation number/i)).toBeInTheDocument();
    });

    const confirmationInput = screen.getByPlaceholderText(/confirmation number/i);
    fireEvent.change(confirmationInput, { target: { value: 'INVALID' } });

    // Mock API error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        error: 'Appointment not found'
      })
    });

    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText(/appointment not found/i)).toBeInTheDocument();
      expect(screen.getByText(/please check your confirmation/i)).toBeInTheDocument();
    });
  });

  it('should handle payment failure gracefully', async () => {
    render(<HomePage />);

    // Navigate to payment step (simplified)
    // In real test, would go through all steps

    // Mock payment failure
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Card declined'
      })
    });

    // Simulate payment attempt
    const payButton = screen.getByRole('button', { name: /pay/i });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  it('should allow skipping payment for $0 copay', async () => {
    // Mock appointment with no copay
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        appointment: {
          copayAmount: 0,
          patientName: 'Jane Doe'
        }
      })
    });

    render(<HomePage />);

    // In payment step, should show "No payment required"
    await waitFor(() => {
      expect(screen.queryByText(/payment required/i)).not.toBeInTheDocument();
      expect(screen.getByText(/no copay required/i)).toBeInTheDocument();
    });

    const continueButton = screen.getByRole('button', { name: /continue to check-in/i });
    expect(continueButton).toBeInTheDocument();
  });

  it('should track check-in progress', async () => {
    render(<HomePage />);

    // Should show progress indicator
    const progressIndicator = screen.getByRole('progressbar');
    expect(progressIndicator).toHaveAttribute('aria-valuenow', '1');
    expect(progressIndicator).toHaveAttribute('aria-valuemax', '6');

    // Click through steps and verify progress updates
    fireEvent.click(screen.getByRole('button', { name: /start check-in/i }));

    await waitFor(() => {
      const updatedProgress = screen.getByRole('progressbar');
      expect(updatedProgress).toHaveAttribute('aria-valuenow', '2');
    });
  });
});