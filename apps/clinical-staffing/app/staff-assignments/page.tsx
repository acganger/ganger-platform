'use client'

import { useStaffAuth } from '@ganger/auth';
import { Button, Card, StaffLoginRedirect } from '@ganger/ui';
import { ArrowLeft, Users, UserPlus, Clock, Award } from 'lucide-react';
import Link from 'next/link';

// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function StaffAssignmentsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Staff Assignments</h1>
          <p className="mt-2 text-gray-600">
            Assign clinical support staff to providers and shifts
          </p>
          <p className="text-sm text-gray-500 mt-1">Generated: {new Date().toISOString()}</p>
        </div>

        {/* Assignment Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6 text-center">
              <UserPlus className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Staff</h3>
              <Button 
                type="button"
                onClick={() => alert('Add Staff functionality coming soon!')}
                size="sm"
                className="w-full"
              >
                Add to Schedule
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6 text-center">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Teams</h3>
              <Button 
                type="button"
                onClick={() => alert('Team Management functionality coming soon!')}
                size="sm"
                className="w-full"
              >
                Edit Teams
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6 text-center">
              <Clock className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Time Off</h3>
              <Button 
                type="button"
                onClick={() => alert('Time Off Management functionality coming soon!')}
                size="sm"
                className="w-full"
              >
                Manage PTO
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6 text-center">
              <Award className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Credentials</h3>
              <Button 
                type="button"
                onClick={() => alert('Credential Management functionality coming soon!')}
                size="sm"
                className="w-full"
              >
                View Certs
              </Button>
            </div>
          </Card>
        </div>

        {/* Current Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Staff</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Sarah Johnson, RN</span>
                    <span className="text-gray-600 block text-sm">Available - Day Shift</span>
                  </div>
                  <Button 
                    type="button"
                    onClick={() => alert('Staff assignment functionality coming soon!')}
                    size="sm"
                  >
                    Assign
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Mike Rodriguez, MA</span>
                    <span className="text-gray-600 block text-sm">Available - Evening Shift</span>
                  </div>
                  <Button 
                    type="button"
                    onClick={() => alert('Staff assignment functionality coming soon!')}
                    size="sm"
                  >
                    Assign
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Emma Wilson, CNA</span>
                    <span className="text-gray-600 block text-sm">Available - Any Shift</span>
                  </div>
                  <Button 
                    type="button"
                    onClick={() => alert('Staff assignment functionality coming soon!')}
                    size="sm"
                  >
                    Assign
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Assignments</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Dr. Ganger</span>
                    <span className="text-gray-600 block text-sm">Main Clinic - 8:00 AM - 5:00 PM</span>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">Assigned</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">NP Johnson</span>
                    <span className="text-gray-600 block text-sm">Dermatology Suite - 9:00 AM - 4:00 PM</span>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">Assigned</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">PA Smith</span>
                    <span className="text-gray-600 block text-sm">Cosmetic Services - Needs Coverage</span>
                  </div>
                  <Button 
                    type="button"
                    onClick={() => alert('Coverage request functionality coming soon!')}
                    size="sm" 
                    variant="outline"
                  >
                    Find Coverage
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}