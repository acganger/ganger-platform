import { useState, useEffect, useCallback } from 'react';
import { generateMockMetrics } from '../utils/mockData';
export function useAnalytics(timeRange, options = {}) {
    const { refreshInterval = 60000, mockData = true } = options;
    const [metrics, setMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchMetrics = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            if (mockData) {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                const data = generateMockMetrics(timeRange);
                setMetrics(data);
            }
            else {
                // Real API call would go here
                const response = await fetch('/api/analytics/metrics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        startDate: timeRange.start.toISOString(),
                        endDate: timeRange.end.toISOString(),
                    }),
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch metrics');
                }
                const data = await response.json();
                setMetrics(data);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        }
        finally {
            setIsLoading(false);
        }
    }, [timeRange, mockData]);
    useEffect(() => {
        fetchMetrics();
        if (refreshInterval > 0) {
            const interval = setInterval(fetchMetrics, refreshInterval);
            return () => clearInterval(interval);
        }
        return;
    }, [fetchMetrics, refreshInterval]);
    return {
        metrics,
        isLoading,
        error,
        refresh: fetchMetrics,
    };
}
