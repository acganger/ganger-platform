'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { 
  LoadingSpinner, 
  Button
} from '@ganger/ui';
import { Select } from '@ganger/ui-catalyst';
import { Alert, Pagination } from '@/components/ui/placeholders';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

import ReviewCard from './ReviewCard';
import ReviewFilters from './ReviewFilters';
import { useOptimizedData, useDebounce } from '@/hooks/usePerformanceOptimization';
import type { 
  GoogleBusinessReview, 
  FilterOptions, 
  SortOption 
} from '@/types';

interface ReviewManagementPanelProps {
  className?: string;
}

export default function ReviewManagementPanel({ className = '' }: ReviewManagementPanelProps) {
  const [allReviews, setAllReviews] = useState<GoogleBusinessReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions['reviews']>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'review_date' | 'rating' | 'urgency_level'>('review_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounced search to improve performance
  useDebounce(setSearchQuery, 300);

  // Optimized data processing
  const {
    items: reviews,
    totalPages,
    totalFilteredItems,
  } = useOptimizedData(allReviews, {
    searchQuery,
    searchFields: ['reviewer_name', 'review_text', 'key_topics'],
    filters,
    sortBy,
    sortOrder,
    pageSize: 10,
    currentPage,
  });

  // Mock data for development
  useEffect(() => {
    const loadMockReviews = () => {
      setLoading(true);
      
      // Simulate API delay
      setTimeout(() => {
        const mockReviews: GoogleBusinessReview[] = [
          {
            id: 'rev_001',
            google_review_id: 'gb_12345',
            business_location: 'ann_arbor',
            reviewer_name: 'Sarah Johnson',
            reviewer_photo_url: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
            rating: 5,
            review_text: 'Dr. Ganger and his team are absolutely amazing! I\'ve been struggling with acne for years, and after just a few months of treatment, my skin has never looked better. The staff is incredibly professional and caring. The new office is beautiful and modern. I would highly recommend Ganger Dermatology to anyone looking for excellent dermatological care.',
            review_date: '2025-01-10T14:30:00Z',
            sentiment_category: 'positive',
            urgency_level: 'low',
            response_status: 'pending',
            review_status: 'new',
            key_topics: ['acne treatment', 'professional staff', 'office quality', 'recommendation'],
            ai_generated_response: 'Thank you so much for your wonderful review, Sarah! We\'re thrilled to hear about your positive experience with Dr. Ganger and our team. It\'s incredibly rewarding to know that our acne treatment has made such a significant difference for you. We appreciate your kind words about our staff and new facility. Reviews like yours motivate us to continue providing exceptional dermatological care. Thank you for recommending us!',
            created_at: '2025-01-10T14:30:00Z',
            updated_at: '2025-01-10T14:30:00Z',
          },
          {
            id: 'rev_002',
            google_review_id: 'gb_12346',
            business_location: 'plymouth',
            reviewer_name: 'Michael Chen',
            rating: 2,
            review_text: 'Had to wait over an hour past my appointment time. When I finally saw the doctor, the consultation felt rushed. I understand they\'re busy, but this level of delay is unacceptable. The receptionist didn\'t seem to care about the wait time either. For the amount I\'m paying, I expect better service.',
            review_date: '2025-01-09T16:45:00Z',
            sentiment_category: 'negative',
            urgency_level: 'high',
            response_status: 'pending',
            review_status: 'new',
            key_topics: ['wait time', 'rushed consultation', 'customer service', 'cost concerns'],
            staff_notes: 'Check with Plymouth office about scheduling issues on 1/9. May need to review appointment booking procedures.',
            created_at: '2025-01-09T16:45:00Z',
            updated_at: '2025-01-10T09:15:00Z',
            last_modified_by: 'admin@gangerdermatology.com',
          },
          {
            id: 'rev_003',
            google_review_id: 'gb_12347',
            business_location: 'wixom',
            reviewer_name: 'Jennifer Martinez',
            rating: 5,
            review_text: 'Excellent experience! Dr. Ganger removed a suspicious mole and was very thorough in explaining the procedure. Results came back clean, thankfully. The entire team made me feel comfortable during what was a stressful time for me.',
            review_date: '2025-01-08T11:20:00Z',
            response_text: 'Dear Jennifer, thank you for sharing your experience! We\'re so glad Dr. Ganger could help address your concerns and that your results came back clean. It\'s wonderful to hear that our team made you feel comfortable during a stressful time - that\'s exactly what we strive for. Your health and peace of mind are our top priorities. Thank you for trusting us with your care!',
            response_date: '2025-01-08T15:30:00Z',
            sentiment_category: 'positive',
            urgency_level: 'low',
            response_status: 'published',
            review_status: 'responded',
            key_topics: ['medical procedure', 'thorough explanation', 'comfortable experience', 'mole removal'],
            created_at: '2025-01-08T11:20:00Z',
            updated_at: '2025-01-08T15:30:00Z',
          },
          {
            id: 'rev_004',
            google_review_id: 'gb_12348',
            business_location: 'ann_arbor',
            reviewer_name: 'David Wilson',
            rating: 4,
            review_text: 'Good overall experience. The doctor was knowledgeable and the treatment plan seems comprehensive. Only complaint is that parking can be difficult during busy times.',
            review_date: '2025-01-07T13:15:00Z',
            sentiment_category: 'neutral',
            urgency_level: 'low',
            response_status: 'draft',
            review_status: 'in_progress',
            key_topics: ['knowledgeable doctor', 'comprehensive treatment', 'parking issues'],
            ai_generated_response: 'Thank you for your feedback, David! We\'re pleased to hear you had a good experience with Dr. Ganger and found the treatment plan comprehensive. We appreciate you bringing up the parking concerns - this is valuable feedback that helps us improve. We\'re looking into solutions to better accommodate our patients during peak times. Thank you for choosing Ganger Dermatology!',
            created_at: '2025-01-07T13:15:00Z',
            updated_at: '2025-01-07T16:45:00Z',
          },
          {
            id: 'rev_005',
            google_review_id: 'gb_12349',
            business_location: 'plymouth',
            reviewer_name: 'Lisa Thompson',
            rating: 1,
            review_text: 'Terrible experience with billing. They charged my insurance incorrectly and when I called to resolve it, I was put on hold for 45 minutes. The billing staff was rude and unhelpful. This is completely unacceptable for a medical practice.',
            review_date: '2025-01-06T10:30:00Z',
            sentiment_category: 'negative',
            urgency_level: 'critical',
            response_status: 'pending',
            review_status: 'new',
            key_topics: ['billing issues', 'insurance problems', 'customer service', 'wait time'],
            staff_notes: 'URGENT: Contact Lisa Thompson immediately to resolve billing issue. Review Plymouth billing procedures. Schedule training for billing staff on customer service.',
            created_at: '2025-01-06T10:30:00Z',
            updated_at: '2025-01-06T11:00:00Z',
            last_modified_by: 'billing@gangerdermatology.com',
          },
        ];

        setAllReviews(mockReviews);
        setLoading(false);
        setError(null);
      }, 1000);
    };

    loadMockReviews();
  }, [filters, sortBy, sortOrder, currentPage]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleRespond = (reviewId: string) => {
    void reviewId;
  };

  const handleUpdateStatus = useCallback((reviewId: string, status: GoogleBusinessReview['review_status']) => {
    setAllReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { ...review, review_status: status, updated_at: new Date().toISOString() }
        : review
    ));
  }, []);

  const handleGenerateResponse = useCallback((reviewId: string) => {
    void reviewId;
    
    // Simulate AI response generation
    setAllReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { 
            ...review, 
            response_status: 'draft' as const,
            ai_generated_response: 'Thank you for your feedback! We truly appreciate you taking the time to share your experience with Ganger Dermatology...',
            updated_at: new Date().toISOString()
          }
        : review
    ));
  }, []);

  const handleFiltersChange = (newFilters: FilterOptions['reviews']) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const sortOptions: SortOption<GoogleBusinessReview>[] = [
    { field: 'review_date', direction: 'desc', label: 'Newest First' },
    { field: 'review_date', direction: 'asc', label: 'Oldest First' },
    { field: 'rating', direction: 'asc', label: 'Lowest Rating' },
    { field: 'rating', direction: 'desc', label: 'Highest Rating' },
    { field: 'urgency_level', direction: 'desc', label: 'Most Urgent' },
  ];

  const getSortLabel = () => {
    const option = sortOptions.find(opt => 
      opt.field === sortBy && opt.direction === sortOrder
    );
    return option?.label || 'Date (Newest)';
  };

  if (error) {
    return (
      <div className={className}>
        <Alert variant="red" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Error loading reviews</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </Alert>
        <Button onClick={handleRefresh} className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review Management</h2>
          <p className="text-gray-600 mt-1">
            Monitor and respond to Google Business Reviews across all locations
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select
            value={getSortLabel()}
            onChange={(value) => {
              const option = sortOptions.find(opt => opt.label === value);
              if (option) {
                setSortBy(option.field as 'review_date' | 'rating' | 'urgency_level');
                setSortOrder(option.direction);
              }
            }}
            options={sortOptions.map(opt => ({
              value: opt.label,
              label: opt.label,
            }))}
            className="w-48"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ReviewFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        totalResults={totalFilteredItems}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Reviews List */}
      {!loading && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onRespond={handleRespond}
              onUpdateStatus={handleUpdateStatus}
              onGenerateResponse={handleGenerateResponse}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && reviews.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No reviews found
          </h3>
          <p className="text-gray-600">
            {Object.keys(filters || {}).length > 0
              ? 'Try adjusting your filters to see more reviews.'
              : 'All reviews have been processed. Great job!'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && reviews.length > 0 && totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showPageNumbers={true}
            className="mx-auto"
          />
        </div>
      )}
    </div>
  );
}
