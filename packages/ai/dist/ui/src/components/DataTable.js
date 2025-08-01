"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTable = DataTable;
const jsx_runtime_1 = require("react/jsx-runtime");
const cn_1 = require("../utils/cn");
const LoadingSpinner_1 = require("./LoadingSpinner");
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
        return ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center p-8", children: (0, jsx_runtime_1.jsx)(LoadingSpinner_1.LoadingSpinner, { size: "lg" }) }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, cn_1.cn)('overflow-hidden rounded-lg border border-gray-200', className), children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full divide-y divide-gray-200", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-gray-50", children: (0, jsx_runtime_1.jsx)("tr", { children: columns.map((column) => ((0, jsx_runtime_1.jsx)("th", { className: (0, cn_1.cn)('px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider', column.sortable && 'cursor-pointer hover:bg-gray-100', column.className), onClick: () => handleSort(column), children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-1", children: [(0, jsx_runtime_1.jsx)("span", { children: column.header }), column.sortable && ((0, jsx_runtime_1.jsxs)("span", { className: "text-gray-400", children: [sortBy === column.key && sortDirection === 'asc' && '↑', sortBy === column.key && sortDirection === 'desc' && '↓', sortBy !== column.key && '↕'] }))] }) }, column.key))) }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "bg-white divide-y divide-gray-200", children: data.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: columns.length, className: "px-6 py-8 text-center text-gray-500", children: emptyMessage }) })) : (data.map((item, index) => ((0, jsx_runtime_1.jsx)("tr", { className: (0, cn_1.cn)('hover:bg-gray-50', onRowClick && 'cursor-pointer'), onClick: () => onRowClick?.(item), children: columns.map((column) => ((0, jsx_runtime_1.jsx)("td", { className: (0, cn_1.cn)('px-6 py-4 whitespace-nowrap text-sm text-gray-900', column.className), children: renderCellValue(item, column) }, column.key))) }, index)))) })] }) }) }));
}
