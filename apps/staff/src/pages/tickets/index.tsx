import { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TicketList } from '@/components/tickets/TicketList';
import { TicketDetail } from '@/components/tickets/TicketDetail';
import { Ticket, TicketFilters } from '@/types';
import { Plus, ArrowLeft } from 'lucide-react';

// Mock data for development
const mockTickets: Ticket[] = [
  {
    id: 'ticket-001',
    form_type: 'support_ticket',
    submitter: {
      id: 'user-001',
      email: 'john.doe@gangerdermatology.com',
      name: 'John Doe'
    },
    status: 'open',
    priority: 'high',
    location: 'Northfield',
    title: 'Computer running slowly and freezing',
    description: 'My computer has been running very slowly over the past few days and occasionally freezes when trying to open patient files. This is affecting my ability to see patients efficiently.',
    form_data: {
      requestType: 'Equipment Issue',
      urgency: 'Urgent',
      importance: 'Important'
    },
    assigned_to: {
      id: 'manager-001',
      email: 'it.support@gangerdermatology.com',
      name: 'IT Support Team'
    },
    comments: [
      {
        id: 'comment-001',
        ticket_id: 'ticket-001',
        author: {
          id: 'manager-001',
          email: 'it.support@gangerdermatology.com',
          name: 'IT Support Team'
        },
        content: 'Thanks for reporting this. We&apos;ll take a look at your computer this afternoon. In the meantime, try restarting it to see if that helps.',
        is_internal: false,
        created_at: '2025-01-11T09:30:00Z',
        updated_at: '2025-01-11T09:30:00Z'
      }
    ],
    attachments: [],
    created_at: '2025-01-11T08:15:00Z',
    updated_at: '2025-01-11T09:30:00Z'
  },
  {
    id: 'ticket-002',
    form_type: 'time_off_request',
    submitter: {
      id: 'user-002',
      email: 'jane.smith@gangerdermatology.com',
      name: 'Jane Smith'
    },
    status: 'pending',
    priority: 'medium',
    location: 'Woodbury',
    title: 'Vacation Request - February 15-19',
    description: 'I would like to request time off for a family vacation from February 15-19, 2025. I have already coordinated with my team to ensure coverage.',
    form_data: {
      dateRange: {
        startDate: '2025-02-15',
        endDate: '2025-02-19'
      },
      ptoElection: 'Paid Time Off',
      reason: 'Family vacation'
    },
    comments: [],
    attachments: [],
    created_at: '2025-01-10T14:20:00Z',
    updated_at: '2025-01-10T14:20:00Z'
  },
  {
    id: 'ticket-003',
    form_type: 'punch_fix',
    submitter: {
      id: 'user-003',
      email: 'mike.johnson@gangerdermatology.com',
      name: 'Mike Johnson'
    },
    status: 'approved',
    priority: 'low',
    location: 'Burnsville',
    title: 'Forgot to clock out on January 9th',
    description: 'I forgot to clock out yesterday (January 9th) after my shift ended at 5:00 PM. Could you please correct this in the system?',
    form_data: {
      date: '2025-01-09',
      punchOut: '17:00',
      comments: 'Forgot to clock out at end of shift'
    },
    comments: [
      {
        id: 'comment-002',
        ticket_id: 'ticket-003',
        author: {
          id: 'manager-002',
          email: 'hr@gangerdermatology.com',
          name: 'HR Team'
        },
        content: 'Punch correction has been approved and updated in the system.',
        is_internal: false,
        created_at: '2025-01-10T16:45:00Z',
        updated_at: '2025-01-10T16:45:00Z'
      }
    ],
    attachments: [],
    created_at: '2025-01-10T10:30:00Z',
    updated_at: '2025-01-10T16:45:00Z'
  }
];

export default function TicketsPage() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [tickets] = useState<Ticket[]>(mockTickets);
  const [loading] = useState(false);
  const router = useRouter();

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
  };

  const handleStatusChange = (ticketId: string, status: Ticket['status']) => {
    console.log('Update ticket status:', ticketId, status);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status });
    }
  };

  const handleAddComment = (ticketId: string, content: string, isInternal = false) => {
    console.log('Add comment:', ticketId, content, isInternal);
  };

  const handleDeleteComment = (commentId: string) => {
    console.log('Delete comment:', commentId);
  };

  const handleFiltersChange = (newFilters: TicketFilters) => {
    setFilters(newFilters);
  };

  const title = selectedTicket ? selectedTicket.title : 'My Tickets';

  return (
    <DashboardLayout title={title}>
      <div className="py-6">
        {!selectedTicket ? (
          // Ticket List View
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
                <p className="text-gray-600">
                  View and manage your support tickets, time off requests, and other submissions.
                </p>
              </div>
              <button
                onClick={() => router.push('/tickets/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </button>
            </div>

            {/* Ticket List */}
            <TicketList
              tickets={tickets}
              loading={loading}
              selectedTicketId={selectedTicket ? (selectedTicket as Ticket).id : undefined}
              onTicketSelect={handleTicketSelect}
              onFiltersChange={handleFiltersChange}
              filters={filters}
            />
          </div>
        ) : (
          // Ticket Detail View
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={handleBackToList}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to tickets
            </button>

            {/* Ticket Detail */}
            <TicketDetail
              ticket={selectedTicket}
              onStatusChange={handleStatusChange}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}