export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useStaffAuth, AuthGuard } from '@ganger/auth/staff';
import { 
  AppLayout, 
  PageHeader, 
  Button,
  Card,
  LoadingSpinner 
} from '@ganger/ui';
import { Input, DataTable } from '@ganger/ui-catalyst';
import { analytics } from '@ganger/utils';

interface GeneratedHandout {
  id: string;
  patientName: string;
  patientMRN: string;
  templates: string[];
  generatedAt: string;
  generatedBy: string;
  deliveryMethods: string[];
  status: 'completed' | 'generating' | 'failed';
  emailStatus?: 'sent' | 'delivered' | 'failed';
  smsStatus?: 'sent' | 'delivered' | 'failed';
  downloadCount: number;
  lastDownloaded?: string;
}

function HistoryPage() {
  const { user, profile } = useStaffAuth();
  const [handouts, setHandouts] = useState<GeneratedHandout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Fetch real handout history from API
        const params = new URLSearchParams({ dateRange });
        const response = await fetch(`/api/handouts/history?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch handout history');
        }
        
        const { data } = await response.json();
        setHandouts(data || []);
        
        analytics.track('history_page_viewed', 'navigation', {
          user_role: profile?.role,
          date_range: dateRange
        });
      } catch (error) {
        console.error('Error loading handout history:', error);
        // Set empty array on error to avoid showing stale data
        setHandouts([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [profile, dateRange]);

  const filteredHandouts = handouts.filter(handout => {
    const searchLower = searchTerm.toLowerCase();
    return handout.patientName.toLowerCase().includes(searchLower) ||
           handout.patientMRN.toLowerCase().includes(searchLower) ||
           handout.templates.some(t => t.toLowerCase().includes(searchLower));
  });

  const columns = [
    { key: 'patientName', header: 'Patient', sortable: true },
    { key: 'patientMRN', header: 'MRN', sortable: true },
    { 
      key: 'templates', 
      header: 'Templates', 
      render: (item: GeneratedHandout) => (
        <div className="space-y-1">
          {item.templates.map((template, index) => (
            <div key={index} className="text-sm text-gray-600">
              {template}
            </div>
          ))}
        </div>
      )
    },
    { 
      key: 'generatedAt', 
      header: 'Generated', 
      sortable: true,
      render: (item: GeneratedHandout) => new Date(item.generatedAt).toLocaleDateString()
    },
    { key: 'generatedBy', header: 'Generated By', sortable: true },
    { 
      key: 'deliveryMethods', 
      header: 'Delivery', 
      render: (item: GeneratedHandout) => (
        <div className="flex gap-1">
          {item.deliveryMethods.map(method => (
            <span 
              key={method}
              className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
            >
              {method}
            </span>
          ))}
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (item: GeneratedHandout) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.status === 'completed' ? 'bg-green-100 text-green-800' :
          item.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {item.status}
        </span>
      )
    },
    { 
      key: 'downloadCount', 
      header: 'Downloads', 
      sortable: true,
      render: (item: GeneratedHandout) => (
        <span className="text-sm font-medium">{item.downloadCount}</span>
      )
    }
  ];

  const totalHandouts = handouts.length;
  const totalDownloads = handouts.reduce((sum, h) => sum + h.downloadCount, 0);
  const digitalDelivered = handouts.filter(h => 
    h.deliveryMethods.includes('email') || h.deliveryMethods.includes('sms')
  ).length;
  const digitalDeliveryRate = totalHandouts > 0 ? 
    Math.round((digitalDelivered / totalHandouts) * 100) : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Handout History"
        subtitle="View generated handouts and delivery status"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              Download Data
            </Button>
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-handouts-primary">
              {totalHandouts}
            </div>
            <div className="text-sm text-gray-600">Total Generated</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {digitalDeliveryRate}%
            </div>
            <div className="text-sm text-gray-600">Digital Delivery Rate</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalDownloads}
            </div>
            <div className="text-sm text-gray-600">Total Downloads</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {handouts.filter(h => h.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
        </Card>
      </div>

      {/* History Table */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Generated Handouts
          </h3>
          <div className="flex gap-4 items-center">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-handouts-primary focus:border-transparent"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Input
              placeholder="Search patients, MRN, templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80"
            />
          </div>
        </div>

        <DataTable
          data={filteredHandouts}
          columns={columns}
          onRowClick={(handout) => {
            analytics.track('handout_history_clicked', 'interaction', {
              handout_id: handout.id,
              patient_mrn: handout.patientMRN
            });
          }}
        />

        {filteredHandouts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 
              'No handouts found matching your search criteria.' :
              'No handouts generated in the selected time period.'
            }
          </div>
        )}
      </Card>
    </AppLayout>
  );
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedHistoryPage() {
  return (
    <AuthGuard level="staff" appName="handouts">
      <HistoryPage />
    </AuthGuard>
  );
}