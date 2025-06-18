# Socials & Reviews Management - Frontend Development PRD
*React/Next.js Frontend Implementation for Ganger Platform*

*This PRD follows the Ganger Platform Frontend Development Standards and ensures compliance with all architectural requirements for Terminal 1 development.*

## 📋 Document Information
- **Application Name**: Socials & Reviews Management (Frontend)
- **Terminal Assignment**: TERMINAL 1 - FRONTEND
- **Priority**: High
- **Development Timeline**: 3-4 weeks
- **Dependencies**: @ganger/ui, @ganger/auth/client, @ganger/utils/client, @ganger/types
- **Integration Requirements**: Backend API endpoints, Real-time subscriptions
- **Quality Gates**: TypeScript zero-error compilation, @ganger/ui exclusive usage, client-server boundary compliance
- **Performance Budget**: <1.2s FCP, <2.0s LCP, <0.1 CLS, <200KB bundle size
- **Accessibility**: WCAG 2.1 AA compliance mandatory

---

## 🎯 Frontend Scope

### **Terminal 1 Responsibilities**
- React components for social media monitoring interface
- Review management and response UI
- Content adaptation ("GD it") interface
- Real-time dashboard with live updates
- Form handling for review responses
- Content preview and publishing interface

### **Excluded from Frontend Terminal**
- API route implementations (Terminal 2)
- External service integrations (Terminal 2)
- AI content generation logic (Terminal 2)
- Server-side authentication (Terminal 2)

---

## 🏗️ Frontend Technology Stack

### **Required Client-Side Packages**
```typescript
'use client'

// ✅ MANDATORY: Client-safe imports only - enforced by quality gates
import { 
  AppLayout, PageHeader, DataTable, Button, Card, 
  StatCard, FormField, LoadingSpinner, SuccessToast,
  Modal, TextArea, Select, DatePicker, Badge, Input,
  Checkbox, DropdownMenu, Tabs, TabsList, TabsTrigger, TabsContent
} from '@ganger/ui';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { formatDate, validateForm, debounce, formatters } from '@ganger/utils/client';
import { 
  User, GoogleBusinessReview, SocialMediaPost, AdaptedContent,
  SocialAccountMonitoring, GoogleBusinessProfile, ApiResponse,
  PaginationMeta, ValidationRule
} from '@ganger/types';

// ❌ PROHIBITED: These imports will fail quality gates
// import { db } from '@ganger/db'; // Server-only
// import { ServerCommunicationService } from '@ganger/integrations/server'; // Server-only
// import { googleapis } from 'googleapis'; // Server-only
// import puppeteer from 'puppeteer'; // Server-only
```

### **Frontend-Specific Technology**
- **Real-time Updates**: Live feed of new reviews and social posts
- **Content Preview**: Rich preview of adapted content before publishing
- **Responsive Grid**: Masonry layout for social media posts
- **Image Handling**: Client-side image preview and optimization
- **Drag & Drop**: Content organization and scheduling interface

---

## 🛡️ **MANDATORY: Component Library Compliance**

### **@ganger/ui Exclusive Usage Policy**

**ZERO TOLERANCE for custom UI components** - All interface elements MUST use @ganger/ui exclusively.

**✅ ALLOWED Component Usage:**
```typescript
'use client'

// Layout Components (MANDATORY)
import { AppLayout, PageHeader, Card, Container, Grid } from '@ganger/ui';

// Form Components (MANDATORY) 
import { 
  FormField, Input, TextArea, Select, Button, Checkbox,
  RadioGroup, DatePicker, TimePicker, FileUpload
} from '@ganger/ui';

// Data Display (MANDATORY)
import { 
  DataTable, StatCard, Badge, Avatar, Tooltip,
  ProgressBar, Chart, Timeline
} from '@ganger/ui';

// Feedback & Navigation (MANDATORY)
import { 
  Modal, Drawer, Toast, Alert, LoadingSpinner,
  Tabs, TabsList, TabsTrigger, TabsContent,
  DropdownMenu, Breadcrumb
} from '@ganger/ui';
```

