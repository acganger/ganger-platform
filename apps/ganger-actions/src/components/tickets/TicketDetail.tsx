import { useState } from 'react';
import { Ticket, Comment } from '@/types';
import { formatDateTime, formatTimeAgo, getInitials, getAvatarColor } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { 
  Clock, 
  User, 
  MapPin, 
  Paperclip,
  Edit,
  Trash2,
  Send,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@ganger/ui';

interface TicketDetailProps {
  ticket: Ticket;
  onAddComment?: (ticketId: string, content: string, isInternal?: boolean) => void;
  onDeleteComment?: (commentId: string) => void;
  onStatusChange?: (ticketId: string, status: Ticket['status']) => void;
}

const StatusBadge = ({ status }: { status: Ticket['status'] }) => {
  const statusConfig = {
    pending: { label: 'Pending', className: 'status-badge-pending', icon: Clock },
    open: { label: 'Open', className: 'status-badge-open', icon: AlertCircle },
    in_progress: { label: 'In Progress', className: 'status-badge-in-progress', icon: Clock },
    stalled: { label: 'Stalled', className: 'status-badge-stalled', icon: XCircle },
    approved: { label: 'Approved', className: 'status-badge-approved', icon: CheckCircle },
    denied: { label: 'Denied', className: 'status-badge-denied', icon: XCircle },
    completed: { label: 'Completed', className: 'status-badge-completed', icon: CheckCircle },
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <span className={`${config.className} flex items-center`}>
      <Icon className="h-3 w-3 mr-1" />
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
    <div className="flex items-center space-x-2">
      <div className={config.className} title={config.label} />
      <span className="text-sm capitalize">{priority}</span>
    </div>
  );
};

const CommentItem = ({ 
  comment, 
  canDelete, 
  onDelete 
}: { 
  comment: Comment; 
  canDelete: boolean; 
  onDelete?: () => void;
}) => {
  return (
    <div className="flex space-x-3">
      {/* Avatar */}
      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(comment.author.name)}`}>
        {getInitials(comment.author.name)}
      </div>
      
      {/* Comment Content */}
      <div className="flex-1 bg-gray-50 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{comment.author.name}</span>
              {comment.is_internal && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Internal
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{formatTimeAgo(comment.created_at)}</p>
          </div>
          
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-gray-400 hover:text-red-500 h-auto p-1"
              title="Delete comment"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="mt-2 text-gray-800 whitespace-pre-wrap">
          {comment.content}
        </div>
      </div>
    </div>
  );
};

export const TicketDetail = ({ 
  ticket, 
  onAddComment,
  onDeleteComment,
  onStatusChange
}: TicketDetailProps) => {
  const { authUser } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment?.(ticket.id, newComment.trim(), isInternal);
      setNewComment('');
      setIsInternal(false);
    }
  };

  const canEditTicket = authUser && (
    authUser.role === 'admin' || 
    authUser.role === 'manager' || 
    ticket.submitter.id === authUser.id
  );

  const canChangeStatus = authUser && (
    authUser.role === 'admin' || 
    authUser.role === 'manager'
  );

  const getFormTypeLabel = (formType: Ticket['form_type']) => {
    const labels = {
      support_ticket: 'Support Ticket',
      time_off_request: 'Time Off Request',
      punch_fix: 'Punch Fix',
      change_of_availability: 'Change of Availability',
    };
    return labels[formType];
  };

  const statusActions = [
    { status: 'open' as const, label: 'Open', className: 'text-blue-600 hover:bg-blue-50' },
    { status: 'in_progress' as const, label: 'In Progress', className: 'text-yellow-600 hover:bg-yellow-50' },
    { status: 'stalled' as const, label: 'Stalled', className: 'text-red-600 hover:bg-red-50' },
    { status: 'approved' as const, label: 'Approve', className: 'text-green-600 hover:bg-green-50' },
    { status: 'denied' as const, label: 'Deny', className: 'text-red-600 hover:bg-red-50' },
    { status: 'completed' as const, label: 'Complete', className: 'text-green-600 hover:bg-green-50' },
  ].filter(action => action.status !== ticket.status);

  return (
    <div className="bg-white shadow-sm rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-semibold text-gray-900">{ticket.title}</h1>
              <StatusBadge status={ticket.status} />
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>#{ticket.id.slice(-8)}</span>
              <span>{getFormTypeLabel(ticket.form_type)}</span>
              <span>{formatDateTime(ticket.created_at)}</span>
            </div>
          </div>
          
          {canEditTicket && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-500 h-auto p-2"
            >
              <Edit className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            {/* Form Data */}
            {Object.keys(ticket.form_data).length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="space-y-2">
                    {Object.entries(ticket.form_data).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-sm font-medium text-gray-500 capitalize">
                          {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            {/* Attachments */}
            {ticket.attachments.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Attachments</h3>
                <div className="space-y-2">
                  {ticket.attachments.map((attachment) => (
                    <div 
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Paperclip className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded by {attachment.uploaded_by.name} • {formatTimeAgo(attachment.created_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary-600 hover:text-primary-500 h-auto p-2"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Comments ({ticket.comments.length})
              </h3>
              
              <div className="space-y-4">
                {ticket.comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    canDelete={authUser?.id === comment.author.id || authUser?.role === 'admin'}
                    onDelete={() => onDeleteComment?.(comment.id)}
                  />
                ))}
                
                {ticket.comments.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No comments yet</p>
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mt-6">
                <div className="border border-gray-300 rounded-lg focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="block w-full border-0 border-b border-gray-300 resize-none focus:ring-0 focus:border-gray-300 sm:text-sm rounded-t-lg"
                  />
                  <div className="flex items-center justify-between px-3 py-2">
                    {authUser && (authUser.role === 'manager' || authUser.role === 'admin') && (
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                        />
                        Internal comment
                      </label>
                    )}
                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={!newComment.trim()}
                        leftIcon={<Send className="h-4 w-4" />}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Ticket Information</h4>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Priority</dt>
                  <dd className="mt-1">
                    <PriorityIndicator priority={ticket.priority} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Location</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900">
                    <MapPin className="h-4 w-4 mr-1" />
                    {ticket.location}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Submitter</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900">
                    <User className="h-4 w-4 mr-1" />
                    {ticket.submitter.name}
                  </dd>
                </div>
                {ticket.assigned_to && (
                  <div>
                    <dt className="text-sm text-gray-500">Assigned To</dt>
                    <dd className="mt-1 flex items-center text-sm text-gray-900">
                      <User className="h-4 w-4 mr-1" />
                      {ticket.assigned_to.name}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateTime(ticket.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateTime(ticket.updated_at)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Status Actions */}
            {canChangeStatus && statusActions.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
                <div className="space-y-2">
                  {statusActions.map((action) => (
                    <Button
                      key={action.status}
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusChange?.(ticket.id, action.status)}
                      className={`w-full text-left justify-start ${action.className}`}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};