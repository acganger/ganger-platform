'use client'

import React, { useState, useMemo } from 'react';
import { Button, Modal, Select } from '../ui/ComponentWrappers';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar, 
  Settings,
  CheckSquare,
  Eye,
  Share2,
  Mail
} from 'lucide-react';
import { ComplianceAPIClient } from '@/lib/api-client';
import { exportToCSV, formatComplianceStatus } from '@/utils/compliance-helpers';
import type { FilterOptions, Employee, TrainingModule, TrainingCompletion } from '@/types/compliance';

interface ExportControlsProps {
  filters: FilterOptions;
  data: {
    employees: Employee[];
    trainings: TrainingModule[];
    completions: TrainingCompletion[];
  };
  icon?: React.ReactNode;
}

interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  includeFilters: boolean;
  includeStats: boolean;
  selectedFields: string[];
  reportType: 'matrix' | 'summary' | 'detailed' | 'custom';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export function ExportControls({ filters, data, icon }: ExportControlsProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeFilters: true,
    includeStats: true,
    selectedFields: ['name', 'department', 'location', 'status'],
    reportType: 'matrix'
  });

  // Enhanced export statistics
  const exportStats = useMemo(() => {
    const overallRate = data.employees.length > 0 
      ? Math.round((data.completions.filter(c => c.status === 'completed').length / (data.employees.length * data.trainings.length)) * 100)
      : 0;
    
    return {
      totalEmployees: data.employees.length,
      totalTrainings: data.trainings.length,
      totalCompletions: data.completions.length,
      overallRate,
      overdueCount: data.completions.filter(c => c.status === 'overdue').length,
      dueSoonCount: data.completions.filter(c => c.status === 'due_soon').length,
      departmentBreakdown: Array.from(
        data.employees.reduce((acc, emp) => {
          if (!acc.has(emp.department)) {
            acc.set(emp.department, 0);
          }
          acc.set(emp.department, acc.get(emp.department)! + 1);
          return acc;
        }, new Map<string, number>())
      ).map(([dept, count]) => ({ department: dept, count }))
    };
  }, [data]);

  const generateAdvancedCSV = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    let csvContent = '';

    // Add header with metadata
    if (exportOptions.includeStats) {
      csvContent += `"Compliance Report Generated: ${new Date().toLocaleString()}"\n`;
      csvContent += `"Total Employees: ${exportStats.totalEmployees}"\n`;
      csvContent += `"Total Training Modules: ${exportStats.totalTrainings}"\n`;
      csvContent += `"Overall Compliance Rate: ${exportStats.overallRate}%"\n`;
      
      if (filters.department !== 'all') {
        csvContent += `"Department Filter: ${filters.department}"\n`;
      }
      if (filters.location !== 'all') {
        csvContent += `"Location Filter: ${filters.location}"\n`;
      }
      if (filters.status !== 'all') {
        csvContent += `"Status Filter: ${filters.status}"\n`;
      }
      csvContent += '\n'; // Empty line separator
    }

    switch (exportOptions.reportType) {
      case 'matrix':
        csvContent += generateMatrixCSV();
        break;
      case 'summary':
        csvContent += generateSummaryCSV();
        break;
      case 'detailed':
        csvContent += generateDetailedCSV();
        break;
      default:
        csvContent += generateMatrixCSV();
    }

    downloadCSV(csvContent, `compliance-${exportOptions.reportType}-${timestamp}.csv`);
  };

  const generateMatrixCSV = (): string => {
    const headers = ['Employee Name', 'Email', 'Department', 'Location', 'Role', ...data.trainings.map(t => t.name)];
    const rows = data.employees.map(employee => {
      const row = [
        employee.name,
        employee.email,
        employee.department,
        employee.location,
        employee.role
      ];
      
      data.trainings.forEach(training => {
        const completion = data.completions.find(
          c => c.employeeId === employee.id && c.trainingId === training.id
        );
        if (completion) {
          row.push(`${formatComplianceStatus(completion.status)} (${completion.completedAt.toLocaleDateString()})`);
        } else {
          row.push('Not Started');
        }
      });
      
      return row;
    });

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const generateSummaryCSV = (): string => {
    const headers = ['Department', 'Total Employees', 'Compliance Rate', 'Overdue Count', 'Due Soon Count'];
    
    const departmentStats = exportStats.departmentBreakdown.map(({ department, count }) => {
      const deptEmployees = data.employees.filter(e => e.department === department);
      const deptCompletions = data.completions.filter(c => 
        deptEmployees.some(e => e.id === c.employeeId)
      );
      
      const completedCount = deptCompletions.filter(c => c.status === 'completed').length;
      const overdueCount = deptCompletions.filter(c => c.status === 'overdue').length;
      const dueSoonCount = deptCompletions.filter(c => c.status === 'due_soon').length;
      const complianceRate = Math.round((completedCount / (count * data.trainings.length)) * 100);
      
      return [
        department,
        count.toString(),
        `${complianceRate}%`,
        overdueCount.toString(),
        dueSoonCount.toString()
      ];
    });

    return [headers, ...departmentStats]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const generateDetailedCSV = (): string => {
    const headers = [
      'Employee Name', 'Email', 'Department', 'Location', 'Role',
      'Training Module', 'Category', 'Status', 'Completion Date', 
      'Due Date', 'Score', 'Days Overdue'
    ];
    
    const rows: string[][] = [];
    
    data.employees.forEach(employee => {
      data.trainings.forEach(training => {
        const completion = data.completions.find(
          c => c.employeeId === employee.id && c.trainingId === training.id
        );
        
        const daysOverdue = completion && completion.status === 'overdue' 
          ? Math.floor((new Date().getTime() - completion.expiresAt.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        rows.push([
          employee.name,
          employee.email,
          employee.department,
          employee.location,
          employee.role,
          training.name,
          training.category,
          completion ? formatComplianceStatus(completion.status) : 'Not Started',
          completion ? completion.completedAt.toLocaleDateString() : '',
          completion ? completion.expiresAt.toLocaleDateString() : '',
          completion?.score ? `${completion.score}%` : '',
          daysOverdue > 0 ? daysOverdue.toString() : ''
        ]);
      });
    });

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const handleAPIExport = async () => {
    setExporting(true);
    
    try {
      // For Excel format, use client-side generation
      if (exportOptions.format === 'excel') {
        generateAdvancedCSV();
        return;
      }

      // Try API export for CSV and PDF
      const exportData = await ComplianceAPIClient.exportCompliance(
        exportOptions.format as 'csv' | 'pdf', 
        filters
      );
      
      const blob = new Blob([JSON.stringify(exportData.data)], { 
        type: exportOptions.format === 'csv' ? 'text/csv' : 'application/pdf' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportData.filename;
      link.click();
      
      window.URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (error) {
      // Fallback to client-side export
      generateAdvancedCSV();
    } finally {
      setExporting(false);
    }
  };

  const updateExportOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowExportModal(true)}
        leftIcon={<Download className="h-4 w-4" />}
      >
        Export Report
      </Button>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Compliance Report"
      >
        <div className="space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'matrix', label: 'Compliance Matrix', desc: 'Employee x Training grid view', icon: <CheckSquare className="h-4 w-4" /> },
                { id: 'summary', label: 'Department Summary', desc: 'High-level department statistics', icon: <Eye className="h-4 w-4" /> },
                { id: 'detailed', label: 'Detailed Report', desc: 'Complete training records', icon: <FileText className="h-4 w-4" /> },
                { id: 'custom', label: 'Custom Fields', desc: 'Choose specific data fields', icon: <Settings className="h-4 w-4" /> }
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => updateExportOption('reportType', type.id as any)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    exportOptions.reportType === type.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {type.icon}
                    <span className="font-medium text-sm">{type.label}</span>
                  </div>
                  <div className="text-xs text-gray-500">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <Select
              value={exportOptions.format}
              onChange={(value) => updateExportOption('format', value as any)}
              options={[
                { value: 'csv', label: 'CSV (Spreadsheet)' },
                { value: 'excel', label: 'Excel Workbook' },
                { value: 'pdf', label: 'PDF Report' }
              ]}
            />
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Export Options
            </label>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeStats}
                  onChange={(e) => updateExportOption('includeStats', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include summary statistics</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeFilters}
                  onChange={(e) => updateExportOption('includeFilters', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include applied filters in export</span>
              </label>
            </div>
          </div>

          {/* Export Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Eye className="h-4 w-4 text-gray-600" />
              <h4 className="font-medium text-gray-900">Export Preview</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Report Type:</span>
                  <span className="font-medium capitalize">{exportOptions.reportType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="font-medium uppercase">{exportOptions.format}</span>
                </div>
                <div className="flex justify-between">
                  <span>Employees:</span>
                  <span className="font-medium">{exportStats.totalEmployees}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Training Modules:</span>
                  <span className="font-medium">{exportStats.totalTrainings}</span>
                </div>
                <div className="flex justify-between">
                  <span>Compliance Rate:</span>
                  <span className="font-medium">{exportStats.overallRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Records:</span>
                  <span className="font-medium">{exportStats.totalCompletions}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Info */}
          {(filters.status !== 'all' || filters.department !== 'all' || filters.location !== 'all' || filters.searchTerm) && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Applied Filters</h4>
              </div>
              <div className="flex flex-wrap gap-1">
                {filters.status !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Status: {filters.status.replace('_', ' ')}
                  </span>
                )}
                {filters.department !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Dept: {filters.department}
                  </span>
                )}
                {filters.location !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Location: {filters.location}
                  </span>
                )}
                {filters.searchTerm && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Search: &quot;{filters.searchTerm}&quot;
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Export Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setShowExportModal(false)}
              disabled={exporting}
            >
              Cancel
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={generateAdvancedCSV}
                disabled={exporting}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Quick Export
              </Button>
              
              <Button
                variant="primary"
                onClick={handleAPIExport}
                disabled={exporting}
                leftIcon={exporting ? <Download className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              >
                {exporting ? 'Exporting...' : 'Export & Share'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}