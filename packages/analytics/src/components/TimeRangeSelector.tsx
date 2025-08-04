'use client';

import React from 'react';
import { cn } from '@ganger/utils';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';

export type TimeRangeOption = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'last7Days' | 'last30Days' | 'last90Days';

interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

interface TimeRangeSelectorProps {
  value: TimeRangeOption;
  onChange: (range: TimeRangeOption, dates: TimeRange) => void;
  options?: TimeRangeOption[];
  className?: string;
}

const defaultOptions: TimeRangeOption[] = [
  'today',
  'yesterday',
  'thisWeek',
  'lastWeek',
  'thisMonth',
  'last7Days',
  'last30Days',
];

export function TimeRangeSelector({ 
  value, 
  onChange, 
  options = defaultOptions,
  className 
}: TimeRangeSelectorProps) {
  const getTimeRange = (option: TimeRangeOption): TimeRange => {
    const now = new Date();
    
    switch (option) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now),
          label: 'Today'
        };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return {
          start: startOfDay(yesterday),
          end: endOfDay(yesterday),
          label: 'Yesterday'
        };
      case 'thisWeek':
        return {
          start: startOfWeek(now, { weekStartsOn: 0 }),
          end: endOfWeek(now, { weekStartsOn: 0 }),
          label: 'This Week'
        };
      case 'lastWeek':
        const lastWeek = subWeeks(now, 1);
        return {
          start: startOfWeek(lastWeek, { weekStartsOn: 0 }),
          end: endOfWeek(lastWeek, { weekStartsOn: 0 }),
          label: 'Last Week'
        };
      case 'thisMonth':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: 'This Month'
        };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
          label: 'Last Month'
        };
      case 'last7Days':
        return {
          start: startOfDay(subDays(now, 6)),
          end: endOfDay(now),
          label: 'Last 7 Days'
        };
      case 'last30Days':
        return {
          start: startOfDay(subDays(now, 29)),
          end: endOfDay(now),
          label: 'Last 30 Days'
        };
      case 'last90Days':
        return {
          start: startOfDay(subDays(now, 89)),
          end: endOfDay(now),
          label: 'Last 90 Days'
        };
    }
  };

  const handleChange = (option: TimeRangeOption) => {
    const timeRange = getTimeRange(option);
    onChange(option, timeRange);
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => {
        const timeRange = getTimeRange(option);
        return (
          <button
            key={option}
            onClick={() => handleChange(option)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              'border border-gray-300',
              value === option
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            {timeRange.label}
          </button>
        );
      })}
    </div>
  );
}