'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { LineChartDataPoint } from '../types';
import { format } from 'date-fns';

interface LineChartProps {
  data: LineChartDataPoint[];
  lines: {
    dataKey: string;
    name: string;
    color: string;
    strokeWidth?: number;
  }[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  xAxisKey?: string;
  formatXAxis?: (value: string) => string;
  formatYAxis?: (value: number) => string;
  className?: string;
}

export function LineChart({
  data,
  lines,
  height = 300,
  showGrid = true,
  showLegend = true,
  xAxisKey = 'date',
  formatXAxis,
  formatYAxis,
  className,
}: LineChartProps) {
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
        <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              iconType="line"
            />
          )}
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              name={line.name}
              strokeWidth={line.strokeWidth || 2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}