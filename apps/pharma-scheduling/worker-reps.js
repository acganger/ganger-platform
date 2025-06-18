/**
 * Cloudflare Worker for Pharma Rep Booking Interface
 * Serves external rep-facing booking interface from R2 bucket
 * Focus: Pharmaceutical rep booking, TimeTrade replacement
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check endpoint for external monitoring
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'pharma-rep-booking',
        interface: 'external',
        deployment: 'r2-cloudflare-workers'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // Allow external monitoring
        }
      });
    }

    // Enhanced CORS headers for external pharma company access
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Handle root path - serve rep booking interface
    if (url.pathname === '/') {
      url.pathname = '/index.html';
    }
    
    // Handle directory paths (add index.html)
    if (url.pathname.endsWith('/')) {
      url.pathname += 'index.html';
    }
    
    // Handle Next.js routing for rep interface
    if (!url.pathname.includes('.') && !url.pathname.endsWith('/')) {
      url.pathname += '.html';
    }

    // Remove leading slash for R2 key
    const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    
    try {
      // Attempt to get file from R2 (rep-specific bucket)
      const object = await env.PHARMA_SCHEDULING_BUCKET.get(key);
      
      if (!object) {
        // Try fallback to index.html for client-side routing
        const indexObject = await env.PHARMA_SCHEDULING_BUCKET.get('index.html');
        if (indexObject) {
          return new Response(indexObject.body, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'public, max-age=86400',
              ...corsHeaders
            },
          });
        }
        
        // Return friendly 404 for external users
        return new Response('Page not found - Please check your booking link', { 
          status: 404,
          headers: corsHeaders
        });
      }

      // Determine content type
      const contentType = getContentType(key);
      
      return new Response(object.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': getCacheControl(key),
          'ETag': object.etag,
          ...corsHeaders
        },
      });
      
    } catch (error) {
      console.error('R2 fetch error (rep interface):', error);
      return new Response('Service temporarily unavailable', { 
        status: 500,
        headers: corsHeaders
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
  // Static assets get longer cache for external access
  if (key.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  
  // API responses get short cache for booking availability
  if (key.includes('/api/')) {
    return 'public, max-age=300'; // 5 minutes for booking data
  }
  
  // HTML files get shorter cache for updates
  if (key.endsWith('.html')) {
    return 'public, max-age=3600'; // 1 hour for rep interface
  }
  
  // Default cache
  return 'public, max-age=86400';
}