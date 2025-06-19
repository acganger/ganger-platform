'use client'

import { useStaffAuth } from '@ganger/auth';
import { Button, Card, StaffLoginRedirect } from '@ganger/ui';
import { MessageSquare, Send, Clock, AlertCircle, CheckCircle } from 'lucide-react';

// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function SocialsRespondPage() {
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
    return <StaffLoginRedirect appName="socials-respond" />;
  }
  
  const timestamp = new Date().toISOString();
  const pendingCount = Math.floor(Math.random() * 10) + 5;
  
  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Review Response Center</h1>
          <p className="mt-2 text-gray-600">
            Manage and respond to patient reviews across all platforms
          </p>
          <p className="text-sm text-gray-500 mt-1">Queue Updated: {timestamp}</p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button variant="primary">
            <MessageSquare className="w-4 h-4 mr-2" />
            {pendingCount} Pending Responses
          </Button>
          <Button variant="secondary">Response Templates</Button>
          <Button variant="secondary">Filter Reviews</Button>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">Sarah Johnson</span>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      3 stars
                    </span>
                    <span className="text-sm text-gray-500">• Google Reviews</span>
                  </div>
                  <p className="text-gray-700 mb-2">
                    "The staff was friendly but the wait time was longer than expected. I waited almost 45 minutes past my appointment time."
                  </p>
                  <p className="text-sm text-gray-500">Posted 2 hours ago</p>
                </div>
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </div>
              
              <div className="mt-4">
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Type your response here..."
                  defaultValue="Thank you for your feedback, Sarah. We sincerely apologize for the extended wait time you experienced. We value your time and are actively working on improving our scheduling to prevent delays..."
                />
                <div className="mt-3 flex gap-2">
                  <Button variant="primary" size="sm">
                    <Send className="w-4 h-4 mr-2" />
                    Send Response
                  </Button>
                  <Button variant="secondary" size="sm">Save Draft</Button>
                  <Button variant="secondary" size="sm">Use Template</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">Michael Chen</span>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      5 stars
                    </span>
                    <span className="text-sm text-gray-500">• Facebook</span>
                  </div>
                  <p className="text-gray-700 mb-2">
                    "Dr. Ganger and his team are amazing! They took great care of my skin concerns and the results exceeded my expectations. Highly recommend!"
                  </p>
                  <p className="text-sm text-gray-500">Posted 5 hours ago</p>
                </div>
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              
              <div className="mt-4">
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Type your response here..."
                />
                <div className="mt-3 flex gap-2">
                  <Button variant="primary" size="sm">
                    <Send className="w-4 h-4 mr-2" />
                    Send Response
                  </Button>
                  <Button variant="secondary" size="sm">Use Template</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 bg-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">Emily Rodriguez</span>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      5 stars
                    </span>
                    <span className="text-sm text-gray-500">• Yelp</span>
                  </div>
                  <p className="text-gray-700 mb-2">
                    "Best dermatology practice in the area! The entire team is professional and caring. My acne has improved dramatically!"
                  </p>
                  <p className="text-sm text-gray-500">Posted yesterday</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Response sent 3 hours ago:</p>
                <p className="text-gray-700">
                  "Thank you so much for your kind words, Emily! We're thrilled to hear about your positive experience and the improvement in your skin. Your satisfaction is our top priority!"
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">2.5 hrs</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Responses Today</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">12</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">67</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Response Rate</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">94%</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}