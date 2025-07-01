'use client'

import { useStaffAuth } from '@ganger/auth/staff';
import { Button, Card, StaffLoginRedirect } from '@ganger/ui';
import { TrendingUp, MessageSquare, Star, AlertCircle } from 'lucide-react';

// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
export const dynamic = 'force-dynamic';

export default function SocialsDashboardPage() {
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
    return <StaffLoginRedirect appName="socials-dashboard" />;
  }
  
  const timestamp = new Date().toISOString();
  const randomReviews = Math.floor(Math.random() * 50) + 150;
  const randomRating = (Math.random() * 0.5 + 4.3).toFixed(1);
  
  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Social Media Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage reviews across all platforms
          </p>
          <p className="text-sm text-gray-500 mt-1">Last Updated: {timestamp}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Reviews</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{randomReviews}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <p className="mt-2 text-sm text-green-600">+12% from last month</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Average Rating</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{randomRating}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="mt-2 text-sm text-green-600">+0.2 from last quarter</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Response Rate</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">94%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <p className="mt-2 text-sm text-gray-600">Within 24 hours</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="mt-1 text-3xl font-bold text-red-600">7</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="mt-2 text-sm text-red-600">Needs response</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Google Reviews</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">4.8 ⭐</span>
                    <span className="text-sm text-gray-500">(487 reviews)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Facebook</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">4.7 ⭐</span>
                    <span className="text-sm text-gray-500">(234 reviews)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Yelp</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">4.5 ⭐</span>
                    <span className="text-sm text-gray-500">(156 reviews)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Healthgrades</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">4.9 ⭐</span>
                    <span className="text-sm text-gray-500">(89 reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">New 5-star review on Google</p>
                    <p className="text-xs text-gray-500">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">3-star review needs response</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Responded to Facebook review</p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Weekly report generated</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
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