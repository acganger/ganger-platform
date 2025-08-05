import { PieChartDataPoint } from '../types';
interface PieChartProps {
    data: PieChartDataPoint[];
    height?: number;
    showLegend?: boolean;
    showLabels?: boolean;
    colors?: string[];
    className?: string;
    innerRadius?: number;
}
export declare function PieChart({ data, height, showLegend, showLabels, colors, className, innerRadius, }: PieChartProps): import("react/jsx-runtime").JSX.Element;
export {};
