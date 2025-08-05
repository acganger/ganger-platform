import { TimeRange } from '../types';
interface UseChartDataOptions {
    type: 'line' | 'bar' | 'pie' | 'area';
    dataSource?: string;
    mockData?: boolean;
    refreshInterval?: number;
}
export declare function useChartData(timeRange: TimeRange, options: UseChartDataOptions): {
    data: any[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
};
export {};
