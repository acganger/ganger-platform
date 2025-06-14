/**
 * Ganger Platform - EOS L10 Static Worker
 * Serves the actual Next.js static export with proper routing
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
          app: 'eos-l10-static',
          timestamp: new Date().toISOString(),
          version: '4.0.0',
          environment: env.ENVIRONMENT || 'production',
          features: ['static_nextjs', 'real_routing', 'eos_application', 'kv_asset_handler']
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        // Use getAssetFromKV with proper options and KV binding
        const response = await getAssetFromKV(request, {
          ASSET_NAMESPACE: env.STATIC_CONTENT_V2,
          mapRequestToAsset: (req) => {
            const url = new URL(req.url);
            let pathname = url.pathname;

            // Handle root path
            if (pathname === '/') {
              pathname = '/index.html';
            }
            // Handle trailing slash routes (Next.js static export style)  
            else if (!pathname.includes('.') && !pathname.endsWith('/')) {
              pathname = pathname + '/index.html';
            }
            // Handle already trailing slash routes
            else if (pathname.endsWith('/') && pathname !== '/') {
              pathname = pathname + 'index.html';
            }

            url.pathname = pathname;
            return new Request(url.toString(), req);
          },
          cacheControl: {
            browserTTL: 86400, // 1 day
            edgeTTL: 86400,    // 1 day
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
        // If asset not found, try to serve index.html for SPA routing
        if (error.status === 404) {
          try {
            const indexRequest = new Request(
              new URL('/index.html', request.url).toString(),
              request
            );
            const indexResponse = await getAssetFromKV(indexRequest, {
              ASSET_NAMESPACE: env.STATIC_CONTENT_V2,
            });
            return new Response(indexResponse.body, {
              ...indexResponse,
              headers: {
                ...indexResponse.headers,
                'Content-Type': 'text/html',
              },
            });
          } catch (indexError) {
            return new Response(`EOS L10 - Page not found: ${pathname}`, {
              status: 404,
              headers: { 'Content-Type': 'text/plain' }
            });
          }
        }

        return new Response(`EOS L10 - Server error: ${error.message}`, {
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

    } catch (error) {
      return new Response(`EOS L10 - Fatal error: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};