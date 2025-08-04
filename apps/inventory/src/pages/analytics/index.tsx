export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useStaffAuth, AuthGuard } from '@ganger/auth/staff';
import {
  DashboardLayout,
  MetricsGrid,
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  TimeRangeOption,
  KPIMetric,
  useAccessControl,
  exportMetricsToPDF,
  exportMetricsToExcel,
} from '@ganger/analytics';
import { Card } from '@ganger/ui-catalyst';
import { toast } from '@ganger/ui';
import { useOffline } from '../../hooks/useOffline';

interface InventoryMetrics {
  overview: {
    totalItems: KPIMetric;
    totalValue: KPIMetric;
    lowStockItems: KPIMetric;
    outOfStockItems: KPIMetric;
  };
  usage: {
    dailyUsage: KPIMetric;
    weeklyUsage: KPIMetric;
    monthlyUsage: KPIMetric;
    wasteRate: KPIMetric;
  };
  ordering: {
    pendingOrders: KPIMetric;
    avgLeadTime: KPIMetric;
    orderAccuracy: KPIMetric;
    supplierPerformance: KPIMetric;
  };
  costs: {
    monthlySpend: KPIMetric;
    costPerPatient: KPIMetric;
    budgetUtilization: KPIMetric;
    savingsAchieved: KPIMetric;
  };
}

