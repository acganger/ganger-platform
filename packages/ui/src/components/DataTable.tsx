import React from 'react';
import { cn } from '../utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Column configuration for DataTable
 * @template T - Type of the data items
 */
interface Column<T> {
  /**
   * Key to access the data property, or custom string for computed columns
   */
  key: keyof T | string;
  
  /**
   * Header text displayed in the column
   */
  header: string;
  
  /**
   * Custom render function for the cell content
   * If not provided, displays the raw value
   */
  render?: (item: T) => React.ReactNode;
  
  /**
   * Additional CSS classes for the column cells
   */
  className?: string;
  
  /**
   * Whether this column can be sorted
   * @default false
   */
  sortable?: boolean;
}

/**
 * Props for the DataTable component
 * @template T - Type of the data items
 */
interface DataTableProps<T> {
  /**
   * Array of data items to display
   */
  data: T[];
  
  /**
   * Column configuration array
   */
  columns: Column<T>[];
  
  /**
   * Whether the table is in a loading state
   * @default false
   */
  loading?: boolean;
  
  /**
   * Message to display when data array is empty
   * @default 'No data available'
   */
  emptyMessage?: string;
  
  /**
   * Additional CSS classes for the table container
   */
  className?: string;
  
  /**
   * Callback when a row is clicked
   */
  onRowClick?: (item: T) => void;
  
  /**
   * Current sort column key
   */
  sortBy?: string;
  
  /**
   * Current sort direction
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * Callback when a sortable column header is clicked
   */
  onSort?: (key: string) => void;
}

/**
 * DataTable component for displaying tabular data
 * 
 * @description
 * A flexible table component that supports sorting, custom rendering,
 * row interactions, and loading states. Responsive and accessible by default.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const data = [
 *   { id: 1, name: 'John Doe', email: 'john@example.com' },
 *   { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
 * ];
 * 
 * const columns = [
 *   { key: 'name', header: 'Name' },
 *   { key: 'email', header: 'Email' }
 * ];
 * 
 * <DataTable data={data} columns={columns} />
 * 
 * // With custom rendering and actions
 * const columns = [
 *   { key: 'name', header: 'Name' },
 *   { key: 'status', header: 'Status', render: (user) => (
 *     <Badge variant={user.active ? 'success' : 'secondary'}>
 *       {user.active ? 'Active' : 'Inactive'}
 *     </Badge>
 *   )},
 *   { key: 'actions', header: 'Actions', render: (user) => (
 *     <Button size="sm" onClick={() => handleEdit(user.id)}>
 *       Edit
 *     </Button>
 *   )}
 * ];
 * 
 * // With sorting
 * const [sortBy, setSortBy] = useState('name');
 * const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
 * 
 * const handleSort = (key: string) => {
 *   if (sortBy === key) {
 *     setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
 *   } else {
 *     setSortBy(key);
 *     setSortDirection('asc');
 *   }
 * };
 * 
 * const sortedData = [...data].sort((a, b) => {
 *   const aVal = a[sortBy];
 *   const bVal = b[sortBy];
 *   const modifier = sortDirection === 'asc' ? 1 : -1;
 *   return aVal > bVal ? modifier : -modifier;
 * });
 * 
 * <DataTable 
 *   data={sortedData}
 *   columns={columns.map(col => ({ ...col, sortable: true }))}
 *   sortBy={sortBy}
 *   sortDirection={sortDirection}
 *   onSort={handleSort}
 * />
 * 
 * // With row click
 * <DataTable 
 *   data={data}
 *   columns={columns}
 *   onRowClick={(item) => navigate(`/users/${item.id}`)}
 * />
 * ```
 * 
 * @template T - Type of the data items
 * @component
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  className,
  onRowClick,
  sortBy,
  sortDirection,
  onSort,
}: DataTableProps<T>) {
  const handleSort = (column: Column<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key as string);
    }
  };

  const renderCellValue = (item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item);
    }
    return item[column.key as keyof T];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border border-gray-200', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:bg-gray-100',
                    column.className
                  )}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="text-gray-400">
                        {sortBy === column.key && sortDirection === 'asc' && '↑'}
                        {sortBy === column.key && sortDirection === 'desc' && '↓'}
                        {sortBy !== column.key && '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  className={cn(
                    'hover:bg-gray-50',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key as string}
                      className={cn(
                        'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
                        column.className
                      )}
                    >
                      {renderCellValue(item, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { DataTable };
export type { Column, DataTableProps };