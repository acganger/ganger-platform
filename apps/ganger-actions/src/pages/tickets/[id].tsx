import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, Badge, Avatar } from '@ganger/ui';
import { 
  formatDateTime, 
  formatTimeAgo, 
  formatFileSize 
} from '@/lib/utils';
import { Database } from '@/types/database';
import { 
  ArrowLeft,
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
  XCircle,
  Calendar,
  Tag,
  ChevronRight,
  MessageSquare,
  Activity,
  FileText,
  Check,
  X,
  UserPlus,
  AlertTriangle,
  Loader2
} from 'lucide-react';

// Type definitions
type Ticket = Database['public']['Tables']['staff_tickets']['Row'] & {
  comments?: Array<Database['public']['Tables']['staff_ticket_comments']['Row'] & {
    author?: {
      id: string;
      raw_user_meta_data: {
        full_name?: string;
        email?: string;
      };
    };
  }>;
  files?: Array<Database['public']['Tables']['staff_attachments']['Row'] & {
    uploader?: {
      id: string;
      raw_user_meta_data: {
        full_name?: string;
        email?: string;
      };
    };
  }>;
  approvals?: Array<{
    id: string;
    status: string;
    approved_at: string;
    notes?: string;
    approver?: {
      id: string;
      raw_user_meta_data: {
        full_name?: string;
        email?: string;
      };
    };
  }>;
  assigned_user?: Database['public']['Tables']['staff_user_profiles']['Row'];
};

type TicketStatus = Database['public']['Tables']['staff_tickets']['Row']['status'];
type TicketPriority = Database['public']['Tables']['staff_tickets']['Row']['priority'];

// Status badge component
const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const statusConfig = {
    pending: { label: 'Pending', variant: 'warning' as const, icon: Clock },
    open: { label: 'Open', variant: 'primary' as const, icon: AlertCircle },
    in_progress: { label: 'In Progress', variant: 'primary' as const, icon: Activity },
    stalled: { label: 'Stalled', variant: 'secondary' as const, icon: AlertTriangle },
    approved: { label: 'Approved', variant: 'success' as const, icon: CheckCircle },
    denied: { label: 'Denied', variant: 'destructive' as const, icon: XCircle },
    completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle },
    cancelled: { label: 'Cancelled', variant: 'destructive' as const, icon: X },
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} size="sm" className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

// Priority indicator component
const PriorityIndicator = ({ priority }: { priority: TicketPriority | null }) => {
  if (!priority) return null;
  
  const priorityConfig = {
    low: { className: 'bg-gray-400', label: 'Low Priority' },
    medium: { className: 'bg-yellow-400', label: 'Medium Priority' },
    high: { className: 'bg-orange-400', label: 'High Priority' },
    urgent: { className: 'bg-red-400 animate-pulse', label: 'Urgent Priority' },
  };

  const config = priorityConfig[priority];
  return (
    <div className="flex items-center space-x-2">
      <div className={`h-2 w-2 rounded-full ${config.className}`} title={config.label} />
      <span className="text-sm capitalize">{priority}</span>
    </div>
  );
};

