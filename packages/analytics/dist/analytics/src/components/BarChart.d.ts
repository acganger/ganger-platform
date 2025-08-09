import { BarChartDataPoint } from '../types';
interface BarChartProps {
    data: BarChartDataPoint[];
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
    barColor?: string;
    useCustomColors?: boolean;
    formatYAxis?: (value: number) => string;
    className?: string;
    orientation?: 'horizontal' | 'vertical';
}
export declare function BarChart({ data, height, showGrid, showLegend, barColor, useCustomColors, formatYAxis, className, orientation, }: BarChartProps): import("react/jsx-runtime").JSX.Element;
export {};
