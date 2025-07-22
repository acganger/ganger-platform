import React from 'react';
import { TableSkeleton } from './skeleton';
import { Card, CardContent } from './card';

export interface DataTableSkeletonProps {
  /** Number of rows to show */
  rows?: number;
  /** Number of columns to show */
  columns?: number;
  /** Show search bar skeleton */
  showSearch?: boolean;
  /** Show filters skeleton */
  showFilters?: boolean;
  /** Show pagination skeleton */
  showPagination?: boolean;
}

export const DataTableSkeleton: React.FC<DataTableSkeletonProps> = ({
  rows = 10,
  columns = 5,
  showSearch = true,
  showFilters = true,
  showPagination = true
}) => {
  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {showSearch && (
            <div className="relative flex-1 max-w-lg">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 bg-gray-300 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-md pl-10 animate-pulse" />
            </div>
          )}
          {showFilters && (
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <TableSkeleton 
            rows={rows} 
            columns={columns} 
            showHeader={true}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

// Grid skeleton for card-based layouts
export interface DataGridSkeletonProps {
  /** Number of cards to show */
  items?: number;
  /** Number of columns */
  columns?: number;
  /** Show image in cards */
  showImage?: boolean;
}

export const DataGridSkeleton: React.FC<DataGridSkeletonProps> = ({
  items = 6,
  columns = 3,
  showImage = true
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid gap-4 ${gridClasses[columns as keyof typeof gridClasses] || gridClasses[3]}`}>
      {Array.from({ length: items }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            {showImage && (
              <div className="h-48 bg-gray-200 rounded-md mb-4 animate-pulse" />
            )}
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};