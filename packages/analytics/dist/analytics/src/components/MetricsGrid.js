'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@ganger/utils';
import { KPICard } from './KPICard';
export function MetricsGrid({ metrics, columns = { default: 1, sm: 2, md: 3, lg: 4 }, onMetricClick, className, compact = false, }) {
    const gridClasses = cn('grid gap-4', columns.default && `grid-cols-${columns.default}`, columns.sm && `sm:grid-cols-${columns.sm}`, columns.md && `md:grid-cols-${columns.md}`, columns.lg && `lg:grid-cols-${columns.lg}`, columns.xl && `xl:grid-cols-${columns.xl}`, className);
    return (_jsx("div", { className: gridClasses, children: metrics.map((metric) => (_jsx(KPICard, { metric: metric, onClick: onMetricClick ? () => onMetricClick(metric) : undefined, compact: compact }, metric.id))) }));
}
