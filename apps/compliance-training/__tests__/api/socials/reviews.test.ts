/**
 * Tests for Socials & Reviews API endpoints
 * Comprehensive testing suite for Google Business reviews and social media functionality
 */

import { testApiHandler } from 'next-test-api-route-handler';
import { createMocks } from 'node-mocks-http';
import reviewsHandler from '../../../pages/api/socials/reviews';
import generateResponseHandler from '../../../pages/api/socials/reviews/generate-response';
import trendingHandler from '../../../pages/api/socials/trending';
import adaptHandler from '../../../pages/api/socials/content/adapt';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockReview,
              error: null
            })),
            range: jest.fn(() => ({
              data: [mockReview],
              error: null,
              count: 1
            }))
          })),
          order: jest.fn(() => ({
            range: jest.fn(() => ({
              data: [mockReview],
              error: null,
              count: 1
            }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockReview,
              error: null
            }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            error: null
          }))
        }))
      }))
    }))
  }))
}));

// Mock auth utilities
jest.mock('../../../lib/auth-utils', () => ({
  getUserFromToken: jest.fn(),
  auditLog: jest.fn()
}));

// Mock integrations
jest.mock('../../../../../packages/integrations/server/ai/OpenAIClient', () => ({
  OpenAIClient: jest.fn(() => ({
    generateReviewResponse: jest.fn(() => Promise.resolve({
      text: 'Thank you for your review! We appreciate your feedback.',
      confidence: 0.85
    })),
    adaptContent: jest.fn(() => Promise.resolve({
      caption: 'Adapted content for Ganger Dermatology',
      hashtags: ['#GangerDermatology', '#SkinHealth'],
      callToAction: 'Book your appointment today!',
      confidence: 0.9,
      prompt: 'Test prompt'
    }))
  }))
}));

// Test data
const mockReview = {
  id: 'test-review-id',
  google_review_id: 'google-123',
  profile_id: 'profile-123',
  reviewer_name: 'John Doe',
  rating: 5,
  review_text: 'Excellent service!',
  review_date: '2025-01-11T10:00:00Z',
  sentiment_category: 'positive',
  urgency_level: 'low',
  response_status: 'pending',
  profile: {
    id: 'profile-123',
    business_name: 'Ganger Dermatology - Ann Arbor',
    location: {
      id: 'location-123',
      name: 'Ann Arbor'
    }
  }
};

const mockUser = {
  id: 'user-123',
  email: 'test@gangerdermatology.com',
  role: 'manager'
};

const mockPost = {
  id: 'post-123',
  platform_post_id: 'insta-456',
  platform: 'instagram',
  caption: 'Great skincare tips!',
  hashtags: ['#skincare', '#beauty'],
  likes_count: 1500,
  comments_count: 120,
  shares_count: 45,
  is_high_performing: true,
  relevance_score: 0.8,
  account: {
    id: 'account-123',
    platform: 'instagram',
    account_username: 'skincare_expert',
    follower_count: 50000
  }
};

