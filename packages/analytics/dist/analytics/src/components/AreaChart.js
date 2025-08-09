'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from 'recharts';
import { format } from 'date-fns';
export function AreaChart({ data, areas, height = 300, showGrid = true, showLegend = true, xAxisKey = 'date', formatXAxis, formatYAxis, stacked = false, className, }) {
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
    return (_jsx("div", { className: className, children: _jsx(ResponsiveContainer, { width: "100%", height: height, children: _jsxs(RechartsAreaChart, { data: data, margin: { top: 5, right: 30, left: 20, bottom: 5 }, children: [showGrid && (_jsx(CartesianGrid, { strokeDasharray: "3 3", className: "opacity-30" })), _jsx(XAxis, { dataKey: xAxisKey, tickFormatter: xFormatter, className: "text-xs", stroke: "#9CA3AF" }), _jsx(YAxis, { tickFormatter: yFormatter, className: "text-xs", stroke: "#9CA3AF" }), _jsx(Tooltip, { contentStyle: {
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            fontSize: '12px',
                        }, labelFormatter: xFormatter }), showLegend && (_jsx(Legend, { wrapperStyle: { fontSize: '12px' }, iconType: "rect" })), areas.map((area) => (_jsx(Area, { type: "monotone", dataKey: area.dataKey, stackId: stacked ? '1' : undefined, stroke: area.color, fill: area.color, fillOpacity: area.fillOpacity || 0.6, name: area.name }, area.dataKey)))] }) }) }));
}
