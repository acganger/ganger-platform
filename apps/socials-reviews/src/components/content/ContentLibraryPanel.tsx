'use client'

import React, { useState, useEffect } from 'react';
import { 
  LoadingSpinner, 
  Button, 
  Badge,
  Card
} from '@ganger/ui';
import { Select } from '@ganger/ui-catalyst';
import { 
  Alert,
  Pagination,
  DropdownMenu,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/placeholders';
import { 
  RefreshCw, 
  AlertCircle, 
  FolderOpen, 
  Grid, 
  List, 
  Send,
  Edit3,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  MoreVertical,
  Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { 
  AdaptedContent, 
  FilterOptions, 
  SortOption 
} from '@/types';

interface ContentLibraryPanelProps {
  className?: string;
}

export default function ContentLibraryPanel({ className = '' }: ContentLibraryPanelProps) {
  const [content, setContent] = useState<AdaptedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters] = useState<FilterOptions['content']>({});
  const [sortBy, setSortBy] = useState<'created_at' | 'adaptation_status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'published'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load adapted content from API
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      
      try {
        const response = await fetch('/api/content');
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        
        const data = await response.json();
        setContent(data.content || []);
      } catch (error) {
        console.error('Error loading content:', error);
        // Fallback to sample content for demo
        const sampleContent: AdaptedContent[] = [
          {
            id: 'content_001',
            original_post_id: 'post_001',
            original_content: '✨ Transform your skin with our revolutionary acne treatment! 🌟\n\nJust look at these incredible before and after results...',
            adapted_content: '✨ Say goodbye to acne with Ganger Dermatology! ✨\n\nOur expert dermatologists use the latest treatments and proven methods to help you achieve the clear, healthy skin you deserve. Every patient\'s journey is unique, and we\'re here to create a personalized treatment plan just for you.\n\nReady to transform your skin confidence? 📞 Book your consultation today!\n\n#GangerDermatology #ClearSkin #AcneTreatment #DermatologyExperts #HealthySkin #SkinConfidence #AnnArbor #Plymouth #Wixom',
            adaptation_method: 'ai_rewrite',
            adaptation_status: 'completed',
            target_platform: 'instagram',
            scheduled_publish_date: '2025-01-12T15:00:00Z',
            ganger_brand_voice_score: 92,
            content_compliance_check: true,
            medical_accuracy_verified: true,
            legal_review_required: false,
            adapted_hashtags: ['#GangerDermatology', '#ClearSkin', '#AcneTreatment', '#DermatologyExperts', '#HealthySkin', '#SkinConfidence', '#AnnArbor', '#Plymouth', '#Wixom'],
            adapted_media_urls: [],
            adaptation_notes: 'Focused on Ganger Dermatology\'s personalized approach and multiple locations',
            created_by: 'ai_assistant',
            created_at: '2025-01-10T16:30:00Z',
          },
          {
            id: 'content_002',
            original_post_id: 'post_002',
            original_content: '🌞 Summer Skin Protection Tips! 🌞\n\nAs temperatures rise, protecting your skin becomes even more crucial...',
            adapted_content: '☀️ Sun protection is skin protection! ☀️\n\nDr. Ganger and our team can\'t stress enough: Daily SPF is your skin\'s best friend! Whether it\'s sunny or cloudy, UVA and UVB rays can cause premature aging and increase skin cancer risk.\n\nOur top sun protection tips:\n✅ Broad-spectrum SPF 30+ daily\n✅ Reapply every 2 hours\n✅ Seek shade during peak hours\n✅ Annual skin checks with your dermatologist\n\nProtect your skin today for beautiful skin tomorrow!\n\n#SunProtection #SkinCancerPrevention #SPF #GangerDermatology #SkinHealth #DermatologyAdvice',
            adaptation_method: 'ai_rewrite',
            adaptation_status: 'pending',
            target_platform: 'facebook',
            ganger_brand_voice_score: 88,
            content_compliance_check: true,
            medical_accuracy_verified: true,
            legal_review_required: false,
            adapted_hashtags: ['#SunProtection', '#SkinCancerPrevention', '#SPF', '#GangerDermatology', '#SkinHealth', '#DermatologyAdvice'],
            adapted_media_urls: [],
            adaptation_notes: 'Emphasized Dr. Ganger\'s expertise and included actionable tips',
            created_by: 'ai_assistant',
            created_at: '2025-01-09T14:15:00Z',
          },
          {
            id: 'content_003',
            original_post_id: 'post_003',
            original_content: 'POV: You finally found the right skincare routine 💫 #dermatologist #skincare #glowup',
            adapted_content: '🌟 Your skin deserves the best care! 🌟\n\nAt Ganger Dermatology, we believe in personalized skincare that works. Our board-certified dermatologists help you develop the perfect routine for your unique skin type and concerns.\n\nFrom medical treatments to cosmetic procedures, we\'re your partners in achieving healthy, radiant skin that makes you feel confident every day.\n\nBook your skin consultation today! 💙\n\n#GangerDermatology #SkincareExperts #HealthySkin #PersonalizedCare #DermatologyLife #Michigan #SkinHealth',
            adaptation_method: 'ai_rewrite',
            adaptation_status: 'published',
            target_platform: 'instagram',
            ganger_brand_voice_score: 91,
            content_compliance_check: true,
            medical_accuracy_verified: true,
            legal_review_required: false,
            adapted_hashtags: ['#GangerDermatology', '#SkincareExperts', '#HealthySkin', '#PersonalizedCare', '#DermatologyLife', '#Michigan', '#SkinHealth'],
            adapted_media_urls: [],
            adaptation_notes: 'Transformed trendy TikTok content into professional skincare messaging',
            created_by: 'ai_assistant',
            created_at: '2025-01-08T11:45:00Z',
            published_at: '2025-01-08T16:00:00Z',
          },
          {
            id: 'content_004',
            original_post_id: 'post_004',
            original_content: 'Exciting developments in medical dermatology! 🏥\n\nOur team recently completed advanced training...',
            adapted_content: '🏥 Leading the way in advanced dermatological care! 🏥\n\nDr. Ganger and our team are committed to staying at the forefront of medical dermatology. We continuously invest in the latest diagnostic techniques and training to provide our patients with the most advanced care available.\n\nEarly detection saves lives, and we\'re here to be your partner in skin health. If you haven\'t had a comprehensive skin examination in the past year, now is the perfect time to schedule your appointment.\n\nYour skin health is our mission. 💙\n\n#GangerDermatology #MedicalDermatology #SkinCancerPrevention #AdvancedCare #EarlyDetection #SkinHealth #Michigan',
            adaptation_method: 'ai_rewrite',
            adaptation_status: 'failed',
            target_platform: 'linkedin',
            ganger_brand_voice_score: 75,
            content_compliance_check: false,
            medical_accuracy_verified: false,
            legal_review_required: true,
            adapted_hashtags: ['#GangerDermatology', '#MedicalDermatology', '#SkinCancerPrevention', '#AdvancedCare', '#EarlyDetection', '#SkinHealth', '#Michigan'],
            adapted_media_urls: [],
            adaptation_notes: 'Requires medical accuracy review before publication - mentions specific diagnostic claims',
            created_by: 'ai_assistant',
            created_at: '2025-01-07T09:30:00Z',
          },
          {
            id: 'content_005',
            original_post_id: 'post_005',
            original_content: '🎉 Patient Testimonial Tuesday! 🎉\n\n"I never thought I could feel confident about my skin again..."',
            adapted_content: '💙 Real stories from our Ganger Dermatology family! 💙\n\n"The team at Ganger Dermatology gave me my confidence back. After years of struggling with eczema, their personalized treatment approach has been life-changing. I\'m so grateful for their expertise and care!" - A Happy Patient\n\nStories like these inspire us every day and remind us why we\'re passionate about dermatological care.\n\nReady to start your own skin transformation journey?\n\n#PatientSuccess #GangerDermatology #EczemaSpecialists #PersonalizedCare #SkinHealth #ConfidenceBoost #Michigan',
            adaptation_method: 'manual_edit',
            adaptation_status: 'completed',
            target_platform: 'facebook',
            ganger_brand_voice_score: 94,
            content_compliance_check: true,
            medical_accuracy_verified: true,
            legal_review_required: false,
            adapted_hashtags: ['#PatientSuccess', '#GangerDermatology', '#EczemaSpecialists', '#PersonalizedCare', '#SkinHealth', '#ConfidenceBoost', '#Michigan'],
            adapted_media_urls: [],
            adaptation_notes: 'Manually edited to ensure HIPAA compliance and remove specific patient details',
            created_by: 'staff@gangerdermatology.com',
            created_at: '2025-01-06T13:20:00Z',
          },
        ];

        // Filter by active tab
        const filteredContent = activeTab === 'all' 
          ? sampleContent 
          : sampleContent.filter(item => {
              switch (activeTab) {
                case 'pending':
                  return item.adaptation_status === 'pending';
                case 'approved':
                  return item.adaptation_status === 'completed';
                case 'published':
                  return item.adaptation_status === 'published';
                default:
                  return true;
              }
            });

        setContent(filteredContent);
        setTotalPages(Math.ceil(filteredContent.length / 12));
      }
      
      setLoading(false);
      setError(null);
    };

    loadContent();
  }, [filters, sortBy, sortOrder, currentPage, activeTab]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleEdit = (contentId: string) => {
    void contentId;
  };

  const handlePreview = (contentId: string) => {
    void contentId;
  };

  const handlePublish = (contentId: string) => {
    
    // Simulate publishing
    setContent(prev => prev.map(item => 
      item.id === contentId 
        ? { ...item, adaptation_status: 'published', published_at: new Date().toISOString() }
        : item
    ));
  };

  const handleSchedule = (contentId: string) => {
    void contentId;
  };

  const getStatusColor = (status: AdaptedContent['adaptation_status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'published':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: AdaptedContent['adaptation_status']) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'processing':
        return RefreshCw;
      case 'completed':
        return CheckCircle;
      case 'failed':
        return AlertCircle;
      case 'published':
        return Send;
      default:
        return Clock;
    }
  };

  const getPlatformColor = (platform: AdaptedContent['target_platform']) => {
    switch (platform) {
      case 'facebook':
        return 'primary';
      case 'instagram':
        return 'secondary';
      case 'twitter':
        return 'primary';
      case 'linkedin':
        return 'primary';
      case 'tiktok':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const sortOptions: SortOption<AdaptedContent>[] = [
    { field: 'created_at', direction: 'desc', label: 'Newest First' },
    { field: 'created_at', direction: 'asc', label: 'Oldest First' },
    { field: 'ganger_brand_voice_score', direction: 'desc', label: 'Highest Brand Score' },
    { field: 'adaptation_status', direction: 'asc', label: 'Status' },
  ];

  const getSortLabel = () => {
    const option = sortOptions.find(opt => 
      opt.field === sortBy && opt.direction === sortOrder
    );
    return option?.label || 'Newest First';
  };

  const getTabCounts = () => {
    return {
      all: content.length,
      pending: content.filter(item => item.adaptation_status === 'pending').length,
      approved: content.filter(item => item.adaptation_status === 'completed').length,
      published: content.filter(item => item.adaptation_status === 'published').length,
    };
  };

  const tabCounts = getTabCounts();

  if (error) {
    return (
      <div className={className}>
        <Alert variant="red" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Error loading content library</h4>
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
          <h2 className="text-2xl font-bold text-gray-900">Content Library</h2>
          <p className="text-gray-600 mt-1">
            Manage and publish adapted social media content for Ganger Dermatology
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex items-center space-x-1"
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
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
            onChange={(e) => {
              const value = e.target.value;
              const option = sortOptions.find(opt => opt.label === value);
              if (option) {
                setSortBy(option.field as 'created_at' | 'adaptation_status');
                setSortOrder(option.direction);
              }
            }}
            className="w-48"
          >
            {sortOptions.map(opt => (
              <option key={opt.label} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </Select>
          
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

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'all' | 'pending' | 'approved' | 'published')}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <FolderOpen className="h-4 w-4" />
            <span>All ({tabCounts.all})</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Pending ({tabCounts.pending})</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Approved ({tabCounts.approved})</span>
          </TabsTrigger>
          <TabsTrigger value="published" className="flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span>Published ({tabCounts.published})</span>
          </TabsTrigger>
        </TabsList>

        {/* Content for all tabs */}
        <TabsContent value={activeTab} className="mt-6">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Content Grid/List */}
          {!loading && content.length > 0 && (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                : "space-y-6"
            }>
              {content.map((item) => {
                const StatusIcon = getStatusIcon(item.adaptation_status);
                
                return (
                  <Card key={item.id} className="p-6 hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(item.adaptation_status)} size="sm">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {item.adaptation_status}
                        </Badge>
                        {item.target_platform && (
                          <Badge variant={getPlatformColor(item.target_platform)} size="sm">
                            {item.target_platform}
                          </Badge>
                        )}
                      </div>
                      
                      <DropdownMenu
                        trigger={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        }
                        items={[
                          {
                            label: 'Preview',
                            icon: Eye,
                            onClick: () => handlePreview(item.id),
                          },
                          {
                            label: 'Edit',
                            icon: Edit3,
                            onClick: () => handleEdit(item.id),
                            disabled: item.adaptation_status === 'published',
                          },
                          {
                            label: 'Publish Now',
                            icon: Send,
                            onClick: () => handlePublish(item.id),
                            disabled: item.adaptation_status !== 'completed',
                          },
                          {
                            label: 'Schedule',
                            icon: Calendar,
                            onClick: () => handleSchedule(item.id),
                            disabled: item.adaptation_status !== 'completed',
                          },
                        ]}
                      />
                    </div>

                    {/* Content Preview */}
                    <div className="mb-4">
                      <p className="text-gray-700 leading-relaxed text-sm line-clamp-4">
                        {item.adapted_content}
                      </p>
                    </div>

                    {/* Hashtags */}
                    {item.adapted_hashtags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {item.adapted_hashtags.slice(0, 4).map((hashtag, index) => (
                            <Badge key={index} variant="secondary" size="sm" className="text-xs">
                              {hashtag}
                            </Badge>
                          ))}
                          {item.adapted_hashtags.length > 4 && (
                            <Badge variant="secondary" size="sm" className="text-xs">
                              +{item.adapted_hashtags.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-500">Brand Voice Score</div>
                        <div className={`text-lg font-bold ${
                          item.ganger_brand_voice_score >= 90 ? 'text-green-600' : 
                          item.ganger_brand_voice_score >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {item.ganger_brand_voice_score}/100
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Compliance</div>
                        <div className={`text-lg font-bold ${
                          item.content_compliance_check ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.content_compliance_check ? 'Verified' : 'Pending'}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                      <span>
                        Created {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                      {item.published_at && (
                        <span>
                          Published {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
                        </span>
                      )}
                      {item.scheduled_publish_date && !item.published_at && (
                        <span className="text-blue-600">
                          Scheduled for {new Date(item.scheduled_publish_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(item.id)}
                        className="flex items-center space-x-1 flex-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Preview</span>
                      </Button>
                      
                      {item.adaptation_status === 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => handlePublish(item.id)}
                          className="flex items-center space-x-1 flex-1"
                        >
                          <Send className="h-3 w-3" />
                          <span>Publish</span>
                        </Button>
                      )}
                      
                      {item.adaptation_status !== 'published' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item.id)}
                          className="flex items-center space-x-1 flex-1"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && content.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No content found
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === 'all'
                  ? 'Start by adapting some social media posts to build your content library.'
                  : `No content with "${activeTab}" status found.`}
              </p>
              <Button
                onClick={() => {
                }}
                className="flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Discover Content to Adapt</span>
              </Button>
            </div>
          )}

          {/* Pagination */}
          {!loading && content.length > 0 && totalPages > 1 && (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
