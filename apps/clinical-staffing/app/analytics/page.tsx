'use client'

import { useStaffAuth } from '@ganger/auth';
import { Button, StaffLoginRedirect } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { ArrowLeft, TrendingUp, BarChart3, PieChart, Users, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading } = useStaffAuth();
  
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
          <h1 className="text-3xl font-bold text-gray-900">Coverage Analytics</h1>
          <p className="mt-2 text-gray-600">
            View staffing coverage reports and optimization insights
          </p>
          <p className="text-sm text-gray-500 mt-1">Report Generated: {new Date().toISOString()}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Staff Coverage
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      94%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Overtime Hours
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      12.5
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Efficiency Score
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      87%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Coverage Gaps
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      3
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts and Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Coverage Trends</h3>
                <Button 
                  type="button"
                  onClick={() => alert('Chart functionality coming soon!')}
                  size="sm" 
                  variant="outline"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Coverage trend chart will appear here</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Staff Distribution</h3>
                <Button 
                  type="button"
                  onClick={() => alert('Chart functionality coming soon!')}
                  size="sm" 
                  variant="outline"
                >
                  <PieChart className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Staff distribution chart will appear here</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Coverage Reports */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Reports</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Main Clinic Coverage</h4>
                  <p className="text-sm text-gray-600">98% coverage this week</p>
                </div>
                <span className="text-green-600 font-semibold">Excellent</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Dermatology Suite Coverage</h4>
                  <p className="text-sm text-gray-600">85% coverage this week</p>
                </div>
                <span className="text-yellow-600 font-semibold">Good</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Cosmetic Services Coverage</h4>
                  <p className="text-sm text-gray-600">72% coverage this week</p>
                </div>
                <span className="text-red-600 font-semibold">Needs Attention</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Items */}
        <Card className="mt-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Schedule Additional Coverage</h4>
                  <p className="text-sm text-gray-600">Cosmetic Services needs 2 additional MA hours on Fridays</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Optimize Shift Patterns</h4>
                  <p className="text-sm text-gray-600">Consider staggered lunch breaks to maintain coverage during peak hours</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}