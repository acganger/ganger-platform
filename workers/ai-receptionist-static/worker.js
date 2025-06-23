/**
 * Ganger Platform - AI Receptionist Static Worker (R2 Version)
 * Using proven R2 pattern from EOS L10 deployment
 */

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      let pathname = url.pathname;

      // Health check endpoint
      if (pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          app: 'ai-receptionist-r2',
          storage: 'r2',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: env.ENVIRONMENT || 'production',
          binding_available: !!env.STATIC_ASSETS,
          features: ['dashboard_app', 'r2_storage', 'nextjs_routing', 'worker_api_upload', 'ai_engine', 'call_monitoring']
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Handle Next.js static export routing
      if (pathname === '/') {
        pathname = '/index.html';
      } else if (!pathname.includes('.') && !pathname.endsWith('/')) {
        pathname = pathname + '/index.html';
      } else if (pathname.endsWith('/') && pathname !== '/') {
        pathname = pathname + 'index.html';
      }

      // Remove leading slash for R2 key
      const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      
      // Handle PUT requests for asset uploads (critical for R2 deployment)
      if (request.method === 'PUT') {
        await env.STATIC_ASSETS.put(key, request.body);
        return new Response(`AI Receptionist - Uploaded ${key} successfully!`);
      }
      
      // Get object from R2 using proven working pattern
      const object = await env.STATIC_ASSETS.get(key);
      
      if (object === null) {
        // Try index.html for SPA routing
        const indexObject = await env.STATIC_ASSETS.get('index.html');
        if (indexObject === null) {
          return new Response(`AI Receptionist - File not found: ${key}`, { 
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
        
        return new Response(indexObject.body, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=3600',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
          }
        });
      }

      // Success case - serve the requested object
      const headers = new Headers();
      
      // Set appropriate content type
      if (key.endsWith('.html')) headers.set('Content-Type', 'text/html');
      else if (key.endsWith('.js')) headers.set('Content-Type', 'application/javascript');
      else if (key.endsWith('.css')) headers.set('Content-Type', 'text/css');
      else if (key.endsWith('.json')) headers.set('Content-Type', 'application/json');
      else if (key.endsWith('.png')) headers.set('Content-Type', 'image/png');
      else if (key.endsWith('.jpg') || key.endsWith('.jpeg')) headers.set('Content-Type', 'image/jpeg');
      else if (key.endsWith('.svg')) headers.set('Content-Type', 'image/svg+xml');
      else if (key.endsWith('.ico')) headers.set('Content-Type', 'image/x-icon');
      else if (key.endsWith('.woff2')) headers.set('Content-Type', 'font/woff2');
      else if (key.endsWith('.woff')) headers.set('Content-Type', 'font/woff');
      
      headers.set('Cache-Control', 'public, max-age=86400');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('X-XSS-Protection', '1; mode=block');

      return new Response(object.body, { headers });

    } catch (error) {
      return new Response(`AI Receptionist - Error: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};