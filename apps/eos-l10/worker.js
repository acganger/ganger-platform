/**
 * Cloudflare Worker for EOS L10 Management Platform R2 Deployment
 * Serves static Next.js build from R2 bucket storage
 * Pattern: Proven R2 deployment strategy
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/l10/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'eos-l10-management',
        deployment: 'r2-cloudflare-workers',
        path: url.pathname
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle L10 prefix - remove it since our static files don't have it
    let pathname = url.pathname;
    
    if (pathname.startsWith('/l10/')) {
      pathname = pathname.substring(4); // Remove '/l10'
    } else if (pathname === '/l10') {
      pathname = '/';
    }

    // Handle root path
    if (pathname === '/') {
      pathname = '/index.html';
    }
    
    // Handle directory paths (add index.html)
    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    }
    
    // Handle paths without extensions (Next.js routing)
    if (!pathname.includes('.') && !pathname.endsWith('/')) {
      pathname += '.html';
    }

    // Remove leading slash for R2 key
    const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    
    // Debug: return the key for testing
    if (url.searchParams.has('debug')) {
      return new Response(JSON.stringify({
        originalPath: url.pathname,
        processedPath: pathname,
        r2Key: key,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      // Attempt to get file from R2
      const object = await env.EOS_L10_BUCKET.get(key);
      
      if (!object) {
        // Try fallback to index.html for client-side routing
        const indexObject = await env.EOS_L10_BUCKET.get('index.html');
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
    'eot': 'application/vnd.ms-fontobject',
    'webmanifest': 'application/manifest+json'
  };
  return types[ext] || 'application/octet-stream';
}

function getCacheControl(key) {
  // Static assets get longer cache
  if (key.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  
  // Service worker gets short cache
  if (key === 'sw.js' || key.endsWith('.js') && key.includes('workbox')) {
    return 'public, max-age=0, must-revalidate';
  }
  
  // HTML files get shorter cache for updates
  if (key.endsWith('.html')) {
    return 'public, max-age=86400';
  }
  
  // Default cache
  return 'public, max-age=86400';
}