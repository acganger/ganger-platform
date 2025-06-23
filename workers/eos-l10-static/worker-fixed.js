/**
 * Ganger Platform - EOS L10 Static Worker (R2 Version - FIXED)
 * Based on official Cloudflare R2 demo worker pattern
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
          app: 'eos-l10-r2-fixed',
          storage: 'r2',
          timestamp: new Date().toISOString(),
          version: '7.0.0',
          environment: env.ENVIRONMENT || 'production',
          binding_available: !!env.STATIC_ASSETS,
          features: ['dashboard_app', 'r2_storage', 'nextjs_routing']
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

      // Remove leading slash for R2 key (critical fix)
      const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      
      console.log(`R2 Debug: Attempting to get key: "${key}"`);
      
      // Get object from R2 using exact pattern from Cloudflare docs
      const object = await env.STATIC_ASSETS.get(key);
      
      console.log(`R2 Debug: Object result:`, object ? 'FOUND' : 'NULL');
      
      if (object === null) {
        console.log(`R2 Debug: Object not found, trying index.html fallback`);
        // Try index.html for SPA routing (exact pattern from docs)
        const indexObject = await env.STATIC_ASSETS.get('index.html');
        if (indexObject === null) {
          return new Response(`EOS L10 - Object not found: ${key}`, { 
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
        
        // Use writeHttpMetadata pattern from official docs
        const headers = new Headers();
        indexObject.writeHttpMetadata(headers);
        headers.set('etag', indexObject.httpEtag);
        headers.set('Content-Type', 'text/html');
        headers.set('Cache-Control', 'public, max-age=86400');
        
        return new Response(indexObject.body, { headers });
      }

      // Success case - use exact pattern from Cloudflare R2 docs
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      
      // Determine content type
      if (key.endsWith('.html')) headers.set('Content-Type', 'text/html');
      else if (key.endsWith('.js')) headers.set('Content-Type', 'application/javascript');
      else if (key.endsWith('.css')) headers.set('Content-Type', 'text/css');
      else if (key.endsWith('.json')) headers.set('Content-Type', 'application/json');
      else if (key.endsWith('.png')) headers.set('Content-Type', 'image/png');
      else if (key.endsWith('.jpg') || key.endsWith('.jpeg')) headers.set('Content-Type', 'image/jpeg');
      else if (key.endsWith('.svg')) headers.set('Content-Type', 'image/svg+xml');
      
      // Add security headers
      headers.set('Cache-Control', 'public, max-age=86400');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('X-XSS-Protection', '1; mode=block');

      return new Response(object.body, { headers });

    } catch (error) {
      console.error('R2 Error:', error);
      return new Response(`EOS L10 - Error: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};