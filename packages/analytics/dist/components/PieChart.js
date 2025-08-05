'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, } from 'recharts';
const DEFAULT_COLORS = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
];
export function PieChart({ data, height = 300, showLegend = true, showLabels = true, colors = DEFAULT_COLORS, className, innerRadius = 0, }) {
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (_jsx("text", { x: x, y: y, fill: "white", textAnchor: x > cx ? 'start' : 'end', dominantBaseline: "central", className: "text-xs font-medium", children: `${(percent * 100).toFixed(0)}%` }));
    };
    return (_jsx("div", { className: className, children: _jsx(ResponsiveContainer, { width: "100%", height: height, children: _jsxs(RechartsPieChart, { children: [_jsx(Pie, { data: data, cx: "50%", cy: "50%", labelLine: false, label: showLabels ? renderCustomizedLabel : false, outerRadius: 80, innerRadius: innerRadius, fill: "#8884d8", dataKey: "value", children: data.map((entry, index) => (_jsx(Cell, { fill: entry.fill || colors[index % colors.length] }, `cell-${index}`))) }), _jsx(Tooltip, { contentStyle: {
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            fontSize: '12px',
                        }, formatter: (value, name) => [
                            value.toLocaleString(),
                            name
                        ] }), showLegend && (_jsx(Legend, { wrapperStyle: { fontSize: '12px' }, verticalAlign: "bottom", height: 36 }))] }) }) }));
}
