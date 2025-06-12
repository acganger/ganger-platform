'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@ganger/ui';
import { useAccessibility } from '../../utils/accessibility';
import { ChevronUp, ChevronDown, ArrowUpDown, Search, Filter } from 'lucide-react';

export interface TableColumn<T = any> {
  id: string;
  label: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  description?: string;
  ariaLabel?: string;
}

export interface TableRow<T = any> {
  id: string;
  data: T;
  selected?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  column: string;
  value: string;
}

interface AccessibleDataTableProps<T> {
  columns: TableColumn<T>[];
  rows: TableRow<T>[];
  caption?: string;
  summary?: string;
  selectable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onSort?: (sortConfig: SortConfig) => void;
  onFilter?: (filters: FilterConfig[]) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

/**
 * Fully accessible data table component with WCAG 2.1 AAA compliance
 * Features:
 * - Screen reader optimized with proper ARIA labels and live regions
 * - Full keyboard navigation (arrow keys, tab, enter, space)
 * - Sortable columns with announcement
 * - Filterable data with live results
 * - Selection support with batch operations
 * - Focus management and visual indicators
 * - Responsive design with mobile accessibility
 */
export function AccessibleDataTable<T>({
  columns,
  rows,
  caption,
  summary,
  selectable = false,
  sortable = true,
  filterable = false,
  pagination,
  onSort,
  onFilter,
  onSelectionChange,
  loading = false,
  emptyMessage = 'No data available',
  className,
  'aria-label': ariaLabel,
  'data-testid': testId,
}: AccessibleDataTableProps<T>) {
  const { announce, focusElement } = useAccessibility();
  
  // State management
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Refs
  const tableRef = useRef<HTMLTableElement>(null);
  const filterRefs = useRef<{ [key: string]: HTMLInputElement }>({});

  // Generate table caption
  const tableCaption = caption || `Data table with ${rows.length} rows and ${columns.length} columns`;

  // Handle sorting
  const handleSort = useCallback((columnId: string) => {
    if (!sortable) return;

    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) return;

    const newDirection: 'asc' | 'desc' = sortConfig?.column === columnId && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    const newSortConfig: SortConfig = { column: columnId, direction: newDirection };
    
    setSortConfig(newSortConfig);
    onSort?.(newSortConfig);

    // Announce sort change
    announce(
      `Table sorted by ${column.label}, ${newDirection === 'asc' ? 'ascending' : 'descending'}`,
      'polite'
    );
  }, [sortable, columns, sortConfig, onSort, announce]);

  // Handle filtering
  const handleFilter = useCallback((columnId: string, value: string) => {
    const newFilters = filters.filter(f => f.column !== columnId);
    if (value.trim()) {
      newFilters.push({ column: columnId, value: value.trim() });
    }
    
    setFilters(newFilters);
    onFilter?.(newFilters);

    // Announce filter change
    const column = columns.find(col => col.id === columnId);
    if (value.trim()) {
      announce(`Filtered ${column?.label} by "${value}"`, 'polite');
    } else {
      announce(`Removed filter from ${column?.label}`, 'polite');
    }
  }, [filters, onFilter, columns, announce]);

  // Handle row selection
  const handleRowSelection = useCallback((rowId: string, selected: boolean) => {
    if (!selectable) return;

    const newSelectedRows = new Set(selectedRows);
    if (selected) {
      newSelectedRows.add(rowId);
    } else {
      newSelectedRows.delete(rowId);
    }
    
    setSelectedRows(newSelectedRows);
    onSelectionChange?.(Array.from(newSelectedRows));

    // Announce selection change
    announce(
      `Row ${selected ? 'selected' : 'deselected'}. ${newSelectedRows.size} of ${rows.length} rows selected.`,
      'polite'
    );
  }, [selectable, selectedRows, onSelectionChange, rows.length, announce]);

  // Handle select all
  const handleSelectAll = useCallback((selected: boolean) => {
    if (!selectable) return;

    const newSelectedRows = selected ? new Set(rows.map(row => row.id)) : new Set<string>();
    setSelectedRows(newSelectedRows);
    onSelectionChange?.(Array.from(newSelectedRows));

    announce(
      selected ? `All ${rows.length} rows selected` : 'All rows deselected',
      'polite'
    );
  }, [selectable, rows, onSelectionChange, announce]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!focusedCell) return;

