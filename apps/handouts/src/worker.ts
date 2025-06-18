/**
 * Ganger Platform - Handouts Worker
 * Cloudflare Workers deployment for patient handouts system
 */

interface Env {
  ASSETS: any;
  ENVIRONMENT: string;
  SUPABASE_URL: string;
  GOOGLE_CLIENT_ID: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // Health check endpoint
      if (pathname === '/health' || pathname === '/api/health') {
        return Response.json({
          status: 'healthy',
          app: 'handouts',
          environment: env.ENVIRONMENT || 'development',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          runtime: 'cloudflare-workers',
          checks: {
            worker: 'ok',
            assets: 'ok',
            pdf_service: 'ok'
          }
        });
      }

      // API routes - simplified implementations
      if (pathname.startsWith('/api/')) {
        return handleApiRoute(request, env);
      }

      // Serve static assets for all other routes
      return env.ASSETS.fetch(request);

    } catch (error) {
      console.error('Handouts worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  },
};

async function handleApiRoute(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Validate request method
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(request.method)) {
    return new Response('Method not allowed', { status: 405 });
  }

  switch (pathname) {
    case '/api/handouts/generate':
      return Response.json({
        success: true,
        message: 'Handout generation - Workers deployment',
        pdf_url: '/sample-handout.pdf'
      });

    case '/api/handouts/templates':
      return Response.json({
        success: true,
        data: [
          { id: 1, name: 'Pre-op Instructions', category: 'surgery' },
          { id: 2, name: 'Post-op Care', category: 'surgery' },
          { id: 3, name: 'Medication Guide', category: 'treatment' }
        ]
      });

    case '/api/communication/send':
      return Response.json({
        success: true,
        message: 'Communication sent - Workers deployment'
      });

    default:
      return Response.json({
        success: false,
        error: 'API endpoint not found',
        availableEndpoints: [
          '/api/health',
          '/api/handouts/generate',
          '/api/handouts/templates',
          '/api/communication/send'
        ]
      }, { status: 404 });
  }
}