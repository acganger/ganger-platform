
import { clsx } from '../utils/clsx'

// LoadingSpinner component for the table
const TableLoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
  }
  
  return (
    <div className="flex items-center justify-center p-8">
      <div className={clsx(sizeClasses[size], 'animate-spin')}>
        <svg className="w-full h-full text-zinc-400" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>
  )
}

// DataTable styles
const tableStyles = {
  container: [
    'overflow-hidden',
    'ring-1 ring-zinc-950/5 dark:ring-white/10',
    'shadow-sm',
  ],
  table: [
    'min-w-full divide-y divide-zinc-200 dark:divide-zinc-800',
  ],
  header: [
    'bg-zinc-50 dark:bg-zinc-800/50',
  ],
  headerCell: [
    'px-6 py-3',
    'text-left text-xs font-medium',
    'text-zinc-500 dark:text-zinc-400',
    'uppercase tracking-wider',
  ],
  sortableHeader: [
    'cursor-pointer',
    'hover:bg-zinc-100 dark:hover:bg-zinc-700/50',
    'transition-colors duration-200',
  ],
  body: [
    'bg-white dark:bg-zinc-900',
    'divide-y divide-zinc-200 dark:divide-zinc-800',
  ],
  row: [
    'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
    'transition-colors duration-200',
  ],
  clickableRow: [
    'cursor-pointer',
  ],
  cell: [
    'px-6 py-4',
    'whitespace-nowrap text-sm',
    'text-zinc-900 dark:text-zinc-100',
  ],
  emptyState: [
    'px-6 py-8',
    'text-center text-zinc-500 dark:text-zinc-400',
  ],
  sortIcon: [
    'ml-1 text-zinc-400 dark:text-zinc-500',
  ],
  rounded: {
    none: 'rounded-none',
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
  },
}

// Column interface
export interface Column<T> {
  /** Unique key for the column */
  key: keyof T | string
  /** Column header text */
  header: string
  /** Custom render function for cell content */
  render?: (item: T) => React.ReactNode
  /** Additional CSS classes for the column */
  className?: string
  /** Whether the column is sortable */
  sortable?: boolean
  /** Custom header renderer */
  headerRender?: () => React.ReactNode
  /** Column width (CSS value) */
  width?: string
  /** Column alignment */
  align?: 'left' | 'center' | 'right'
}

// DataTable props interface
export interface DataTableProps<T> {
  /** Array of data to display */
  data: T[]
  /** Column configuration */
  columns: Column<T>[]
  /** Whether the table is in loading state */
  loading?: boolean
  /** Message to show when no data */
  emptyMessage?: string
  /** Additional CSS classes */
  className?: string
  /** Callback when a row is clicked */
  onRowClick?: (item: T) => void
  /** Current sort column key */
  sortBy?: string
  /** Current sort direction */
  sortDirection?: 'asc' | 'desc'
  /** Callback when column header is clicked for sorting */
  onSort?: (key: string) => void
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg'
  /** Whether to show alternating row colors */
  striped?: boolean
  /** Whether to show hover effects */
  hoverable?: boolean
  /** Dense mode with reduced padding */
  dense?: boolean
}

// Main DataTable component
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  className,
  onRowClick,
  sortBy,
  sortDirection,
  onSort,
  rounded = 'lg',
  striped = false,
  hoverable = true,
  dense = false,
}: DataTableProps<T>) {
  
  const handleSort = (column: Column<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key as string)
    }
  }

  const renderCellValue = (item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item)
    }
    return item[column.key as keyof T]
  }

  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center': return 'text-center'
      case 'right': return 'text-right'
      default: return 'text-left'
    }
  }

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null
    
    const isCurrentSort = sortBy === column.key
    const isAsc = isCurrentSort && sortDirection === 'asc'
    const isDesc = isCurrentSort && sortDirection === 'desc'
    
    return (
      <span className={clsx(tableStyles.sortIcon)}>
        {isAsc && (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
            <path d="M6 4l-3 3h6l-3-3z" />
          </svg>
        )}
        {isDesc && (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
            <path d="M6 8l3-3H3l3 3z" />
          </svg>
        )}
        {!isCurrentSort && (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
            <path d="M6 2l-2 3h4l-2-3zM6 10l2-3H4l2 3z" opacity="0.5" />
          </svg>
        )}
      </span>
    )
  }

  if (loading) {
    return <TableLoadingSpinner />
  }

  return (
    <div className={clsx(
      tableStyles.container,
      tableStyles.rounded[rounded],
      className
    )}>
      <div className="overflow-x-auto">
        <table className={clsx(tableStyles.table)}>
          {/* Header */}
          <thead className={clsx(tableStyles.header)}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={clsx(
                    tableStyles.headerCell,
                    dense ? 'px-4 py-2' : 'px-6 py-3',
                    column.sortable && tableStyles.sortableHeader,
                    getAlignmentClass(column.align),
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                  role={column.sortable ? 'button' : undefined}
                  tabIndex={column.sortable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      handleSort(column)
                    }
                  }}
                >
                  <div className="flex items-center">
                    {column.headerRender ? column.headerRender() : column.header}
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody className={clsx(tableStyles.body)}>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={clsx(tableStyles.emptyState)}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={clsx(
                    hoverable && tableStyles.row,
                    onRowClick && tableStyles.clickableRow,
                    striped && rowIndex % 2 === 1 && 'bg-zinc-50 dark:bg-zinc-800/25'
                  )}
                  onClick={() => onRowClick?.(item)}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      onRowClick(item)
                    }
                  }}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key as string}
                      className={clsx(
                        tableStyles.cell,
                        dense ? 'px-4 py-2' : 'px-6 py-4',
                        getAlignmentClass(column.align),
                        column.className
                      )}
                      style={{ width: column.width }}
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
  )
}

// Legacy API compatibility
export interface DataTableLegacyProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  onRowClick?: (item: T) => void
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (key: string) => void
}

export function DataTableLegacy<T extends Record<string, any>>(
  props: DataTableLegacyProps<T>
) {
  return <DataTable {...props} />
}

// Export types for external use
export type { Column as DataTableColumn }