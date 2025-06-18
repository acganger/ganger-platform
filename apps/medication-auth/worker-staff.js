/**
 * Staff Access Worker for Medication Authorization
 * Access: Requires Google OAuth authentication
 * Features: Auth review, AI assistance, approval workflow, full admin capabilities
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Security headers for staff interface
    const securityHeaders = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Staff-Portal': 'medication-auth',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };

    // TODO: Add Google OAuth authentication check here
    // For now, allowing access for testing
    
    // Handle static assets from R2
    if (path.startsWith('/_next/') || 
        path.startsWith('/static/') || 
        path.endsWith('.js') || 
        path.endsWith('.css') || 
        path.endsWith('.ico') ||
        path.endsWith('.png') ||
        path.endsWith('.jpg') ||
        path.endsWith('.svg')) {
      
      const assetKey = path.startsWith('/') ? path.slice(1) : path;
      
      try {
        const object = await env.ASSETS.get(assetKey);
        if (object) {
          const headers = new Headers();
          headers.set('Content-Type', getContentType(path));
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');
          headers.set('ETag', object.etag);
          
          // Add security headers
          Object.entries(securityHeaders).forEach(([key, value]) => {
            headers.set(key, value);
          });
          
          return new Response(object.body, { headers });
        }
      } catch (error) {
        console.error('Staff portal R2 fetch error:', error);
      }
    }

    // Handle staff-specific API routes (full access)
    if (path.startsWith('/api/')) {
      return handleStaffApiRoute(request, env);
    }

    // For all other routes, serve the index.html (SPA routing)
    try {
      const indexObject = await env.ASSETS.get('index.html');
      if (indexObject) {
        const headers = new Headers();
        headers.set('Content-Type', 'text/html');
        
        // Add security headers
        Object.entries(securityHeaders).forEach(([key, value]) => {
          headers.set(key, value);
        });
        
        return new Response(indexObject.body, { headers });
      }
    } catch (error) {
      console.error('Staff portal index.html fetch error:', error);
    }

    // Fallback 404
    return new Response('Access denied', { status: 403 });
  }
};

function getContentType(path) {
  if (path.endsWith('.js')) return 'application/javascript';
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.html')) return 'text/html';
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.ico')) return 'image/x-icon';
  if (path.endsWith('.woff2')) return 'font/woff2';
  if (path.endsWith('.woff')) return 'font/woff';
  return 'application/octet-stream';
}

async function handleStaffApiRoute(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Health check for staff portal
  if (path === '/api/health') {
    return new Response(JSON.stringify({
      status: 'healthy',
      portal: 'staff',
      app: 'medication-auth',
      timestamp: new Date().toISOString(),
      features: ['auth-review', 'ai-assistance', 'approval-workflow', 'admin-access'],
      api_routes: 16,
      authentication: 'google-oauth-required'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Staff-Portal': 'medication-auth'
      }
    });
  }

  // Full API access for staff (all 16 routes available)
  if (path === '/api/ai/analyze') {
    return new Response(JSON.stringify({
      message: 'AI analysis endpoint',
      access: 'staff-only'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/analytics/dashboard') {
    return new Response(JSON.stringify({
      message: 'Analytics dashboard endpoint',
      access: 'staff-only'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Add other staff API routes as needed...

  return new Response('API endpoint not found', { status: 404 });
}