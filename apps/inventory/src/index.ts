/**
 * Cloudflare Worker for Inventory Management R2 Deployment
 * Serves static Next.js build from R2 bucket storage with TypeScript
 * Pattern: Modern TypeScript Worker with Security Headers
 */

interface Env {
  INVENTORY_BUCKET: any; // R2Bucket type
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
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return Response.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'inventory-management',
        deployment: 'r2-cloudflare-workers',
        environment: env.ENVIRONMENT || 'development',
        app_name: env.APP_NAME || 'inventory',
        app_version: env.APP_VERSION || '1.0.0'
      }, {
        headers: {
          ...securityHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // API metrics endpoint
    if (url.pathname === '/api/metrics') {
      return Response.json({
        timestamp: new Date().toISOString(),
        uptime: Date.now(),
        service: 'inventory-management',
        status: 'operational'
      }, {
        headers: {
          ...securityHeaders,
          'Content-Type': 'application/json'
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
      const object = await env.INVENTORY_BUCKET.get(key);
      
      if (!object) {
        // Try fallback to index.html for client-side routing
        const indexObject = await env.INVENTORY_BUCKET.get('index.html');
        if (indexObject) {
          return new Response(indexObject.body, {
            headers: {
              ...securityHeaders,
              'Content-Type': 'text/html',
              'Cache-Control': 'public, max-age=86400',
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
          ...securityHeaders,
          'Content-Type': contentType,
          'Cache-Control': getCacheControl(key),
          'ETag': object.etag,
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
};

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
    'eot': 'application/vnd.ms-fontobject'
  };
  return types[ext || ''] || 'application/octet-stream';
}

function getCacheControl(key: string): string {
  // Static assets get longer cache
  if (key.includes('/_next/static/')) {
    return 'public, max-age=31536000, immutable';
  }
  
  // HTML files get shorter cache for updates
  if (key.endsWith('.html')) {
    return 'public, max-age=86400';
  }
  
  // Default cache
  return 'public, max-age=86400';
}