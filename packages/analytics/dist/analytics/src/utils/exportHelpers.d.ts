import 'jspdf-autotable';
import { DashboardMetrics } from '../types';
export declare function exportMetricsToPDF(metrics: DashboardMetrics, _title: string, filename: string): void;
export declare function exportMetricsToExcel(metrics: DashboardMetrics, _title: string, filename: string): void;
