import { KPIMetric } from '../types';
interface KPICardProps {
    metric: KPIMetric;
    onClick?: () => void;
    className?: string;
    compact?: boolean;
}
export declare function KPICard({ metric, onClick, className, compact }: KPICardProps): import("react/jsx-runtime").JSX.Element;
export {};
