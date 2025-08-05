'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@ganger/utils';
import { TimeRangeSelector } from './TimeRangeSelector';
import { ExportButton } from './ExportButton';
export function DashboardLayout({ title, subtitle, children, timeRange, onTimeRangeChange, exportData, exportFilename, actions, className, }) {
    return (_jsxs("div", { className: cn('space-y-6', className), children: [_jsxs("div", { className: "bg-white border-b border-gray-200 pb-4", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: title }), subtitle && (_jsx("p", { className: "mt-1 text-sm text-gray-600", children: subtitle }))] }), _jsxs("div", { className: "flex items-center gap-3", children: [actions, exportData && exportFilename && (_jsx(ExportButton, { data: exportData, filename: exportFilename, title: title }))] })] }), timeRange && onTimeRangeChange && (_jsx("div", { className: "mt-4", children: _jsx(TimeRangeSelector, { value: timeRange, onChange: onTimeRangeChange }) }))] }), _jsx("div", { children: children })] }));
}
