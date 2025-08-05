import { DashboardMetrics, TimeRange } from '../types';
export declare function generateMockMetrics(_timeRange: TimeRange): DashboardMetrics;
export declare function generateMockChartData(type: 'line' | 'bar' | 'pie' | 'area', timeRange: TimeRange): any[];