// Activity timeline item component
const TimelineItem = ({ 
  icon: Icon, 
  title, 
  content, 
  timestamp, 
  author 
}: { 
  icon: any; 
  title: string; 
  content?: string; 
  timestamp: string; 
  author?: string;
}) => {
  return (
    <div className="relative pb-8">
      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
      <div className="relative flex space-x-3">
        <div>
          <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon className="h-4 w-4 text-gray-600" />
          </span>
        </div>
        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
          <div>
            <p className="text-sm text-gray-900 font-medium">{title}</p>
            {content && <p className="mt-1 text-sm text-gray-600">{content}</p>}
            <p className="mt-1 text-xs text-gray-500">
              {author && <span className="font-medium">{author} • </span>}
              {formatTimeAgo(timestamp)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TicketDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { authUser, isLoading: authLoading } = useAuth();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [staffList, setStaffList] = useState<Database['public']['Tables']['staff_user_profiles']['Row'][]>([]);

  // Fetch ticket data
  const fetchTicket = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/tickets/${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch ticket');
      }
      
      setTicket(data.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch staff list for assignment
  const fetchStaffList = useCallback(async () => {
    try {
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        setStaffList(data.staff || []);
      }
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    }
  }, []);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  useEffect(() => {
    if (authUser?.role === 'admin' || authUser?.role === 'manager') {
      fetchStaffList();
    }
  }, [authUser, fetchStaffList]);

  // Update ticket status
  const updateTicketStatus = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }
      
      await fetchTicket();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // Update ticket priority
  const updateTicketPriority = async (newPriority: TicketPriority) => {
    if (!ticket) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update ticket priority');
      }
      
      await fetchTicket();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update priority');
    } finally {
      setUpdating(false);
    }
  };

  // Assign ticket
  const assignTicket = async () => {
    if (!ticket || !selectedAssignee) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assigned_to: selectedAssignee,
          assigned_to_email: selectedAssignee,
          assigned_at: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign ticket');
      }
      
      setShowAssignModal(false);
      setSelectedAssignee('');
      await fetchTicket();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign ticket');
    } finally {
      setUpdating(false);
    }
  };

  // Submit comment
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !newComment.trim()) return;
    
    try {
      setSubmittingComment(true);
      const response = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          is_internal: isInternalComment,
          comment_type: 'comment'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      setNewComment('');
      setIsInternalComment(false);
      await fetchTicket();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Download attachment
  const downloadAttachment = async (file: any) => {
    try {
      const response = await fetch(`/api/attachments/${file.id}`);
      if (!response.ok) throw new Error('Failed to download file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download file');
    }
  };

  // Check permissions
  const canUpdateStatus = authUser && (
    authUser.role === 'admin' || 
    authUser.role === 'manager' ||
    ticket?.assigned_to === authUser.email
  );

  const canAssignTicket = authUser && (
    authUser.role === 'admin' || 
    authUser.role === 'manager'
  );

  const canApproveTicket = authUser && (
    authUser.role === 'admin' || 
    authUser.role === 'manager'
  ) && ticket?.approval_required;

  const canAddInternalComment = authUser && (
    authUser.role === 'admin' || 
    authUser.role === 'manager'
  );

  const canCloseTicket = authUser && (
    ticket?.submitter_email === authUser.email ||
    authUser.role === 'admin' || 
    authUser.role === 'manager'
  );

  // Get form type display name
  const getFormTypeDisplay = (formType: string) => {
    const displays: Record<string, string> = {
      'time_off': 'Time Off Request',
      'expense': 'Expense Report',
      'support': 'Support Ticket',
      'meeting': 'Meeting Room Request',
      'punch_fix': 'Punch Fix Request',
      'availability': 'Availability Change',
      'impact': 'Impact Submission'
    };
    return displays[formType] || formType;
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !ticket) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {error || 'Ticket not found'}
          </h2>
          <Link href="/tickets" className="text-primary-600 hover:text-primary-500">
            Return to tickets list
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Ticket #{ticket.ticket_number} - Ganger Actions</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/tickets" className="text-gray-400 hover:text-gray-500 flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Tickets
              </Link>
            </li>
            <li>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </li>
            <li>
              <span className="text-gray-500">#{ticket.ticket_number}</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-semibold text-gray-900">{ticket.title}</h1>
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Tag className="h-4 w-4 mr-1" />
                    #{ticket.ticket_number}
                  </span>
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {getFormTypeDisplay(ticket.form_type)}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDateTime(ticket.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Form Data */}
            {ticket.form_data && Object.keys(ticket.form_data).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">Form Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Object.entries(ticket.form_data as Record<string, any>).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-sm font-medium text-gray-500 capitalize">
                          {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            {ticket.files && ticket.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-gray-900">
                    Attachments ({ticket.files.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-gray-200">
                    {ticket.files.map((file) => (
                      <li key={file.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <Paperclip className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.file_size)} • 
                              Uploaded by {file.uploader?.raw_user_meta_data?.full_name || 'Unknown'} • 
                              {formatTimeAgo(file.created_at)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadAttachment(file)}
                          className="ml-4 flex-shrink-0 text-primary-600 hover:text-primary-500"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">Activity</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="flow-root">
                <ul className="-mb-8">
                  {/* Ticket created */}
                  <li>
                    <TimelineItem
                      icon={FileText}
                      title="Ticket created"
                      content={`${ticket.submitter_name} submitted this ${getFormTypeDisplay(ticket.form_type)}`}
                      timestamp={ticket.created_at}
                    />
                  </li>

                  {/* Status changes and comments */}
                  {ticket.comments?.map((comment, idx) => (
                    <li key={comment.id}>
                      <TimelineItem
                        icon={comment.comment_type === 'status_change' ? Activity : MessageSquare}
                        title={
                          comment.comment_type === 'status_change' 
                            ? `Status changed from ${comment.previous_status} to ${comment.new_status}`
                            : comment.is_internal ? 'Internal comment' : 'Comment added'
                        }
                        content={comment.content}
                        timestamp={comment.created_at}
                        author={comment.author?.raw_user_meta_data?.full_name || comment.author_name}
                      />
                    </li>
                  ))}

                  {/* Remove the connecting line from the last item */}
                  <li className="relative">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-gray-600" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5">
                        <p className="text-sm text-gray-500">End of activity</p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">
                  Comments ({ticket.comments?.filter(c => c.comment_type === 'comment').length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
              
              {/* Comment List */}
              <div className="space-y-4 mb-6">
                {ticket.comments?.filter(c => c.comment_type === 'comment').map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar 
                      size="md"
                      alt={comment.author_name}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg px-4 py-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {comment.author?.raw_user_meta_data?.full_name || comment.author_name}
                            </span>
                            {comment.is_internal && (
                              <Badge variant="warning" size="sm" className="ml-2">
                                Internal
                              </Badge>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(comment.created_at)}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!ticket.comments || ticket.comments.filter(c => c.comment_type === 'comment').length === 0) && (
                  <p className="text-center text-gray-500 py-4">No comments yet</p>
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={submitComment} className="border-t pt-4">
                <div>
                  <label htmlFor="comment" className="sr-only">Add a comment</label>
                  <textarea
                    id="comment"
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  {canAddInternalComment && (
                    <label className="flex items-center text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                      />
                      Internal comment (only visible to managers and admins)
                    </label>
                  )}
                  <div className="flex-shrink-0">
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Post Comment
                    </button>
                  </div>
                </div>
              </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">Details</CardTitle>
              </CardHeader>
              <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={ticket.status} />
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Priority</dt>
                  <dd className="mt-1">
                    <PriorityIndicator priority={ticket.priority} />
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900">
                    <MapPin className="h-4 w-4 mr-1" />
                    {ticket.location || 'Not specified'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Submitted by</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900">
                    <User className="h-4 w-4 mr-1" />
                    {ticket.submitter_name}
                  </dd>
                </div>

                {ticket.assigned_to && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Assigned to</dt>
                    <dd className="mt-1 flex items-center text-sm text-gray-900">
                      <User className="h-4 w-4 mr-1" />
                      {ticket.assigned_user?.full_name || ticket.assigned_to}
                    </dd>
                  </div>
                )}

                {ticket.due_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Due date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDateTime(ticket.due_date)}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateTime(ticket.created_at)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Last updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateTime(ticket.updated_at)}
                  </dd>
                </div>
              </dl>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">Actions</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-2">
                {/* Status Actions */}
                {canUpdateStatus && (
                  <>
                    {ticket.status === 'pending' && (
                      <button
                        onClick={() => updateTicketStatus('open')}
                        disabled={updating}
                        className="w-full text-left px-3 py-2 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                      >
                        Mark as Open
                      </button>
                    )}
                    
                    {['pending', 'open'].includes(ticket.status) && (
                      <button
                        onClick={() => updateTicketStatus('in_progress')}
                        disabled={updating}
                        className="w-full text-left px-3 py-2 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50"
                      >
                        Start Progress
                      </button>
                    )}

                    {ticket.status === 'in_progress' && (
                      <button
                        onClick={() => updateTicketStatus('stalled')}
                        disabled={updating}
                        className="w-full text-left px-3 py-2 text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50"
                      >
                        Mark as Stalled
                      </button>
                    )}

                    {canApproveTicket && ticket.status !== 'approved' && ticket.status !== 'denied' && (
                      <>
                        <button
                          onClick={() => updateTicketStatus('approved')}
                          disabled={updating}
                          className="w-full text-left px-3 py-2 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                        >
                          <Check className="h-4 w-4 inline mr-1" />
                          Approve Request
                        </button>
                        <button
                          onClick={() => updateTicketStatus('denied')}
                          disabled={updating}
                          className="w-full text-left px-3 py-2 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                        >
                          <X className="h-4 w-4 inline mr-1" />
                          Deny Request
                        </button>
                      </>
                    )}

                    {!['completed', 'cancelled'].includes(ticket.status) && (
                      <button
                        onClick={() => updateTicketStatus('completed')}
                        disabled={updating}
                        className="w-full text-left px-3 py-2 text-sm font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Mark as Completed
                      </button>
                    )}
                  </>
                )}

                {/* Priority Actions */}
                {canUpdateStatus && (
                  <div className="pt-2 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Change Priority
                    </label>
                    <select
                      value={ticket.priority || 'medium'}
                      onChange={(e) => updateTicketPriority(e.target.value as TicketPriority)}
                      disabled={updating}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                )}

                {/* Assignment */}
                {canAssignTicket && (
                  <div className="pt-2 border-t">
                    <button
                      onClick={() => setShowAssignModal(true)}
                      disabled={updating}
                      className="w-full text-left px-3 py-2 text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 disabled:opacity-50"
                    >
                      <UserPlus className="h-4 w-4 inline mr-1" />
                      {ticket.assigned_to ? 'Reassign Ticket' : 'Assign Ticket'}
                    </button>
                  </div>
                )}

                {/* Close/Cancel */}
                {canCloseTicket && !['completed', 'cancelled'].includes(ticket.status) && (
                  <div className="pt-2 border-t">
                    <button
                      onClick={() => updateTicketStatus('cancelled')}
                      disabled={updating}
                      className="w-full text-left px-3 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Cancel Ticket
                    </button>
                  </div>
                )}
              </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {ticket.assigned_to ? 'Reassign Ticket' : 'Assign Ticket'}
            </h3>
            <div className="mb-4">
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                Select Staff Member
              </label>
              <select
                id="assignee"
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">Select a staff member</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.email}>
                    {staff.full_name} ({staff.department})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedAssignee('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={assignTicket}
                disabled={!selectedAssignee || updating}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Assigning...' : 'Assign'}
              </button>
            </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}