describe('/api/socials/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('../../../lib/auth-utils').getUserFromToken.mockResolvedValue(mockUser);
  });

  describe('GET /api/socials/reviews', () => {
    it('should fetch reviews successfully', async () => {
      await testApiHandler({
        handler: reviewsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
            headers: {
              authorization: 'Bearer valid-token'
            }
          });

          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data.success).toBe(true);
          expect(data.data).toHaveLength(1);
          expect(data.meta).toBeDefined();
          expect(data.meta.page).toBe(1);
          expect(data.meta.total).toBe(1);
        }
      });
    });

    it('should require authentication', async () => {
      require('../../../lib/auth-utils').getUserFromToken.mockResolvedValue(null);

      await testApiHandler({
        handler: reviewsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(401);
          const data = await res.json();
          expect(data.success).toBe(false);
          expect(data.error.code).toBe('UNAUTHORIZED');
        }
      });
    });

    it('should filter reviews by location', async () => {
      await testApiHandler({
        handler: reviewsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
            headers: {
              authorization: 'Bearer valid-token'
            },
            url: '?location=ann-arbor&status=pending'
          });

          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data.success).toBe(true);
        }
      });
    });

    it('should validate pagination parameters', async () => {
      await testApiHandler({
        handler: reviewsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
            headers: {
              authorization: 'Bearer valid-token'
            },
            url: '?page=2&limit=50'
          });

          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data.meta.page).toBe(2);
          expect(data.meta.limit).toBe(50);
        }
      });
    });
  });

  describe('POST /api/socials/reviews', () => {
    it('should create a new review', async () => {
      await testApiHandler({
        handler: reviewsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              authorization: 'Bearer valid-token',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              google_review_id: 'new-review-123',
              profile_id: 'profile-123',
              reviewer_name: 'Jane Smith',
              rating: 4,
              review_text: 'Good experience',
              review_date: '2025-01-11T12:00:00Z'
            })
          });

          expect(res.status).toBe(201);
          const data = await res.json();
          expect(data.success).toBe(true);
          expect(data.data).toBeDefined();
        }
      });
    });

    it('should validate required fields', async () => {
      await testApiHandler({
        handler: reviewsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              authorization: 'Bearer valid-token',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              google_review_id: 'test-123'
              // Missing required fields
            })
          });

          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data.success).toBe(false);
          expect(data.error.code).toBe('VALIDATION_ERROR');
        }
      });
    });

    it('should validate rating range', async () => {
      await testApiHandler({
        handler: reviewsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              authorization: 'Bearer valid-token',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              google_review_id: 'test-123',
              profile_id: 'profile-123',
              rating: 6, // Invalid rating
              review_date: '2025-01-11T12:00:00Z'
            })
          });

          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data.error.message).toContain('Rating must be between 1 and 5');
        }
      });
    });

    it('should require manager permissions for creation', async () => {
      require('../../../lib/auth-utils').getUserFromToken.mockResolvedValue({
        ...mockUser,
        role: 'staff'
      });

      await testApiHandler({
        handler: reviewsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              authorization: 'Bearer valid-token',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              google_review_id: 'test-123',
              profile_id: 'profile-123',
              rating: 5,
              review_date: '2025-01-11T12:00:00Z'
            })
          });

          expect(res.status).toBe(403);
          const data = await res.json();
          expect(data.error.code).toBe('INSUFFICIENT_PERMISSIONS');
        }
      });
    });
  });
});

describe('/api/socials/reviews/generate-response', () => {
  beforeEach(() => {
    require('../../../lib/auth-utils').getUserFromToken.mockResolvedValue(mockUser);
  });

  it('should generate AI response successfully', async () => {
    await testApiHandler({
      handler: generateResponseHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer valid-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            reviewId: 'test-review-id'
          })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.response).toBeDefined();
        expect(data.data.confidence).toBeGreaterThan(0);
      }
    });
  });

  it('should require reviewId parameter', async () => {
    await testApiHandler({
      handler: generateResponseHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer valid-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify({})
        });

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error.message).toContain('Review ID is required');
      }
    });
  });

  it('should handle non-existent review', async () => {
    // Mock Supabase to return no review
    const mockSupabase = require('@supabase/supabase-js').createClient();
    mockSupabase.from().select().eq().eq().single.mockReturnValue({
      data: null,
      error: { message: 'Not found' }
    });

    await testApiHandler({
      handler: generateResponseHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer valid-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            reviewId: 'non-existent-review'
          })
        });

        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
      }
    });
  });

  it('should only allow POST method', async () => {
    await testApiHandler({
      handler: generateResponseHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer valid-token'
          }
        });

        expect(res.status).toBe(405);
        const data = await res.json();
        expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
      }
    });
  });
});

describe('/api/socials/trending', () => {
  beforeEach(() => {
    require('../../../lib/auth-utils').getUserFromToken.mockResolvedValue(mockUser);
    
    // Mock Supabase response for trending posts
    const mockSupabase = require('@supabase/supabase-js').createClient();
    mockSupabase.from().select().eq().gte().order().range.mockReturnValue({
      data: [mockPost],
      error: null,
      count: 1
    });
  });

  it('should fetch trending posts successfully', async () => {
    await testApiHandler({
      handler: trendingHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer valid-token'
          }
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(1);
        expect(data.meta.summary).toBeDefined();
      }
    });
  });

  it('should filter by platform', async () => {
    await testApiHandler({
      handler: trendingHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer valid-token'
          },
          url: '?platform=instagram&sortBy=engagement'
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.meta.filters.platform).toBe('instagram');
        expect(data.meta.filters.sortBy).toBe('engagement');
      }
    });
  });

  it('should validate time range filter', async () => {
    await testApiHandler({
      handler: trendingHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer valid-token'
          },
          url: '?timeRange=30d&relevanceThreshold=0.7'
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.meta.filters.timeRange).toBe('30d');
        expect(data.meta.filters.relevanceThreshold).toBe(0.7);
      }
    });
  });

  it('should require authentication', async () => {
    require('../../../lib/auth-utils').getUserFromToken.mockResolvedValue(null);

    await testApiHandler({
      handler: trendingHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
      }
    });
  });
});

