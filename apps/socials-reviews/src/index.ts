interface Env {
  ASSETS: any;
  ENVIRONMENT?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Validate request method
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405 });
    }

    // Security headers applied to all responses
    const securityHeaders = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/socials/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'socials-staff',
        deployment: 'staff-portal-worker',
        environment: env.ENVIRONMENT || 'production',
        version: '1.0.0',
        route: '/socials'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...securityHeaders
        }
      });
    }

    // API endpoints
    if (url.pathname.startsWith('/api/')) {
      return handleAPIRoutes(url, request, env);
    }

    // Serve static assets for all other requests
    const response = await env.ASSETS.fetch(request);
    
    // Add security headers to static content
    const headers = new Headers(response.headers);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};

async function handleAPIRoutes(url: URL, request: Request, env: Env): Promise<Response> {
  const securityHeaders = {
    'Content-Type': 'application/json',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };

  try {
    // Validate content type for POST requests
    if (request.method === 'POST') {
      const contentType = request.headers.get('Content-Type');
      if (!contentType?.includes('application/json')) {
        return new Response(JSON.stringify({ error: 'Invalid content type' }), { 
          status: 400, 
          headers: securityHeaders 
        });
      }
    }

    // Social media reviews API
    if (url.pathname === '/api/socials/reviews') {
      return handleSocialsReviews(request, env);
    }

    // Social media monitoring API
    if (url.pathname === '/api/socials/monitoring') {
      return handleSocialMonitoring(request, env);
    }

    // Content library API
    if (url.pathname === '/api/socials/content') {
      return handleContentLibrary(request, env);
    }

    // Dashboard stats API
    if (url.pathname === '/api/socials/dashboard') {
      return handleDashboardStats(request, env);
    }

    return new Response(JSON.stringify({ error: 'API endpoint not found' }), { 
      status: 404, 
      headers: securityHeaders 
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers: securityHeaders 
    });
  }
}

async function handleSocialsReviews(request: Request, env: Env): Promise<Response> {
  const mockReviews = {
    reviews: [
      {
        id: 'review_1',
        author: 'Sarah Johnson',
        rating: 5,
        text: 'Excellent service from Dr. Ganger and his team. Very professional and caring.',
        platform: 'Google Business',
        created_at: '2025-01-15T10:30:00Z',
        status: 'pending_response',
        sentiment: 'positive'
      },
      {
        id: 'review_2',
        author: 'Michael Chen',
        rating: 4,
        text: 'Good experience overall. Wait time was a bit long but worth it.',
        platform: 'Google Business',
        created_at: '2025-01-14T14:20:00Z',
        status: 'responded',
        sentiment: 'positive'
      }
    ],
    pagination: {
      total: 57,
      page: 1,
      per_page: 20,
      total_pages: 3
    }
  };

  return Response.json(mockReviews, {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

async function handleSocialMonitoring(request: Request, env: Env): Promise<Response> {
  const mockMonitoring = {
    high_performing_posts: [
      {
        id: 'post_1',
        platform: 'Instagram',
        account: '@medicalskincare',
        content: 'Winter skin care tips that actually work...',
        engagement_rate: 0.084,
        likes: 1247,
        comments: 89,
        shares: 34,
        adaptation_suggestions: [
          'Adapt for dermatology practice audience',
          'Add clinic-specific winter care services',
          'Include patient testimonials'
        ]
      }
    ],
    monitored_accounts: 24,
    total_posts_analyzed: 1847,
    content_opportunities: 7
  };

  return Response.json(mockMonitoring, {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

async function handleContentLibrary(request: Request, env: Env): Promise<Response> {
  const mockContent = {
    adapted_content: [
      {
        id: 'content_1',
        title: 'Winter Skincare Tips for Healthy Skin',
        original_source: '@medicalskincare',
        adapted_for: 'Ganger Dermatology',
        status: 'published',
        published_date: '2025-01-10T09:00:00Z',
        engagement: {
          likes: 89,
          comments: 12,
          shares: 7
        }
      }
    ],
    pending_approval: 3,
    total_library_items: 156,
    compliance_status: 'all_approved'
  };

  return Response.json(mockContent, {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

async function handleDashboardStats(request: Request, env: Env): Promise<Response> {
  const mockStats = {
    reviews: {
      total_pending: 12,
      new_today: 3,
      avg_rating_this_month: 4.7,
      response_rate: 0.89,
      sentiment_breakdown: {
        positive: 45,
        neutral: 8,
        negative: 4
      }
    },
    social: {
      high_performing_posts_discovered: 7,
      content_adapted_this_week: 5,
      total_monitored_accounts: 24,
      avg_engagement_rate: 0.034
    },
    content: {
      total_adapted_content: 156,
      published_this_month: 23,
      pending_approval: 3,
      compliance_review_needed: 1
    }
  };

  return Response.json(mockStats, {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

export default handler;