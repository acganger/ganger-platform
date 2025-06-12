import { useState, useEffect } from 'react';
import { useAuth, withAuthComponent } from '@ganger/auth';
import { 
  AppLayout, 
  PageHeader, 
  StatCard,
  Card,
  LoadingSpinner 
} from '@ganger/ui';
import { analytics } from '@ganger/utils';

interface AnalyticsData {
  period: string;
  totalGenerated: number;
  digitalDeliveryRate: number;
  averageGenerationTime: number;
  topTemplates: Array<{
    name: string;
    usage: number;
    digitalRate: number;
  }>;
  deliveryStats: {
    print: number;
    email: number;
    sms: number;
    emailSuccessRate: number;
    smsSuccessRate: number;
  };
  patientEngagement: {
    downloadRate: number;
    averageTimeToDownload: number;
    repeatDownloads: number;
  };
  staffProductivity: Array<{
    name: string;
    handoutsGenerated: number;
    averageTime: number;
  }>;
}

function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        // Mock analytics data
        const mockData: AnalyticsData = {
          period: selectedPeriod,
          totalGenerated: 1247,
          digitalDeliveryRate: 68.5,
          averageGenerationTime: 2.3,
          topTemplates: [
            { name: 'Acne Treatment Plan', usage: 245, digitalRate: 72 },
            { name: 'Sun Protection Guidelines', usage: 189, digitalRate: 85 },
            { name: 'Eczema Treatment Regimen', usage: 156, digitalRate: 63 },
            { name: 'Patch Testing Instructions', usage: 98, digitalRate: 45 },
            { name: 'Rosacea Treatment Protocol', usage: 67, digitalRate: 71 }
          ],
          deliveryStats: {
            print: 854,
            email: 623,
            sms: 231,
            emailSuccessRate: 94.8,
            smsSuccessRate: 89.2
          },
          patientEngagement: {
            downloadRate: 76.3,
            averageTimeToDownload: 4.2,
            repeatDownloads: 23.1
          },
          staffProductivity: [
            { name: 'Jane Smith', handoutsGenerated: 142, averageTime: 1.8 },
            { name: 'Mike Wilson', handoutsGenerated: 128, averageTime: 2.1 },
            { name: 'Sarah Davis', handoutsGenerated: 119, averageTime: 2.0 },
            { name: 'Emily Johnson', handoutsGenerated: 98, averageTime: 2.4 },
            { name: 'David Brown', handoutsGenerated: 87, averageTime: 2.7 }
          ]
        };
        
        setData(mockData);
        
        analytics.track('analytics_page_viewed', 'navigation', {
          user_role: user?.role,
          period: selectedPeriod
        });
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user, selectedPeriod]);

  const canViewAnalytics = user?.role === 'manager' || user?.role === 'superadmin';

  if (!canViewAnalytics) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-600">
            Analytics are only available to managers and administrators.
          </p>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Data Available</h2>
          <p className="text-gray-600">
            Analytics data could not be loaded. Please try again later.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Handouts Analytics"
        subtitle="Performance insights and usage statistics"
        actions={
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-handouts-primary focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Handouts Generated"
          value={data.totalGenerated.toLocaleString()}
          icon="file-text"
          trend={{ value: 12, direction: 'up' }}
        />
        <StatCard
          title="Digital Delivery Rate"
          value={`${data.digitalDeliveryRate}%`}
          icon="send"
          trend={{ value: 8, direction: 'up' }}
          variant="success"
        />
        <StatCard
          title="Avg Generation Time"
          value={`${data.averageGenerationTime} min`}
          icon="clock"
          trend={{ value: 15, direction: 'down' }}
          variant="success"
        />
        <StatCard
          title="Patient Engagement"
          value={`${data.patientEngagement.downloadRate}%`}
          icon="users"
          trend={{ value: 5, direction: 'up' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Templates */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Most Used Templates</h3>
          <div className="space-y-4">
            {data.topTemplates.map((template, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-500">
                    {template.usage} generations • {template.digitalRate}% digital
                  </div>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2 ml-4">
                  <div 
                    className="bg-handouts-primary h-2 rounded-full"
                    style={{ width: `${(template.usage / data.topTemplates[0].usage) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Delivery Methods */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Delivery Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Print</span>
              <span className="font-medium">{data.deliveryStats.print.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Email</span>
              <div className="text-right">
                <div className="font-medium">{data.deliveryStats.email.toLocaleString()}</div>
                <div className="text-sm text-green-600">
                  {data.deliveryStats.emailSuccessRate}% success rate
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">SMS</span>
              <div className="text-right">
                <div className="font-medium">{data.deliveryStats.sms.toLocaleString()}</div>
                <div className="text-sm text-green-600">
                  {data.deliveryStats.smsSuccessRate}% success rate
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Engagement */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Patient Engagement</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Download Rate</span>
              <span className="font-medium text-green-600">
                {data.patientEngagement.downloadRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Avg Time to Download</span>
              <span className="font-medium">
                {data.patientEngagement.averageTimeToDownload} hours
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Repeat Downloads</span>
              <span className="font-medium">
                {data.patientEngagement.repeatDownloads}%
              </span>
            </div>
          </div>
        </Card>

        {/* Staff Productivity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Staff Productivity</h3>
          <div className="space-y-4">
            {data.staffProductivity.map((staff, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{staff.name}</div>
                  <div className="text-sm text-gray-500">
                    {staff.handoutsGenerated} handouts • {staff.averageTime} min avg
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-handouts-primary">
                    #{index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

export default withAuthComponent(AnalyticsPage, {
  requiredRoles: ['manager', 'superadmin'],
  redirectTo: '/auth/login'
});