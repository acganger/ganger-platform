import { useState } from 'react';
import Link from 'next/link';
// import { format } from 'date-fns';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@/components/icons';
import { AuthorizationCard } from './AuthorizationCard';
import { AuthorizationListView } from './AuthorizationListView';
import type { Authorization, PaginatedResponse } from '@/types';

interface AuthorizationDashboardProps {
  authorizations: Authorization[];
  pagination?: PaginatedResponse<Authorization>['pagination'];
  isLoading: boolean;
  error: any;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

type ViewMode = 'card' | 'list';

export function AuthorizationDashboard({
  authorizations,
  pagination,
  isLoading,
  error,
  onPageChange,
  onRefresh,
}: AuthorizationDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading authorizations</h3>
        <p className="mt-1 text-sm text-gray-500">
          {error.message || 'Something went wrong. Please try again.'}
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Authorization Requests
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {pagination?.total || 0} total authorizations
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === 'card'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                Card View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  viewMode === 'list'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                List View
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <LoadingState viewMode={viewMode} />
        ) : authorizations.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {authorizations.map((authorization) => (
              <AuthorizationCard
                key={authorization.id}
                authorization={authorization}
              />
            ))}
          </div>
        ) : (
          <AuthorizationListView authorizations={authorizations} />
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <Pagination pagination={pagination} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  );
}

function LoadingState({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'card') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="auth-card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg border animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-gray-400">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No authorizations found</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating a new medication authorization request.
      </p>
      <div className="mt-6">
        <Link
          href="/create"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PencilIcon className="w-4 h-4 mr-2" />
          Create Authorization
        </Link>
      </div>
    </div>
  );
}

function Pagination({ 
  pagination, 
  onPageChange 
}: { 
  pagination: PaginatedResponse<Authorization>['pagination'];
  onPageChange: (page: number) => void;
}) {
  const { page, pages, total } = pagination;
  
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) {
      rangeWithDots.push('...', pages);
    } else {
      rangeWithDots.push(pages);
    }

    return rangeWithDots;
  };

  return (
    <nav className="border-t border-gray-200 px-4 flex items-center justify-between sm:px-0 mt-8">
      <div className="-mt-px w-0 flex-1 flex">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="border-t-2 border-transparent pt-4 pr-1 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
      </div>
      
      <div className="hidden md:-mt-px md:flex">
        {getPageNumbers().map((pageNumber, index) => (
          <button
            key={index}
            onClick={() => typeof pageNumber === 'number' ? onPageChange(pageNumber) : undefined}
            disabled={pageNumber === '...'}
            className={`border-t-2 pt-4 px-4 inline-flex items-center text-sm font-medium ${
              pageNumber === page
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } ${pageNumber === '...' ? 'cursor-default' : ''}`}
          >
            {pageNumber}
          </button>
        ))}
      </div>
      
      <div className="-mt-px w-0 flex-1 flex justify-end">
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="border-t-2 border-transparent pt-4 pl-1 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}