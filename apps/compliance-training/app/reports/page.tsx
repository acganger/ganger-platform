'use client'

import { useStaffAuth } from '@ganger/auth';
import { Button, StaffLoginRedirect } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';

// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
export const dynamic = 'force-dynamic';

export default function ComplianceReportsPage() {
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
    return <StaffLoginRedirect appName="compliance-reports" />;
  }
  
  const timestamp = new Date().toISOString();
  const reportDate = new Date().toLocaleDateString();
  const randomScore = Math.floor(Math.random() * 10) + 90;
  
  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compliance Reports</h1>
          <p className="mt-2 text-gray-600">
            Generate and view compliance training reports
          </p>
          <p className="text-sm text-gray-500 mt-1">Report Generated: {timestamp}</p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button variant="primary">Generate New Report</Button>
          <Button variant="secondary">Schedule Reports</Button>
          <Button variant="secondary">Export Templates</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Overall Compliance Score</span>
                  <span className="text-2xl font-bold text-green-600">{randomScore}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Report Period</span>
                  <span className="text-sm font-medium">Q1 2025</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Staff</span>
                  <span className="text-sm font-medium">156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Compliant Staff</span>
                  <span className="text-sm font-medium text-green-600">142</span>
                </div>
              </div>
              <Button className="w-full mt-4">Download Summary</Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reports</h3>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full justify-start">
                  Monthly Compliance Overview
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  Department Breakdown
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  Expiring Certifications
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  Training Completion Rates
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Reports</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Weekly Summary</span>
                  <span className="text-gray-500">Every Monday</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Monthly Full Report</span>
                  <span className="text-gray-500">1st of month</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Quarterly Audit</span>
                  <span className="text-gray-500">End of quarter</span>
                </div>
              </div>
              <Button variant="secondary" className="w-full mt-4">Manage Schedules</Button>
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-gray-700">Report Name</th>
                    <th className="text-left py-2 font-medium text-gray-700">Type</th>
                    <th className="text-left py-2 font-medium text-gray-700">Generated</th>
                    <th className="text-left py-2 font-medium text-gray-700">Status</th>
                    <th className="text-left py-2 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3">Q1 2025 Compliance Summary</td>
                    <td className="py-3">Quarterly</td>
                    <td className="py-3">{reportDate}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Complete
                      </span>
                    </td>
                    <td className="py-3">
                      <Button size="sm" variant="secondary">Download</Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3">HIPAA Training Report</td>
                    <td className="py-3">Course</td>
                    <td className="py-3">3 days ago</td>
                    <td className="py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Complete
                      </span>
                    </td>
                    <td className="py-3">
                      <Button size="sm" variant="secondary">Download</Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3">December 2024 Monthly</td>
                    <td className="py-3">Monthly</td>
                    <td className="py-3">1 week ago</td>
                    <td className="py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Complete
                      </span>
                    </td>
                    <td className="py-3">
                      <Button size="sm" variant="secondary">Download</Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3">Staff Certification Audit</td>
                    <td className="py-3">Audit</td>
                    <td className="py-3">2 weeks ago</td>
                    <td className="py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Complete
                      </span>
                    </td>
                    <td className="py-3">
                      <Button size="sm" variant="secondary">Download</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}