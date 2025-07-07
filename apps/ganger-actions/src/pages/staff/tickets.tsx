import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@ganger/ui';
import { 
  ArrowLeft, 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  Monitor,
  Wifi,
  Printer,
  Smartphone,
  Bug,
  HelpCircle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: 'hardware' | 'software' | 'network' | 'access' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  submittedBy: string;
  submittedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  tags: string[];
}

// Mock data
const MOCK_TICKETS: SupportTicket[] = [
  {
    id: '1',
    title: 'Printer not working in reception',
    description: 'The main reception printer is showing error messages and not printing patient forms.',
    category: 'hardware',
    priority: 'high',
    status: 'open',
    submittedBy: 'Sarah Johnson',
    submittedAt: '2025-06-18T09:30:00Z',
    tags: ['printer', 'reception', 'patient-forms']
  },
  {
    id: '2',
    title: 'Cannot access inventory system',
    description: 'Getting "access denied" when trying to log into the inventory management system.',
    category: 'access',
    priority: 'medium',
    status: 'in_progress',
    submittedBy: 'Mike Chen',
    submittedAt: '2025-06-17T14:15:00Z',
    assignedTo: 'IT Support',
    tags: ['inventory', 'access', 'login']
  }
];

const CATEGORIES = [
  { value: 'hardware', label: 'Hardware', icon: Monitor, color: 'bg-blue-100 text-blue-800' },
  { value: 'software', label: 'Software', icon: Bug, color: 'bg-green-100 text-green-800' },
  { value: 'network', label: 'Network', icon: Wifi, color: 'bg-purple-100 text-purple-800' },
  { value: 'access', label: 'Access/Login', icon: User, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'other', label: 'Other', icon: HelpCircle, color: 'bg-gray-100 text-gray-800' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

export default function SupportTicketsPage() {
  const { authUser, isAuthenticated, loading } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_TICKETS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'other' as SupportTicket['category'],
    priority: 'medium' as SupportTicket['priority']
  });

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || ticket.category === filterCategory;
    const matchesStatus = filterStatus === '' || ticket.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const ticket: SupportTicket = {
        id: Date.now().toString(),
        ...newTicket,
        status: 'open',
        submittedBy: authUser?.name || 'Unknown User',
        submittedAt: new Date().toISOString(),
        tags: []
      };

      setTickets(prev => [ticket, ...prev]);
      setShowCreateForm(false);
      setNewTicket({
        title: '',
        description: '',
        category: 'other',
        priority: 'medium'
      });

      console.log('Support ticket created:', ticket);
      
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[4];
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority)?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return AlertTriangle;
      case 'in_progress': return Clock;
      case 'resolved': return CheckCircle;
      case 'closed': return CheckCircle;
      default: return Clock;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Authentication loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading tickets..." center />
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    window.location.href = '/auth/login';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Staff Portal
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {authUser?.name || 'Staff Member'}
              </span>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Support Tickets
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  Submit IT support requests and track issue resolution
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            
            <div className="text-sm text-gray-500 flex items-center">
              <span className="font-medium">{filteredTickets.length}</span>&nbsp;tickets
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const categoryInfo = getCategoryInfo(ticket.category);
            const StatusIcon = getStatusIcon(ticket.status);
            const CategoryIcon = categoryInfo.icon;
            
            return (
              <div key={ticket.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryInfo.color}`}>
                          <CategoryIcon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {ticket.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {ticket.submittedBy}
                          </span>
                          <span>{formatTimeAgo(ticket.submittedAt)}</span>
                          {ticket.assignedTo && (
                            <span>Assigned to {ticket.assignedTo}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2 ml-6">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${categoryInfo.color}`}>
                      {categoryInfo.label}
                    </span>
                  </div>
                </div>
                
                {ticket.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {ticket.tags.map(tag => (
                      <span key={tag} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredTickets.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterCategory || filterStatus 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first support ticket'
              }
            </p>
          </div>
        )}

        {/* Create Ticket Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Create Support Ticket</h3>
                
                <form onSubmit={handleCreateTicket} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTicket.title}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief description of the issue"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={newTicket.description}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Detailed description of the problem, including steps to reproduce if applicable"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        required
                        value={newTicket.category}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value as SupportTicket['category'] }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority *
                      </label>
                      <select
                        required
                        value={newTicket.priority}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as SupportTicket['priority'] }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {PRIORITIES.map(priority => (
                          <option key={priority.value} value={priority.value}>{priority.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Submission Guidelines</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Be specific about the problem and when it occurs</li>
                      <li>• Include error messages if any</li>
                      <li>• Mention which devices/applications are affected</li>
                      <li>• For urgent issues, also contact IT directly</li>
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Submit Ticket
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}