'use client'

import React, { useMemo } from 'react';
import { Card } from '../ui/ComponentWrappers';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import type { Employee, TrainingModule, TrainingCompletion } from '@/types/compliance';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ComplianceChartsProps {
  employees: Employee[];
  trainings: TrainingModule[];
  completions: TrainingCompletion[];
}

export function ComplianceCharts({ employees, trainings, completions }: ComplianceChartsProps) {
  const chartData = useMemo(() => {
    // Department completion rates
    const departmentData = employees.reduce((acc, employee) => {
      if (!acc[employee.department]) {
        acc[employee.department] = { total: 0, completed: 0 };
      }
      acc[employee.department].total += trainings.length;
      acc[employee.department].completed += completions.filter(
        c => c.employeeId === employee.id && c.status === 'completed'
      ).length;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    const departments = Object.keys(departmentData);
    const departmentRates = departments.map(dept => 
      departmentData[dept].total > 0 
        ? Math.round((departmentData[dept].completed / departmentData[dept].total) * 100)
        : 0
    );

    // Training module completion rates
    const trainingData = trainings.map(training => {
      const trainingCompletions = completions.filter(
        c => c.trainingId === training.id && c.status === 'completed'
      ).length;
      return {
        name: training.name,
        completionRate: employees.length > 0 
          ? Math.round((trainingCompletions / employees.length) * 100)
          : 0
      };
    });

    // Status distribution
    const statusCounts = completions.reduce((acc, completion) => {
      acc[completion.status] = (acc[completion.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Mock trend data (would come from API in real implementation)
    const trendData = [
      { month: 'Jan', rate: 82 },
      { month: 'Feb', rate: 85 },
      { month: 'Mar', rate: 83 },
      { month: 'Apr', rate: 87 },
      { month: 'May', rate: 89 },
      { month: 'Jun', rate: 91 }
    ];

    return {
      departmentData: {
        labels: departments,
        datasets: [{
          label: 'Completion Rate (%)',
          data: departmentRates,
          backgroundColor: departmentRates.map(rate => 
            rate >= 90 ? '#10b981' : rate >= 75 ? '#f59e0b' : '#ef4444'
          ),
          borderColor: departmentRates.map(rate => 
            rate >= 90 ? '#059669' : rate >= 75 ? '#d97706' : '#dc2626'
          ),
          borderWidth: 1
        }]
      },
      trainingData: {
        labels: trainingData.map(t => t.name),
        datasets: [{
          label: 'Completion Rate (%)',
          data: trainingData.map(t => t.completionRate),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }]
      },
      statusData: {
        labels: ['Completed', 'Overdue', 'Due Soon', 'Not Started'],
        datasets: [{
          data: [
            statusCounts.completed || 0,
            statusCounts.overdue || 0,
            statusCounts.due_soon || 0,
            statusCounts.not_started || 0
          ],
          backgroundColor: [
            '#10b981', // completed - green
            '#ef4444', // overdue - red
            '#f59e0b', // due soon - yellow
            '#9ca3af'  // not started - gray
          ],
          borderWidth: 0
        }]
      },
      trendData: {
        labels: trendData.map(d => d.month),
        datasets: [{
          label: 'Overall Compliance Rate',
          data: trendData.map(d => d.rate),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      }
    };
  }, [employees, trainings, completions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Department Compliance Rates */}
      <Card className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Compliance by Department</h3>
        </div>
        <div className="h-64">
          <Bar data={chartData.departmentData} options={chartOptions} />
        </div>
      </Card>

      {/* Training Module Completion Rates */}
      <Card className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Training Module Completion</h3>
        </div>
        <div className="h-64">
          <Bar data={chartData.trainingData} options={chartOptions} />
        </div>
      </Card>

      {/* Status Distribution */}
      <Card className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Status Distribution</h3>
        </div>
        <div className="h-64">
          <Doughnut data={chartData.statusData} options={doughnutOptions} />
        </div>
      </Card>

      {/* Compliance Trend */}
      <Card className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">6-Month Compliance Trend</h3>
        </div>
        <div className="h-64">
          <Line data={chartData.trendData} options={chartOptions} />
        </div>
      </Card>
    </div>
  );
}