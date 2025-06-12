'use client'

import React, { useState, useEffect } from 'react';
import { 
  AppLayout, 
  PageHeader, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  LoadingSpinner,
  Button
} from '@/components/ui/MockComponents';
import { useAuth } from '@/lib/auth';
import { MessageSquare, TrendingUp, FolderOpen, Settings, RefreshCw } from 'lucide-react';

import DashboardStats from '@/components/DashboardStats';
import NotificationBanner from '@/components/NotificationBanner';
import ReviewManagementPanel from '@/components/reviews/ReviewManagementPanel';
import SocialMonitoringPanel from '@/components/social/SocialMonitoringPanel';
import ContentLibraryPanel from '@/components/content/ContentLibraryPanel';
import SkipLinks from '@/components/accessibility/SkipLinks';
import LiveRegion from '@/components/accessibility/LiveRegion';
import LoginForm from '@/components/auth/LoginForm';
import { useRealtimeSocials } from '@/hooks/useRealtimeSocials';
import { useTabNavigation, useScreenReaderAnnouncement } from '@/hooks/useKeyboardNavigation';
import type { 
  DashboardStats as DashboardStatsType
} from '@/types';

type TabValue = 'reviews' | 'social' | 'content' | 'settings';

interface SocialsReviewsDashboardProps {
  initialTab?: TabValue;
}

export default function SocialsReviewsDashboard({ 
  initialTab = 'reviews' 
}: SocialsReviewsDashboardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [announcement, setAnnouncement] = useState('');

  // Real-time data
  const {
    isConnected,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useRealtimeSocials();

  // Accessibility
  const { announce } = useScreenReaderAnnouncement();
  useTabNavigation(
    ['reviews', 'social', 'content', 'settings'],
    activeTab,
    (tab) => {
      setActiveTab(tab as TabValue);
      announce(`Switched to ${tab} tab`);
    },
    true
  );

  // Mock data for development
  useEffect(() => {
    const loadMockData = () => {
      setIsLoadingStats(true);
      
      // Simulate API delay
      setTimeout(() => {
        setStats({
          reviews: {
            total_pending: 12,
            new_today: 3,
            avg_rating_this_month: 4.7,
            response_rate: 0.89,
            sentiment_breakdown: {
              positive: 45,
              neutral: 8,
              negative: 4,
            },
          },
          social: {
            high_performing_posts_discovered: 7,
            content_adapted_this_week: 5,
            total_monitored_accounts: 24,
            avg_engagement_rate: 0.034,
          },
          content: {
            total_adapted_content: 156,
            published_this_month: 23,
            pending_approval: 3,
            compliance_review_needed: 1,
          },
        });

        // Note: Real-time notifications are now handled by useRealtimeSocials hook

        setIsLoadingStats(false);
        setLastRefresh(new Date());
        setAnnouncement('Dashboard data loaded successfully');
      }, 1200);
    };

    loadMockData();
  }, []);

  const handleDismissNotification = (notificationId: string) => {
    markNotificationRead(notificationId);
  };

  const handleMarkAllNotificationsRead = () => {
    markAllNotificationsRead();
  };

  const handleRefresh = () => {
    setIsLoadingStats(true);
    setAnnouncement('Refreshing dashboard data');
    // Simulate refresh
    setTimeout(() => {
      setIsLoadingStats(false);
      setLastRefresh(new Date());
      setAnnouncement('Dashboard data refreshed successfully');
    }, 800);
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <AppLayout>
      <SkipLinks />
      <LiveRegion message={announcement} />
      <div className="space-y-6" id="main-content">
        {/* Page Header */}
        <PageHeader
          title="Socials & Reviews"
          subtitle="Monitor Google Business Reviews and Social Media Performance"
          actions={
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-2 px-2 py-1 rounded-lg text-xs ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoadingStats}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <div className="text-xs text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          }
        />

        {/* Real-time Notifications */}
        <NotificationBanner
          notifications={notifications}
          onDismiss={handleDismissNotification}
          onMarkAllRead={handleMarkAllNotificationsRead}
        />

        {/* Dashboard Stats */}
        <DashboardStats 
          stats={stats} 
          loading={isLoadingStats} 
        />

        {/* Main Content Tabs */}
        <nav id="navigation" aria-label="Main dashboard navigation">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              setActiveTab(value as TabValue);
              setAnnouncement(`Navigated to ${value} section`);
            }}
          >
            <TabsList className="grid w-full grid-cols-4" role="tablist">
              <TabsTrigger 
                value="reviews" 
                className="flex items-center space-x-2"
                role="tab"
                aria-controls="reviews-panel"
                aria-label="Review Management - Monitor and respond to Google Business Reviews"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Reviews</span>
              </TabsTrigger>
              <TabsTrigger 
                value="social" 
                className="flex items-center space-x-2"
                role="tab"
                aria-controls="social-panel"
                aria-label="Social Media Monitoring - Discover and adapt high-performing content"
              >
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Social Media</span>
              </TabsTrigger>
              <TabsTrigger 
                value="content" 
                className="flex items-center space-x-2"
                role="tab"
                aria-controls="content-panel"
                aria-label="Content Library - Manage adapted social media content"
              >
                <FolderOpen className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Content Library</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center space-x-2"
                role="tab"
                aria-controls="settings-panel"
                aria-label="Settings - Configure platform preferences"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent 
              value="reviews" 
              className="mt-6"
              role="tabpanel"
              id="reviews-panel"
              aria-labelledby="reviews-tab"
            >
              <ReviewManagementPanel />
            </TabsContent>

            <TabsContent 
              value="social" 
              className="mt-6"
              role="tabpanel"
              id="social-panel"
              aria-labelledby="social-tab"
            >
              <SocialMonitoringPanel />
            </TabsContent>

            <TabsContent 
              value="content" 
              className="mt-6"
              role="tabpanel"
              id="content-panel"
              aria-labelledby="content-tab"
            >
              <ContentLibraryPanel />
            </TabsContent>

            <TabsContent 
              value="settings" 
              className="mt-6"
              role="tabpanel"
              id="settings-panel"
              aria-labelledby="settings-tab"
            >
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Settings & Configuration
                </h3>
                <div className="text-center py-12 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                  <p className="text-lg font-medium mb-2">Platform Settings</p>
                  <p className="text-sm">
                    Configure monitoring accounts, response templates,
                    and notification preferences.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </nav>
      </div>
    </AppLayout>
  );
}