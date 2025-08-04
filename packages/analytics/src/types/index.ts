export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface BarChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface LineChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface PieChartDataPoint {
  name: string;
  value: number;
  percentage?: number;
  fill?: string;
}

export interface KPIMetric {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number | string;
  trend?: 'up' | 'down' | 'stable';
  changePercentage?: number;
  target?: number | string;
  unit?: string;
  category: 'financial' | 'operational' | 'clinical' | 'staff';
}

export interface DashboardMetrics {
  financial: {
    revenue: KPIMetric;
    collections: KPIMetric;
    arDays: KPIMetric;
    writeOffs: KPIMetric;
  };
  operational: {
    patientVolume: KPIMetric;
    avgWaitTime: KPIMetric;
    appointmentUtilization: KPIMetric;
    noShowRate: KPIMetric;
  };
  clinical: {
    proceduresCompleted: KPIMetric;
    patientSatisfaction: KPIMetric;
    clinicalOutcomes: KPIMetric;
    readmissionRate: KPIMetric;
  };
  staff: {
    utilization: KPIMetric;
    overtimeHours: KPIMetric;
    turnoverRate: KPIMetric;
    trainingCompliance: KPIMetric;
  };
}

export interface ChartConfig {
  title: string;
  subtitle?: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  filename: string;
  title?: string;
  includeCharts?: boolean;
  dateRange?: TimeRange;
}