function InventoryAnalytics() {
  const { profile } = useStaffAuth();
  const { executeAction, isOnline } = useOffline();
  const { canExportData } = useAccessControl();
  
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('last30Days');
  const [selectedTimeRange, setSelectedTimeRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 30 Days',
  });
  
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [usageTrend, setUsageTrend] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [stockStatus, setStockStatus] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Generate mock data for now
      const mockMetrics: InventoryMetrics = {
        overview: {
          totalItems: {
            id: 'total_items',
            label: 'Total Items',
            value: 847,
            previousValue: 823,
            trend: 'up',
            changePercentage: 2.9,
            category: 'operational',
          },
          totalValue: {
            id: 'total_value',
            label: 'Inventory Value',
            value: 125420,
            previousValue: 118500,
            trend: 'up',
            changePercentage: 5.8,
            unit: '$',
            category: 'financial',
          },
          lowStockItems: {
            id: 'low_stock',
            label: 'Low Stock Items',
            value: 23,
            previousValue: 31,
            trend: 'down',
            changePercentage: -25.8,
            category: 'operational',
          },
          outOfStockItems: {
            id: 'out_of_stock',
            label: 'Out of Stock',
            value: 3,
            previousValue: 7,
            trend: 'down',
            changePercentage: -57.1,
            category: 'operational',
          },
        },
        usage: {
          dailyUsage: {
            id: 'daily_usage',
            label: 'Daily Usage',
            value: 342,
            previousValue: 315,
            trend: 'up',
            changePercentage: 8.6,
            unit: 'items',
            category: 'operational',
          },
          weeklyUsage: {
            id: 'weekly_usage',
            label: 'Weekly Usage',
            value: 2394,
            previousValue: 2205,
            trend: 'up',
            changePercentage: 8.6,
            unit: 'items',
            category: 'operational',
          },
          monthlyUsage: {
            id: 'monthly_usage',
            label: 'Monthly Usage',
            value: 10260,
            previousValue: 9450,
            trend: 'up',
            changePercentage: 8.6,
            unit: 'items',
            category: 'operational',
          },
          wasteRate: {
            id: 'waste_rate',
            label: 'Waste Rate',
            value: 2.3,
            previousValue: 3.1,
            trend: 'down',
            changePercentage: -25.8,
            unit: '%',
            category: 'operational',
          },
        },
        ordering: {
          pendingOrders: {
            id: 'pending_orders',
            label: 'Pending Orders',
            value: 5,
            previousValue: 8,
            trend: 'down',
            changePercentage: -37.5,
            category: 'operational',
          },
          avgLeadTime: {
            id: 'avg_lead_time',
            label: 'Avg Lead Time',
            value: 3.2,
            previousValue: 4.1,
            trend: 'down',
            changePercentage: -22.0,
            unit: 'days',
            category: 'operational',
          },
          orderAccuracy: {
            id: 'order_accuracy',
            label: 'Order Accuracy',
            value: 98.5,
            previousValue: 96.2,
            trend: 'up',
            changePercentage: 2.4,
            unit: '%',
            category: 'operational',
          },
          supplierPerformance: {
            id: 'supplier_performance',
            label: 'Supplier Performance',
            value: 94.8,
            previousValue: 92.1,
            trend: 'up',
            changePercentage: 2.9,
            unit: '%',
            category: 'operational',
          },
        },
        costs: {
          monthlySpend: {
            id: 'monthly_spend',
            label: 'Monthly Spend',
            value: 32450,
            previousValue: 35200,
            trend: 'down',
            changePercentage: -7.8,
            unit: '$',
            category: 'financial',
          },
          costPerPatient: {
            id: 'cost_per_patient',
            label: 'Cost per Patient',
            value: 8.42,
            previousValue: 9.15,
            trend: 'down',
            changePercentage: -8.0,
            unit: '$',
            category: 'financial',
          },
          budgetUtilization: {
            id: 'budget_utilization',
            label: 'Budget Utilization',
            value: 87.3,
            previousValue: 94.5,
            trend: 'down',
            changePercentage: -7.6,
            unit: '%',
            category: 'financial',
          },
          savingsAchieved: {
            id: 'savings_achieved',
            label: 'Savings Achieved',
            value: 4750,
            previousValue: 2100,
            trend: 'up',
            changePercentage: 126.2,
            unit: '$',
            category: 'financial',
          },
        },
      };

      // Generate trend data
      const days = 30;
      const trendData = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        return {
          date: date.toISOString().split('T')[0],
          usage: 300 + Math.floor(Math.random() * 100),
          cost: 1000 + Math.floor(Math.random() * 300),
          orders: 2 + Math.floor(Math.random() * 5),
        };
      });

      // Category breakdown
      const categories = [
        { name: 'Medical Supplies', value: 45, fill: '#3B82F6' },
        { name: 'Medications', value: 25, fill: '#10B981' },
        { name: 'Surgical Items', value: 15, fill: '#8B5CF6' },
        { name: 'Office Supplies', value: 10, fill: '#F59E0B' },
        { name: 'Other', value: 5, fill: '#EC4899' },
      ];

      // Stock status
      const stockStatusData = [
        { name: 'In Stock', value: 821 },
        { name: 'Low Stock', value: 23 },
        { name: 'Out of Stock', value: 3 },
      ];

      // Top items by usage
      const topItemsData = [
        { name: 'Nitrile Gloves', value: 1250, fill: '#3B82F6' },
        { name: 'Syringes', value: 980, fill: '#10B981' },
        { name: 'Gauze Pads', value: 875, fill: '#8B5CF6' },
        { name: 'Alcohol Wipes', value: 720, fill: '#F59E0B' },
        { name: 'Face Masks', value: 650, fill: '#EC4899' },
      ];

      setMetrics(mockMetrics);
      setUsageTrend(trendData);
      setCategoryBreakdown(categories);
      setStockStatus(stockStatusData);
      setTopItems(topItemsData);

      if (!isOnline) {
        toast.info('Showing cached analytics data');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeRangeChange = (range: TimeRangeOption, dates: typeof selectedTimeRange) => {
    setTimeRange(range);
    setSelectedTimeRange(dates);
  };

  const handleExportPDF = () => {
    if (!metrics || !canExportData) {
      toast.error('You do not have permission to export data');
      return;
    }
    exportMetricsToPDF(metrics as any, 'Inventory Analytics Report', 'inventory-analytics');
    toast.success('PDF exported successfully');
  };

  const handleExportExcel = () => {
    if (!metrics || !canExportData) {
      toast.error('You do not have permission to export data');
      return;
    }
    exportMetricsToExcel(metrics as any, 'Inventory Analytics Report', 'inventory-analytics');
    toast.success('Excel file exported successfully');
  };

  const handleMetricClick = (metric: KPIMetric) => {
    // Navigate to detailed view
    window.location.href = `/analytics/${metric.category}/${metric.id}`;
  };

  return (
    <>
      <DashboardLayout
        title="Inventory Analytics"
        subtitle="Track inventory performance, usage patterns, and cost optimization"
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={!metrics || isLoading}
            >
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={!metrics || isLoading}
            >
              Export Excel
            </button>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : metrics ? (
          <div className="space-y-8">
            {/* Overview Metrics */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Overview</h2>
              <MetricsGrid
                metrics={Object.values(metrics.overview)}
                onMetricClick={handleMetricClick}
              />
            </div>

            {/* Usage Metrics */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Patterns</h2>
              <MetricsGrid
                metrics={Object.values(metrics.usage)}
                onMetricClick={handleMetricClick}
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Usage Trend */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage & Cost Trend</h3>
                <AreaChart
                  data={usageTrend}
                  areas={[
                    { dataKey: 'usage', name: 'Items Used', color: '#3B82F6' },
                    { dataKey: 'cost', name: 'Daily Cost ($)', color: '#10B981' },
                  ]}
                  height={320}
                  stacked={false}
                />
              </Card>

              {/* Category Breakdown */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Category</h3>
                <PieChart
                  data={categoryBreakdown}
                  height={320}
                  innerRadius={60}
                />
              </Card>
            </div>

            {/* Ordering & Supply Chain */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ordering & Supply Chain</h2>
              <MetricsGrid
                metrics={Object.values(metrics.ordering)}
                onMetricClick={handleMetricClick}
              />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stock Status */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Status Distribution</h3>
                <BarChart
                  data={stockStatus}
                  height={320}
                  barColor="#3B82F6"
                />
              </Card>

              {/* Top Items */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Items by Usage</h3>
                <BarChart
                  data={topItems}
                  height={320}
                  orientation="horizontal"
                  useCustomColors={true}
                />
              </Card>
            </div>

            {/* Cost Analysis */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h2>
              <MetricsGrid
                metrics={Object.values(metrics.costs)}
                onMetricClick={handleMetricClick}
              />
            </div>

            {/* Optimization Insights */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Reorder Recommendations</h4>
                  <p className="text-sm text-blue-700">
                    23 items approaching reorder point. Review and create purchase orders.
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Cost Savings Opportunity</h4>
                  <p className="text-sm text-green-700">
                    Switch to bulk ordering for top 5 items could save $1,200/month.
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">Usage Optimization</h4>
                  <p className="text-sm text-purple-700">
                    Waste reduced by 25.8% this month. Continue monitoring expiration dates.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-8">
            <div className="text-center">
              <p className="text-gray-600">No analytics data available</p>
            </div>
          </Card>
        )}
      </DashboardLayout>
    </>
  );
}

export default function AuthenticatedInventoryAnalytics() {
  return (
    <AuthGuard level="staff" appName="inventory">
      <InventoryAnalytics />
    </AuthGuard>
  );
}