import { DashboardMetrics, TimeRange } from '../types';
interface UseAnalyticsOptions {
    refreshInterval?: number;
    mockData?: boolean;
}
export declare function useAnalytics(timeRange: TimeRange, options?: UseAnalyticsOptions): {
    metrics: DashboardMetrics | null;
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
};
export {};