**❌ PROHIBITED Patterns:**
```typescript
// ❌ NEVER create custom button implementations
const CustomButton = ({ children, ...props }) => (
  <button className="bg-blue-500 px-4 py-2 rounded" {...props}>
    {children}
  </button>
);

// ❌ NEVER use inline styles
<div style={{ color: 'blue', padding: '16px' }}>Content</div>

// ❌ NEVER implement UI elements directly
<input className="border rounded px-3 py-2" />

// ✅ ALWAYS use @ganger/ui components
import { Button, Input } from '@ganger/ui';
<Button variant="primary">Click me</Button>
<Input placeholder="Enter value" />
```

### **Design Token System Compliance**

**Mandatory Color Usage:**
```typescript
// ✅ REQUIRED: Use design tokens exclusively
const APPROVED_CLASSES = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white',
  secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white', 
  success: 'bg-green-500 hover:bg-green-600 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  neutral: 'bg-gray-100 hover:bg-gray-200 text-gray-900'
};

// ❌ PROHIBITED: Arbitrary colors
<Button className="bg-blue-500"> // Will fail quality gates
```

### **Typography Standards**
```typescript
const TYPOGRAPHY_CLASSES = {
  // Headings
  h1: 'text-3xl font-bold text-neutral-900',
  h2: 'text-2xl font-semibold text-neutral-800',
  h3: 'text-xl font-medium text-neutral-700',
  h4: 'text-lg font-medium text-neutral-700',
  
  // Body text
  body: 'text-base text-neutral-600',
  bodyLarge: 'text-lg text-neutral-600', 
  bodySmall: 'text-sm text-neutral-500',
  
  // Special text
  caption: 'text-xs text-neutral-400',
  label: 'text-sm font-medium text-neutral-700'
};
```

---

## 🎨 User Interface Components

### **Main Dashboard Layout**
```typescript
'use client'

import { useState } from 'react';
import { 
  AppLayout, PageHeader, Tabs, TabsList, TabsTrigger, TabsContent 
} from '@ganger/ui';
import { useAuth } from '@ganger/auth/client';
import { User } from '@ganger/types';

interface SocialsReviewsDashboardProps {
  initialTab?: 'reviews' | 'social' | 'content';
}

export default function SocialsReviewsDashboard({ 
  initialTab = 'reviews' 
}: SocialsReviewsDashboardProps) {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'reviews' | 'social' | 'content'>(initialTab);
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <PageHeader 
        title="Socials & Reviews" 
        subtitle="AI-powered social media monitoring and review management"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Socials & Reviews', href: '/socials-reviews' }
        ]}
      />
      
      {/* ✅ COMPLIANT: Using @ganger/ui Tabs instead of custom navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reviews" className="text-sm font-medium">
            Review Management
          </TabsTrigger>
          <TabsTrigger value="social" className="text-sm font-medium">
            Social Monitoring
          </TabsTrigger>
          <TabsTrigger value="content" className="text-sm font-medium">
            Content Library
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reviews" className="mt-6">
          <ReviewManagementPanel user={user} />
        </TabsContent>
        
        <TabsContent value="social" className="mt-6">
          <SocialMonitoringPanel user={user} />
        </TabsContent>
        
        <TabsContent value="content" className="mt-6">
          <ContentLibraryPanel user={user} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
```

### **Advanced UI Patterns & Responsive Design**

**Mobile-First Responsive Grid System:**
```typescript
'use client'

import { Grid, Container } from '@ganger/ui';

// ✅ COMPLIANT: Responsive dashboard layout
export function ResponsiveDashboardGrid({ children }: { children: React.ReactNode }) {
  return (
    <Container maxWidth="7xl" className="px-4 sm:px-6 lg:px-8">
      <Grid 
        cols={{ 
          default: 1,    // Mobile: single column
          sm: 1,         // Small: single column
          md: 2,         // Medium: two columns
          lg: 3,         // Large: three columns
          xl: 4          // Extra large: four columns
        }}
        gap={{ default: 4, md: 6, lg: 8 }}
        className="w-full"
      >
        {children}
      </Grid>
    </Container>
  );
}
```

