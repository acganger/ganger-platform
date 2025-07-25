export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PauseCircleIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Button, Badge } from '@ganger/ui-catalyst';
import { Card, CardHeader, CardContent, CardTitle } from '@ganger/ui-catalyst';
import { Input, Select } from '@ganger/ui-catalyst';
import debounce from 'lodash/debounce';
import { getBadgeClassName } from '@/utils/catalyst-helpers';

// Form type options
const FORM_TYPES = [
  { value: 'support_ticket', label: 'Support Ticket' },
  { value: 'time_off_request', label: 'Time Off Request' },
  { value: 'expense_reimbursement', label: 'Expense Reimbursement' },
  { value: 'punch_fix', label: 'Punch Fix' },
  { value: 'change_of_availability', label: 'Change of Availability' },
  { value: 'meeting_request', label: 'Meeting Request' },
  { value: 'general_inquiry', label: 'General Inquiry' }
];

// Status options
const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', icon: ClockIcon },
  { value: 'in_progress', label: 'In Progress', icon: ArrowPathIcon },
  { value: 'closed', label: 'Closed', icon: CheckCircleIcon },
  { value: 'pending_approval', label: 'Pending Approval', icon: PauseCircleIcon },
  { value: 'approved', label: 'Approved', icon: CheckCircleIcon },
  { value: 'denied', label: 'Denied', icon: XCircleIcon },
  { value: 'stalled', label: 'Stalled', icon: ExclamationCircleIcon }
];

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

// Location options
const LOCATION_OPTIONS = [
  { value: 'Wixom', label: 'Wixom' },
  { value: 'Ann Arbor', label: 'Ann Arbor' },
  { value: 'Plymouth', label: 'Plymouth' },
  { value: 'Multiple', label: 'Multiple' }
];

interface Ticket {
  id: string;
  ticket_number: string;
  form_type: string;
  submitter_email: string;
  submitter_name: string;
  status: string;
  priority: string;
  location: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  assigned_to_email?: string;
  assigned_to_name?: string;
  comments: { count: number }[];
  files: { count: number }[];
}

