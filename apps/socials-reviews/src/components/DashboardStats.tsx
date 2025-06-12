'use client'

import React, { memo } from 'react';
import { StatCard } from '@/components/ui/MockComponents';
import { Star, MessageSquare, TrendingUp, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import type { DashboardStats } from '@/types';

interface DashboardStatsProps {
  stats: DashboardStats | null;
  loading: boolean;
  className?: string;
}

const DashboardStats = memo(function DashboardStats({ stats, loading, className = '' }: DashboardStatsProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`flex items-center justify-center h-24 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Unable to load dashboard stats</p>
        </div>
      </div>
    );
  }

  const reviewCards = [
    {
      title: 'Pending Reviews',
      value: stats.reviews.total_pending,
      icon: MessageSquare,
      description: 'Reviews awaiting response',
    },
    {
      title: 'New Today',
      value: stats.reviews.new_today,
      icon: Calendar,
      description: 'Reviews received today',
    },
    {
      title: 'Avg Rating',
      value: stats.reviews.avg_rating_this_month.toFixed(1),
      icon: Star,
      description: 'This month average',
    },
    {
      title: 'Response Rate',
      value: `${Math.round(stats.reviews.response_rate * 100)}%`,
      icon: CheckCircle,
      description: 'Reviews responded to',
    },
  ];

  const socialCards = [
    {
      title: 'High-Performing Posts',
      value: stats.social.high_performing_posts_discovered,
      icon: TrendingUp,
      description: 'Posts discovered today',
    },
    {
      title: 'Content Adapted',
      value: stats.social.content_adapted_this_week,
      icon: CheckCircle,
      description: 'This week',
    },
    {
      title: 'Monitored Accounts',
      value: stats.social.total_monitored_accounts,
      icon: MessageSquare,
      description: 'Active monitoring',
    },
    {
      title: 'Avg Engagement',
      value: `${(stats.social.avg_engagement_rate * 100).toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Across all platforms',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Review Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Review Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviewCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              description={card.description}
            />
          ))}
        </div>
      </div>

      {/* Social Media Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Social Media Monitoring</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {socialCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              description={card.description}
            />
          ))}
        </div>
      </div>

      {/* Sentiment Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Review Sentiment Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Positive Reviews"
            value={stats.reviews.sentiment_breakdown.positive}
            description="Happy customers"
          />
          <StatCard
            title="Neutral Reviews"
            value={stats.reviews.sentiment_breakdown.neutral}
            description="Mixed feedback"
          />
          <StatCard
            title="Negative Reviews"
            value={stats.reviews.sentiment_breakdown.negative}
            description="Need attention"
          />
        </div>
      </div>
    </div>
  );
});

export default DashboardStats;