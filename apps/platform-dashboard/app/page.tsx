'use client'

import { useStaffAuth } from '@ganger/auth';
import { Button, Card, StaffLoginRedirect } from '@ganger/ui';

export default function PlatformDashboardPage() {
  const { user, isAuthenticated, isLoading } = useStaffAuth();
  
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
    return <StaffLoginRedirect appName="platform-dashboard" />;
  }
  
  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor platform-wide metrics, performance, and system health
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">System Health</h3>
              <div className="text-3xl font-bold text-green-600">99.9%</div>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Users</h3>
              <div className="text-3xl font-bold text-blue-600">42</div>
              <p className="text-sm text-gray-600">Currently online</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API Requests</h3>
              <div className="text-3xl font-bold text-purple-600">1.2k</div>
              <p className="text-sm text-gray-600">Last hour</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Time</h3>
              <div className="text-3xl font-bold text-orange-600">125ms</div>
              <p className="text-sm text-gray-600">Average</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button className="w-full justify-start">Deploy Platform Updates</Button>
                <Button className="w-full justify-start">Generate System Report</Button>
                <Button className="w-full justify-start">Backup Database</Button>
                <Button className="w-full justify-start">Monitor Performance</Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Database backup completed</span>
                  <span className="text-sm text-gray-400">10 min ago</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Security scan finished</span>
                  <span className="text-sm text-gray-400">1 hour ago</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Platform update deployed</span>
                  <span className="text-sm text-gray-400">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Performance optimization run</span>
                  <span className="text-sm text-gray-400">4 hours ago</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}