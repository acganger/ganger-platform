'use client';

import { cn } from '@ganger/utils';
import { KPICard } from './KPICard';
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

export function MetricsGrid({
  metrics,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  onMetricClick,
  className,
  compact = false,
}: MetricsGridProps) {
  const gridClasses = cn(
    'grid gap-4',
    columns.default && `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
    className
  );

  return (
    <div className={gridClasses}>
      {metrics.map((metric) => (
        <KPICard
          key={metric.id}
          metric={metric}
          onClick={onMetricClick ? () => onMetricClick(metric) : undefined}
          compact={compact}
        />
      ))}
    </div>
  );
}