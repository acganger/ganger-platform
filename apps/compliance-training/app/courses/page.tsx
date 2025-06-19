'use client'

import { useStaffAuth } from '@ganger/auth';
import { Button, Card, StaffLoginRedirect } from '@ganger/ui';

// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function ComplianceCoursesPage() {
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
    return <StaffLoginRedirect appName="compliance-courses" />;
  }
  
  const timestamp = new Date().toISOString();
  const randomEnrolled = Math.floor(Math.random() * 50) + 100;
  
  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compliance Courses</h1>
          <p className="mt-2 text-gray-600">
            Available training courses and certifications
          </p>
          <p className="text-sm text-gray-500 mt-1">Last Updated: {timestamp}</p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button variant="primary">Add New Course</Button>
          <Button variant="secondary">Import Courses</Button>
          <Button variant="secondary">Export Report</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">HIPAA Privacy & Security</h3>
                  <p className="text-sm text-gray-600 mt-1">Annual requirement for all staff</p>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Active
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Duration:</span> 45 minutes</p>
                <p><span className="font-medium">Enrolled:</span> {randomEnrolled} staff</p>
                <p><span className="font-medium">Completion Rate:</span> 87%</p>
                <p><span className="font-medium">Valid For:</span> 12 months</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">View Details</Button>
                <Button size="sm" variant="secondary">Manage</Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Fire Safety Training</h3>
                  <p className="text-sm text-gray-600 mt-1">Required for clinical staff</p>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Active
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Duration:</span> 30 minutes</p>
                <p><span className="font-medium">Enrolled:</span> 78 staff</p>
                <p><span className="font-medium">Completion Rate:</span> 92%</p>
                <p><span className="font-medium">Valid For:</span> 24 months</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">View Details</Button>
                <Button size="sm" variant="secondary">Manage</Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">CPR & First Aid</h3>
                  <p className="text-sm text-gray-600 mt-1">Medical staff certification</p>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  In-Person
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Duration:</span> 4 hours</p>
                <p><span className="font-medium">Enrolled:</span> 45 staff</p>
                <p><span className="font-medium">Completion Rate:</span> 100%</p>
                <p><span className="font-medium">Valid For:</span> 24 months</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">View Details</Button>
                <Button size="sm" variant="secondary">Schedule Session</Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Data Security Basics</h3>
                  <p className="text-sm text-gray-600 mt-1">IT and administrative staff</p>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  New
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Duration:</span> 60 minutes</p>
                <p><span className="font-medium">Enrolled:</span> 32 staff</p>
                <p><span className="font-medium">Completion Rate:</span> 65%</p>
                <p><span className="font-medium">Valid For:</span> 12 months</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">View Details</Button>
                <Button size="sm" variant="secondary">Manage</Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">24</p>
                </div>
                <div>
                  <p className="text-gray-600">Active Enrollments</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{randomEnrolled * 2}</p>
                </div>
                <div>
                  <p className="text-gray-600">Avg Completion</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">86%</p>
                </div>
                <div>
                  <p className="text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">12</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}