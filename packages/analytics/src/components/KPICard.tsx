'use client';

import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';
import { KPIMetric } from '../types';
import { cn } from '@ganger/utils';

interface KPICardProps {
  metric: KPIMetric;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

export function KPICard({ metric, onClick, className, compact = false }: KPICardProps) {
  const getTrendIcon = () => {
    if (!metric.trend) return null;
    
    const iconClass = cn(
      'h-4 w-4',
      metric.trend === 'up' && 'text-green-500',
      metric.trend === 'down' && 'text-red-500',
      metric.trend === 'stable' && 'text-gray-400'
    );

    switch (metric.trend) {
      case 'up':
        return <ArrowUpIcon className={iconClass} />;
      case 'down':
        return <ArrowDownIcon className={iconClass} />;
      case 'stable':
        return <MinusIcon className={iconClass} />;
    }
  };

  const formatValue = (value: number | string) => {
    if (typeof value === 'number') {
      if (metric.unit === '$') {
        return `$${value.toLocaleString()}`;
      }
      if (metric.unit === '%') {
        return `${value}%`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-lg transition-all hover:shadow-md',
        onClick && 'cursor-pointer hover:border-blue-300',
        compact ? 'p-3' : 'p-4 sm:p-6',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            'text-gray-600 font-medium',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {metric.label}
          </p>
          
          <div className="flex items-baseline gap-2 mt-1">
            <p className={cn(
              'text-gray-900 font-bold',
              compact ? 'text-xl' : 'text-2xl sm:text-3xl'
            )}>
              {formatValue(metric.value)}
            </p>
            
            {metric.changePercentage !== undefined && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={cn(
                  'text-sm font-medium',
                  metric.trend === 'up' && 'text-green-600',
                  metric.trend === 'down' && 'text-red-600',
                  metric.trend === 'stable' && 'text-gray-500'
                )}>
                  {Math.abs(metric.changePercentage)}%
                </span>
              </div>
            )}
          </div>

          {metric.previousValue !== undefined && !compact && (
            <p className="text-xs text-gray-500 mt-1">
              Previous: {formatValue(metric.previousValue)}
            </p>
          )}

          {metric.target !== undefined && !compact && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Target</span>
                <span className="text-gray-700 font-medium">
                  {formatValue(metric.target)}
                </span>
              </div>
              
              {typeof metric.value === 'number' && typeof metric.target === 'number' && (
                <div className="mt-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all',
                      metric.value >= metric.target ? 'bg-green-500' : 'bg-yellow-500'
                    )}
                    style={{
                      width: `${Math.min((metric.value / metric.target) * 100, 100)}%`
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {onClick && (
          <div className="ml-3">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}