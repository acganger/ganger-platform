import { LineChartDataPoint } from '../types';
interface LineChartProps {
    data: LineChartDataPoint[];
    lines: {
        dataKey: string;
        name: string;
        color: string;
        strokeWidth?: number;
    }[];
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
    xAxisKey?: string;
    formatXAxis?: (value: string) => string;
    formatYAxis?: (value: number) => string;
    className?: string;
}
export declare function LineChart({ data, lines, height, showGrid, showLegend, xAxisKey, formatXAxis, formatYAxis, className, }: LineChartProps): import("react/jsx-runtime").JSX.Element;
export {};
