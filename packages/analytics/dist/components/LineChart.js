'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from 'recharts';
import { format } from 'date-fns';
export function LineChart({ data, lines, height = 300, showGrid = true, showLegend = true, xAxisKey = 'date', formatXAxis, formatYAxis, className, }) {
    const defaultFormatXAxis = (value) => {
        try {
            return format(new Date(value), 'MMM d');
        }
        catch {
            return value;
        }
    };
    const defaultFormatYAxis = (value) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toString();
    };
    const xFormatter = formatXAxis || defaultFormatXAxis;
    const yFormatter = formatYAxis || defaultFormatYAxis;
    return (_jsx("div", { className: className, children: _jsx(ResponsiveContainer, { width: "100%", height: height, children: _jsxs(RechartsLineChart, { data: data, margin: { top: 5, right: 30, left: 20, bottom: 5 }, children: [showGrid && (_jsx(CartesianGrid, { strokeDasharray: "3 3", className: "opacity-30" })), _jsx(XAxis, { dataKey: xAxisKey, tickFormatter: xFormatter, className: "text-xs", stroke: "#9CA3AF" }), _jsx(YAxis, { tickFormatter: yFormatter, className: "text-xs", stroke: "#9CA3AF" }), _jsx(Tooltip, { contentStyle: {
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            fontSize: '12px',
                        }, labelFormatter: xFormatter }), showLegend && (_jsx(Legend, { wrapperStyle: { fontSize: '12px' }, iconType: "line" })), lines.map((line) => (_jsx(Line, { type: "monotone", dataKey: line.dataKey, stroke: line.color, name: line.name, strokeWidth: line.strokeWidth || 2, dot: false, activeDot: { r: 4 } }, line.dataKey)))] }) }) }));
}
