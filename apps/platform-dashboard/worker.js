/**
 * Cloudflare Worker for Platform Dashboard Static Deployment
 * Serves Next.js static export with client-side routing support
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/dashboard/health' || url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'platform-dashboard',
        deployment: 'static-export',
        runtime: 'cloudflare-workers'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Remove /dashboard prefix for internal routing
    let pathname = url.pathname;
    if (pathname.startsWith('/dashboard')) {
      pathname = pathname.slice('/dashboard'.length) || '/';
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
      pathname += '/index.html';
    }

    try {
      // Get asset from the static files
      const asset = await env.ASSETS.fetch(new URL('https://placeholder.com' + pathname));
      
      if (asset.status === 404) {
        // Fallback to index.html for client-side routing
        const indexAsset = await env.ASSETS.fetch(new URL('https://placeholder.com/index.html'));
        if (indexAsset.ok) {
          return new Response(indexAsset.body, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'public, max-age=86400',
            },
          });
        }
        
        return new Response('Dashboard Not Found', { status: 404 });
      }

      // Determine content type
      const contentType = getContentType(pathname);
      
      return new Response(asset.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': getCacheControl(pathname),
        },
      });
      
    } catch (error) {
      console.error('Asset fetch error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};

function getContentType(pathname) {
  const ext = pathname.split('.').pop()?.toLowerCase();
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

function getCacheControl(pathname) {
  // Static assets get longer cache
  if (pathname.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  
  // HTML files get shorter cache for updates
  if (pathname.endsWith('.html')) {
    return 'public, max-age=86400';
  }
  
  // Default cache
  return 'public, max-age=86400';
}