export default function TicketsPage() {
  const router = useRouter();
  const { authUser, isLoading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [isManagerOrAdmin, setIsManagerOrAdmin] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: [] as string[],
    form_type: [] as string[],
    priority: [] as string[],
    location: [] as string[],
    search: '',
    submitter: '',
    assigned_to: '',
    date_from: '',
    date_to: '',
    view_all: false
  });
  
  // Separate state for immediate UI updates
  const [searchInput, setSearchInput] = useState('');

  // Sort states
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchTickets = useCallback(async () => {
    if (!authUser) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      // Add pagination
      params.append('limit', pageSize.toString());
      params.append('offset', ((page - 1) * pageSize).toString());
      
      // Add sorting
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      
      // Add filters
      if (filters.status.length > 0) {
        filters.status.forEach(s => params.append('status', s));
      }
      if (filters.form_type.length > 0) {
        filters.form_type.forEach(ft => params.append('form_type', ft));
      }
      if (filters.priority.length > 0) {
        filters.priority.forEach(p => params.append('priority', p));
      }
      if (filters.location.length > 0) {
        filters.location.forEach(l => params.append('location', l));
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.submitter) {
        params.append('submitter', filters.submitter);
      }
      if (filters.assigned_to) {
        params.append('assigned_to', filters.assigned_to);
      }
      if (filters.date_from) {
        params.append('date_from', filters.date_from);
      }
      if (filters.date_to) {
        params.append('date_to', filters.date_to);
      }
      if (filters.view_all) {
        params.append('view_all', 'true');
      }

      const response = await fetch(`/api/tickets?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tickets');
      }

      setTickets(data.tickets);
      setTotal(data.total);
      setIsManagerOrAdmin(data.isManagerOrAdmin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [authUser, page, pageSize, sortBy, sortOrder, filters]);

  // Debounce search input changes
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => {
      setFilters(prev => ({ ...prev, search: value }));
    }, 500),
    []
  );
  
  // Debounce other text filter changes
  const debouncedSetFilter = useMemo(
    () => debounce((filterType: string, value: any) => {
      setFilters(prev => ({ ...prev, [filterType]: value }));
    }, 300),
    []
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);
  
  // Handle search input changes
  useEffect(() => {
    debouncedSetSearch(searchInput);
  }, [searchInput, debouncedSetSearch]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleFilterChange = (filterType: string, value: any) => {
    if (filterType === 'search') {
      setSearchInput(value);
      return;
    }
    
    // For text inputs, use debounced update
    if (filterType === 'submitter' || filterType === 'assigned_to') {
      debouncedSetFilter(filterType, value);
      return;
    }
    
    // For other filters, update immediately
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setPage(1); // Reset to first page when filters change
  };

  const handleExportCSV = async () => {
    try {
      // Fetch all tickets without pagination for export
      const params = new URLSearchParams();
      params.append('limit', '10000'); // Large limit for export
      params.append('offset', '0');
      
      // Add current filters
      if (filters.status.length > 0) {
        filters.status.forEach(s => params.append('status', s));
      }
      if (filters.form_type.length > 0) {
        filters.form_type.forEach(ft => params.append('form_type', ft));
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      const response = await fetch(`/api/tickets?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tickets for export');
      }
      
      // Convert to CSV
      const headers = ['Ticket #', 'Status', 'Type', 'Title', 'Submitter', 'Priority', 'Location', 'Created Date'];
      const rows = data.tickets.map((ticket: Ticket) => [
        ticket.ticket_number,
        ticket.status,
        ticket.form_type,
        ticket.title,
        ticket.submitter_name,
        ticket.priority || 'normal',
        ticket.location || 'N/A',
        format(new Date(ticket.created_at), 'yyyy-MM-dd HH:mm')
      ]);
      
      const csv = [
        headers.join(','),
        ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export tickets');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    if (!statusOption) return null;
    
    const Icon = statusOption.icon;
    
    // Map status to Badge variants
    const variantMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
      'open': 'primary',
      'in_progress': 'primary',
      'approved': 'success',
      'completed': 'success',
      'pending_approval': 'warning',
      'stalled': 'secondary',
      'closed': 'destructive',
      'denied': 'destructive'
    };
    
    const variant = variantMap[status] || 'secondary';
    
    return (
      <Badge className={`${getBadgeClassName(variant)} gap-1`}>
        <Icon className="w-3.5 h-3.5" />
        {statusOption.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityOption = PRIORITY_OPTIONS.find(p => p.value === priority);
    if (!priorityOption) return null;
    
    // Map priority to Badge variants
    const variantMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
      'low': 'secondary',
      'normal': 'primary',
      'high': 'warning',
      'urgent': 'destructive'
    };
    
    const variant = variantMap[priority] || 'secondary';
    
    return (
      <Badge className={getBadgeClassName(variant)}>
        {priorityOption.label}
      </Badge>
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Tickets - Ganger Actions</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage and track all support tickets and requests
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <Button
              outline
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<FunnelIcon className="h-4 w-4" />}
            >
              Filters
            </Button>
            <Button
              outline
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
            >
              Export CSV
            </Button>
            <Button
              color="blue"
              size="sm"
              onClick={() => router.push('/forms/support')}
            >
              New Ticket
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="bg-gray-50">
            <CardContent className="p-4 space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search by title, description, or ticket number..."
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  multiple
                  value={filters.status}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    handleFilterChange('status', selected);
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  size={4}
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  multiple
                  value={filters.form_type}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    handleFilterChange('form_type', selected);
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  size={4}
                >
                  {FORM_TYPES.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  multiple
                  value={filters.priority}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    handleFilterChange('priority', selected);
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  size={4}
                >
                  {PRIORITY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  multiple
                  value={filters.location}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    handleFilterChange('location', selected);
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  size={3}
                >
                  {LOCATION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range */}
              <Input
                type="date"
                label="From Date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
              <Input
                type="date"
                label="To Date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />

              {/* Manager/Admin only filters */}
              {isManagerOrAdmin && (
                <Input
                  type="email"
                  label="Submitter Email"
                  value={filters.submitter}
                  onChange={(e) => handleFilterChange('submitter', e.target.value)}
                  placeholder="user@gangerdermatology.com"
                />
              )}
            </div>

            {/* View All Toggle for Managers/Admins */}
            {isManagerOrAdmin && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="view-all"
                  checked={filters.view_all}
                  onChange={(e) => handleFilterChange('view_all', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="view-all" className="ml-2 block text-sm text-gray-700">
                  View all tickets (not just mine)
                </label>
              </div>
            )}

            {/* Clear Filters */}
            <div className="flex justify-end">
              <Button
                plain
                size="sm"
                onClick={() => {
                  setFilters({
                    status: [],
                    form_type: [],
                    priority: [],
                    location: [],
                    search: '',
                    submitter: '',
                    assigned_to: '',
                    date_from: '',
                    date_to: '',
                    view_all: false
                  });
                  setPage(1);
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Clear all filters
              </Button>
            </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Tickets Table */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No tickets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort('ticket_number')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        Ticket #
                        {sortBy === 'ticket_number' && (
                          sortOrder === 'asc' ? <ChevronUpIcon className="ml-1 h-4 w-4" /> : <ChevronDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        Status
                        {sortBy === 'status' && (
                          sortOrder === 'asc' ? <ChevronUpIcon className="ml-1 h-4 w-4" /> : <ChevronDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitter
                    </th>
                    <th
                      onClick={() => handleSort('priority')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        Priority
                        {sortBy === 'priority' && (
                          sortOrder === 'asc' ? <ChevronUpIcon className="ml-1 h-4 w-4" /> : <ChevronDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('created_at')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        Created
                        {sortBy === 'created_at' && (
                          sortOrder === 'asc' ? <ChevronUpIcon className="ml-1 h-4 w-4" /> : <ChevronDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ticket.ticket_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {FORM_TYPES.find(ft => ft.value === ticket.form_type)?.label || ticket.form_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{ticket.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{ticket.submitter_name}</div>
                        <div className="text-xs text-gray-400">{ticket.submitter_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(ticket.priority || 'normal')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                        <div className="text-xs text-gray-400">
                          {format(new Date(ticket.created_at), 'h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            plain
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/tickets/${ticket.id}`);
                            }}
                            className="text-blue-600 hover:text-blue-900 h-auto p-1"
                            title="View ticket"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Button>
                          <Button
                            plain
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/tickets/${ticket.id}/edit`);
                            }}
                            className="text-gray-600 hover:text-gray-900 h-auto p-1"
                            title="Edit ticket"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                outline
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                outline
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="ml-3"
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(page - 1) * pageSize + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">{Math.min(page * pageSize, total)}</span>
                  {' '}of{' '}
                  <span className="font-medium">{total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button
                    outline
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="rounded-r-none"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </Button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (page <= 3) {
                      pageNumber = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        {...(pageNumber === page ? { color: 'blue' as const } : { outline: true })}
                        size="sm"
                        onClick={() => setPage(pageNumber)}
                        className={`rounded-none ${
                          pageNumber === page
                            ? 'z-10'
                            : ''
                        }`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  
                  <Button
                    outline
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="rounded-l-none"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </nav>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="page-size" className="text-sm text-gray-700">
                  Show:
                </label>
                <Select
                  value={pageSize.toString()}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="text-sm"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
              </div>
            </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
