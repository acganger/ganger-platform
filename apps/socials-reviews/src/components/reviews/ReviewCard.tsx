'use client'

import React, { useState, memo } from 'react';
import { 
  Badge, 
  Button
} from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { Avatar } from '@ganger/ui-catalyst';
import { DropdownMenu, Tooltip } from '@/components/ui/placeholders';
import { 
  Star, 
  MessageSquare, 
  Clock, 
  MapPin, 
  MoreVertical,
  Bot,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Archive
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { GoogleBusinessReview, ReviewCardProps } from '@/types';

const ReviewCard = memo(function ReviewCard({
  review,
  onRespond,
  onUpdateStatus,
  onGenerateResponse,
  className = ''
}: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSentimentColor = (sentiment: GoogleBusinessReview['sentiment_category']) => {
    switch (sentiment) {
      case 'positive':
        return 'green';
      case 'neutral':
        return 'yellow';
      case 'negative':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getUrgencyColor = (urgency: GoogleBusinessReview['urgency_level']) => {
    switch (urgency) {
      case 'low':
        return 'blue';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'orange';
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status: GoogleBusinessReview['response_status']) => {
    switch (status) {
      case 'pending':
        return 'gray';
      case 'draft':
        return 'blue';
      case 'approved':
        return 'green';
      case 'published':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getLocationDisplayName = (location: GoogleBusinessReview['business_location']) => {
    switch (location) {
      case 'ann_arbor':
        return 'Ann Arbor';
      case 'plymouth':
        return 'Plymouth';
      case 'wixom':
        return 'Wixom';
      default:
        return location;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const shouldShowReviewText = review.review_text.length > 150;
  const displayText = shouldShowReviewText && !isExpanded 
    ? `${review.review_text.slice(0, 150)}...`
    : review.review_text;

  return (
    <Card className={`p-6 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Avatar
            src={review.reviewer_photo_url}
            alt={review.reviewer_name}
            fallback={review.reviewer_name.charAt(0)}
            size="md"
          />
          <div>
            <h4 className="font-medium text-gray-900">{review.reviewer_name}</h4>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>{getLocationDisplayName(review.business_location)}</span>
              <span>•</span>
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(review.review_date), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Urgency Badge */}
          {review.urgency_level !== 'low' && (
            <Tooltip content={`${review.urgency_level} urgency`}>
              <Badge variant={getUrgencyColor(review.urgency_level)} size="sm">
                {review.urgency_level === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {review.urgency_level.charAt(0).toUpperCase() + review.urgency_level.slice(1)}
              </Badge>
            </Tooltip>
          )}

          {/* Actions Menu */}
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
            items={[
              {
                label: 'Generate AI Response',
                icon: Bot,
                onClick: () => onGenerateResponse(review.id),
                disabled: review.response_status === 'published',
              },
              {
                label: 'Respond Manually',
                icon: Edit3,
                onClick: () => onRespond(review.id),
              },
              {
                label: 'Mark as Responded',
                icon: CheckCircle,
                onClick: () => onUpdateStatus(review.id, 'responded'),
                disabled: review.review_status === 'responded',
              },
              {
                label: 'Archive',
                icon: Archive,
                onClick: () => onUpdateStatus(review.id, 'archived'),
              },
            ]}
          />
        </div>
      </div>

      {/* Rating and Sentiment */}
      <div className="flex items-center space-x-4 mb-3">
        <div className="flex items-center space-x-1">
          {renderStars(review.rating)}
          <span className="text-sm font-medium text-gray-700 ml-2">
            {review.rating}/5
          </span>
        </div>
        <Badge variant={getSentimentColor(review.sentiment_category)} size="sm">
          {review.sentiment_category}
        </Badge>
        <Badge variant={getStatusColor(review.response_status)} size="sm">
          {review.response_status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">
          {displayText}
        </p>
        {shouldShowReviewText && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1 focus-ring"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Key Topics */}
      {review.key_topics.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {review.key_topics.map((topic, index) => (
              <Badge key={index} variant="gray" size="sm">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Existing Response */}
      {review.response_text && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Response</span>
            {review.response_date && (
              <span className="text-xs text-blue-600">
                {formatDistanceToNow(new Date(review.response_date), { addSuffix: true })}
              </span>
            )}
          </div>
          <p className="text-sm text-blue-800">{review.response_text}</p>
        </div>
      )}

      {/* AI Generated Response Preview */}
      {review.ai_generated_response && review.response_status === 'draft' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Bot className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">AI-Generated Response</span>
            <Badge variant="purple" size="sm">Draft</Badge>
          </div>
          <p className="text-sm text-purple-800">{review.ai_generated_response}</p>
        </div>
      )}

      {/* Staff Notes */}
      {review.staff_notes && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Edit3 className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Staff Notes</span>
          </div>
          <p className="text-sm text-gray-700">{review.staff_notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          {review.response_status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => onGenerateResponse(review.id)}
                className="flex items-center space-x-2"
              >
                <Bot className="h-4 w-4" />
                <span>Generate Response</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRespond(review.id)}
                className="flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Respond</span>
              </Button>
            </>
          )}
          
          {review.response_status === 'draft' && (
            <Button
              size="sm"
              onClick={() => onRespond(review.id)}
              className="flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit & Approve</span>
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500">
          {review.last_modified_by && (
            <span>Modified by {review.last_modified_by}</span>
          )}
        </div>
      </div>
    </Card>
  );
});

export default ReviewCard;