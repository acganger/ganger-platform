'use client'

import { useState, useEffect } from 'react';
import { useAuth, withAuth } from '@ganger/auth';
import { 
  AppLayout, 
  PageHeader, 
  Card, 
  Button, 
  DataTable,
  StatCard,
  Chart,
  LoadingSpinner,
  Select,
} from '@ganger/ui';
// Temporary local implementations until @ganger/utils is available
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
import type { ExecutiveMetrics, LocationMetrics, CampaignPerformance } from '../../types';

interface ManagerDashboardData {
  executiveMetrics: ExecutiveMetrics;
  locationMetrics: LocationMetrics[];
  campaignPerformance: CampaignPerformance[];
  isLoading: boolean;
}

function ManagerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<ManagerDashboardData>({
    executiveMetrics: {} as ExecutiveMetrics,
    locationMetrics: [],
    campaignPerformance: [],
    isLoading: true
  });
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7d');

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates every 5 minutes for executive view
    const interval = setInterval(loadDashboardData, 300000);
    return () => clearInterval(interval);
  }, [selectedLocation, selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      const params = new URLSearchParams({
        location: selectedLocation,
        period: selectedPeriod
      });

      const [metricsRes] = await Promise.all([
        fetch(`/api/analytics/team-metrics?role=manager&include_analytics=true&${params}`)
      ]);

      const [metrics] = await Promise.all([
        metricsRes.json()
      ]);

      setData({
        executiveMetrics: metrics.data?.manager_analytics?.executive_summary || {},
        locationMetrics: metrics.data?.location_breakdown || [],
        campaignPerformance: metrics.data?.manager_analytics?.campaign_performance || [],
        isLoading: false
      });
    } catch (error) {
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const exportReport = async () => {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'executive_summary',
          location: selectedLocation,
          period: selectedPeriod
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `executive-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
    }
  };

  if (data.isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  const locationColumns = [
    {
      key: 'location_name',
      label: 'Location',
      sortable: true
    },
    {
      key: 'total_calls',
      label: 'Total Calls',
      sortable: true
    },
    {
      key: 'avg_quality_score',
      label: 'Quality Score',
      render: (row: LocationMetrics) => `${row.avg_quality_score}%`
    },
    {
      key: 'appointments_scheduled',
      label: 'Appointments',
      sortable: true
    },
    {
      key: 'revenue_attributed',
      label: 'Revenue',
      render: (row: LocationMetrics) => formatCurrency(row.revenue_attributed)
    },
    {
      key: 'utilization_rate',
      label: 'Utilization',
      render: (row: LocationMetrics) => (
        <div className="flex items-center">
          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
            <div 
              className={`h-2 rounded-full ${
                row.utilization_rate >= 90 ? 'bg-green-600' :
                row.utilization_rate >= 80 ? 'bg-blue-600' :
                row.utilization_rate >= 70 ? 'bg-yellow-600' : 'bg-red-600'
              }`}
              style={{ width: `${row.utilization_rate}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium">{row.utilization_rate}%</span>
        </div>
      )
    }
  ];

  const campaignColumns = [
    {
      key: 'campaign_name',
      label: 'Campaign',
      sortable: true
    },
    {
      key: 'calls_attempted',
      label: 'Calls Made',
      sortable: true
    },
    {
      key: 'conversion_rate',
      label: 'Conversion Rate',
      render: (row: CampaignPerformance) => `${row.conversion_rate}%`
    },
    {
      key: 'revenue_generated',
      label: 'Revenue',
      render: (row: CampaignPerformance) => formatCurrency(row.revenue_generated)
    },
    {
      key: 'roi',
      label: 'ROI',
      render: (row: CampaignPerformance) => (
        <span className={`font-medium ${
          row.roi > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {row.roi > 0 ? '+' : ''}{row.roi}%
        </span>
      )
    }
  ];

  return (
    <AppLayout>
      <PageHeader 
        title="Manager Dashboard" 
        subtitle="Executive performance summaries and strategic analytics"
      >
        <div className="flex space-x-3">
          <Select
            value={selectedLocation}
            onChange={setSelectedLocation}
            options={[
              { value: 'all', label: 'All Locations' },
              { value: 'ann_arbor', label: 'Ann Arbor' },
              { value: 'wixom', label: 'Wixom' },
              { value: 'plymouth', label: 'Plymouth' }
            ]}
          />
          <Select
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            options={[
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: '90d', label: 'Last 90 Days' },
              { value: '1y', label: 'Last Year' }
            ]}
          />
          <Button variant="outline" onClick={exportReport}>
            📊 Export Report
          </Button>
          <Button 
            variant="primary"
            onClick={() => window.location.href = '/management/campaigns'}
          >
            🎯 Manage Campaigns
          </Button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Executive KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <StatCard
            title="Total Calls"
            value={data.executiveMetrics.total_calls || 0}
            change={data.executiveMetrics.calls_change || 0}
            trend={data.executiveMetrics.calls_trend || 'neutral'}
            icon="phone"
          />
          <StatCard
            title="Revenue Impact"
            value={formatCurrency(data.executiveMetrics.revenue_attributed || 0)}
            change={data.executiveMetrics.revenue_change || 0}
            trend={data.executiveMetrics.revenue_trend || 'neutral'}
            icon="dollar-sign"
          />
          <StatCard
            title="Avg Quality Score"
            value={`${data.executiveMetrics.avg_quality_score || 0}%`}
            change={data.executiveMetrics.quality_change || 0}
            trend={data.executiveMetrics.quality_trend || 'neutral'}
            icon="star"
          />
          <StatCard
            title="Cost Per Call"
            value={formatCurrency(data.executiveMetrics.cost_per_call || 0)}
            change={data.executiveMetrics.cost_change || 0}
            trend={data.executiveMetrics.cost_trend === 'up' ? 'down' : 'up'} // Inverse for cost
            icon="trending-down"
          />
          <StatCard
            title="Customer Satisfaction"
            value={`${data.executiveMetrics.customer_satisfaction || 0}/5`}
            change={data.executiveMetrics.satisfaction_change || 0}
            trend={data.executiveMetrics.satisfaction_trend || 'neutral'}
            icon="heart"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Performance Trends</h3>
            <Chart
              type="line"
              data={{
                labels: data.executiveMetrics.trend_labels || [],
                datasets: [
                  {
                    label: 'Call Volume',
                    data: data.executiveMetrics.call_volume_trend || [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                  },
                  {
                    label: 'Quality Score',
                    data: data.executiveMetrics.quality_trend_data || [],
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                  }
                ]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const
                  }
                },
                scales: {
                  y: {
                    type: 'linear' as const,
                    display: true,
                    position: 'left' as const,
                    title: {
                      display: true,
                      text: 'Call Volume'
                    }
                  },
                  y1: {
                    type: 'linear' as const,
                    display: true,
                    position: 'right' as const,
                    title: {
                      display: true,
                      text: 'Quality Score (%)'
                    },
                    grid: {
                      drawOnChartArea: false,
                    }
                  }
                }
              }}
            />
          </Card>

          {/* Revenue Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Revenue Analysis</h3>
            <Chart
              type="bar"
              data={{
                labels: ['Ann Arbor', 'Wixom', 'Plymouth'],
                datasets: [
                  {
                    label: 'Revenue Attributed',
                    data: data.locationMetrics.map(loc => loc.revenue_attributed),
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(16, 185, 129, 0.8)',
                      'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                      'rgb(59, 130, 246)',
                      'rgb(16, 185, 129)',
                      'rgb(245, 158, 11)'
                    ],
                    borderWidth: 1
                  }
                ]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(value as number);
                      }
                    }
                  }
                }
              }}
            />
          </Card>
        </div>

        {/* Location Performance Comparison */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-neutral-900">Location Performance</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/performance/team'}
            >
              Detailed Analysis
            </Button>
          </div>
          <DataTable
            data={data.locationMetrics}
            columns={locationColumns}
            pagination={{ enabled: false }}
            searchable={false}
          />
        </Card>

        {/* Campaign Performance */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-neutral-900">Campaign Performance</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/management/campaigns'}
            >
              Manage Campaigns
            </Button>
          </div>
          <DataTable
            data={data.campaignPerformance}
            columns={campaignColumns}
            pagination={{ enabled: true, pageSize: 10 }}
            searchable={true}
          />
        </Card>

        {/* Key Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Key Insights</h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  <span className="text-sm font-medium text-green-900">
                    Quality scores improved 8% this month
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">📈</span>
                  <span className="text-sm font-medium text-blue-900">
                    Wixom location leading in appointment conversions
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center">
                  <span className="text-amber-600 mr-2">⚠️</span>
                  <span className="text-sm font-medium text-amber-900">
                    Plymouth wait times above target (4:12 avg)
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Action Items</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-3" />
                <div>
                  <div className="text-sm font-medium text-neutral-900">
                    Review Plymouth staffing levels
                  </div>
                  <div className="text-xs text-neutral-600">Due: End of week</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-3" />
                <div>
                  <div className="text-sm font-medium text-neutral-900">
                    Implement Wixom best practices across locations
                  </div>
                  <div className="text-xs text-neutral-600">Due: Next month</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-3" />
                <div>
                  <div className="text-sm font-medium text-neutral-900">
                    Schedule Q1 performance reviews
                  </div>
                  <div className="text-xs text-neutral-600">Due: Next quarter</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export default withAuth(ManagerDashboard, {
  requiredRoles: ['manager', 'superadmin']
});