    const { row, col } = focusedCell;
    const maxRow = rows.length - 1;
    const maxCol = columns.length - 1 + (selectable ? 1 : 0);

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (row > -1) {
          setFocusedCell({ row: Math.max(-1, row - 1), col });
        }
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        if (row < maxRow) {
          setFocusedCell({ row: Math.min(maxRow, row + 1), col });
        }
        break;
      
      case 'ArrowLeft':
        e.preventDefault();
        if (col > 0) {
          setFocusedCell({ row, col: col - 1 });
        }
        break;
      
      case 'ArrowRight':
        e.preventDefault();
        if (col < maxCol) {
          setFocusedCell({ row, col: col + 1 });
        }
        break;
      
      case 'Home':
        e.preventDefault();
        if (e.ctrlKey) {
          setFocusedCell({ row: -1, col: 0 });
        } else {
          setFocusedCell({ row, col: 0 });
        }
        break;
      
      case 'End':
        e.preventDefault();
        if (e.ctrlKey) {
          setFocusedCell({ row: maxRow, col: maxCol });
        } else {
          setFocusedCell({ row, col: maxCol });
        }
        break;
      
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (row >= 0 && col === 0 && selectable) {
          const rowData = rows[row];
          handleRowSelection(rowData.id, !selectedRows.has(rowData.id));
        } else if (row === -1 && col > (selectable ? 1 : 0)) {
          const columnIndex = col - (selectable ? 1 : 0);
          const column = columns[columnIndex];
          if (column?.sortable) {
            handleSort(column.id);
          }
        }
        break;
    }
  }, [focusedCell, rows, columns, selectable, selectedRows, handleRowSelection, handleSort]);

  // Focus management effect
  useEffect(() => {
    if (focusedCell && tableRef.current) {
      const { row, col } = focusedCell;
      let cellSelector: string;

      if (row === -1) {
        // Header row
        cellSelector = `thead th:nth-child(${col + 1})`;
      } else {
        // Data row
        cellSelector = `tbody tr:nth-child(${row + 1}) td:nth-child(${col + 1})`;
      }

      const cell = tableRef.current.querySelector(cellSelector) as HTMLElement;
      if (cell) {
        focusElement(cell);
      }
    }
  }, [focusedCell, focusElement]);

  // Render cell content
  const renderCellContent = useCallback((column: TableColumn<T>, rowData: T) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(rowData);
    }
    return String(rowData[column.accessor] || '');
  }, []);

  // All rows selected state
  const allRowsSelected = rows.length > 0 && selectedRows.size === rows.length;
  const someRowsSelected = selectedRows.size > 0 && selectedRows.size < rows.length;

  return (
    <div className={cn('overflow-auto border border-gray-200 rounded-lg', className)}>
      {/* Screen reader instructions */}
      <div className="sr-only" id="table-instructions">
        Use arrow keys to navigate cells, Enter or Space to interact with controls,
        Home/End to jump to row start/end, Ctrl+Home/End to jump to table start/end.
        {selectable && ' Press Space on a data row to select/deselect it.'}
      </div>

      {/* Filter controls */}
      {filterable && (
        <div className="p-4 bg-gray-50 border-b">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            aria-expanded={showFilters}
            aria-controls="table-filters"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {showFilters && (
            <div id="table-filters" className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {columns.filter(col => col.filterable).map(column => (
                <div key={column.id}>
                  <label htmlFor={`filter-${column.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                    Filter {column.label}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                    <input
                      id={`filter-${column.id}`}
                      ref={(el) => { if (el) filterRefs.current[column.id] = el; }}
                      type="text"
                      placeholder={`Search ${column.label}...`}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={filters.find(f => f.column === column.id)?.value || ''}
                      onChange={(e) => handleFilter(column.id, e.target.value)}
                      aria-describedby={column.description ? `desc-${column.id}` : undefined}
                    />
                  </div>
                  {column.description && (
                    <p id={`desc-${column.id}`} className="mt-1 text-xs text-gray-500">
                      {column.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data table */}
      <table
        ref={tableRef}
        className="w-full"
        role="grid"
        aria-label={ariaLabel || tableCaption}
        aria-describedby={summary ? 'table-summary table-instructions' : 'table-instructions'}
        aria-rowcount={rows.length + 1}
        aria-colcount={columns.length + (selectable ? 1 : 0)}
        data-testid={testId}
        onKeyDown={handleKeyDown}
      >
        <caption className="sr-only">
          {tableCaption}
          {summary && `. ${summary}`}
        </caption>

        {summary && (
          <div id="table-summary" className="sr-only">
            {summary}
          </div>
        )}

        <thead>
          <tr role="row" aria-rowindex={1}>
            {selectable && (
              <th
                role="columnheader"
                aria-colindex={1}
                className="p-3 text-left bg-gray-50 border-b"
                aria-sort="none"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allRowsSelected}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = someRowsSelected;
                      }
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    aria-label={`Select all rows. Currently ${selectedRows.size} of ${rows.length} rows selected.`}
                  />
                </div>
              </th>
            )}
            
            {columns.map((column, index) => (
              <th
                key={column.id}
                role="columnheader"
                aria-colindex={index + 1 + (selectable ? 1 : 0)}
                aria-sort={
                  sortConfig?.column === column.id 
                    ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                    : column.sortable ? 'none' : undefined
                }
                className={cn(
                  'p-3 bg-gray-50 border-b font-medium text-gray-900',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.sortable && 'cursor-pointer hover:bg-gray-100 focus:bg-gray-100',
                  focusedCell?.row === -1 && focusedCell?.col === index + (selectable ? 1 : 0) && 'ring-2 ring-blue-500'
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.id)}
                onFocus={() => setFocusedCell({ row: -1, col: index + (selectable ? 1 : 0) })}
                tabIndex={-1}
                aria-label={column.ariaLabel || `${column.label}${column.sortable ? ', sortable column' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <span className="flex flex-col" aria-hidden="true">
                      {sortConfig?.column === column.id ? (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 text-gray-400" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr role="row">
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="p-8 text-center text-gray-500"
                role="gridcell"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Loading data...
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr role="row">
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="p-8 text-center text-gray-500"
                role="gridcell"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                role="row"
                aria-rowindex={rowIndex + 2}
                aria-selected={selectable ? selectedRows.has(row.id) : undefined}
                className={cn(
                  'hover:bg-gray-50',
                  selectedRows.has(row.id) && 'bg-blue-50',
                  row.disabled && 'opacity-50 cursor-not-allowed'
                )}
                aria-label={row.ariaLabel}
              >
                {selectable && (
                  <td
                    role="gridcell"
                    aria-colindex={1}
                    className={cn(
                      'p-3 border-b',
                      focusedCell?.row === rowIndex && focusedCell?.col === 0 && 'ring-2 ring-blue-500'
                    )}
                    onFocus={() => setFocusedCell({ row: rowIndex, col: 0 })}
                    tabIndex={-1}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={(e) => handleRowSelection(row.id, e.target.checked)}
                      disabled={row.disabled}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      aria-label={`Select row for ${row.ariaLabel || `row ${rowIndex + 1}`}`}
                    />
                  </td>
                )}
                
                {columns.map((column, colIndex) => (
                  <td
                    key={column.id}
                    role="gridcell"
                    aria-colindex={colIndex + 1 + (selectable ? 1 : 0)}
                    className={cn(
                      'p-3 border-b',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      focusedCell?.row === rowIndex && 
                      focusedCell?.col === colIndex + (selectable ? 1 : 0) && 
                      'ring-2 ring-blue-500'
                    )}
                    onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex + (selectable ? 1 : 0) })}
                    tabIndex={-1}
                  >
                    {renderCellContent(column, row.data)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && (
        <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go to previous page"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go to next page"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Live region for dynamic announcements */}
      <div aria-live="polite" aria-atomic="false" className="sr-only" id="table-live-region"></div>
    </div>
  );
}

AccessibleDataTable.displayName = 'AccessibleDataTable';