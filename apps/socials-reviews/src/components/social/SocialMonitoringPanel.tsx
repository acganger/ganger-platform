'use client'

import React, { useState, useEffect } from 'react';
import { 
  LoadingSpinner, 
  Button, 
  Select,
  Alert,
  Pagination
} from '@/components/ui/MockComponents';
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

  // Mock data for development
  useEffect(() => {
    const loadMockPosts = () => {
      setLoading(true);
      
      // Simulate API delay
      setTimeout(() => {
        const mockPosts: SocialMediaPost[] = [
          {
            id: 'post_001',
            platform: 'instagram',
            account_handle: 'detroitdermatology',
            account_name: 'Detroit Dermatology',
            account_verified: true,
            post_id: 'ig_12345',
            post_url: 'https://instagram.com/p/xyz123',
            caption: '✨ Transform your skin with our revolutionary acne treatment! 🌟\n\nJust look at these incredible before and after results from one of our amazing patients. Our dermatologists use the latest technology and proven methods to help you achieve clear, healthy skin.\n\n📞 Book your consultation today!\n\n#acnetreatment #clearskín #dermatology #skincare #beforeandafter #michigan #detroit',
            content_type: 'carousel',
            media_urls: [
              'https://picsum.photos/800/800?random=1',
              'https://picsum.photos/800/800?random=2',
              'https://picsum.photos/800/800?random=3'
            ],
            hashtags: ['#acnetreatment', '#clearskin', '#dermatology', '#skincare', '#beforeandafter', '#michigan', '#detroit'],
            mentions: [],
            post_date: '2025-01-10T15:30:00Z',
            likes_count: 2157,
            comments_count: 89,
            shares_count: 43,
            engagement_rate: 0.052,
            is_high_performing: true,
            performance_level: 'high',
            relevance_score: 95,
            content_topics: ['acne_treatment', 'before_after', 'patient_testimonials'],
            competitor_name: 'Detroit Dermatology',
            discovered_at: '2025-01-10T16:00:00Z',
            last_analyzed: '2025-01-10T16:00:00Z',
          },
          {
            id: 'post_002',
            platform: 'facebook',
            account_handle: 'michiganskincare',
            account_name: 'Michigan Skin Care Center',
            account_verified: false,
            post_id: 'fb_67890',
            post_url: 'https://facebook.com/posts/abc456',
            caption: '🌞 Summer Skin Protection Tips! 🌞\n\nAs temperatures rise, protecting your skin becomes even more crucial. Here are our top 5 tips for keeping your skin healthy and radiant this summer:\n\n1. Apply broad-spectrum SPF 30+ sunscreen daily\n2. Seek shade during peak hours (10am-4pm)\n3. Wear protective clothing and wide-brimmed hats\n4. Stay hydrated - drink plenty of water\n5. Schedule regular skin checks with your dermatologist\n\nYour skin will thank you! 💙',
            content_type: 'image',
            media_urls: [
              'https://picsum.photos/800/600?random=4'
            ],
            hashtags: ['#sunprotection', '#skincare', '#summer', '#dermatology', '#SPF', '#healthyskin'],
            mentions: [],
            post_date: '2025-01-09T12:15:00Z',
            likes_count: 834,
            comments_count: 42,
            shares_count: 67,
            engagement_rate: 0.038,
            is_high_performing: true,
            performance_level: 'medium',
            relevance_score: 88,
            content_topics: ['sun_protection', 'educational', 'seasonal_tips'],
            competitor_name: 'Michigan Skin Care Center',
            discovered_at: '2025-01-09T12:45:00Z',
            last_analyzed: '2025-01-09T12:45:00Z',
          },
          {
            id: 'post_003',
            platform: 'tiktok',
            account_handle: 'advancedderma',
            account_name: 'Advanced Dermatology',
            account_verified: true,
            post_id: 'tiktok_111',
            post_url: 'https://tiktok.com/@advancedderma/video/456789',
            caption: 'POV: You finally found the right skincare routine 💫 #dermatologist #skincare #glowup',
            content_type: 'video',
            media_urls: [
              'https://example.com/video1.mp4'
            ],
            hashtags: ['#dermatologist', '#skincare', '#glowup', '#skincareroutine', '#derrnatiktok'],
            mentions: [],
            post_date: '2025-01-08T19:20:00Z',
            likes_count: 12400,
            comments_count: 256,
            shares_count: 891,
            engagement_rate: 0.067,
            is_high_performing: true,
            performance_level: 'high',
            relevance_score: 82,
            content_topics: ['skincare', 'educational'],
            competitor_name: 'Advanced Dermatology',
            discovered_at: '2025-01-08T20:00:00Z',
            last_analyzed: '2025-01-08T20:00:00Z',
          },
          {
            id: 'post_004',
            platform: 'linkedin',
            account_handle: 'greatlakesdermatology',
            account_name: 'Great Lakes Dermatology',
            account_verified: true,
            post_id: 'linkedin_789',
            post_url: 'https://linkedin.com/posts/greatlakesdermatology_medical-dermatology',
            caption: 'Exciting developments in medical dermatology! 🏥\n\nOur team recently completed advanced training in the latest diagnostic techniques for skin cancer detection. Early detection saves lives, and we\'re committed to providing our patients with the most advanced care available.\n\nIf you haven\'t had a skin check in the past year, now is the time to schedule your appointment. Prevention and early detection are your best defenses against skin cancer.\n\n#MedicalDermatology #SkinCancer #EarlyDetection #Healthcare #Dermatology',
            content_type: 'text',
            media_urls: [],
            hashtags: ['#MedicalDermatology', '#SkinCancer', '#EarlyDetection', '#Healthcare', '#Dermatology'],
            mentions: [],
            post_date: '2025-01-07T14:00:00Z',
            likes_count: 156,
            comments_count: 23,
            shares_count: 31,
            engagement_rate: 0.029,
            is_high_performing: false,
            performance_level: 'medium',
            relevance_score: 76,
            content_topics: ['medical_dermatology', 'educational'],
            competitor_name: 'Great Lakes Dermatology',
            discovered_at: '2025-01-07T14:30:00Z',
            last_analyzed: '2025-01-07T14:30:00Z',
          },
          {
            id: 'post_005',
            platform: 'instagram',
            account_handle: 'dermatologyassociates',
            account_name: 'Dermatology Associates',
            account_verified: false,
            post_id: 'ig_456',
            post_url: 'https://instagram.com/p/def789',
            caption: '🎉 Patient Testimonial Tuesday! 🎉\n\n"I never thought I could feel confident about my skin again, but Dr. Smith and the team at Dermatology Associates changed my life. After struggling with severe eczema for years, their personalized treatment plan has given me my confidence back. I can\'t thank them enough!" - Sarah M.\n\nStories like these remind us why we love what we do. 💙\n\n#PatientTestimonial #Eczema #ConfidenceBoost #Dermatology #SkinHealth',
            content_type: 'image',
            media_urls: [
              'https://picsum.photos/800/800?random=5'
            ],
            hashtags: ['#PatientTestimonial', '#Eczema', '#ConfidenceBoost', '#Dermatology', '#SkinHealth'],
            mentions: [],
            post_date: '2025-01-06T16:45:00Z',
            likes_count: 423,
            comments_count: 31,
            shares_count: 12,
            engagement_rate: 0.025,
            is_high_performing: false,
            performance_level: 'low',
            relevance_score: 71,
            content_topics: ['patient_testimonials', 'medical_dermatology'],
            competitor_name: 'Dermatology Associates',
            discovered_at: '2025-01-06T17:00:00Z',
            last_analyzed: '2025-01-06T17:00:00Z',
          },
        ];

        setPosts(mockPosts);
        setTotalPages(Math.ceil(mockPosts.length / 12));
        setLoading(false);
        setError(null);
      }, 1200);
    };

    loadMockPosts();
  }, [filters, sortBy, sortOrder, currentPage]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleAdaptContent = (postId: string) => {
    void postId;
  };

  const handleViewDetails = (postId: string) => {
    void postId;
  };

  const handleFiltersChange = (newFilters: FilterOptions['social']) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const sortOptions: SortOption<SocialMediaPost>[] = [
    { field: 'post_date', direction: 'desc', label: 'Newest First' },
    { field: 'post_date', direction: 'asc', label: 'Oldest First' },
    { field: 'engagement_rate', direction: 'desc', label: 'Highest Engagement' },
    { field: 'likes_count', direction: 'desc', label: 'Most Likes' },
    { field: 'relevance_score', direction: 'desc', label: 'Most Relevant' },
  ];

  const getSortLabel = () => {
    const option = sortOptions.find(opt => 
      opt.field === sortBy && opt.direction === sortOrder
    );
    return option?.label || 'Newest First';
  };

  const highPerformingPosts = posts.filter(post => post.is_high_performing);

  if (error) {
    return (
      <div className={className}>
        <Alert variant="red" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Error loading social media posts</h4>
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
          <h2 className="text-2xl font-bold text-gray-900">Social Media Monitoring</h2>
          <p className="text-gray-600 mt-1">
            Discover high-performing content from competitor dermatology practices
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex items-center space-x-1"
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center space-x-1"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>

          <Select
            value={getSortLabel()}
            onChange={(value) => {
              const option = sortOptions.find(opt => opt.label === value);
              if (option) {
                setSortBy(option.field as 'post_date' | 'engagement_rate' | 'relevance_score');
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

      {/* High-Performing Posts Summary */}
      {!loading && highPerformingPosts.length > 0 && (
        <Alert variant="green" className="border border-green-200">
          <TrendingUp className="h-4 w-4" />
          <div>
            <h4 className="font-medium">High-Performing Posts Discovered</h4>
            <p className="text-sm mt-1">
              {highPerformingPosts.length} posts with exceptional engagement rates found. 
              Perfect candidates for adaptation!
            </p>
          </div>
        </Alert>
      )}

      {/* Filters */}
      <SocialFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        totalResults={posts.length}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Posts Grid/List */}
      {!loading && posts.length > 0 && (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            : "space-y-6"
        }>
          {posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              onAdapt={handleAdaptContent}
              onViewDetails={handleViewDetails}
              className={viewMode === 'list' ? 'max-w-none' : ''}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No posts found
          </h3>
          <p className="text-gray-600 mb-4">
            {Object.keys(filters || {}).length > 0
              ? 'Try adjusting your filters to see more posts.'
              : 'We\'re currently monitoring competitor accounts for new content.'}
          </p>
          <Button
            onClick={handleRefresh}
            className="flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Check for New Posts</span>
          </Button>
        </div>
      )}

      {/* Pagination */}
      {!loading && posts.length > 0 && totalPages > 1 && (
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

      {/* Quick Actions */}
      {!loading && highPerformingPosts.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border p-4">
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              {highPerformingPosts.length} high-performing posts ready
            </div>
            <Button
              size="sm"
              onClick={() => {
              }}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Wand2 className="h-4 w-4" />
              <span>GD Them All!</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}