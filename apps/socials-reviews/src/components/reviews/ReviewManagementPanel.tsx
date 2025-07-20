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

  // Fetch reviews from API
  useEffect(() => {
    fetchReviews();
  }, [filters, sortBy, sortOrder, currentPage]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      // Add filters
      if (filters.location) params.append('location', filters.location);
      if (filters.status) params.append('status', filters.status);
      if (filters.sentiment) params.append('sentiment', filters.sentiment);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      
      // Add sorting
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      
      // Add pagination
      params.append('page', currentPage.toString());
      params.append('page_size', '10');
      
      const response = await fetch(`/api/reviews?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await response.json();
      setAllReviews(data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
      // Set empty array on error to avoid showing stale/mock data
      setAllReviews([]);
    }
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, currentPage]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchReviews();
    setIsRefreshing(false);
  }, [fetchReviews]);

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
