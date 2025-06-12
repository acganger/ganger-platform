/**
 * Cloudflare Worker for Medication Authorization App
 * Serves static assets from R2 and handles dynamic routing
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

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
          
          return new Response(object.body, { headers });
        }
      } catch (error) {
        console.error('R2 fetch error:', error);
      }
    }

    // Handle API routes (if any)
    if (path.startsWith('/api/')) {
      return handleApiRoute(request, env);
    }

    // For all other routes, serve the index.html from R2 (SPA routing)
    try {
      const indexObject = await env.ASSETS.get('index.html');
      if (indexObject) {
        const headers = new Headers();
        headers.set('Content-Type', 'text/html');
        headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
        
        return new Response(indexObject.body, { headers });
      }
    } catch (error) {
      console.error('Index.html fetch error:', error);
    }

    // Fallback 404
    return new Response('Not Found', { status: 404 });
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

async function handleApiRoute(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Health check endpoint
  if (path === '/api/health') {
    return new Response(JSON.stringify({
      status: 'healthy',
      app: 'medication-auth',
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Add other API routes as needed
  return new Response('API endpoint not found', { status: 404 });
}