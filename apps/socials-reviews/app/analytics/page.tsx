'use client'

import { useStaffAuth } from '@ganger/auth/staff';
import { Button, StaffLoginRedirect } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { TrendingUp, TrendingDown, BarChart3, Star, Calendar } from 'lucide-react';

// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
export const dynamic = 'force-dynamic';

export default function SocialsAnalyticsPage() {
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
    return <StaffLoginRedirect appName="socials-analytics" />;
  }
  
  const timestamp = new Date().toISOString();
  const randomSentiment = Math.floor(Math.random() * 10) + 85;
  
  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Social Media Analytics</h1>
          <p className="mt-2 text-gray-600">
            Track performance metrics and sentiment analysis across platforms
          </p>
          <p className="text-sm text-gray-500 mt-1">Analytics Updated: {timestamp}</p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button variant="primary">Generate Report</Button>
          <Button variant="secondary">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="secondary">Export Data</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Overall Sentiment</h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">{randomSentiment}%</p>
                  <p className="text-sm text-gray-600 mt-1">Positive</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">+3.2%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">vs last month</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Review Volume</h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">234</p>
                  <p className="text-sm text-gray-600 mt-1">This month</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-red-600">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">-8.5%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">vs last month</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Engagement Rate</h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-600">78%</p>
                  <p className="text-sm text-gray-600 mt-1">Responses</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">+12%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">vs last month</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-12">5 ⭐</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div className="absolute inset-y-0 left-0 bg-green-500 rounded-full" style={{width: '72%'}}></div>
                  </div>
                  <span className="text-sm font-medium w-12">72%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-12">4 ⭐</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div className="absolute inset-y-0 left-0 bg-green-400 rounded-full" style={{width: '18%'}}></div>
                  </div>
                  <span className="text-sm font-medium w-12">18%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-12">3 ⭐</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div className="absolute inset-y-0 left-0 bg-yellow-400 rounded-full" style={{width: '6%'}}></div>
                  </div>
                  <span className="text-sm font-medium w-12">6%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-12">2 ⭐</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div className="absolute inset-y-0 left-0 bg-orange-400 rounded-full" style={{width: '3%'}}></div>
                  </div>
                  <span className="text-sm font-medium w-12">3%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-12">1 ⭐</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div className="absolute inset-y-0 left-0 bg-red-500 rounded-full" style={{width: '1%'}}></div>
                  </div>
                  <span className="text-sm font-medium w-12">1%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Keywords</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Professional</span>
                  <span className="text-sm font-medium text-gray-900">142 mentions</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Friendly staff</span>
                  <span className="text-sm font-medium text-gray-900">128 mentions</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Clean facility</span>
                  <span className="text-sm font-medium text-gray-900">97 mentions</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Great results</span>
                  <span className="text-sm font-medium text-gray-900">89 mentions</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Knowledgeable</span>
                  <span className="text-sm font-medium text-gray-900">76 mentions</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Wait time</span>
                  <span className="text-sm font-medium text-gray-900">23 mentions</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Interactive chart visualization coming soon</p>
                <p className="text-sm text-gray-500 mt-2">
                  Will display review volume, ratings, and sentiment over time
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}