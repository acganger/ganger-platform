/**
 * Ganger Platform - EOS L10 Worker
 * Serves the EOS Level 10 Meeting Management application
 */

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        app: 'eos-l10',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      // Use KV asset handler to serve static files
      return await getAssetFromKV(request, {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
        mapRequestToAsset: (req) => {
          const url = new URL(req.url);
          
          // Handle root path and deep routes for SPA
          if (url.pathname === '/' || 
              url.pathname.startsWith('/compass') ||
              url.pathname.startsWith('/issues') ||
              url.pathname.startsWith('/meeting') ||
              url.pathname.startsWith('/rocks') ||
              url.pathname.startsWith('/scorecard') ||
              url.pathname.startsWith('/todos') ||
              url.pathname.startsWith('/auth')) {
            return new Request(`${url.origin}/index.html`, req);
          }
          
          // Handle API routes - should be processed by Next.js API
          if (url.pathname.startsWith('/api/')) {
            return new Request(`${url.origin}${url.pathname}`, req);
          }
          
          return req;
        }
      });
    } catch (e) {
      // Fallback for unmatched routes
      return new Response(`EOS L10 - Route not found: ${url.pathname}`, {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};