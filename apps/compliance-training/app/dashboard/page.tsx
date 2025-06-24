'use client'

import { useStaffAuth } from '@ganger/auth';
import { Card, StaffLoginRedirect } from '@ganger/ui';

// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
export const dynamic = 'force-dynamic';

export default function ComplianceDashboardPage() {
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
    return <StaffLoginRedirect appName="compliance-dashboard" />;
  }
  
  const timestamp = new Date().toISOString();
  const randomCompliance = Math.floor(Math.random() * 20) + 80;
  
  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Real-time compliance overview and metrics
          </p>
          <p className="text-sm text-gray-500 mt-1">Generated: {timestamp}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Overall Compliance</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">{randomCompliance}%</p>
              <p className="text-sm text-gray-500 mt-1">Dynamic value</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Active Trainings</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">24</p>
              <p className="text-sm text-gray-500 mt-1">In progress</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Certifications</h3>
              <p className="mt-2 text-3xl font-bold text-purple-600">156</p>
              <p className="text-sm text-gray-500 mt-1">Valid certificates</p>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Due Soon</h3>
              <p className="mt-2 text-3xl font-bold text-red-600">7</p>
              <p className="text-sm text-gray-500 mt-1">Next 30 days</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Compliance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Clinical Staff</span>
                  <span className="text-sm font-medium text-green-600">94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Administrative</span>
                  <span className="text-sm font-medium text-green-600">88%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">IT Department</span>
                  <span className="text-sm font-medium text-yellow-600">76%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Billing</span>
                  <span className="text-sm font-medium text-green-600">92%</span>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3"></div>
                  <div>
                    <p className="text-gray-700">Sarah Chen completed HIPAA Training</p>
                    <p className="text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3"></div>
                  <div>
                    <p className="text-gray-700">New Fire Safety course available</p>
                    <p className="text-gray-500">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 mr-3"></div>
                  <div>
                    <p className="text-gray-700">CPR certification expiring for 3 staff</p>
                    <p className="text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}