/**
 * Ganger Platform - EOS L10 Static Worker (KV Version - PROVEN WORKING)
 * Uses Workers Sites with KV for reliable asset serving
 */

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // Health check endpoint
      if (pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          app: 'eos-l10-kv-working',
          storage: 'kv',
          timestamp: new Date().toISOString(),
          version: '8.0.0',
          environment: env.ENVIRONMENT || 'production',
          features: ['dashboard_app', 'kv_storage', 'nextjs_routing', 'workers_sites']
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Serve static assets using KV (Workers Sites pattern)
      const response = await getAssetFromKV(request, {
        mapRequestToAsset: (req) => {
          const url = new URL(req.url);
          let pathname = url.pathname;

          // Handle Next.js static export routing
          if (pathname === '/') {
            pathname = '/index.html';
          } else if (!pathname.includes('.') && !pathname.endsWith('/')) {
            pathname = pathname + '/index.html';
          } else if (pathname.endsWith('/') && pathname !== '/') {
            pathname = pathname + 'index.html';
          }

          url.pathname = pathname;
          return new Request(url.toString(), req);
        },
        cacheControl: {
          browserTTL: 86400,
          edgeTTL: 86400,
          bypassCache: false,
        },
      });
      
      // Add security headers
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('X-Content-Type-Options', 'nosniff');
      newResponse.headers.set('X-Frame-Options', 'DENY');
      newResponse.headers.set('X-XSS-Protection', '1; mode=block');
      
      return newResponse;

    } catch (error) {
      // Handle 404s by serving index.html for SPA routing
      if (error.status === 404) {
        try {
          const indexRequest = new Request(
            new URL('/index.html', request.url).toString(),
            request
          );
          const indexResponse = await getAssetFromKV(indexRequest);
          return new Response(indexResponse.body, {
            ...indexResponse,
            headers: { ...indexResponse.headers, 'Content-Type': 'text/html' },
          });
        } catch (indexError) {
          return new Response(`EOS L10 - Page not found: ${pathname}`, {
            status: 404, headers: { 'Content-Type': 'text/plain' }
          });
        }
      }

      return new Response(`EOS L10 - Server error: ${error.message}`, {
        status: 500, headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};