import { DashboardMetrics, TimeRange, LineChartDataPoint, BarChartDataPoint, PieChartDataPoint } from '../types';
import { eachDayOfInterval, format, differenceInDays } from 'date-fns';

export function generateMockMetrics(timeRange: TimeRange): DashboardMetrics {
  // Generate random but realistic metrics
  const baseRevenue = 850000;
  const basePatientVolume = 1200;
  
  return {
    financial: {
      revenue: {
        id: 'revenue',
        label: 'Monthly Revenue',
        value: baseRevenue + Math.floor(Math.random() * 100000),
        previousValue: baseRevenue,
        trend: 'up',
        changePercentage: 5.2,
        target: 900000,
        unit: '$',
        category: 'financial',
      },
      collections: {
        id: 'collections',
        label: 'Collections Rate',
        value: 94.5 + Math.random() * 3,
        previousValue: 93.2,
        trend: 'up',
        changePercentage: 1.4,
        target: 95,
        unit: '%',
        category: 'financial',
      },
      arDays: {
        id: 'ar_days',
        label: 'A/R Days',
        value: 32,
        previousValue: 35,
        trend: 'down',
        changePercentage: -8.6,
        target: 30,
        category: 'financial',
      },
      writeOffs: {
        id: 'write_offs',
        label: 'Write-offs',
        value: 12500,
        previousValue: 15000,
        trend: 'down',
        changePercentage: -16.7,
        unit: '$',
        category: 'financial',
      },
    },
    operational: {
      patientVolume: {
        id: 'patient_volume',
        label: 'Patient Volume',
        value: basePatientVolume + Math.floor(Math.random() * 200),
        previousValue: basePatientVolume,
        trend: 'up',
        changePercentage: 3.5,
        target: 1300,
        category: 'operational',
      },
      avgWaitTime: {
        id: 'avg_wait_time',
        label: 'Avg Wait Time',
        value: 18,
        previousValue: 22,
        trend: 'down',
        changePercentage: -18.2,
        target: 15,
        unit: 'min',
        category: 'operational',
      },
      appointmentUtilization: {
        id: 'appt_utilization',
        label: 'Appointment Utilization',
        value: 87,
        previousValue: 84,
        trend: 'up',
        changePercentage: 3.6,
        target: 90,
        unit: '%',
        category: 'operational',
      },
      noShowRate: {
        id: 'no_show_rate',
        label: 'No-Show Rate',
        value: 4.2,
        previousValue: 5.1,
        trend: 'down',
        changePercentage: -17.6,
        target: 3,
        unit: '%',
        category: 'operational',
      },
    },
    clinical: {
      proceduresCompleted: {
        id: 'procedures',
        label: 'Procedures Completed',
        value: 342,
        previousValue: 315,
        trend: 'up',
        changePercentage: 8.6,
        target: 350,
        category: 'clinical',
      },
      patientSatisfaction: {
        id: 'patient_satisfaction',
        label: 'Patient Satisfaction',
        value: 4.7,
        previousValue: 4.6,
        trend: 'up',
        changePercentage: 2.2,
        target: 4.8,
        unit: '/5',
        category: 'clinical',
      },
      clinicalOutcomes: {
        id: 'clinical_outcomes',
        label: 'Clinical Success Rate',
        value: 96.2,
        previousValue: 95.8,
        trend: 'up',
        changePercentage: 0.4,
        target: 97,
        unit: '%',
        category: 'clinical',
      },
      readmissionRate: {
        id: 'readmission_rate',
        label: 'Readmission Rate',
        value: 1.8,
        previousValue: 2.1,
        trend: 'down',
        changePercentage: -14.3,
        target: 1.5,
        unit: '%',
        category: 'clinical',
      },
    },
    staff: {
      utilization: {
        id: 'staff_utilization',
        label: 'Staff Utilization',
        value: 82,
        previousValue: 78,
        trend: 'up',
        changePercentage: 5.1,
        target: 85,
        unit: '%',
        category: 'staff',
      },
      overtimeHours: {
        id: 'overtime_hours',
        label: 'Overtime Hours',
        value: 124,
        previousValue: 156,
        trend: 'down',
        changePercentage: -20.5,
        target: 100,
        unit: 'hrs',
        category: 'staff',
      },
      turnoverRate: {
        id: 'turnover_rate',
        label: 'Turnover Rate',
        value: 8.2,
        previousValue: 9.5,
        trend: 'down',
        changePercentage: -13.7,
        target: 7,
        unit: '%',
        category: 'staff',
      },
      trainingCompliance: {
        id: 'training_compliance',
        label: 'Training Compliance',
        value: 94,
        previousValue: 91,
        trend: 'up',
        changePercentage: 3.3,
        target: 95,
        unit: '%',
        category: 'staff',
      },
    },
  };
}

export function generateMockChartData(
  type: 'line' | 'bar' | 'pie' | 'area',
  timeRange: TimeRange
): any[] {
  switch (type) {
    case 'line':
    case 'area':
      return generateLineChartData(timeRange);
    case 'bar':
      return generateBarChartData();
    case 'pie':
      return generatePieChartData();
    default:
      return [];
  }
}

function generateLineChartData(timeRange: TimeRange): LineChartDataPoint[] {
  const days = eachDayOfInterval({ start: timeRange.start, end: timeRange.end });
  
  return days.map((day, index) => ({
    date: format(day, 'yyyy-MM-dd'),
    revenue: 25000 + Math.random() * 10000 + (index * 500),
    patients: 40 + Math.floor(Math.random() * 20) + Math.floor(index * 0.5),
    procedures: 8 + Math.floor(Math.random() * 5),
  }));
}

function generateBarChartData(): BarChartDataPoint[] {
  const departments = [
    { name: 'Medical', baseline: 85 },
    { name: 'Cosmetic', baseline: 92 },
    { name: 'Surgical', baseline: 78 },
    { name: 'Pediatric', baseline: 88 },
    { name: 'General', baseline: 81 },
  ];

  return departments.map(dept => ({
    name: dept.name,
    value: dept.baseline + Math.floor(Math.random() * 10),
    fill: getRandomColor(),
  }));
}

function generatePieChartData(): PieChartDataPoint[] {
  const categories = [
    { name: 'New Patients', value: 320 },
    { name: 'Follow-ups', value: 580 },
    { name: 'Procedures', value: 210 },
    { name: 'Consultations', value: 140 },
  ];

  const total = categories.reduce((sum, cat) => sum + cat.value, 0);

  return categories.map(cat => ({
    name: cat.name,
    value: cat.value,
    percentage: (cat.value / total) * 100,
    fill: getRandomColor(),
  }));
}

function getRandomColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}