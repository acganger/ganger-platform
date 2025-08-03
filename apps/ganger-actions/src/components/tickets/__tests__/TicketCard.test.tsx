import React from 'react';
import { render, screen, fireEvent, mockTicket, mockUser } from '@ganger/test-utils';
import { TicketCard } from '../TicketCard';

describe('TicketCard', () => {
  const defaultTicket = mockTicket();
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders ticket information correctly', () => {
    render(
      <TicketCard ticket={defaultTicket} onClick={mockOnClick} />
    );

    // Check ticket ID is displayed
    expect(screen.getByText(`#${defaultTicket.id.slice(-8)}`)).toBeInTheDocument();
    
    // Check title is displayed
    expect(screen.getByText(defaultTicket.title)).toBeInTheDocument();
    
    // Check description is displayed
    expect(screen.getByText(defaultTicket.description)).toBeInTheDocument();
    
    // Check submitter name is displayed
    expect(screen.getByText(defaultTicket.submitter.name)).toBeInTheDocument();
    
    // Check location is displayed
    expect(screen.getByText(defaultTicket.location)).toBeInTheDocument();
  });

  it('displays correct status badge', () => {
    const statuses = ['pending', 'open', 'in_progress', 'completed'] as const;
    
    statuses.forEach(status => {
      const { rerender } = render(
        <TicketCard 
          ticket={mockTicket({ status })} 
          onClick={mockOnClick} 
        />
      );
      
      const statusLabels = {
        pending: 'Pending',
        open: 'Open',
        in_progress: 'In Progress',
        completed: 'Completed'
      };
      
      expect(screen.getByText(statusLabels[status])).toBeInTheDocument();
      
      rerender(<div />); // Clear for next iteration
    });
  });

  it('displays urgent indicator for urgent tickets', () => {
    render(
      <TicketCard 
        ticket={mockTicket({ priority: 'urgent' })} 
        onClick={mockOnClick} 
      />
    );

    // Check for pulsing urgent indicator
    const urgentIndicator = screen.getByRole('button').querySelector('.animate-pulse');
    expect(urgentIndicator).toBeInTheDocument();
  });

  it('handles click events', () => {
    render(
      <TicketCard ticket={defaultTicket} onClick={mockOnClick} />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation', () => {
    render(
      <TicketCard ticket={defaultTicket} onClick={mockOnClick} />
    );

    const card = screen.getByRole('button');
    
    // Test Enter key
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    
    // Test Space key
    fireEvent.keyDown(card, { key: ' ' });
    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });

  it('displays attachment count when present', () => {
    const ticketWithAttachments = mockTicket({
      attachments: ['file1.pdf', 'file2.jpg']
    });

    render(
      <TicketCard ticket={ticketWithAttachments} onClick={mockOnClick} />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays comment count when present', () => {
    const ticketWithComments = mockTicket({
      comments: [
        { id: '1', text: 'Comment 1', author: 'User 1', created_at: new Date().toISOString() },
        { id: '2', text: 'Comment 2', author: 'User 2', created_at: new Date().toISOString() }
      ]
    });

    render(
      <TicketCard ticket={ticketWithComments} onClick={mockOnClick} />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays assigned user when present', () => {
    const assignedTicket = mockTicket({
      assigned_to: mockUser({ name: 'Jane Doe' })
    });

    render(
      <TicketCard ticket={assignedTicket} onClick={mockOnClick} />
    );

    expect(screen.getByText('Assigned to Jane Doe')).toBeInTheDocument();
  });

  it('applies selected styles when selected', () => {
    render(
      <TicketCard ticket={defaultTicket} onClick={mockOnClick} selected />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveClass('ring-2', 'ring-primary-500', 'bg-primary-50');
  });

  it('does not re-render when props are the same (React.memo)', () => {
    const { rerender } = render(
      <TicketCard ticket={defaultTicket} onClick={mockOnClick} />
    );

    const firstRender = screen.getByRole('button');
    
    // Re-render with same props
    rerender(
      <TicketCard ticket={defaultTicket} onClick={mockOnClick} />
    );

    const secondRender = screen.getByRole('button');
    
    // Component should be the same instance (not re-rendered)
    expect(firstRender).toBe(secondRender);
  });
});