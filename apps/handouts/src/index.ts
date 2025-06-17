/**
 * Cloudflare Worker for Handouts Generator - TypeScript Edition
 * Serves static Next.js build from R2 bucket storage with modern security
 * Pattern: Modern TypeScript Workers with Static Assets and R2 integration
 */

interface Env {
  ASSETS: Fetcher;
  HANDOUTS_BUCKET: R2Bucket;
  ENVIRONMENT: string;
  APP_NAME: string;
  APP_VERSION: string;
}

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      
      // Validate request method
      if (!['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].includes(request.method)) {
        return new Response('Method not allowed', { 
          status: 405, 
          headers: securityHeaders 
        });
      }
      
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            ...securityHeaders,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      }
      
      // Health check endpoint
      if (url.pathname === '/health') {
        return Response.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'handouts-generator',
          deployment: 'r2-cloudflare-workers-typescript',
          environment: env.ENVIRONMENT || 'unknown',
          app: env.APP_NAME || 'handouts',
          version: env.APP_VERSION || '1.0.0'
        }, { headers: securityHeaders });
      }

      // API routes for handout generation
      if (url.pathname.startsWith('/api/')) {
        return await handleApiRoutes(url, request, env);
      }

      // Try to serve from static assets first (Next.js build)
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          // Add security headers to static assets
          const newHeaders = new Headers(assetResponse.headers);
          Object.entries(securityHeaders).forEach(([key, value]) => {
            newHeaders.set(key, value);
          });
          
          return new Response(assetResponse.body, {
            status: assetResponse.status,
            statusText: assetResponse.statusText,
            headers: newHeaders
          });
        }
      } catch (error) {
        console.warn('Static assets fetch failed, falling back to R2:', error);
      }

      // Fallback to R2 bucket for dynamic content or missing static files
      return await handleR2Content(url, env);
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal server error', { 
        status: 500,
        headers: securityHeaders
      });
    }
  }
} satisfies ExportedHandler<Env>;

/**
 * Handle API routes for handout generation
 */
async function handleApiRoutes(url: URL, request: Request, env: Env): Promise<Response> {
  const path = url.pathname.slice(5); // Remove '/api/'
  
  switch (path) {
    case 'generate':
      if (request.method === 'POST') {
        try {
          const body = await request.json() as { 
            template: string; 
            patientData: Record<string, any>;
            format: 'pdf' | 'html';
          };
          
          // Basic validation
          if (!body.template || !body.patientData) {
            return Response.json(
              { error: 'Missing required fields: template, patientData' }, 
              { status: 400, headers: securityHeaders }
            );
          }
          
          // Generate handout (placeholder - would integrate with PDF service)
          const result = {
            id: crypto.randomUUID(),
            template: body.template,
            format: body.format || 'pdf',
            generated_at: new Date().toISOString(),
            status: 'generated',
            download_url: `/api/download/${crypto.randomUUID()}`
          };
          
          return Response.json(result, { headers: securityHeaders });
          
        } catch (error) {
          console.error('Generate API error:', error);
          return Response.json(
            { error: 'Invalid request body' }, 
            { status: 400, headers: securityHeaders }
          );
        }
      }
      break;
      
    case 'templates':
      // Return available handout templates
      const templates = [
        { id: 'medication-guide', name: 'Medication Guide', category: 'prescriptions' },
        { id: 'post-procedure', name: 'Post-Procedure Care', category: 'procedures' },
        { id: 'skin-care', name: 'Skin Care Instructions', category: 'general' }
      ];
      
      return Response.json({ templates }, { headers: securityHeaders });
      
    default:
      return Response.json(
        { error: 'API endpoint not found' }, 
        { status: 404, headers: securityHeaders }
      );
  }
  
  return Response.json(
    { error: 'Method not allowed' }, 
    { status: 405, headers: securityHeaders }
  );
}

/**
 * Handle R2 bucket content serving
 */
async function handleR2Content(url: URL, env: Env): Promise<Response> {
  // Handle root path
  if (url.pathname === '/') {
    url.pathname = '/index.html';
  }
  
  // Handle directory paths (add index.html)
  if (url.pathname.endsWith('/')) {
    url.pathname += 'index.html';
  }
  
  // Handle paths without extensions (Next.js routing)
  if (!url.pathname.includes('.') && !url.pathname.endsWith('/')) {
    url.pathname += '.html';
  }

  // Remove leading slash for R2 key
  const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  
  try {
    // Attempt to get file from R2
    const object = await env.HANDOUTS_BUCKET.get(key);
    
    if (!object) {
      // Try fallback to index.html for client-side routing
      const indexObject = await env.HANDOUTS_BUCKET.get('index.html');
      if (indexObject) {
        return new Response(indexObject.body, {
          headers: {
            ...securityHeaders,
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
      
      // Return 404 with security headers
      return new Response('Not Found', { 
        status: 404, 
        headers: securityHeaders 
      });
    }

    // Determine content type
    const contentType = getContentType(key);
    
    return new Response(object.body, {
      headers: {
        ...securityHeaders,
        'Content-Type': contentType,
        'Cache-Control': getCacheControl(key),
        'ETag': object.etag || '',
      },
    });
    
  } catch (error) {
    console.error('R2 fetch error:', error);
    return new Response('Internal Server Error', { 
      status: 500, 
      headers: securityHeaders 
    });
  }
}

/**
 * Get appropriate content type based on file extension
 */
function getContentType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
    'pdf': 'application/pdf'
  };
  return types[ext || ''] || 'application/octet-stream';
}

/**
 * Get appropriate cache control header based on file type
 */
function getCacheControl(key: string): string {
  // Static assets get longer cache
  if (key.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  
  // HTML files get shorter cache for updates
  if (key.endsWith('.html')) {
    return 'public, max-age=86400';
  }
  
  // PDF files get medium cache
  if (key.endsWith('.pdf')) {
    return 'public, max-age=604800'; // 1 week
  }
  
  // Default cache
  return 'public, max-age=86400';
}