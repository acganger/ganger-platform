import { useState } from 'react';
import { Ticket, TicketFilters } from '@/types';
import { TicketCard } from './TicketCard';
import { TicketFilters as TicketFiltersComponent } from './TicketFilters';
import { LoadingSpinner, Card, CardContent } from '@ganger/ui';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  loading?: boolean;
  error?: string;
  selectedTicketId?: string;
  onTicketSelect?: (ticket: Ticket) => void;
  onFiltersChange?: (filters: TicketFilters) => void;
  filters?: TicketFilters;
}

type SortField = 'created_at' | 'updated_at' | 'priority' | 'status';
type SortOrder = 'asc' | 'desc';

export const TicketList = ({
  tickets,
  loading = false,
  error,
  selectedTicketId,
  onTicketSelect,
  onFiltersChange,
  filters = {}
}: TicketListProps) => {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter and sort tickets
  const filteredAndSortedTickets = tickets
    .filter(ticket => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          ticket.title.toLowerCase().includes(query) ||
          ticket.description.toLowerCase().includes(query) ||
          ticket.submitter.name.toLowerCase().includes(query) ||
          ticket.id.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle date sorting
      if (sortField === 'created_at' || sortField === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle priority sorting
      if (sortField === 'priority') {
        const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
      }

      // Handle status sorting
      if (sortField === 'status') {
        const statusOrder = { 
          pending: 1, 
          open: 2, 
          in_progress: 3, 
          stalled: 4, 
          approved: 5, 
          denied: 6, 
          completed: 7 
        };
        aValue = statusOrder[a.status];
        bValue = statusOrder[b.status];
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange?.({ ...filters, search: searchQuery });
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return null;
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">
          <h3 className="font-medium">Error loading tickets</h3>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search tickets by title, description, or submitter..."
              />
            </div>
          </form>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              showFilters ? 'bg-gray-100' : ''
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <TicketFiltersComponent
              filters={filters}
              onFiltersChange={onFiltersChange}
            />
          </div>
        )}
        </CardContent>
      </Card>

      {/* Sort Options */}
      <div className="flex items-center space-x-4 text-sm">
        <span className="text-gray-500">Sort by:</span>
        <button
          onClick={() => handleSort('created_at')}
          className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
            sortField === 'created_at' 
              ? 'bg-primary-100 text-primary-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>Date Created</span>
          {getSortIcon('created_at')}
        </button>
        <button
          onClick={() => handleSort('priority')}
          className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
            sortField === 'priority' 
              ? 'bg-primary-100 text-primary-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>Priority</span>
          {getSortIcon('priority')}
        </button>
        <button
          onClick={() => handleSort('status')}
          className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
            sortField === 'status' 
              ? 'bg-primary-100 text-primary-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>Status</span>
          {getSortIcon('status')}
        </button>
      </div>

      {/* Tickets */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading tickets..." center />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedTickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg font-medium">No tickets found</p>
                <p className="mt-1">
                  {searchQuery || Object.keys(filters).length > 0
                    ? 'Try adjusting your search or filters'
                    : 'Create your first ticket to get started'
                  }
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-500 mb-4">
                Showing {filteredAndSortedTickets.length} ticket{filteredAndSortedTickets.length === 1 ? '' : 's'}
              </div>
              <div className="grid gap-4">
                {filteredAndSortedTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    selected={ticket.id === selectedTicketId}
                    onClick={() => onTicketSelect?.(ticket)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};