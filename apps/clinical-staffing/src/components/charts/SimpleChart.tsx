import React, { useMemo } from 'react';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartProps {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area';
  height?: number;
  showLabels?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  className?: string;
}

export function SimpleChart({ 
  data, 
  type, 
  height = 200, 
  showLabels = true,
  showGrid = true,
  animate = true,
  className = ''
}: ChartProps) {
  const { maxValue, minValue, scaledData } = useMemo(() => {
    if (!data.length) return { maxValue: 0, minValue: 0, scaledData: [] };
    
    const values = data.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    
    const scaled = data.map((point, index) => ({
      ...point,
      scaledValue: ((point.value - min) / range) * (height - 40), // Leave 40px for labels
      x: (index / (data.length - 1 || 1)) * 100 // Percentage
    }));
    
    return { maxValue: max, minValue: min, scaledData: scaled };
  }, [data, height]);

  if (!data.length) {
    return (
      <div 
        className={`flex items-center justify-center bg-neutral-50 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center text-neutral-500">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm">No data available</div>
        </div>
      </div>
    );
  }

  const renderLineChart = () => {
    const pathData = scaledData
      .map((point, index) => {
        const x = (index / (scaledData.length - 1)) * 100;
        const y = ((height - 40 - point.scaledValue) / (height - 40)) * 100;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return (
      <svg className="w-full" style={{ height }}>
        {/* Grid lines */}
        {showGrid && (
          <g className="text-neutral-300" stroke="currentColor" strokeWidth="0.5">
            {[0, 25, 50, 75, 100].map(y => (
              <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} />
            ))}
          </g>
        )}
        
        {/* Area fill */}
        {type === 'area' && (
          <path
            d={`${pathData} L 100 100 L 0 100 Z`}
            fill="rgba(59, 130, 246, 0.1)"
            className={animate ? 'animate-fade-in' : ''}
          />
        )}
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="rgb(59, 130, 246)"
          strokeWidth="2"
          className={animate ? 'animate-fade-in' : ''}
        />
        
        {/* Data points */}
        {scaledData.map((point, index) => {
          const x = (index / (scaledData.length - 1)) * 100;
          const y = ((height - 40 - point.scaledValue) / (height - 40)) * 100;
          
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r="3"
              fill="rgb(59, 130, 246)"
              className={`${animate ? 'animate-fade-in' : ''} hover:r-4 transition-all cursor-pointer`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <title>{`${point.label}: ${point.value}`}</title>
            </circle>
          );
        })}
        
        {/* Labels */}
        {showLabels && (
          <g className="text-xs text-neutral-600">
            {scaledData.map((point, index) => {
              const x = (index / (scaledData.length - 1)) * 100;
              return (
                <text
                  key={index}
                  x={`${x}%`}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-current"
                >
                  {point.label}
                </text>
              );
            })}
          </g>
        )}
      </svg>
    );
  };

  const renderBarChart = () => {
    const barWidth = 80 / scaledData.length;
    
    return (
      <svg className="w-full" style={{ height }}>
        {/* Grid lines */}
        {showGrid && (
          <g className="text-neutral-300" stroke="currentColor" strokeWidth="0.5">
            {[0, 25, 50, 75, 100].map(y => (
              <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} />
            ))}
          </g>
        )}
        
        {/* Bars */}
        {scaledData.map((point, index) => {
          const x = (index / scaledData.length) * 100 + (100 / scaledData.length - barWidth) / 2;
          const barHeight = (point.scaledValue / (height - 40)) * 100;
          const y = 100 - barHeight - 15; // 15% for label space
          
          return (
            <rect
              key={index}
              x={`${x}%`}
              y={`${y}%`}
              width={`${barWidth}%`}
              height={`${barHeight}%`}
              fill={point.color || 'rgb(59, 130, 246)'}
              className={`${animate ? 'animate-slide-up' : ''} hover:opacity-80 transition-opacity cursor-pointer`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <title>{`${point.label}: ${point.value}`}</title>
            </rect>
          );
        })}
        
        {/* Labels */}
        {showLabels && (
          <g className="text-xs text-neutral-600">
            {scaledData.map((point, index) => {
              const x = (index / scaledData.length) * 100 + (100 / scaledData.length) / 2;
              return (
                <text
                  key={index}
                  x={`${x}%`}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-current"
                >
                  {point.label}
                </text>
              );
            })}
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 p-4 ${className}`}>
      {/* Chart title and value indicators */}
      <div className="flex justify-between items-center mb-2 text-sm text-neutral-600">
        <span>Max: {maxValue}</span>
        <span>Min: {minValue}</span>
      </div>
      
      {/* Chart */}
      <div className="relative">
        {type === 'bar' ? renderBarChart() : renderLineChart()}
      </div>
    </div>
  );
}

// Specialized chart components
export function CoverageChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <SimpleChart
      data={data}
      type="area"
      height={300}
      showGrid={true}
      animate={true}
    />
  );
}

export function UtilizationChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <SimpleChart
      data={data}
      type="bar"
      height={300}
      showGrid={true}
      animate={true}
    />
  );
}