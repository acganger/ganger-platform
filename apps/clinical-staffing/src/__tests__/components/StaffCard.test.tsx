import { render, screen, fireEvent } from '@testing-library/react';
import { StaffCard } from '@/components/staff/StaffCard';
import type { StaffMember, StaffSchedule } from '@/types/staffing';

// Mock staff member data
const mockStaff: StaffMember = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'medical_assistant',
  certifications: ['CPR', 'First Aid'],
  availability_start_time: '08:00',
  availability_end_time: '17:00',
  location_preferences: ['location-1'],
  skills: ['Patient Care', 'Data Entry'],
  hourly_rate: 25,
  max_hours_per_week: 40,
  unavailable_dates: [],
  notes: 'Experienced medical assistant',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};

const mockSchedule: StaffSchedule = {
  id: '1',
  staff_member_id: '1',
  provider_id: 'provider-1',
  location_id: 'location-1',
  schedule_date: '2025-01-15',
  start_time: '09:00',
  end_time: '17:00',
  role: 'medical_assistant',
  status: 'scheduled',
  notes: 'Regular shift',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};

describe('StaffCard', () => {
  it('renders staff member name and role', () => {
    render(
      <StaffCard 
        staff={mockStaff} 
        compact={false}
        status="available"
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Medical Assistant')).toBeInTheDocument();
  });

  it('shows availability when showAssignment is true', () => {
    render(
      <StaffCard 
        staff={mockStaff} 
        showAssignment={true}
        compact={false}
        status="available"
      />
    );
    
    expect(screen.getByText(/8:00 AM - 5:00 PM/)).toBeInTheDocument();
  });

  it('displays schedule information when provided', () => {
    render(
      <StaffCard 
        staff={mockStaff}
        schedule={mockSchedule}
        showAssignment={true}
        compact={false}
        status="assigned"
      />
    );
    
    expect(screen.getByText(/9:00 AM - 5:00 PM/)).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
  });

  it('shows skills and certifications in non-compact mode', () => {
    render(
      <StaffCard 
        staff={mockStaff} 
        compact={false}
        status="available"
      />
    );
    
    expect(screen.getByText('Skills:')).toBeInTheDocument();
    expect(screen.getByText('Patient Care')).toBeInTheDocument();
    expect(screen.getByText('Certifications:')).toBeInTheDocument();
    expect(screen.getByText('CPR')).toBeInTheDocument();
  });

  it('hides details in compact mode', () => {
    render(
      <StaffCard 
        staff={mockStaff} 
        compact={true}
        status="available"
      />
    );
    
    expect(screen.queryByText('Skills:')).not.toBeInTheDocument();
    expect(screen.queryByText('Certifications:')).not.toBeInTheDocument();
  });

  it('shows remove button when showRemoveButton is true', () => {
    const mockOnRemove = jest.fn();
    
    render(
      <StaffCard 
        staff={mockStaff}
        showRemoveButton={true}
        onRemove={mockOnRemove}
        status="assigned"
      />
    );
    
    const removeButton = screen.getByLabelText(`Remove ${mockStaff.name} from assignment`);
    expect(removeButton).toBeInTheDocument();
    
    fireEvent.click(removeButton);
    expect(mockOnRemove).toHaveBeenCalled();
  });

  it('applies correct status styling', () => {
    const { rerender } = render(
      <StaffCard 
        staff={mockStaff} 
        status="available"
      />
    );
    
    let container = screen.getByText('John Doe').closest('div');
    expect(container).toHaveClass('bg-green-50', 'border-green-200');
    
    rerender(
      <StaffCard 
        staff={mockStaff} 
        status="assigned"
      />
    );
    
    container = screen.getByText('John Doe').closest('div');
    expect(container).toHaveClass('bg-blue-50', 'border-blue-200');
    
    rerender(
      <StaffCard 
        staff={mockStaff} 
        status="unavailable"
      />
    );
    
    container = screen.getByText('John Doe').closest('div');
    expect(container).toHaveClass('bg-neutral-50', 'border-neutral-300', 'opacity-60');
  });

  it('shows schedule notes when provided', () => {
    render(
      <StaffCard 
        staff={mockStaff}
        schedule={mockSchedule}
        compact={false}
        status="assigned"
      />
    );
    
    expect(screen.getByText('Note:')).toBeInTheDocument();
    expect(screen.getByText('Regular shift')).toBeInTheDocument();
  });

  it('shows drag handle for available staff', () => {
    render(
      <StaffCard 
        staff={mockStaff} 
        status="available"
      />
    );
    
    // Look for the drag handle visual indicator
    const dragHandle = screen.getByText('John Doe').closest('div')?.querySelector('.w-8.h-1');
    expect(dragHandle).toBeInTheDocument();
  });

  it('handles long skill and certification lists', () => {
    const staffWithManySkills = {
      ...mockStaff,
      skills: ['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4', 'Skill 5'],
      certifications: ['Cert 1', 'Cert 2', 'Cert 3', 'Cert 4']
    };
    
    render(
      <StaffCard 
        staff={staffWithManySkills} 
        compact={false}
        status="available"
      />
    );
    
    expect(screen.getByText('+2 more')).toBeInTheDocument(); // For skills
    expect(screen.getByText('+2 more')).toBeInTheDocument(); // For certifications
  });
});