**Progressive Enhancement Pattern:**
```typescript
'use client'

import { useState, useEffect } from 'react';
import { LoadingSpinner, Card } from '@ganger/ui';

export function ProgressiveEnhancementWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Server-side: render basic version
  if (!isClient) {
    return (
      <Card className="p-6">
        {fallback || (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="md" />
          </div>
        )}
      </Card>
    );
  }
  
  // Client-side: render full interactive version
  return <>{children}</>;
}
```

**Optimistic UI Updates Pattern:**
```typescript
'use client'

import { useState, useCallback } from 'react';
import { Button, Toast } from '@ganger/ui';
import { GoogleBusinessReview } from '@ganger/types';

export function OptimisticReviewResponse({ 
  review, 
  onUpdate 
}: {
  review: GoogleBusinessReview;
  onUpdate: () => void;
}) {
  const [localStatus, setLocalStatus] = useState(review.response_status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleOptimisticUpdate = useCallback(async (newStatus: string) => {
    // Immediately update UI (optimistic)
    const previousStatus = localStatus;
    setLocalStatus(newStatus);
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/reviews/${review.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      // Success: keep optimistic update
      onUpdate();
      Toast.success('Review status updated successfully');
    } catch (error) {
      // Failure: revert optimistic update
      setLocalStatus(previousStatus);
      Toast.error('Failed to update review status');
    } finally {
      setIsSubmitting(false);
    }
  }, [review.id, localStatus, onUpdate]);
  
  return (
    <div className="flex space-x-2">
      <Button
        size="sm"
        variant={localStatus === 'approved' ? 'success' : 'outline'}
        disabled={isSubmitting}
        onClick={() => handleOptimisticUpdate('approved')}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant={localStatus === 'rejected' ? 'danger' : 'outline'}
        disabled={isSubmitting}
        onClick={() => handleOptimisticUpdate('rejected')}
      >
        Reject
      </Button>
    </div>
  );
}
```

**Virtualized List for Performance:**
```typescript
'use client'

import { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card } from '@ganger/ui';
import { GoogleBusinessReview } from '@ganger/types';

interface VirtualizedReviewsListProps {
  reviews: GoogleBusinessReview[];
  onUpdate: () => void;
}

const ITEM_HEIGHT = 180; // Height of each review card

export function VirtualizedReviewsList({ 
  reviews, 
  onUpdate 
}: VirtualizedReviewsListProps) {
  const ReviewItem = useMemo(() => 
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const review = reviews[index];
      
      return (
        <div style={style}>
          <Card className="mx-4 mb-4">
            <div className="p-4">
              <h4 className="font-semibold">{review.reviewer_name}</h4>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                {review.review_text}
              </p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-500">
                  {formatDate(review.review_date)}
                </span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${
                        i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }, [reviews]);
  
  return (
    <List
      height={600} // Fixed height for viewport
      itemCount={reviews.length}
      itemSize={ITEM_HEIGHT}
      className="w-full"
    >
      {ReviewItem}
    </List>
  );
}
```

**Skeleton Loading Pattern:**
```typescript
'use client'

import { Card } from '@ganger/ui';

export function ReviewCardSkeleton() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="flex items-start space-x-4">
        {/* Avatar skeleton */}
        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
        
        <div className="flex-1 space-y-3">
          {/* Header skeleton */}
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
          
          {/* Actions skeleton */}
          <div className="flex space-x-2 pt-2">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ReviewsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### **Review Management Component**
```typescript
'use client'

interface ReviewManagementPanelProps {}

