'use client';

import { useState } from 'react';
import { cn } from '@ganger/utils';
import { ExportOptions } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExportButtonProps {
  data: any[];
  filename: string;
  title?: string;
  className?: string;
  onExport?: (options: ExportOptions) => void;
  formats?: ('pdf' | 'excel' | 'csv')[];
}

export function ExportButton({
  data,
  filename,
  title,
  className,
  onExport,
  formats = ['excel', 'pdf', 'csv'],
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    if (title) {
      doc.setFontSize(16);
      doc.text(title, 14, 15);
    }

    // Prepare table data
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map(row => headers.map(header => String(row[header] || '')));

      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: title ? 25 : 15,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    doc.save(`${filename}.pdf`);
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setIsExporting(true);
    
    try {
      const options: ExportOptions = {
        format,
        filename,
        title,
      };

      if (onExport) {
        await onExport(options);
      } else {
        switch (format) {
          case 'excel':
            exportToExcel();
            break;
          case 'csv':
            exportToCSV();
            break;
          case 'pdf':
            exportToPDF();
            break;
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={cn(
          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md',
          'bg-white border border-gray-300 text-gray-700',
          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {isOpen && !isExporting && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="py-1">
            {formats.includes('excel') && (
              <button
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
              >
                Export as Excel
              </button>
            )}
            {formats.includes('pdf') && (
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
              >
                Export as PDF
              </button>
            )}
            {formats.includes('csv') && (
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
              >
                Export as CSV
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}