'use client'

import { useState, useEffect } from 'react';
import { useStaffAuth } from '@ganger/auth/staff';
import { Button, StaffLoginRedirect } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { SocialMonitoringPanel } from '@/components/social/SocialMonitoringPanel';
import { ReviewManagementPanel } from '@/components/reviews/ReviewManagementPanel';
import { ContentLibraryPanel } from '@/components/content/ContentLibraryPanel';
import { 
  Star, 
  MessageSquare, 
  Eye, 
  TrendingUp,
  Users,
  Heart,
  Share,
  AlertTriangle
} from 'lucide-react';

// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
export const dynamic = 'force-dynamic';

interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  socialMentions: number;
  engagementRate: number;
  newReviewsToday: number;
  pendingResponses: number;
}

export default function SocialsReviewsPage() {
  const { user, isAuthenticated, isLoading } = useStaffAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'social' | 'reviews' | 'content'>('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalReviews: 0,
    averageRating: 0,
    socialMentions: 0,
    engagementRate: 0,
    newReviewsToday: 0,
    pendingResponses: 0
  });
  
  useEffect(() => {
    // Fetch real data from API
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/socials/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Fallback to loading real data from database
        console.log('Loading stats from database...');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };
  
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
    return <StaffLoginRedirect appName="socials-reviews" />;
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Reviews</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalReviews}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Social Mentions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.socialMentions}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Engagement Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.engagementRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Items */}
      {stats.pendingResponses > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-orange-500 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Action Required</h3>
                <p className="text-gray-600">
                  You have {stats.pendingResponses} review{stats.pendingResponses > 1 ? 's' : ''} pending response
                </p>
              </div>
              <div className="ml-auto">
                <Button 
                  onClick={() => setActiveTab('reviews')}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Review Now
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
  
  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Social Media & Reviews</h1>
          <p className="mt-2 text-gray-600">
            Monitor online presence and manage patient feedback for Ganger Dermatology
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'social', name: 'Social Media' },
              { id: 'reviews', name: 'Reviews' },
              { id: 'content', name: 'Content Library' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'social' && <SocialMonitoringPanel />}
          {activeTab === 'reviews' && <ReviewManagementPanel />}
          {activeTab === 'content' && <ContentLibraryPanel />}
        </div>
      </div>
    </main>
  );
}