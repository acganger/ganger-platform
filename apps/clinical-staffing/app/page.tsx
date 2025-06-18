'use client'

import { useStaffAuth } from '@ganger/auth';
import { Button, Card, StaffLoginRedirect } from '@ganger/ui';

// Cloudflare Workers Edge Runtime
export const runtime = 'edge';

export default function ClinicalStaffingPage() {
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <span className="font-medium text-gray-900">Dr. Ganger</span>
                    <span className="text-gray-600 ml-2">- Main Clinic</span>
                  </div>
                  <span className="text-sm text-gray-500">8:00 AM - 5:00 PM</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <span className="font-medium text-gray-900">NP Johnson</span>
                    <span className="text-gray-600 ml-2">- Dermatology Suite</span>
                  </div>
                  <span className="text-sm text-gray-500">9:00 AM - 4:00 PM</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-medium text-gray-900">PA Smith</span>
                    <span className="text-gray-600 ml-2">- Cosmetic Services</span>
                  </div>
                  <span className="text-sm text-gray-500">10:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}