describe('/api/socials/content/adapt', () => {
  beforeEach(() => {
    require('../../../lib/auth-utils').getUserFromToken.mockResolvedValue(mockUser);
    
    // Mock Supabase for content adaptation
    const mockSupabase = require('@supabase/supabase-js').createClient();
    mockSupabase.from().select().eq().single.mockReturnValue({
      data: mockPost,
      error: null
    });
    mockSupabase.from().insert().select().single.mockReturnValue({
      data: {
        id: 'adapted-content-123',
        adapted_caption: 'Adapted content',
        adapted_hashtags: ['#GangerDermatology'],
        call_to_action: 'Book now!',
        target_platforms: ['instagram'],
        approval_status: 'pending',
        publishing_status: 'draft',
        created_at: '2025-01-11T12:00:00Z'
      },
      error: null
    });
  });

  it('should adapt content successfully', async () => {
    await testApiHandler({
      handler: adaptHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer valid-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            originalPostId: 'post-123',
            targetPlatforms: ['instagram', 'facebook'],
            tone: 'professional'
          })
        });

        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.adapted_caption).toBeDefined();
        expect(data.data.target_platforms).toEqual(['instagram', 'facebook']);
        expect(data.data.next_steps).toHaveLength(4);
      }
    });
  });

  it('should validate required fields', async () => {
    await testApiHandler({
      handler: adaptHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer valid-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            originalPostId: 'post-123'
            // Missing targetPlatforms
          })
        });

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error.message).toContain('target platforms are required');
      }
    });
  });

  it('should validate platform names', async () => {
    await testApiHandler({
      handler: adaptHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer valid-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            originalPostId: 'post-123',
            targetPlatforms: ['invalid-platform']
          })
        });

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error.message).toContain('Invalid platforms');
      }
    });
  });

  it('should prevent duplicate adaptations', async () => {
    // Mock existing adaptation
    const mockSupabase = require('@supabase/supabase-js').createClient();
    mockSupabase.from().select().eq().single.mockReturnValueOnce({
      data: { id: 'existing-adaptation', approval_status: 'pending' },
      error: null
    });

    await testApiHandler({
      handler: adaptHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer valid-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            originalPostId: 'post-123',
            targetPlatforms: ['instagram']
          })
        });

        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.error.code).toBe('RESOURCE_ALREADY_EXISTS');
      }
    });
  });

  it('should only allow POST method', async () => {
    await testApiHandler({
      handler: adaptHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer valid-token'
          }
        });

        expect(res.status).toBe(405);
      }
    });
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    require('../../../lib/auth-utils').getUserFromToken.mockResolvedValue(mockUser);
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    const mockSupabase = require('@supabase/supabase-js').createClient();
    mockSupabase.from().select().eq().eq().single.mockReturnValue({
      data: null,
      error: { message: 'Database connection failed' }
    });

    await testApiHandler({
      handler: reviewsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer valid-token'
          }
        });

        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  it('should handle AI service errors', async () => {
    const { OpenAIClient } = require('../../../../../packages/integrations/server/ai/OpenAIClient');
    OpenAIClient.prototype.generateReviewResponse.mockRejectedValue(new Error('OpenAI API failed'));

    await testApiHandler({
      handler: generateResponseHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer valid-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            reviewId: 'test-review-id'
          })
        });

        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data.error.code).toBe('AI_GENERATION_ERROR');
      }
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete review response workflow', async () => {
    // This would test the full flow: fetch review -> generate response -> update status
    // Implementation would involve more complex mocking and state management
  });

  it('should handle complete content adaptation workflow', async () => {
    // This would test: fetch trending post -> adapt content -> queue for approval
    // Implementation would involve testing the full business logic flow
  });
});