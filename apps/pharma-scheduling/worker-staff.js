/**
 * Cloudflare Worker for Pharma Scheduling Staff Interface
 * Serves staff management interface from R2 bucket for staff.gangerdermatology.com/reps
 * Focus: Schedule management, rep approval, analytics
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check endpoint for internal monitoring
    if (url.pathname === '/reps/health' || url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'pharma-staff-management',
        interface: 'staff',
        deployment: 'r2-cloudflare-workers'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Security headers for staff interface
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    };

    // Strip /reps prefix for internal routing if present
    let pathname = url.pathname;
    if (pathname.startsWith('/reps/')) {
      pathname = pathname.substring(5); // Remove '/reps' prefix
    } else if (pathname === '/reps') {
      pathname = '/';
    }

    // Handle root path - serve staff management interface
    if (pathname === '/') {
      pathname = '/index.html';
    }
    
    // Handle directory paths (add index.html)
    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    }
    
    // Handle Next.js routing for staff interface
    if (!pathname.includes('.') && !pathname.endsWith('/')) {
      pathname += '.html';
    }

    // Remove leading slash for R2 key
    const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    
    try {
      // Attempt to get file from R2 (staff-specific bucket)
      const object = await env.PHARMA_SCHEDULING_BUCKET.get(key);
      
      if (!object) {
        // Try fallback to index.html for client-side routing
        const indexObject = await env.PHARMA_SCHEDULING_BUCKET.get('index.html');
        if (indexObject) {
          return new Response(indexObject.body, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'public, max-age=86400',
              ...securityHeaders
            },
          });
        }
        
        // Return 404 for staff interface
        return new Response('Not Found', { 
          status: 404,
          headers: securityHeaders
        });
      }

      // Determine content type
      const contentType = getContentType(key);
      
      return new Response(object.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': getCacheControl(key),
          'ETag': object.etag,
          ...securityHeaders
        },
      });
      
    } catch (error) {
      console.error('R2 fetch error (staff interface):', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: securityHeaders
      });
    }
  },
};

function getContentType(key) {
  const ext = key.split('.').pop()?.toLowerCase();
  const types = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
    'webmanifest': 'application/manifest+json'
  };
  return types[ext] || 'application/octet-stream';
}

function getCacheControl(key) {
  // Static assets get longer cache for staff interface
  if (key.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  
  // API responses get short cache for real-time management
  if (key.includes('/api/')) {
    return 'public, max-age=60'; // 1 minute for staff management data
  }
  
  // HTML files get shorter cache for updates
  if (key.endsWith('.html')) {
    return 'public, max-age=600'; // 10 minutes for staff interface
  }
  
  // Default cache
  return 'public, max-age=86400';
}