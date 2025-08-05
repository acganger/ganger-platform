'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChartDataPoint } from '../types';

interface BarChartProps {
  data: BarChartDataPoint[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  barColor?: string;
  useCustomColors?: boolean;
  formatYAxis?: (value: number) => string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function BarChart({
  data,
  height = 300,
  showGrid = true,
  showLegend = false,
  barColor = '#3B82F6',
  useCustomColors = false,
  formatYAxis,
  className,
  orientation = 'vertical',
}: BarChartProps) {
  const defaultFormatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const yFormatter = formatYAxis || defaultFormatYAxis;

  const layout = orientation === 'horizontal' ? 'horizontal' : 'vertical';
  const xKey = orientation === 'horizontal' ? 'value' : 'name';
  const yKey = orientation === 'horizontal' ? 'name' : 'value';

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart 
          data={data} 
          layout={layout}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          )}
          <XAxis
            dataKey={xKey}
            type={orientation === 'horizontal' ? 'number' : 'category'}
            tickFormatter={orientation === 'horizontal' ? yFormatter : undefined}
            className="text-xs"
            stroke="#9CA3AF"
          />
          <YAxis
            dataKey={yKey}
            type={orientation === 'horizontal' ? 'category' : 'number'}
            tickFormatter={orientation === 'horizontal' ? undefined : yFormatter}
            className="text-xs"
            stroke="#9CA3AF"
            width={orientation === 'horizontal' ? 100 : 60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [yFormatter(value), 'Value']}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
          <Bar dataKey="value" fill={barColor}>
            {useCustomColors && data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || barColor} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}