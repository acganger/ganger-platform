'use client';

import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { LineChartDataPoint } from '../types';
import { format } from 'date-fns';

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

export function AreaChart({
  data,
  areas,
  height = 300,
  showGrid = true,
  showLegend = true,
  xAxisKey = 'date',
  formatXAxis,
  formatYAxis,
  stacked = false,
  className,
}: AreaChartProps) {
  const defaultFormatXAxis = (value: string) => {
    try {
      return format(new Date(value), 'MMM d');
    } catch {
      return value;
    }
  };

  const defaultFormatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const xFormatter = formatXAxis || defaultFormatXAxis;
  const yFormatter = formatYAxis || defaultFormatYAxis;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          )}
          <XAxis
            dataKey={xAxisKey}
            tickFormatter={xFormatter}
            className="text-xs"
            stroke="#9CA3AF"
          />
          <YAxis
            tickFormatter={yFormatter}
            className="text-xs"
            stroke="#9CA3AF"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelFormatter={xFormatter}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="rect"
            />
          )}
          {areas.map((area, index) => (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              stackId={stacked ? '1' : undefined}
              stroke={area.color}
              fill={area.color}
              fillOpacity={area.fillOpacity || 0.6}
              name={area.name}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}