export function ReviewManagementPanel() {
  const [reviews, setReviews] = useState<GoogleBusinessReview[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState(true);

  const locationOptions = [
    { value: 'all', label: 'All Locations' },
    { value: 'ann_arbor', label: 'Ann Arbor' },
    { value: 'plymouth', label: 'Plymouth' },
    { value: 'wixom', label: 'Wixom' }
  ];

  useEffect(() => {
    loadReviews();
  }, [selectedLocation, statusFilter]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reviews?location=${selectedLocation}&status=${statusFilter}`);
      const data = await response.json();
      setReviews(data.data || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Pending Reviews"
          value="12"
          change="+3"
          trend="up"
          icon="message-circle"
          color="yellow"
        />
        <StatCard
          title="Response Rate"
          value="98%"
          change="+2%"
          trend="up"
          icon="check-circle"
          color="green"
        />
        <StatCard
          title="Avg Rating"
          value="4.8"
          change="+0.1"
          trend="up"
          icon="star"
          color="blue"
        />
        <StatCard
          title="Avg Response Time"
          value="4.2h"
          change="-1.3h"
          trend="down"
          color="purple"
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select
                label="Location"
                value={selectedLocation}
                onChange={setSelectedLocation}
                options={locationOptions}
              />
            </div>
            <div className="flex-1">
              <Select
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'pending', label: 'Pending Response' },
                  { value: 'draft', label: 'Draft Response' },
                  { value: 'published', label: 'Response Published' },
                  { value: 'not_needed', label: 'No Response Needed' }
                ]}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadReviews} variant="outline">
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          reviews.map(review => (
            <ReviewCard 
              key={review.id} 
              review={review} 
              onUpdate={loadReviews}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

### **Individual Review Card**
```typescript
'use client'

interface ReviewCardProps {
  review: GoogleBusinessReview;
  onUpdate: () => void;
}

export function ReviewCard({ review, onUpdate }: ReviewCardProps) {
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const generateAIResponse = async () => {
    setIsGeneratingResponse(true);
    try {
      const response = await fetch('/api/reviews/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id })
      });
      
      const data = await response.json();
      if (data.success) {
        setAiResponse(data.response);
        setShowResponseModal(true);
      }
    } catch (error) {
      console.error('Failed to generate AI response:', error);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  return (
    <>
      <Card className={`${getUrgencyColor(review.urgency_level)}`}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {review.reviewer_profile_photo_url ? (
                  <img 
                    src={review.reviewer_profile_photo_url}
                    alt={review.reviewer_name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 font-medium">
                      {review.reviewer_name?.charAt(0) || 'A'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {review.reviewer_name || 'Anonymous'}
                </h4>
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(review.review_date)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge 
                className={getSentimentColor(review.sentiment_category)}
                variant="soft"
              >
                {review.sentiment_category}
              </Badge>
              {review.urgency_level === 'urgent' && (
                <Badge className="text-red-600 bg-red-100" variant="soft">
                  Urgent
                </Badge>
              )}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed">
              {review.review_text}
            </p>
          </div>

          {review.key_topics && review.key_topics.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {review.key_topics.map((topic, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Response Status: <span className="font-medium capitalize">{review.response_status}</span>
            </div>
            
            <div className="flex space-x-2">
              {review.response_status === 'pending' && (
                <Button
                  onClick={generateAIResponse}
                  disabled={isGeneratingResponse}
                  size="sm"
                >
                  {isGeneratingResponse ? 'Generating...' : 'Generate AI Response'}
                </Button>
              )}
              
              {review.response_status === 'draft' && (
                <Button
                  onClick={() => setShowResponseModal(true)}
                  variant="outline"
                  size="sm"
                >
                  Edit Response
                </Button>
              )}
              
              {review.final_response && (
                <Button
                  onClick={() => {/* View published response */}}
                  variant="outline"
                  size="sm"
                >
                  View Response
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Response Modal */}
      <ResponseModal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        review={review}
        initialResponse={aiResponse}
        onUpdate={onUpdate}
      />
    </>
  );
}
```

### **Social Media Monitoring Panel**
```typescript
'use client'

export function SocialMonitoringPanel() {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [monitoredAccounts, setMonitoredAccounts] = useState<SocialAccountMonitoring[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('engagement');

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="High-Performing Posts"
          value="23"
          change="+5"
          trend="up"
          icon="trending-up"
          color="green"
        />
        <StatCard
          title="Content Adapted"
          value="8"
          change="+3"
          trend="up"
          icon="refresh-cw"
          color="blue"
        />
        <StatCard
          title="Accounts Monitored"
          value="15"
          change="+2"
          trend="up"
          icon="eye"
          color="purple"
        />
        <StatCard
          title="Avg Engagement"
          value="2.4k"
          change="+12%"
          trend="up"
          icon="heart"
          color="pink"
        />
      </div>

      {/* Platform Filter */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4">
              <Select
                label="Platform"
                value={selectedPlatform}
                onChange={setSelectedPlatform}
                options={[
                  { value: 'all', label: 'All Platforms' },
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'tiktok', label: 'TikTok' },
                  { value: 'linkedin', label: 'LinkedIn' }
                ]}
              />
              <Select
                label="Sort By"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: 'engagement', label: 'Engagement' },
                  { value: 'recent', label: 'Most Recent' },
                  { value: 'relevance', label: 'Relevance Score' }
                ]}
              />
            </div>
            <Button onClick={() => {/* Add account modal */}}>
              Add Account
            </Button>
          </div>
        </div>
      </Card>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <SocialPostCard 
            key={post.id} 
            post={post}
            onGDIt={() => handleGDIt(post)}
          />
        ))}
      </div>
    </div>
  );
}
```

### **Social Post Card with "GD It" Button**
```typescript
'use client'

interface SocialPostCardProps {
  post: SocialMediaPost;
  onGDIt: () => void;
}

export function SocialPostCard({ post, onGDIt }: SocialPostCardProps) {
  const [isAdapting, setIsAdapting] = useState(false);

  const handleGDIt = async () => {
    setIsAdapting(true);
    try {
      await onGDIt();
    } finally {
      setIsAdapting(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      instagram: '📷',
      facebook: '👥',
      tiktok: '🎵',
      linkedin: '💼'
    };
    return icons[platform] || '📱';
  };

  const formatEngagement = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getPlatformIcon(post.platform)}</span>
            <span className="text-sm font-medium text-gray-600 capitalize">
              {post.platform}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {post.is_high_performing && (
              <Badge className="text-green-600 bg-green-100" variant="soft">
                High Performing
              </Badge>
            )}
            <Button
              size="sm"
              onClick={handleGDIt}
              disabled={isAdapting}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAdapting ? 'Adapting...' : 'GD It'}
            </Button>
          </div>
        </div>

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mb-3">
            <img
              src={post.media_urls[0]}
              alt="Post content"
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Content */}
        <div className="mb-3">
          <p className="text-sm text-gray-700 line-clamp-3">
            {post.caption}
          </p>
        </div>

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {post.hashtags.slice(0, 3).map((hashtag, index) => (
                <span 
                  key={index}
                  className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded"
                >
                  #{hashtag}
                </span>
              ))}
              {post.hashtags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{post.hashtags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex space-x-4">
            <span>❤️ {formatEngagement(post.likes_count)}</span>
            <span>💬 {formatEngagement(post.comments_count)}</span>
            <span>🔄 {formatEngagement(post.shares_count)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Relevance:</span>
            <span className="font-medium">
              {Math.round((post.relevance_score || 0) * 100)}%
            </span>
          </div>
        </div>

        {/* Topics */}
        {post.content_topics && post.content_topics.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex flex-wrap gap-1">
              {post.content_topics.map((topic, index) => (
                <span 
                  key={index}
                  className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
```

### **Content Adaptation Modal**
```typescript
'use client'

interface ContentAdaptationModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPost: SocialMediaPost;
  onPublish: (adaptedContent: AdaptedContent) => void;
}

export function ContentAdaptationModal({ 
  isOpen, 
  onClose, 
  originalPost, 
  onPublish 
}: ContentAdaptationModalProps) {
  const [adaptedContent, setAdaptedContent] = useState<Partial<AdaptedContent>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook']);

  useEffect(() => {
    if (isOpen && originalPost) {
      generateAdaptation();
    }
  }, [isOpen, originalPost]);

  const generateAdaptation = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/content/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          originalPostId: originalPost.id,
          targetPlatforms: selectedPlatforms
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setAdaptedContent(data.adaptedContent);
      }
    } catch (error) {
      console.error('Failed to generate adaptation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Adapt Content for Ganger Dermatology</h2>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Content */}
          <div>
            <h3 className="text-lg font-medium mb-3">Original Content</h3>
            <Card>
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">{getPlatformIcon(originalPost.platform)}</span>
                  <span className="font-medium capitalize">{originalPost.platform}</span>
                </div>
                
                {originalPost.media_urls && originalPost.media_urls.length > 0 && (
                  <img
                    src={originalPost.media_urls[0]}
                    alt="Original content"
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                )}
                
                <p className="text-sm text-gray-700 mb-3">
                  {originalPost.caption}
                </p>
                
                <div className="flex space-x-4 text-sm text-gray-500">
                  <span>❤️ {formatEngagement(originalPost.likes_count)}</span>
                  <span>💬 {formatEngagement(originalPost.comments_count)}</span>
                  <span>🔄 {formatEngagement(originalPost.shares_count)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Adapted Content */}
          <div>
            <h3 className="text-lg font-medium mb-3">Adapted for Ganger Dermatology</h3>
            
            {isGenerating ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="mt-2 text-gray-600">Generating adaptation...</p>
                </div>
              </div>
            ) : (
              <Card>
                <div className="p-4 space-y-4">
                  {/* Platform Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Platforms
                    </label>
                    <div className="flex space-x-3">
                      {['instagram', 'facebook', 'linkedin'].map(platform => (
                        <label key={platform} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedPlatforms.includes(platform)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlatforms(prev => [...prev, platform]);
                              } else {
                                setSelectedPlatforms(prev => prev.filter(p => p !== platform));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="capitalize">{platform}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Adapted Caption */}
                  <FormField label="Adapted Caption">
                    <TextArea
                      value={adaptedContent.adapted_caption || ''}
                      onChange={(value) => setAdaptedContent(prev => ({
                        ...prev,
                        adapted_caption: value
                      }))}
                      rows={4}
                      placeholder="AI-generated adaptation will appear here..."
                    />
                  </FormField>

                  {/* Hashtags */}
                  <FormField label="Hashtags">
                    <div className="flex flex-wrap gap-2 p-2 border rounded">
                      {(adaptedContent.adapted_hashtags || []).map((hashtag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                        >
                          #{hashtag}
                        </span>
                      ))}
                    </div>
                  </FormField>

                  {/* Call to Action */}
                  <FormField label="Call to Action">
                    <Input
                      value={adaptedContent.call_to_action || ''}
                      onChange={(value) => setAdaptedContent(prev => ({
                        ...prev,
                        call_to_action: value
                      }))}
                      placeholder="Schedule your consultation today!"
                    />
                  </FormField>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <Button 
                      onClick={generateAdaptation}
                      variant="outline"
                      disabled={isGenerating}
                    >
                      Regenerate
                    </Button>
                    <Button 
                      onClick={() => onPublish(adaptedContent as AdaptedContent)}
                      disabled={!adaptedContent.adapted_caption}
                    >
                      Save to Library
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
```

---

## ⚙️ **CRITICAL: Client-Server Boundary Enforcement**

### **Next.js 'use client' Directive Requirements**

**MANDATORY for ALL interactive components:**
```typescript
// ✅ REQUIRED at top of every component file using React hooks
'use client'

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@ganger/ui';

export default function InteractiveComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <Button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </Button>
  );
}
```

**❌ WILL FAIL: Missing 'use client' directive**
```typescript
// ❌ This will cause hydration errors and build failures
import { useState } from 'react'; // Requires 'use client'

export default function BrokenComponent() {
  const [value, setValue] = useState(''); // ❌ Error: useState in server component
  return <div>{value}</div>;
}
```

### **Prohibited Server Imports in Client Components**

**Pre-commit hooks will BLOCK these patterns:**
```typescript
'use client'

// ❌ BLOCKED by quality gates - server-only imports
import { db } from '@ganger/db';
import { ServerCommunicationService } from '@ganger/integrations/server';
import { googleapis } from 'googleapis';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js'; // Use @ganger/db instead
```

### **API Route Integration Pattern**

**Correct client-server communication:**
```typescript
'use client'

export default function ReviewResponseForm({ reviewId }: { reviewId: string }) {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // ✅ CORRECT: Client calls API route, server handles business logic
      const result = await fetch('/api/reviews/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, response })
      });
      
      if (!result.ok) {
        throw new Error('Failed to submit response');
      }
      
      const data = await result.json();
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Response" required>
        <TextArea
          value={response}
          onChange={setResponse}
          placeholder="Enter your response..."
          rows={4}
        />
      </FormField>
      
      <Button 
        type="submit" 
        disabled={isSubmitting || !response.trim()}
        variant="primary"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Response'}
      </Button>
    </form>
  );
}
```

### **Webpack Configuration Compliance**

**Required next.config.js for client-server boundary:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Prevent server-only packages from being bundled in client
    if (!isServer) {
      config.externals = [
        ...config.externals,
        '@ganger/db',
        '@ganger/integrations/server',
        'googleapis',
        'puppeteer',
        'ioredis'
      ];
    }
    return config;
  },
  
  experimental: {
    serverComponentsExternalPackages: [
      '@ganger/db',
      'googleapis',
      'puppeteer'
    ]
  }
};

module.exports = nextConfig;
```

---

## 📊 Real-time Features

### **Live Updates Hook**
```typescript
'use client'

export function useRealtimeSocials() {
  const [newReviews, setNewReviews] = useState<GoogleBusinessReview[]>([]);
  const [newPosts, setNewPosts] = useState<SocialMediaPost[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to real-time updates
    const reviewsSubscription = supabase
      .channel('google-business-reviews')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'google_business_reviews' },
        (payload) => {
          setNewReviews(prev => [payload.new as GoogleBusinessReview, ...prev]);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    const postsSubscription = supabase
      .channel('social-media-posts')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'social_media_posts' },
        (payload) => {
          const newPost = payload.new as SocialMediaPost;
          if (newPost.is_high_performing) {
            setNewPosts(prev => [newPost, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      reviewsSubscription.unsubscribe();
      postsSubscription.unsubscribe();
    };
  }, []);

  return {
    newReviews,
    newPosts,
    isConnected,
    clearNewReviews: () => setNewReviews([]),
    clearNewPosts: () => setNewPosts([])
  };
}
```

### **Notification System**
```typescript
'use client'

export function NotificationBanner() {
  const { newReviews, newPosts, clearNewReviews, clearNewPosts } = useRealtimeSocials();

  if (newReviews.length === 0 && newPosts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-16 right-4 z-50 space-y-2">
      {newReviews.length > 0 && (
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <span>
              {newReviews.length} new review{newReviews.length > 1 ? 's' : ''}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-blue-700"
              onClick={clearNewReviews}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
      
      {newPosts.length > 0 && (
        <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <span>
              {newPosts.length} new high-performing post{newPosts.length > 1 ? 's' : ''}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-green-700"
              onClick={clearNewPosts}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

