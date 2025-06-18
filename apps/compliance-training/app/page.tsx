'use client'

import { useStaffAuth } from '@ganger/auth';
import { Button, Card, StaffLoginRedirect } from '@ganger/ui';

// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function ComplianceTrainingPage() {
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
    return <StaffLoginRedirect appName="compliance-training" />;
  }
  
  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compliance Training Management</h1>
          <p className="mt-2 text-gray-600">
            Track training progress, certifications, and compliance requirements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Training Matrix</h3>
              <p className="text-gray-600 mb-4">
                View comprehensive training requirements and completion status
              </p>
              <Button>View Matrix</Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Certification Tracking</h3>
              <p className="text-gray-600 mb-4">
                Monitor expiring certifications and renewal requirements
              </p>
              <Button>Track Certifications</Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance Analytics</h3>
              <p className="text-gray-600 mb-4">
                Generate reports and analyze training completion rates
              </p>
              <Button>View Analytics</Button>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <span className="font-medium text-gray-900">HIPAA Annual Training</span>
                    <span className="text-gray-600 ml-2">- All Staff</span>
                  </div>
                  <span className="text-sm text-red-600 font-medium">Due in 5 days</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <span className="font-medium text-gray-900">Fire Safety Training</span>
                    <span className="text-gray-600 ml-2">- Clinical Staff</span>
                  </div>
                  <span className="text-sm text-yellow-600 font-medium">Due in 2 weeks</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-medium text-gray-900">CPR Certification Renewal</span>
                    <span className="text-gray-600 ml-2">- Medical Staff</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Due in 1 month</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}