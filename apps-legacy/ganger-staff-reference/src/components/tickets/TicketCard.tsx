import { Ticket } from '@/types';
import { formatTimeAgo, cn } from '@/lib/utils';
import { 
  Clock, 
  User, 
  MapPin, 
  Paperclip,
  MessageCircle,
  AlertCircle
} from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
  selected?: boolean;
}

const StatusBadge = ({ status }: { status: Ticket['status'] }) => {
  const statusConfig = {
    pending: { label: 'Pending', className: 'status-badge-pending' },
    open: { label: 'Open', className: 'status-badge-open' },
    in_progress: { label: 'In Progress', className: 'status-badge-in-progress' },
    stalled: { label: 'Stalled', className: 'status-badge-stalled' },
    approved: { label: 'Approved', className: 'status-badge-approved' },
    denied: { label: 'Denied', className: 'status-badge-denied' },
    completed: { label: 'Completed', className: 'status-badge-completed' },
  };

  const config = statusConfig[status];
  return (
    <span className={config.className}>
      {config.label}
    </span>
  );
};

const PriorityIndicator = ({ priority }: { priority: Ticket['priority'] }) => {
  const priorityConfig = {
    low: { className: 'priority-low', label: 'Low Priority' },
    medium: { className: 'priority-medium', label: 'Medium Priority' },
    high: { className: 'priority-high', label: 'High Priority' },
    urgent: { className: 'priority-urgent', label: 'Urgent Priority' },
  };

  const config = priorityConfig[priority];
  return (
    <div 
      className={config.className}
      title={config.label}
      aria-label={config.label}
    />
  );
};

const FormTypeIcon = ({ formType }: { formType: Ticket['form_type'] }) => {
  const icons = {
    support_ticket: AlertCircle,
    time_off_request: Clock,
    punch_fix: Clock,
    change_of_availability: User,
  };

  const Icon = icons[formType];
  return <Icon className="h-4 w-4" />;
};

export const TicketCard = ({ ticket, onClick, selected }: TicketCardProps) => {
  const isUrgent = ticket.priority === 'urgent';
  
  return (
    <div
      className={cn(
        'ticket-card cursor-pointer transition-all duration-200',
        isUrgent && 'ticket-card-urgent',
        selected && 'ring-2 ring-primary-500 bg-primary-50',
        'hover:scale-[1.02] focus:scale-[1.02]'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Ticket ${ticket.id}: ${ticket.title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FormTypeIcon formType={ticket.form_type} />
          <span className="text-sm font-medium text-gray-500">
            #{ticket.id.slice(-8)}
          </span>
          <PriorityIndicator priority={ticket.priority} />
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {ticket.title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {ticket.description}
      </p>

      {/* Metadata */}
      <div className="space-y-2">
        {/* Submitter and Location */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{ticket.submitter.name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>{ticket.location}</span>
          </div>
        </div>

        {/* Time and Attachments/Comments */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatTimeAgo(ticket.created_at)}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {ticket.attachments.length > 0 && (
              <div className="flex items-center space-x-1">
                <Paperclip className="h-4 w-4" />
                <span>{ticket.attachments.length}</span>
              </div>
            )}
            {ticket.comments.length > 0 && (
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{ticket.comments.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Assigned To */}
        {ticket.assigned_to && (
          <div className="flex items-center text-sm text-gray-500">
            <User className="h-4 w-4 mr-1" />
            <span>Assigned to {ticket.assigned_to.name}</span>
          </div>
        )}
      </div>

      {/* Urgent indicator */}
      {isUrgent && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};