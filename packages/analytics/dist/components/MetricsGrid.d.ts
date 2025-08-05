import { KPIMetric } from '../types';
interface MetricsGridProps {
    metrics: KPIMetric[];
    columns?: {
        default?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    onMetricClick?: (metric: KPIMetric) => void;
    className?: string;
    compact?: boolean;
}
export declare function MetricsGrid({ metrics, columns, onMetricClick, className, compact, }: MetricsGridProps): import("react/jsx-runtime").JSX.Element;
export {};
