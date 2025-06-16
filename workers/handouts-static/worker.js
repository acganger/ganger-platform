/**
 * Ganger Platform - Handouts Static Worker (R2 Version)
 * Serves the Patient Handouts Generator from R2 object storage
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
          app: 'handouts-r2',
          storage: 'r2',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: env.ENVIRONMENT || 'production',
          binding_available: !!env.STATIC_ASSETS,
          features: ['handouts_generator', 'r2_storage', 'nextjs_routing', 'pdf_generation']
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Test endpoint
      if (pathname === '/test') {
        try {
          const testObject = await env.STATIC_ASSETS.get('index.html');
          return new Response(`Test R2 access: ${testObject ? 'SUCCESS - Object found' : 'FAIL - Object not found'}`, {
            headers: { 'Content-Type': 'text/plain' }
          });
        } catch (error) {
          return new Response(`Test R2 access: ERROR - ${error.message}`, {
            headers: { 'Content-Type': 'text/plain' }
          });
        }
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
      
      // Debug the R2 binding
      if (!env.STATIC_ASSETS) {
        return new Response(`Handouts - R2 binding not available`, { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Get object from R2
      console.log(`Attempting to get R2 object: ${key}`);
      let object;
      try {
        object = await env.STATIC_ASSETS.get(key);
        console.log(`R2 object result: ${object ? 'found' : 'null'}`);
      } catch (error) {
        console.log(`R2 error: ${error.message}`);
        return new Response(`Handouts - R2 Error: ${error.message}`, { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      if (object === null) {
        // Try index.html for SPA routing
        console.log(`Original key ${key} not found, trying index.html`);
        const indexObject = await env.STATIC_ASSETS.get('index.html');
        console.log(`Index.html result: ${indexObject ? 'found' : 'null'}`);
        if (indexObject === null) {
          return new Response(`Handouts - File not found: ${key} (also tried index.html)`, { 
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
      return new Response(`Handouts - Error: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};