export const dynamic = 'force-dynamic';

import { AuthGuard } from '@ganger/auth/staff';
import { Button, Card } from '@ganger/ui';
import { useEffect, useState } from 'react';
import { Activity, Users, BarChart2, Shield, Calendar, Settings } from 'lucide-react';

function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading platform data
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthGuard level="staff">
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Ganger Platform Dashboard</h1>
            <p className="mt-2 text-gray-600">Monitor and manage all platform applications</p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Applications</p>
                        <p className="text-2xl font-semibold text-gray-900">17</p>
                      </div>
                      <Activity className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-semibold text-gray-900">142</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">API Calls Today</p>
                        <p className="text-2xl font-semibold text-gray-900">8,493</p>
                      </div>
                      <BarChart2 className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">System Health</p>
                        <p className="text-2xl font-semibold text-green-600">100%</p>
                      </div>
                      <Shield className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="mb-8">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => window.location.href = '/applications'}
                      className="justify-start"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      View All Applications
                    </Button>
                    <Button
                      onClick={() => window.location.href = '/analytics'}
                      className="justify-start"
                      variant="secondary"
                    >
                      <BarChart2 className="w-4 h-4 mr-2" />
                      Platform Analytics
                    </Button>
                    <Button
                      onClick={() => window.location.href = '/settings'}
                      className="justify-start"
                      variant="secondary"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      System Settings
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Application Status */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h2>
                  <div className="space-y-3">
                    {[
                      { name: 'Inventory Management', status: 'online', users: 12 },
                      { name: 'Patient Handouts', status: 'online', users: 8 },
                      { name: 'Check-in Kiosk', status: 'online', users: 3 },
                      { name: 'EOS L10', status: 'online', users: 24 },
                      { name: 'Clinical Staffing', status: 'online', users: 15 },
                    ].map((app) => (
                      <div key={app.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            app.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="font-medium text-gray-900">{app.name}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="w-4 h-4 mr-1" />
                          {app.users} active users
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

export default Dashboard;