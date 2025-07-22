import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SupportTicketForm } from '../SupportTicketForm';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useToast');
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('SupportTicketForm', () => {
  const mockUser = {
    id: '123',
    email: 'test@gangerdermatology.com',
    name: 'Test User',
    location: 'Wixom',
  };

  const mockToast = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      authUser: mockUser,
      isAuthenticated: true,
      loading: false,
    } as any);

    mockUseToast.mockReturnValue({
      toast: mockToast,
    });
  });

  it('should render all form fields', () => {
    render(<SupportTicketForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/request type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority level/i)).toBeInTheDocument();
  });

  it('should pre-fill user information', () => {
    render(<SupportTicketForm onSubmit={mockOnSubmit} />);

    expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockUser.name)).toBeInTheDocument();
  });

  describe('Form Validation', () => {
    it('should require location selection', async () => {
      render(<SupportTicketForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please select a location/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should require request type selection', async () => {
      render(<SupportTicketForm onSubmit={mockOnSubmit} />);

      // Select location first
      const locationSelect = screen.getByLabelText(/location/i);
      await userEvent.selectOptions(locationSelect, 'Wixom');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please select a request type/i)).toBeInTheDocument();
      });
    });

    it('should validate subject length', async () => {
      render(<SupportTicketForm onSubmit={mockOnSubmit} />);

      const subjectInput = screen.getByLabelText(/subject/i);
      await userEvent.type(subjectInput, 'ab'); // Too short

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/subject must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate description length', async () => {
      render(<SupportTicketForm onSubmit={mockOnSubmit} />);

      const descriptionInput = screen.getByLabelText(/description/i);
      await userEvent.type(descriptionInput, 'too short'); // Less than 20 chars

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/description must be at least 20 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Attachments', () => {
    it('should handle file uploads', async () => {
      render(<SupportTicketForm onSubmit={mockOnSubmit} />);

      const fileInput = screen.getByLabelText(/attachments/i);
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
        expect(screen.getByText(/0.0 MB/)).toBeInTheDocument();
      });
    });

    it('should enforce file size limit', async () => {
      render(<SupportTicketForm onSubmit={mockOnSubmit} />);

      const fileInput = screen.getByLabelText(/attachments/i);
      // Create a file larger than 25MB
      const largeFile = new File(['x'.repeat(26 * 1024 * 1024)], 'large.pdf', { 
        type: 'application/pdf' 
      });

      await userEvent.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'File too large',
          description: expect.stringContaining('25MB'),
          variant: 'error',
        });
      });
    });

    it('should allow file removal', async () => {
      render(<SupportTicketForm onSubmit={mockOnSubmit} />);

      const fileInput = screen.getByLabelText(/attachments/i);
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove/i });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit valid form data', async () => {
      const user = userEvent.setup();
      
      render(<SupportTicketForm onSubmit={mockOnSubmit} />);

      // Fill out form
      await user.selectOptions(screen.getByLabelText(/location/i), 'Wixom');
      await user.selectOptions(screen.getByLabelText(/request type/i), 'IT (Network/Computer/Software)');
      await user.type(screen.getByLabelText(/subject/i), 'Computer not turning on');
      await user.type(screen.getByLabelText(/description/i), 'My computer will not turn on this morning. I have tried restarting it multiple times.');
      await user.selectOptions(screen.getByLabelText(/priority/i), 'high');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          location: 'Wixom',
          request_type: 'IT (Network/Computer/Software)',
          subject: 'Computer not turning on',
          description: expect.any(String),
          priority: 'high',
          submitter_name: mockUser.name,
          submitter_email: mockUser.email,
          attachments: [],
        });
      });
    });

    it('should show loading state during submission', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<SupportTicketForm onSubmit={mockOnSubmit} loading={true} />);

      const submitButton = screen.getByRole('button', { name: /submitting/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit when file size exceeds limit', async () => {
      render(<SupportTicketForm onSubmit={mockOnSubmit} />);

      const fileInput = screen.getByLabelText(/attachments/i);
      // Add multiple files that exceed 25MB total
      const files = [
        new File(['x'.repeat(15 * 1024 * 1024)], 'file1.pdf', { type: 'application/pdf' }),
        new File(['x'.repeat(15 * 1024 * 1024)], 'file2.pdf', { type: 'application/pdf' }),
      ];

      for (const file of files) {
        await userEvent.upload(fileInput, file);
      }

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /submit/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Email validation', () => {
    it('should validate submitter email format', async () => {
      render(<SupportTicketForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/your email/i);
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/valid email is required/i)).toBeInTheDocument();
      });
    });
  });
});