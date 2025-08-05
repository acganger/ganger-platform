import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DashboardMetrics, KPIMetric } from '../types';

export function exportMetricsToPDF(
  metrics: DashboardMetrics,
  _title: string,
  filename: string
) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text(_title, 14, 20);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  
  let yPosition = 40;
  
  // Helper function to add a section
  const addSection = (sectionTitle: string, sectionMetrics: Record<string, KPIMetric>) => {
    doc.setFontSize(14);
    doc.text(sectionTitle, 14, yPosition);
    yPosition += 10;
    
    const rows = Object.values(sectionMetrics).map(metric => [
      metric.label,
      formatMetricValue(metric),
      metric.changePercentage ? `${metric.changePercentage > 0 ? '+' : ''}${metric.changePercentage}%` : '-',
      metric.target ? formatMetricValue({ ...metric, value: metric.target }) : '-',
    ]);
    
    (doc as any).autoTable({
      head: [['Metric', 'Current', 'Change', 'Target']],
      body: rows,
      startY: yPosition,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  };
  
  // Add sections
  addSection('Financial Metrics', metrics.financial);
  
  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }
  
  addSection('Operational Metrics', metrics.operational);
  
  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }
  
  addSection('Clinical Metrics', metrics.clinical);
  
  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }
  
  addSection('Staff Metrics', metrics.staff);
  
  doc.save(`${filename}.pdf`);
}

export function exportMetricsToExcel(
  metrics: DashboardMetrics,
  _title: string,
  filename: string
) {
  const wb = XLSX.utils.book_new();
  
  // Create summary sheet
  const summaryData: any[] = [];
  
  Object.entries(metrics).forEach(([category, categoryMetrics]) => {
    summaryData.push([category.toUpperCase(), '', '', '', '']);
    summaryData.push(['Metric', 'Current Value', 'Previous Value', 'Change %', 'Target']);
    
    Object.values(categoryMetrics).forEach((metric: any) => {
      summaryData.push([
        metric.label,
        formatMetricValue(metric),
        metric.previousValue ? formatMetricValue({ ...metric, value: metric.previousValue }) : '-',
        metric.changePercentage ? `${metric.changePercentage}%` : '-',
        metric.target ? formatMetricValue({ ...metric, value: metric.target }) : '-',
      ]);
    });
    
    summaryData.push(['', '', '', '', '']); // Empty row between sections
  });
  
  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws, 'Summary');
  
  // Create individual sheets for each category
  Object.entries(metrics).forEach(([category, categoryMetrics]) => {
    const sheetData = [
      ['Metric', 'Current Value', 'Previous Value', 'Change %', 'Target', 'Trend'],
    ];
    
    Object.values(categoryMetrics).forEach((metric: any) => {
      sheetData.push([
        metric.label,
        formatMetricValue(metric),
        metric.previousValue ? formatMetricValue({ ...metric, value: metric.previousValue }) : '-',
        metric.changePercentage ? `${metric.changePercentage}%` : '-',
        metric.target ? formatMetricValue({ ...metric, value: metric.target }) : '-',
        metric.trend || '-',
      ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, category.charAt(0).toUpperCase() + category.slice(1));
  });
  
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function formatMetricValue(metric: { value: number | string; unit?: string }): string {
  if (typeof metric.value === 'string') return metric.value;
  
  if (metric.unit === '$') {
    return `$${metric.value.toLocaleString()}`;
  }
  if (metric.unit === '%') {
    return `${metric.value}%`;
  }
  if (metric.unit) {
    return `${metric.value} ${metric.unit}`;
  }
  
  return metric.value.toLocaleString();
}