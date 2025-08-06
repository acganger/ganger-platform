export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { AuthGuard } from '@ganger/auth/staff';
import {
  DashboardLayout,
  MetricsGrid,
  LineChart,
  BarChart,
  PieChart,
  TimeRangeOption,
  useAnalytics,
  useAccessControl,
  useChartData,
  exportMetricsToPDF,
  exportMetricsToExcel,
} from '@ganger/analytics';
import { Card } from '@ganger/ui-catalyst';
import { toast } from '@ganger/ui';

function PlatformAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('last7Days');
  const [selectedTimeRange, setSelectedTimeRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 7 Days',
  });

  const { canViewAllMetrics, canExportData, canViewFinancialMetrics, canViewStaffMetrics } = useAccessControl();
  
  const { metrics, isLoading: metricsLoading, error: metricsError } = useAnalytics(selectedTimeRange, {
    mockData: true,
  });

  const { data: revenueData, isLoading: revenueLoading } = useChartData(selectedTimeRange, {
    type: 'line',
    dataSource: 'revenue',
    mockData: true,
  });

  const { data: departmentData, isLoading: departmentLoading } = useChartData(selectedTimeRange, {
    type: 'bar',
    dataSource: 'departments',
    mockData: true,
  });

  const { data: patientTypeData, isLoading: patientTypeLoading } = useChartData(selectedTimeRange, {
    type: 'pie',
    dataSource: 'patientTypes',
    mockData: true,
  });

  const handleTimeRangeChange = (range: TimeRangeOption, dates: typeof selectedTimeRange) => {
    setTimeRange(range);
    setSelectedTimeRange(dates);
  };

  const handleExportPDF = () => {
    if (!metrics || !canExportData) {
      toast.error('You do not have permission to export data');
      return;
    }
    exportMetricsToPDF(metrics, 'Ganger Platform Analytics', 'platform-analytics');
    toast.success('PDF exported successfully');
  };

  const handleExportExcel = () => {
    if (!metrics || !canExportData) {
      toast.error('You do not have permission to export data');
      return;
    }
    exportMetricsToExcel(metrics, 'Ganger Platform Analytics', 'platform-analytics');
    toast.success('Excel file exported successfully');
  };

  const handleMetricClick = (metric: any) => {
    // Navigate to detailed view
    window.location.href = `/analytics/${metric.category}/${metric.id}`;
  };

  if (!canViewAllMetrics) {
    return (
      <AuthGuard level="staff">
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <Card className="p-8 max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Access Restricted</h2>
            <p className="text-gray-600">
              You do not have permission to view platform analytics. 
              Only members of the managers organizational unit can access this data.
            </p>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard level="staff">
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardLayout
            title="Platform Analytics"
            subtitle="Real-time KPIs and performance metrics across all applications"
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
            exportData={metrics ? Object.values(metrics).flatMap(cat => Object.values(cat)) : undefined}
            exportFilename="platform-analytics"
            actions={
              <div className="flex gap-2">
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={!metrics || metricsLoading}
                >
                  Export PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={!metrics || metricsLoading}
                >
                  Export Excel
                </button>
              </div>
            }
          >
            {/* Loading State */}
            {metricsLoading && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {metricsError && (
              <Card className="p-8">
                <div className="text-center">
                  <p className="text-red-600 mb-4">Failed to load analytics data</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              </Card>
            )}

            {/* Metrics Dashboard */}
            {metrics && !metricsLoading && (
              <div className="space-y-8">
                {/* Financial Metrics */}
                {canViewFinancialMetrics && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Performance</h2>
                    <MetricsGrid
                      metrics={Object.values(metrics.financial)}
                      onMetricClick={handleMetricClick}
                    />
                  </div>
                )}

                {/* Operational Metrics */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Operational Metrics</h2>
                  <MetricsGrid
                    metrics={Object.values(metrics.operational)}
                    onMetricClick={handleMetricClick}
                  />
                </div>

                {/* Clinical Metrics */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinical Performance</h2>
                  <MetricsGrid
                    metrics={Object.values(metrics.clinical)}
                    onMetricClick={handleMetricClick}
                  />
                </div>

                {/* Staff Metrics */}
                {canViewStaffMetrics && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance</h2>
                    <MetricsGrid
                      metrics={Object.values(metrics.staff)}
                      onMetricClick={handleMetricClick}
                    />
                  </div>
                )}

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Trend */}
                  {canViewFinancialMetrics && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                      {revenueLoading ? (
                        <div className="h-80 bg-gray-100 rounded animate-pulse" />
                      ) : (
                        <LineChart
                          data={revenueData}
                          lines={[
                            { dataKey: 'revenue', name: 'Revenue', color: '#3B82F6' },
                            { dataKey: 'patients', name: 'Patients', color: '#10B981' },
                          ]}
                          height={320}
                        />
                      )}
                    </Card>
                  )}

                  {/* Department Performance */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
                    {departmentLoading ? (
                      <div className="h-80 bg-gray-100 rounded animate-pulse" />
                    ) : (
                      <BarChart
                        data={departmentData}
                        height={320}
                        useCustomColors={true}
                      />
                    )}
                  </Card>

                  {/* Patient Distribution */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Distribution</h3>
                    {patientTypeLoading ? (
                      <div className="h-80 bg-gray-100 rounded animate-pulse" />
                    ) : (
                      <PieChart
                        data={patientTypeData}
                        height={320}
                        innerRadius={60}
                      />
                    )}
                  </Card>

                  {/* Staff Utilization */}
                  {canViewStaffMetrics && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Utilization by Role</h3>
                      <BarChart
                        data={[
                          { name: 'Providers', value: 88, fill: '#3B82F6' },
                          { name: 'MAs', value: 82, fill: '#10B981' },
                          { name: 'RNs', value: 91, fill: '#8B5CF6' },
                          { name: 'Front Desk', value: 76, fill: '#F59E0B' },
                          { name: 'Billing', value: 85, fill: '#EC4899' },
                        ]}
                        height={320}
                        orientation="horizontal"
                        useCustomColors={true}
                      />
                    </Card>
                  )}
                </div>

                {/* System Health Overview */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-2">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">99.8%</p>
                      <p className="text-sm text-gray-600">Uptime</p>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-2">
                        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">245ms</p>
                      <p className="text-sm text-gray-600">Avg Response Time</p>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-2">
                        <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">17/17</p>
                      <p className="text-sm text-gray-600">Apps Online</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </DashboardLayout>
        </div>
      </div>
    </AuthGuard>
  );
}

export default PlatformAnalytics;