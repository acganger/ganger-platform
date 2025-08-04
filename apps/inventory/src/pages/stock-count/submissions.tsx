export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useStaffAuth, AuthGuard } from '@ganger/auth/staff';
import { 
  AppLayout, 
  PageHeader, 
  Button,
  LoadingSpinner,
  toast 
} from '@ganger/ui';
import { Badge, Select, SelectItem } from '@ganger/ui-catalyst';
import { analytics } from '@ganger/utils';

interface StockCountSubmission {
  id: string;
  item_id: string;
  item_name: string;
  item_sku?: string;
  counted_quantity: number;
  variance: number;
  counted_at: string;
  is_variance_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  session_name?: string;
}

function MySubmissionsPage() {
  const { user, profile } = useStaffAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<StockCountSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadSubmissions();
  }, [user, filterPeriod]);

  const loadSubmissions = async () => {
    if (!user?.email) return;

    try {
      const response = await fetch(`/api/stock-count/my-submissions?user=${encodeURIComponent(user.email)}&period=${filterPeriod}`);
      
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        toast.error('Failed to load submissions');
      }

      analytics.track('my_submissions_loaded', 'navigation', {
        submission_count: submissions.length,
        filter_period: filterPeriod
      });

    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load submission data');
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeText = () => {
    switch (filterPeriod) {
      case 'today':
        return "Today's Submissions";
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'all':
        return 'All Time';
      default:
        return 'Submissions';
    }
  };

  const groupSubmissionsByDate = () => {
    const grouped: Record<string, StockCountSubmission[]> = {};
    
    submissions.forEach(submission => {
      const date = new Date(submission.counted_at).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(submission);
    });

    return grouped;
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader 
          title="My Submissions"
          subtitle="View your stock count history"
        />
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  const groupedSubmissions = groupSubmissionsByDate();
  const totalCounted = submissions.length;
  const pendingApprovals = submissions.filter(s => s.variance !== 0 && !s.is_variance_approved).length;
  const totalVariance = submissions.reduce((sum, s) => sum + Math.abs(s.variance), 0);

  return (
    <AppLayout>
      <PageHeader 
        title="My Submissions"
        subtitle="View your stock count history"
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/stock-count')}
            >
              Back to Dashboard
            </Button>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => router.push('/stock-count/scan')}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              New Count
            </Button>
          </div>
        }
      />

      <div className="px-4 lg:px-0">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Items Counted</p>
            <p className="text-2xl font-bold text-gray-900">{totalCounted}</p>
            <p className="text-sm text-gray-500 mt-1">{getDateRangeText()}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Pending Approvals</p>
            <p className="text-2xl font-bold text-orange-600">{pendingApprovals}</p>
            <p className="text-sm text-gray-500 mt-1">Variances to review</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Variance</p>
            <p className="text-2xl font-bold text-blue-600">{totalVariance}</p>
            <p className="text-sm text-gray-500 mt-1">Absolute units</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Time Period:</label>
            <Select
              value={filterPeriod}
              onValueChange={(value) => setFilterPeriod(value as any)}
              className="w-40"
            >
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </Select>
          </div>
        </div>

        {/* Submissions List */}
        {Object.keys(groupedSubmissions).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedSubmissions)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dateSubmissions]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{date}</h3>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {dateSubmissions.map((submission) => (
                        <div key={submission.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{submission.item_name}</p>
                              {submission.item_sku && (
                                <p className="text-sm text-gray-500">SKU: {submission.item_sku}</p>
                              )}
                              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                                <span>Count: <span className="font-medium">{submission.counted_quantity}</span></span>
                                {submission.variance !== 0 && (
                                  <>
                                    <span>•</span>
                                    <span className={submission.variance > 0 ? 'text-green-600' : 'text-red-600'}>
                                      Variance: {submission.variance > 0 ? '+' : ''}{submission.variance}
                                    </span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{new Date(submission.counted_at).toLocaleTimeString()}</span>
                              </div>
                              {submission.notes && (
                                <p className="text-sm text-gray-500 mt-1">Note: {submission.notes}</p>
                              )}
                              {submission.session_name && (
                                <p className="text-sm text-gray-500 mt-1">Session: {submission.session_name}</p>
                              )}
                            </div>
                            <div className="ml-4">
                              {submission.variance === 0 ? (
                                <Badge color="green">Match</Badge>
                              ) : submission.is_variance_approved ? (
                                <Badge color="blue">Approved</Badge>
                              ) : (
                                <Badge color="orange">Pending</Badge>
                              )}
                            </div>
                          </div>
                          {submission.is_variance_approved && submission.approved_by && (
                            <div className="mt-2 text-xs text-gray-500">
                              Approved by {submission.approved_by} on {new Date(submission.approved_at!).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-600">No submissions found for {getDateRangeText().toLowerCase()}</p>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => router.push('/stock-count/scan')}
              className="mt-4"
            >
              Start Counting
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedMySubmissionsPage() {
  return (
    <AuthGuard level="staff" appName="inventory">
      <MySubmissionsPage />
    </AuthGuard>
  );
}