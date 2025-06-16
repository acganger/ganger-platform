/**
 * Cloudflare Worker for Staff Portal R2 Deployment
 * Serves static Next.js build from R2 bucket storage
 * Pattern: Proven R2 deployment strategy
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'staff-portal',
        deployment: 'r2-cloudflare-workers'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle root path
    if (url.pathname === '/') {
      url.pathname = '/index.html';
    }
    
    // Handle directory paths (add index.html)
    if (url.pathname.endsWith('/')) {
      url.pathname += 'index.html';
    }
    
    // Handle paths without extensions (Next.js routing)
    if (!url.pathname.includes('.') && !url.pathname.endsWith('/')) {
      url.pathname += '.html';
    }

    // Remove leading slash for R2 key
    const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    
    try {
      // Attempt to get file from R2
      const object = await env.STAFF_PORTAL_BUCKET.get(key);
      
      if (!object) {
        // Try fallback to index.html for client-side routing
        const indexObject = await env.STAFF_PORTAL_BUCKET.get('index.html');
        if (indexObject) {
          return new Response(indexObject.body, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'public, max-age=86400',
            },
          });
        }
        
        // Return 404
        return new Response('Not Found', { status: 404 });
      }

      // Determine content type
      const contentType = getContentType(key);
      
      return new Response(object.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': getCacheControl(key),
          'ETag': object.etag,
        },
      });
      
    } catch (error) {
      console.error('R2 fetch error:', error);
      return new Response('Internal Server Error', { status: 500 });
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
    'eot': 'application/vnd.ms-fontobject'
  };
  return types[ext] || 'application/octet-stream';
}

function getCacheControl(key) {
  // Static assets get longer cache
  if (key.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  
  // HTML files get shorter cache for updates
  if (key.endsWith('.html')) {
    return 'public, max-age=86400';
  }
  
  // Default cache
  return 'public, max-age=86400';
}