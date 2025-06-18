/**
 * Patient Access Worker for Medication Authorization
 * Domain: meds.gangerdermatology.com
 * Access: Public (no authentication required)
 * Features: Prior auth requests, status tracking, document upload
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Security headers for patient interface
    const securityHeaders = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Patient-Portal': 'medication-auth',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };

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
        console.error('Patient portal R2 fetch error:', error);
      }
    }

    // Handle patient-specific API routes
    if (path.startsWith('/api/')) {
      return handlePatientApiRoute(request, env);
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
      console.error('Patient portal index.html fetch error:', error);
    }

    // Fallback 404
    return new Response('Page not found', { status: 404 });
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

async function handlePatientApiRoute(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Health check for patient portal
  if (path === '/api/health') {
    return new Response(JSON.stringify({
      status: 'healthy',
      portal: 'patient',
      app: 'medication-auth',
      timestamp: new Date().toISOString(),
      features: ['prior-auth-requests', 'status-tracking', 'document-upload']
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Patient-Portal': 'medication-auth'
      }
    });
  }

  // Patient-specific API endpoints (limited access)
  if (path === '/api/patient/status') {
    // Return patient authorization status
    return new Response(JSON.stringify({
      message: 'Patient status endpoint',
      access: 'public'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('API endpoint not found', { status: 404 });
}