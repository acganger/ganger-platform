/**
 * Cloudflare Worker for Ganger Staff Portal
 * Modern TypeScript Workers with Static Assets deployment
 * Pattern: Method 2 from DEPLOYMENT_GUIDE.md
 */

interface Env {
  ASSETS: Fetcher;
  // Environment variables
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  ENVIRONMENT?: string;
}

// Security headers as recommended in deployment guide
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff', 
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Validate request method
      if (!['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].includes(request.method)) {
        return new Response('Method not allowed', { 
          status: 405,
          headers: securityHeaders
        });
      }

      const url = new URL(request.url);

      // Health check endpoint
      if (url.pathname === '/health') {
        return Response.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'ganger-staff-portal',
          deployment: 'cloudflare-workers-static-assets',
          environment: env.ENVIRONMENT || 'unknown',
          version: '1.0.0'
        }, {
          headers: {
            ...securityHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
      }

      // Handle API routes if needed (future expansion)
      if (url.pathname.startsWith('/api/')) {
        // For now, let static assets handle API routes
        // Future: Add server-side API logic here
        return env.ASSETS.fetch(request);
      }

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            ...securityHeaders,
            'Access-Control-Allow-Origin': 'https://staff.gangerdermatology.com',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
          }
        });
      }

      // Serve static assets from Next.js build
      const response = await env.ASSETS.fetch(request);
      
      // Add security headers to all responses
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          ...securityHeaders
        }
      });

      // Cache static assets
      if (url.pathname.includes('/_next/static/')) {
        newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (url.pathname.endsWith('.html')) {
        newResponse.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      }

      return newResponse;
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal server error', { 
        status: 500,
        headers: securityHeaders
      });
    }
  }
} satisfies ExportedHandler<Env>;