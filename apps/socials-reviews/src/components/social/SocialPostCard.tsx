'use client'

import React, { useState, memo } from 'react';
import { 
  Card, 
  Badge, 
  Button, 
  Avatar
} from '@ganger/ui';
import { DropdownMenu, Tooltip } from '@/components/ui/placeholders';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  TrendingUp, 
  ExternalLink,
  Wand2,
  Eye,
  MoreVertical,
  Calendar,
  Hash,
  User,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import type { SocialMediaPost, SocialPostCardProps } from '@/types';

const SocialPostCard = memo(function SocialPostCard({
  post,
  onAdapt,
  onViewDetails,
  className = ''
}: SocialPostCardProps) {
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const getPlatformColor = (platform: SocialMediaPost['platform']) => {
    switch (platform) {
      case 'facebook':
        return 'blue';
      case 'instagram':
        return 'purple';
      case 'twitter':
        return 'sky';
      case 'linkedin':
        return 'blue';
      case 'tiktok':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getPlatformIcon = (platform: SocialMediaPost['platform']) => {
    // Note: In a real app, you'd use proper brand icons
    // For now, using generic icons as placeholders
    switch (platform) {
      case 'facebook':
      case 'instagram':
      case 'twitter':
      case 'linkedin':
      case 'tiktok':
      default:
        return User;
    }
  };

  const getPerformanceColor = (level: SocialMediaPost['performance_level']) => {
    switch (level) {
      case 'high':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatEngagementRate = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const shouldShowCaption = post.caption.length > 200;
  const displayCaption = shouldShowCaption && !isExpanded 
    ? `${post.caption.slice(0, 200)}...`
    : post.caption;

  const PlatformIcon = getPlatformIcon(post.platform);

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar
                fallback={post.account_handle.charAt(0).toUpperCase()}
                size="md"
                className="border-2 border-gray-200"
              />
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-${getPlatformColor(post.platform)}-500 flex items-center justify-center`}>
                <PlatformIcon className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900 truncate">
                  {post.account_name}
                </h4>
                {post.account_verified && (
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>@{post.account_handle}</span>
                <span>•</span>
                <span>{post.competitor_name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {post.is_high_performing && (
              <Tooltip content="High-performing post">
                <Badge variant="green" size="sm" className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>High Performance</span>
                </Badge>
              </Tooltip>
            )}
            
            <DropdownMenu
              trigger={
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
              items={[
                {
                  label: 'GD It! (Adapt Content)',
                  icon: Wand2,
                  onClick: () => onAdapt(post.id),
                },
                {
                  label: 'View Details',
                  icon: Eye,
                  onClick: () => onViewDetails(post.id),
                },
                {
                  label: 'Open Original Post',
                  icon: ExternalLink,
                  onClick: () => window.open(post.post_url, '_blank'),
                },
              ]}
            />
          </div>
        </div>

        {/* Post Metadata */}
        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(post.post_date), { addSuffix: true })}</span>
          </div>
          <Badge 
            variant={getPlatformColor(post.platform)} 
            size="sm"
            className="capitalize"
          >
            {post.platform}
          </Badge>
          <Badge variant={getPerformanceColor(post.performance_level)} size="sm">
            {post.performance_level} performance
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Caption */}
        {post.caption && (
          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {displayCaption}
            </p>
            {shouldShowCaption && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1 focus-ring"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Media Grid */}
        {post.media_urls.length > 0 && (
          <div className={`mb-4 ${
            post.media_urls.length === 1 
              ? 'grid grid-cols-1' 
              : post.media_urls.length === 2 
              ? 'grid grid-cols-2 gap-2'
              : 'grid grid-cols-2 gap-2'
          }`}>
            {post.media_urls.slice(0, 4).map((url, index) => {
              const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('video');
              
              if (imageLoadError[url]) {
                return (
                  <div 
                    key={index}
                    className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center text-gray-500"
                  >
                    <span className="text-sm">Media unavailable</span>
                  </div>
                );
              }

              return (
                <div 
                  key={index} 
                  className={`relative rounded-lg overflow-hidden bg-gray-100 ${
                    post.media_urls.length === 1 ? 'aspect-video' : 'aspect-square'
                  }`}
                >
                  {isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <div className="text-white text-center">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                          <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-b-2 border-t-transparent border-b-transparent ml-1"></div>
                        </div>
                        <span className="text-sm">Video Content</span>
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={url}
                      alt={`Post media ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={() => setImageLoadError(prev => ({ ...prev, [url]: true }))}
                    />
                  )}
                  
                  {post.media_urls.length > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-medium">
                        +{post.media_urls.length - 4} more
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {post.hashtags.slice(0, 5).map((hashtag, index) => (
                <Badge key={index} variant="gray" size="sm" className="text-xs">
                  <Hash className="h-2 w-2 mr-1" />
                  {hashtag.replace('#', '')}
                </Badge>
              ))}
              {post.hashtags.length > 5 && (
                <Badge variant="gray" size="sm" className="text-xs">
                  +{post.hashtags.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Content Topics */}
        {post.content_topics.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {post.content_topics.map((topic, index) => (
                <Badge key={index} variant="blue" size="sm" className="text-xs capitalize">
                  {topic.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Engagement Stats */}
      <div className="px-4 py-3 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>{formatCount(post.likes_count)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{formatCount(post.comments_count)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Share className="h-4 w-4" />
              <span>{formatCount(post.shares_count)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span>{formatEngagementRate(post.engagement_rate)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => onAdapt(post.id)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Wand2 className="h-4 w-4" />
              <span>GD It!</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(post.id)}
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Details</span>
            </Button>
          </div>
        </div>

        {/* Relevance Score */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>Relevance Score: {post.relevance_score}/100</span>
          <span>Discovered {formatDistanceToNow(new Date(post.discovered_at), { addSuffix: true })}</span>
        </div>
      </div>
    </Card>
  );
});

export default SocialPostCard;