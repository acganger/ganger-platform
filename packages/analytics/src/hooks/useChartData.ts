import { useState, useEffect, useCallback } from 'react';
import { TimeRange } from '../types';
import { generateMockChartData } from '../utils/mockData';

interface UseChartDataOptions {
  type: 'line' | 'bar' | 'pie' | 'area';
  dataSource?: string;
  mockData?: boolean;
  refreshInterval?: number;
}

export function useChartData(
  timeRange: TimeRange,
  options: UseChartDataOptions
) {
  const { type, dataSource, mockData = true, refreshInterval = 0 } = options;
  
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (mockData) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const chartData = generateMockChartData(type, timeRange);
        setData(chartData);
      } else {
        // Real API call
        const response = await fetch(`/api/analytics/chart-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            dataSource,
            startDate: timeRange.start.toISOString(),
            endDate: timeRange.end.toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }

        const result = await response.json();
        setData(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [type, dataSource, timeRange, mockData]);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
    return;
  }, [fetchData, refreshInterval]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
  };
}