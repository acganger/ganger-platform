import { LineChartDataPoint } from '../types';
interface AreaChartProps {
    data: LineChartDataPoint[];
    areas: {
        dataKey: string;
        name: string;
        color: string;
        fillOpacity?: number;
    }[];
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
    xAxisKey?: string;
    formatXAxis?: (value: string) => string;
    formatYAxis?: (value: number) => string;
    stacked?: boolean;
    className?: string;
}
export declare function AreaChart({ data, areas, height, showGrid, showLegend, xAxisKey, formatXAxis, formatYAxis, stacked, className, }: AreaChartProps): import("react/jsx-runtime").JSX.Element;
export {};
