'use client'

import React, { memo } from 'react';
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
      Icon: MessageSquare,
      description: 'Reviews awaiting response',
    },
    {
      title: 'New Today',
      value: stats.reviews.new_today,
      Icon: Calendar,
      description: 'Reviews received today',
    },
    {
      title: 'Avg Rating',
      value: stats.reviews.avg_rating_this_month.toFixed(1),
      Icon: Star,
      description: 'This month average',
    },
    {
      title: 'Response Rate',
      value: `${Math.round(stats.reviews.response_rate * 100)}%`,
      Icon: CheckCircle,
      description: 'Reviews responded to',
    },
  ];

  const socialCards = [
    {
      title: 'High-Performing Posts',
      value: stats.social.high_performing_posts_discovered,
      Icon: TrendingUp,
      description: 'Posts discovered today',
    },
    {
      title: 'Content Adapted',
      value: stats.social.content_adapted_this_week,
      Icon: CheckCircle,
      description: 'This week',
    },
    {
      title: 'Monitored Accounts',
      value: stats.social.total_monitored_accounts,
      Icon: MessageSquare,
      description: 'Active monitoring',
    },
    {
      title: 'Avg Engagement',
      value: `${(stats.social.avg_engagement_rate * 100).toFixed(1)}%`,
      Icon: TrendingUp,
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
            <div key={card.title} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <card.Icon className="h-5 w-5 text-gray-400" />
                <span className="text-2xl font-bold text-gray-900">{card.value}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900">{card.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Social Media Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Social Media Monitoring</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {socialCards.map((card) => (
            <div key={card.title} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <card.Icon className="h-5 w-5 text-gray-400" />
                <span className="text-2xl font-bold text-gray-900">{card.value}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900">{card.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Review Sentiment Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.reviews.sentiment_breakdown.positive}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-900">Positive Reviews</h3>
            <p className="text-xs text-gray-500 mt-1">Happy customers</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.reviews.sentiment_breakdown.neutral}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-900">Neutral Reviews</h3>
            <p className="text-xs text-gray-500 mt-1">Mixed feedback</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.reviews.sentiment_breakdown.negative}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-900">Negative Reviews</h3>
            <p className="text-xs text-gray-500 mt-1">Need attention</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default DashboardStats;