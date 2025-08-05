'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';
import { cn } from '@ganger/utils';
export function KPICard({ metric, onClick, className, compact = false }) {
    const getTrendIcon = () => {
        if (!metric.trend)
            return null;
        const iconClass = cn('h-4 w-4', metric.trend === 'up' && 'text-green-500', metric.trend === 'down' && 'text-red-500', metric.trend === 'stable' && 'text-gray-400');
        switch (metric.trend) {
            case 'up':
                return _jsx(ArrowUpIcon, { className: iconClass });
            case 'down':
                return _jsx(ArrowDownIcon, { className: iconClass });
            case 'stable':
                return _jsx(MinusIcon, { className: iconClass });
        }
    };
    const formatValue = (value) => {
        if (typeof value === 'number') {
            if (metric.unit === '$') {
                return `$${value.toLocaleString()}`;
            }
            if (metric.unit === '%') {
                return `${value}%`;
            }
            return value.toLocaleString();
        }
        return value;
    };
    return (_jsx("div", { className: cn('bg-white border border-gray-200 rounded-lg transition-all hover:shadow-md', onClick && 'cursor-pointer hover:border-blue-300', compact ? 'p-3' : 'p-4 sm:p-6', className), onClick: onClick, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: cn('text-gray-600 font-medium', compact ? 'text-xs' : 'text-sm'), children: metric.label }), _jsxs("div", { className: "flex items-baseline gap-2 mt-1", children: [_jsx("p", { className: cn('text-gray-900 font-bold', compact ? 'text-xl' : 'text-2xl sm:text-3xl'), children: formatValue(metric.value) }), metric.changePercentage !== undefined && (_jsxs("div", { className: "flex items-center gap-1", children: [getTrendIcon(), _jsxs("span", { className: cn('text-sm font-medium', metric.trend === 'up' && 'text-green-600', metric.trend === 'down' && 'text-red-600', metric.trend === 'stable' && 'text-gray-500'), children: [Math.abs(metric.changePercentage), "%"] })] }))] }), metric.previousValue !== undefined && !compact && (_jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["Previous: ", formatValue(metric.previousValue)] })), metric.target !== undefined && !compact && (_jsxs("div", { className: "mt-2", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-gray-500", children: "Target" }), _jsx("span", { className: "text-gray-700 font-medium", children: formatValue(metric.target) })] }), typeof metric.value === 'number' && typeof metric.target === 'number' && (_jsx("div", { className: "mt-1 bg-gray-200 rounded-full h-2", children: _jsx("div", { className: cn('h-2 rounded-full transition-all', metric.value >= metric.target ? 'bg-green-500' : 'bg-yellow-500'), style: {
                                            width: `${Math.min((metric.value / metric.target) * 100, 100)}%`
                                        } }) }))] }))] }), onClick && (_jsx("div", { className: "ml-3", children: _jsx("svg", { className: "h-5 w-5 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }) }))] }) }));
}
