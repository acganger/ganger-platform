/**
 * Platform Dashboard - Modern Cloudflare Worker with Static Assets
 * Central hub for Ganger Platform applications with real-time status
 */

interface Env {
  ASSETS: any; // Simplified type for now
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

    // Health check endpoint with proper headers
    if (url.pathname === '/health' || url.pathname === '/dashboard/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'dashboard-staff',
        deployment: 'staff-portal-worker',
        environment: env.ENVIRONMENT || 'production',
        version: '1.0.0',
        route: '/dashboard'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      });
    }

    // API routes for dashboard functionality
    if (url.pathname.startsWith('/api/')) {
      return handleAPIRoutes(url, request, env);
    }

    // Serve static assets using Workers Static Assets
    return env.ASSETS.fetch(request);
  }
};

export default handler;

async function handleAPIRoutes(url: URL, request: Request, _env: Env): Promise<Response> {
  const securityHeaders = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Type': 'application/json'
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

    switch (url.pathname) {
      case '/api/dashboard':
        return handleDashboardData(request, _env);
      
      case '/api/search':
        return handleSearch(request, _env);
      
      case '/api/quick-actions/execute':
        return handleQuickAction(request, _env);
      
      default:
        return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
          status: 404,
          headers: securityHeaders
        });
    }
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: securityHeaders
    });
  }
}

async function handleDashboardData(_request: Request, _env: Env): Promise<Response> {
  // Mock dashboard data for demo - would be replaced with real API calls
  const dashboardData = {
    metrics: {
      totalApplications: 12,
      activeUsers: 45,
      systemUptime: '99.9%',
      alertsCount: 0
    },
    applications: [
      {
        id: 'inventory',
        name: 'Inventory Management',
        description: 'Medical supply tracking with barcode scanning',
        url: '/inventory',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        users: 8
      },
      {
        id: 'handouts',
        name: 'Patient Handouts',
        description: 'Digital handout generation and delivery',
        url: '/handouts',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        users: 12
      },
      {
        id: 'l10',
        name: 'EOS L10 Meetings',
        description: 'Level 10 meeting management platform',
        url: '/l10',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        users: 6
      },
      {
        id: 'compliance',
        name: 'Compliance Training',
        description: 'Staff training and compliance tracking',
        url: '/compliance',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        users: 15
      },
      {
        id: 'status',
        name: 'Integration Status',
        description: 'System monitoring and health dashboard',
        url: '/status',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        users: 3
      },
      {
        id: 'config',
        name: 'Configuration Dashboard',
        description: 'Platform configuration and settings',
        url: '/config',
        status: 'active',
        lastUpdated: new Date().toISOString(),
        users: 2
      }
    ],
    recentActivity: [
      {
        id: '1',
        action: 'User login',
        user: 'Dr. Sarah Johnson',
        application: 'inventory',
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: '2',
        action: 'Report generated',
        user: 'Mike Chen',
        application: 'compliance',
        timestamp: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: '3',
        action: 'Meeting scheduled',
        user: 'Lisa Rodriguez',
        application: 'l10',
        timestamp: new Date(Date.now() - 900000).toISOString()
      }
    ],
    systemHealth: {
      database: 'healthy',
      authentication: 'healthy',
      storage: 'healthy',
      network: 'healthy'
    }
  };

  return new Response(JSON.stringify(dashboardData), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

async function handleSearch(request: Request, _env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const body = await request.json() as { query: string };
  
  // Mock search results - would be replaced with real search
  const searchResults = {
    query: body.query,
    results: [
      {
        type: 'application',
        title: 'Inventory Management',
        description: 'Medical supply tracking system',
        url: '/inventory',
        relevance: 0.95
      },
      {
        type: 'help',
        title: 'How to scan barcodes',
        description: 'Step-by-step guide for inventory scanning',
        url: '/help/barcode-scanning',
        relevance: 0.85
      }
    ],
    total: 2,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(searchResults), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleQuickAction(request: Request, _env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const body = await request.json() as { action: string; parameters?: any };
  
  // Mock quick action execution - would be replaced with real actions
  const actionResult = {
    action: body.action,
    status: 'success',
    message: `Action '${body.action}' executed successfully`,
    timestamp: new Date().toISOString(),
    result: {
      redirectUrl: body.action === 'system_health' ? '/status' : undefined
    }
  };

  return new Response(JSON.stringify(actionResult), {
    headers: { 'Content-Type': 'application/json' }
  });
}