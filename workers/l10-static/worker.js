/**
 * Ganger Platform - L10 Static Worker (Proven R2 Pattern)
 * Serves L10 EOS management app from R2 static assets
 */

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      let pathname = url.pathname;
      
      // Strip /l10 prefix if it exists (when accessed via staff router)
      if (pathname.startsWith('/l10/')) {
        pathname = pathname.slice(4); // Remove '/l10'
      } else if (pathname === '/l10') {
        pathname = '/';
      }

      // Health check endpoint
      if (pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          app: 'l10',
          storage: 'r2',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: env.ENVIRONMENT || 'production',
          binding_available: !!env.STATIC_ASSETS,
          bucket_name: 'ganger-l10-assets'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Handle Next.js static export routing
      if (pathname === '/') {
        pathname = '/index.html';
      } else if (!pathname.includes('.') && !pathname.endsWith('/')) {
        // Only add index.html for routes that don't already have file extensions
        pathname = pathname + '/index.html';
      } else if (pathname.endsWith('/') && pathname !== '/') {
        pathname = pathname + 'index.html';
      }
      // For files with extensions (js, css, etc.), serve them directly

      // Remove leading slash for R2 key
      const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      
      // Get object from R2 using proven working pattern
      const object = await env.STATIC_ASSETS.get(key);
      
      if (object === null) {
        // Only fall back to index.html for page routes, not for static assets
        if (key.includes('/_next/') || key.includes('.js') || key.includes('.css') || key.includes('.map') || key.includes('.json')) {
          // Don't fall back to index.html for static assets - return 404
          return new Response(`L10 - Static asset not found: ${key}`, { 
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
        
        // Try index.html for SPA routing (only for page routes)
        const indexObject = await env.STATIC_ASSETS.get('index.html');
        if (indexObject === null) {
          return new Response(`L10 - File not found: ${key}`, { 
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
      return new Response(`L10 - Error: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};