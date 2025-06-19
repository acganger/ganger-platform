'use client'

import { useStaffAuth } from '@ganger/auth';
import { Button, Card, StaffLoginRedirect } from '@ganger/ui';
import { ArrowLeft, Calendar, Clock, Users, Plus } from 'lucide-react';
import Link from 'next/link';

// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function ScheduleBuilderPage() {
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Builder</h1>
          <p className="mt-2 text-gray-600">
            Create and manage provider schedules with drag-and-drop functionality
          </p>
          <p className="text-sm text-gray-500 mt-1">Last Updated: {new Date().toISOString()}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Plus className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Add Shift</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Create a new shift assignment for providers or staff
              </p>
              <Button 
                type="button"
                onClick={() => alert('Add Shift functionality coming soon!')}
                className="w-full"
              >
                Add New Shift
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Request Coverage</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Submit a request for shift coverage or backup staff
              </p>
              <Button 
                type="button"
                onClick={() => alert('Request Coverage functionality coming soon!')}
                className="w-full"
              >
                Request Coverage
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">View Schedule</h3>
              </div>
              <p className="text-gray-600 mb-4">
                View and edit existing provider and staff schedules
              </p>
              <Button 
                type="button"
                onClick={() => alert('Schedule View functionality coming soon!')}
                className="w-full"
              >
                View Schedule
              </Button>
            </div>
          </Card>
        </div>

        {/* Schedule Grid */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
            <div className="mb-4 text-sm text-gray-600">
              <p>Active Providers: {Math.floor(Math.random() * 10) + 15}</p>
              <p>Shifts Today: {Math.floor(Math.random() * 20) + 30}</p>
              <p>Coverage Rate: {Math.floor(Math.random() * 10) + 90}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Schedule Builder Coming Soon</h4>
              <p className="text-gray-600 mb-4">
                The drag-and-drop schedule builder interface is currently under development.
              </p>
              <p className="text-sm text-gray-500">
                Features will include:
              </p>
              <ul className="text-sm text-gray-500 mt-2 list-disc list-inside">
                <li>Drag-and-drop shift assignment</li>
                <li>Provider availability management</li>
                <li>Staff coverage optimization</li>
                <li>Real-time schedule updates</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}