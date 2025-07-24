'use client'

import React, { useState, useEffect } from 'react';
import { 
  LoadingSpinner, 
  Button
} from '@ganger/ui';
import { Select } from '@ganger/ui-catalyst';
import { Alert, Pagination } from '@/components/ui/placeholders';
import { RefreshCw, AlertCircle, TrendingUp, Grid, List, Search, Wand2 } from 'lucide-react';

import SocialPostCard from './SocialPostCard';
import SocialFilters from './SocialFilters';
import type { 
  SocialMediaPost, 
  FilterOptions, 
  SortOption 
} from '@/types';

interface SocialMonitoringPanelProps {
  className?: string;
}

export default function SocialMonitoringPanel({ className = '' }: SocialMonitoringPanelProps) {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions['social']>({});
  const [sortBy, setSortBy] = useState<'post_date' | 'engagement_rate' | 'relevance_score'>('post_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch social posts from API
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        
        // Add filters
        if (filters.platform) {
          filters.platform.forEach(p => params.append('platform', p));
        }
        if (filters.competitor) {
          filters.competitor.forEach(c => params.append('competitor', c));
        }
        if (filters.performance_level) {
          filters.performance_level.forEach(pl => params.append('performance_level', pl));
        }
        if (filters.date_range?.start) params.append('date_from', filters.date_range.start);
        if (filters.date_range?.end) params.append('date_to', filters.date_range.end);
        
        // Add sorting
        params.append('sort_by', sortBy);
        params.append('sort_order', sortOrder);
        
        // Add pagination
        params.append('page', currentPage.toString());
        params.append('page_size', '12');
        
        const response = await fetch(`/api/social/posts?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch social posts');
        }
        
        const data = await response.json();
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error('Error fetching social posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load social posts');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [filters, sortBy, sortOrder, currentPage]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const params = new URLSearchParams();
    
    // Add filters
    if (filters.platform) {
      filters.platform.forEach(p => params.append('platform', p));
    }
    if (filters.competitor) {
      filters.competitor.forEach(c => params.append('competitor', c));
    }
    if (filters.performance_level) {
      filters.performance_level.forEach(pl => params.append('performance_level', pl));
    }
    if (filters.date_range?.start) params.append('date_from', filters.date_range.start);
    if (filters.date_range?.end) params.append('date_to', filters.date_range.end);
    
    // Add sorting
    params.append('sort_by', sortBy);
    params.append('sort_order', sortOrder);
    
    // Add pagination
    params.append('page', currentPage.toString());
    params.append('page_size', '12');
    
    try {
      const response = await fetch(`/api/social/posts?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh social posts');
      }
      
      const data = await response.json();
      setPosts(data.posts || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error refreshing social posts:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFiltersChange = (newFilters: FilterOptions['social']) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleAdapt = (postId: string) => {
    // Handle content adaptation
    console.log('Adapting post:', postId);
  };

  const handleViewDetails = (postId: string) => {
    // Handle viewing post details
    console.log('Viewing details for post:', postId);
  };

  const sortOptions: SortOption<SocialMediaPost>[] = [
    { field: 'post_date', direction: 'desc', label: 'Newest First' },
    { field: 'post_date', direction: 'asc', label: 'Oldest First' },
    { field: 'engagement_rate', direction: 'desc', label: 'Highest Engagement' },
    { field: 'engagement_rate', direction: 'asc', label: 'Lowest Engagement' },
    { field: 'relevance_score', direction: 'desc', label: 'Most Relevant' },
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
            <h4 className="font-medium">Error loading social posts</h4>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Media Monitoring</h2>
          <p className="text-gray-600 mt-1">
            Track competitor activity and engagement across social platforms
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Select
            value={getSortLabel()}
            onChange={(e) => {
              const value = e.target.value;
              const option = sortOptions.find(opt => opt.label === value);
              if (option) {
                setSortBy(option.field as any);
                setSortOrder(option.direction);
              }
            }}
          >
            {sortOptions.map(opt => (
              <option key={opt.label} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </Select>
          
          <Button 
            onClick={handleRefresh}
            variant="secondary"
            size="sm"
            className="flex items-center space-x-2"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <SocialFilters 
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        totalResults={posts.length}
      />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No social posts found</p>
          <p className="text-gray-400 text-sm mt-1">
            Try adjusting your filters or check back later for new content
          </p>
        </div>
      ) : (
        <>
          {/* Posts Grid/List */}
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
          }>
            {posts.map((post) => (
              <SocialPostCard
                key={post.id}
                post={post}
                onAdapt={handleAdapt}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Quick Stats */}
      {posts.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                Performance Overview
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div>
                <span className="text-gray-500">High Performing:</span>{' '}
                <span className="font-medium text-green-600">
                  {posts.filter(p => p.performance_level === 'high').length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Avg Engagement:</span>{' '}
                <span className="font-medium">
                  {(posts.reduce((sum, p) => sum + p.engagement_rate, 0) / posts.length * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-gray-500">Total Posts:</span>{' '}
                <span className="font-medium">{posts.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}