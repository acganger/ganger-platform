export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useStaffAuth, AuthGuard } from '@ganger/auth/staff';
import { 
  AppLayout, 
  PageHeader, 
  Button,
  LoadingSpinner,
  toast 
} from '@ganger/ui';
import { Badge } from '@ganger/ui-catalyst';
import { analytics } from '@ganger/utils';
import { useBarcodeScan } from '../../hooks/useBarcodeScan';
import { StockCountSession, InventoryItem } from '../../types/inventory';
import Link from 'next/link';

interface ActiveSession {
  session: StockCountSession;
  itemsCounted: number;
  pendingSubmissions: number;
}

function StockCountDashboard() {
  const { user, profile } = useStaffAuth();
  const router = useRouter();
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [recentCounts, setRecentCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSupervisor, setIsSupervisor] = useState(false);

  useEffect(() => {
    // Check if user is supervisor based on role or permissions
    setIsSupervisor(profile?.role === 'admin' || profile?.role === 'supervisor');
    loadStockCountData();
  }, [profile]);

  const loadStockCountData = async () => {
    try {
      const [sessionsResponse, countsResponse] = await Promise.all([
        fetch('/api/stock-count/sessions?status=in_progress'),
        fetch('/api/stock-count/recent')
      ]);

      if (sessionsResponse.ok) {
        const sessions = await sessionsResponse.json();
        setActiveSessions(sessions);
      }

      if (countsResponse.ok) {
        const counts = await countsResponse.json();
        setRecentCounts(counts);
      }

      analytics.track('stock_count_dashboard_loaded', 'navigation', {
        user_role: profile?.role,
        active_sessions: activeSessions.length
      });

    } catch (error) {
      console.error('Error loading stock count data:', error);
      toast.error('Failed to load stock count data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCounting = () => {
    router.push('/stock-count/scan');
  };

  const handleCreateSession = () => {
    router.push('/stock-count/new-session');
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader 
          title="Stock Counting"
          subtitle="Scan items to update counts and submit reorder requests"
        />
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Stock Counting"
        subtitle="Scan items to update counts and submit reorder requests"
        actions={
          <div className="flex gap-2">
            {isSupervisor && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateSession}
              >
                New Count Session
              </Button>
            )}
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleStartCounting}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Start Scanning
            </Button>
          </div>
        }
      />

      {/* Mobile Optimized View */}
      <div className="px-4 lg:px-0">
        {/* Quick Actions for Mobile */}
        <div className="lg:hidden mb-6 grid grid-cols-2 gap-4">
          <Link href="/stock-count/scan">
            <a className="block p-6 bg-blue-50 rounded-lg text-center">
              <svg className="w-12 h-12 mx-auto mb-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="text-lg font-semibold text-blue-900">Scan Items</p>
              <p className="text-sm text-blue-700 mt-1">Count & reorder</p>
            </a>
          </Link>
          
          <Link href="/stock-count/submissions">
            <a className="block p-6 bg-green-50 rounded-lg text-center">
              <svg className="w-12 h-12 mx-auto mb-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-lg font-semibold text-green-900">My Submissions</p>
              <p className="text-sm text-green-700 mt-1">View pending</p>
            </a>
          </Link>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Count Sessions</h3>
            <div className="space-y-3">
              {activeSessions.map((activeSession) => (
                <div key={activeSession.session.id} 
                     className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{activeSession.session.session_name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Location: {activeSession.session.location_id}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-gray-600">
                          Items counted: <span className="font-medium text-gray-900">{activeSession.itemsCounted}</span>
                        </span>
                        <span className="text-gray-600">
                          Pending: <span className="font-medium text-orange-600">{activeSession.pendingSubmissions}</span>
                        </span>
                      </div>
                    </div>
                    <Link href={`/stock-count/session/${activeSession.session.id}`}>
                      <a className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Continue →
                      </a>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Count Activity */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentCounts.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {recentCounts.map((count) => (
                  <div key={count.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{count.item_name}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
                          <span>Count: {count.counted_quantity}</span>
                          {count.variance !== 0 && (
                            <Badge 
                              color={count.variance > 0 ? 'green' : 'red'}
                              className="text-xs"
                            >
                              {count.variance > 0 ? '+' : ''}{count.variance}
                            </Badge>
                          )}
                          <span>• {new Date(count.counted_at).toLocaleString()}</span>
                        </div>
                      </div>
                      {count.needs_reorder && (
                        <Badge color="orange" className="ml-2">
                          Reorder
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-600">No recent count activity</p>
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleStartCounting}
                className="mt-4"
              >
                Start First Count
              </Button>
            </div>
          )}
        </div>

        {/* Supervisor Actions */}
        {isSupervisor && (
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Supervisor Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/stock-count/balance">
                <a className="block p-4 bg-white rounded-lg text-center hover:shadow-sm transition-shadow">
                  <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  <p className="font-medium text-gray-900">Balance Counts</p>
                </a>
              </Link>
              
              <Link href="/stock-count/reports">
                <a className="block p-4 bg-white rounded-lg text-center hover:shadow-sm transition-shadow">
                  <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-medium text-gray-900">View Reports</p>
                </a>
              </Link>
              
              <Link href="/stock-count/variances">
                <a className="block p-4 bg-white rounded-lg text-center hover:shadow-sm transition-shadow">
                  <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium text-gray-900">Review Variances</p>
                </a>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Wrap with authentication guard for staff-level access
export default function AuthenticatedStockCountDashboard() {
  return (
    <AuthGuard level="staff" appName="inventory">
      <StockCountDashboard />
    </AuthGuard>
  );
}