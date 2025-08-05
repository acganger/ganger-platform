'use client';

import { ReactNode } from 'react';
import { cn } from '@ganger/utils';
import { TimeRangeSelector, TimeRangeOption } from './TimeRangeSelector';
import { ExportButton } from './ExportButton';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  timeRange?: TimeRangeOption;
  onTimeRangeChange?: (range: TimeRangeOption, dates: { start: Date; end: Date; label: string }) => void;
  exportData?: any[];
  exportFilename?: string;
  actions?: ReactNode;
  className?: string;
}

export function DashboardLayout({
  title,
  subtitle,
  children,
  timeRange,
  onTimeRangeChange,
  exportData,
  exportFilename,
  actions,
  className,
}: DashboardLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {actions}
            {exportData && exportFilename && (
              <ExportButton
                data={exportData}
                filename={exportFilename}
                title={title}
              />
            )}
          </div>
        </div>

        {timeRange && onTimeRangeChange && (
          <div className="mt-4">
            <TimeRangeSelector
              value={timeRange}
              onChange={onTimeRangeChange}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}