'use client'

import { useStaffAuth } from '@ganger/auth';
import { Button, StaffLoginRedirect } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { useOfflineSchedule } from '../src/hooks/useOfflineSchedule';
import { formatDate } from '@ganger/utils';

// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
export const dynamic = 'force-dynamic';

export default function ClinicalStaffingPage() {
  const { user, isAuthenticated, isLoading } = useStaffAuth();
  const today = new Date().toISOString().split('T')[0];
  const { 
    data: todaySchedule, 
    loading: scheduleLoading, 
    isOffline, 
    isFromCache 
  } = useOfflineSchedule({ date: today });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <StaffLoginRedirect appName="clinical-staffing" />;
  }
  
  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clinical Staffing Management</h1>
          <p className="mt-2 text-gray-600">
            Optimize provider scheduling and clinical support staffing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Builder</h3>
              <p className="text-gray-600 mb-4">
                Create and manage provider schedules with drag-and-drop functionality
              </p>
              <Button 
                type="button"
                onClick={() => window.location.href = '/schedule-builder'}
              >
                Build Schedule
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Staff Assignment</h3>
              <p className="text-gray-600 mb-4">
                Assign clinical support staff to providers and shifts
              </p>
              <Button 
                type="button"
                onClick={() => window.location.href = '/staff-assignments'}
              >
                Manage Assignments
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Coverage Analytics</h3>
              <p className="text-gray-600 mb-4">
                View staffing coverage reports and optimization insights
              </p>
              <Button 
                type="button"
                onClick={() => window.location.href = '/analytics'}
              >
                View Analytics
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
                {isFromCache && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    {isOffline ? 'Offline' : 'Cached'}
                  </span>
                )}
              </div>
              
              {scheduleLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center justify-between py-3 border-b">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : todaySchedule?.schedules?.length > 0 ? (
                <div className="space-y-3">
                  {todaySchedule.schedules.slice(0, 5).map((schedule: any, index: number) => (
                    <div key={schedule.id || index} className="flex items-center justify-between py-3 border-b">
                      <div>
                        <span className="font-medium text-gray-900">
                          {schedule.provider_name || 'Provider'}
                        </span>
                        <span className="text-gray-600 ml-2">
                          - {schedule.location || 'Main Clinic'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {schedule.start_time || '8:00 AM'} - {schedule.end_time || '5:00 PM'}
                      </span>
                    </div>
                  ))}
                  
                  {todaySchedule.schedules.length > 5 && (
                    <div className="text-center pt-2">
                      <Button 
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => window.location.href = '/schedule-builder'}
                      >
                        View All ({todaySchedule.schedules.length} total)
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No schedules found for today</p>
                  <Button 
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => window.location.href = '/schedule-builder'}
                  >
                    Create Schedule
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}