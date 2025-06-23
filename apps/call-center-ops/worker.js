/**
 * Cloudflare Worker for call center ops Next.js Application
 * Using @cloudflare/next-on-pages for proper Next.js runtime
 */

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// Import the Next.js handler from the build
import { default as nextHandler } from './_worker.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/phones/health' || url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'call center ops',
        deployment: 'next-on-pages',
        runtime: 'cloudflare-workers'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      // Use Next.js handler for all requests
      return await nextHandler.fetch(request, env, ctx);
    } catch (error) {
      console.error('Next.js handler error:', error);
      
      // Fallback error response
      return new Response(JSON.stringify({
        error: 'Application Error',
        message: 'The call center ops application encountered an error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};