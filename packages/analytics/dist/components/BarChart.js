'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, } from 'recharts';
export function BarChart({ data, height = 300, showGrid = true, showLegend = false, barColor = '#3B82F6', useCustomColors = false, formatYAxis, className, orientation = 'vertical', }) {
    const defaultFormatYAxis = (value) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toString();
    };
    const yFormatter = formatYAxis || defaultFormatYAxis;
    const layout = orientation === 'horizontal' ? 'horizontal' : 'vertical';
    const xKey = orientation === 'horizontal' ? 'value' : 'name';
    const yKey = orientation === 'horizontal' ? 'name' : 'value';
    return (_jsx("div", { className: className, children: _jsx(ResponsiveContainer, { width: "100%", height: height, children: _jsxs(RechartsBarChart, { data: data, layout: layout, margin: { top: 5, right: 30, left: 20, bottom: 5 }, children: [showGrid && (_jsx(CartesianGrid, { strokeDasharray: "3 3", className: "opacity-30" })), _jsx(XAxis, { dataKey: xKey, type: orientation === 'horizontal' ? 'number' : 'category', tickFormatter: orientation === 'horizontal' ? yFormatter : undefined, className: "text-xs", stroke: "#9CA3AF" }), _jsx(YAxis, { dataKey: yKey, type: orientation === 'horizontal' ? 'category' : 'number', tickFormatter: orientation === 'horizontal' ? undefined : yFormatter, className: "text-xs", stroke: "#9CA3AF", width: orientation === 'horizontal' ? 100 : 60 }), _jsx(Tooltip, { contentStyle: {
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            fontSize: '12px',
                        }, formatter: (value) => [yFormatter(value), 'Value'] }), showLegend && _jsx(Legend, { wrapperStyle: { fontSize: '12px' } }), _jsx(Bar, { dataKey: "value", fill: barColor, children: useCustomColors && data.map((entry, index) => (_jsx(Cell, { fill: entry.fill || barColor }, `cell-${index}`))) })] }) }) }));
}
