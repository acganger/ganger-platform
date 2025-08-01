import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../utils/cn';
import { LoadingSpinner } from './LoadingSpinner';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DataTable({ data, columns, loading = false, emptyMessage = 'No data available', className, onRowClick, sortBy, sortDirection, onSort, }) {
    const handleSort = (column) => {
        if (column.sortable && onSort) {
            onSort(column.key);
        }
    };
    const renderCellValue = (item, column) => {
        if (column.render) {
            return column.render(item);
        }
        return item[column.key];
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center p-8", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsx("div", { className: cn('overflow-hidden rounded-lg border border-gray-200', className), children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsx("tr", { children: columns.map((column) => (_jsx("th", { className: cn('px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider', column.sortable && 'cursor-pointer hover:bg-gray-100', column.className), onClick: () => handleSort(column), children: _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { children: column.header }), column.sortable && (_jsxs("span", { className: "text-gray-400", children: [sortBy === column.key && sortDirection === 'asc' && '↑', sortBy === column.key && sortDirection === 'desc' && '↓', sortBy !== column.key && '↕'] }))] }) }, column.key))) }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: data.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, className: "px-6 py-8 text-center text-gray-500", children: emptyMessage }) })) : (data.map((item, index) => (_jsx("tr", { className: cn('hover:bg-gray-50', onRowClick && 'cursor-pointer'), onClick: () => onRowClick?.(item), children: columns.map((column) => (_jsx("td", { className: cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900', column.className), children: renderCellValue(item, column) }, column.key))) }, index)))) })] }) }) }));
}
export { DataTable };
