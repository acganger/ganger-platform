/**
 * Cloudflare Worker for Component Showcase Platform R2 Deployment
 * Modern TypeScript Workers with Static Assets deployment
 * Pattern: Method 2 from DEPLOYMENT_GUIDE.md
 */

interface Env {
  COMPONENT_SHOWCASE_BUCKET: R2Bucket;
  ENVIRONMENT?: string;
  APP_NAME?: string;
  APP_VERSION?: string;
}

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'component-showcase',
        deployment: 'r2-cloudflare-workers',
        version: env.APP_VERSION || '1.0.0',
        environment: env.ENVIRONMENT || 'production'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...securityHeaders
        }
      });
    }

    // API endpoint for showcase metrics
    if (url.pathname === '/api/metrics') {
      return new Response(JSON.stringify({
        uptime: Date.now(),
        components_shown: 18,
        service: 'component-showcase'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...securityHeaders
        }
      });
    }

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
      const object = await env.COMPONENT_SHOWCASE_BUCKET.get(key);
      
      if (!object) {
        // Try fallback to index.html for client-side routing
        const indexObject = await env.COMPONENT_SHOWCASE_BUCKET.get('index.html');
        if (indexObject) {
          return new Response(indexObject.body, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'public, max-age=86400',
              ...securityHeaders
            },
          });
        }
        
        // Return 404
        return new Response('Not Found', { 
          status: 404,
          headers: securityHeaders
        });
      }

      // Determine content type
      const contentType = getContentType(key);
      
      return new Response(object.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': getCacheControl(key),
          'ETag': object.etag,
          ...securityHeaders
        },
      });
      
    } catch (error) {
      console.error('R2 fetch error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: securityHeaders
      });
    }
  },
} satisfies ExportedHandler<Env>;

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
    'webmanifest': 'application/manifest+json'
  };
  return types[ext || ''] || 'application/octet-stream';
}

function getCacheControl(key: string): string {
  // Static assets get longer cache
  if (key.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  
  // Service worker gets short cache
  if (key === 'sw.js' || (key.endsWith('.js') && key.includes('workbox'))) {
    return 'public, max-age=0, must-revalidate';
  }
  
  // HTML files get shorter cache for updates
  if (key.endsWith('.html')) {
    return 'public, max-age=86400';
  }
  
  // Default cache
  return 'public, max-age=86400';
}