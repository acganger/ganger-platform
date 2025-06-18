/**
 * EOS L10 Management Platform - Cloudflare Worker
 * Serves static Next.js build from R2 bucket storage
 * 
 * Following Cloudflare Workers best practices:
 * - TypeScript with proper types
 * - ES Modules format
 * - Secure environment variable handling
 * - Comprehensive error handling
 */

interface Env {
  EOS_L10_BUCKET: R2Bucket;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  service: string;
  deployment: string;
  path: string;
}

interface DiagnosticResponse {
  status: string;
  indexExists: boolean;
  manifestExists: boolean;
  indexSize: number | null;
  manifestSize: number | null;
  timestamp: string;
  '404Exists': boolean;
  '404Size': number | null;
  bucketBinding: string;
}

/**
 * Determines content type based on file extension
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
    'webmanifest': 'application/manifest+json'
  };
  return types[ext!] || 'application/octet-stream';
}

/**
 * Determines cache control headers based on file type
 */
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

/**
 * Processes URL pathname for L10 prefix handling
 */
function processPathname(pathname: string): string {
  // Handle L10 prefix - remove it since our static files don't have it
  if (pathname.startsWith('/l10/')) {
    pathname = pathname.substring(4); // Remove '/l10'
  } else if (pathname === '/l10') {
    pathname = '/';
  }

  // Handle root path
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Handle directory paths (add index.html)
  if (pathname.endsWith('/')) {
    pathname += 'index.html';
  }
  
  // Handle paths without extensions (Next.js routing)
  if (!pathname.includes('.') && !pathname.endsWith('/')) {
    pathname += '.html';
  }

  return pathname;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      
      // Health check endpoint
      if (url.pathname === '/health' || url.pathname === '/l10/health') {
        const response: HealthCheckResponse = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'eos-l10-management',
          deployment: 'r2-cloudflare-workers',
          path: url.pathname
        };
        
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Diagnostic endpoint for R2 bucket testing
      if (url.pathname === '/l10/diag') {
        try {
          // Check if bucket binding exists
          if (!env.EOS_L10_BUCKET) {
            return new Response(JSON.stringify({
              status: 'r2-error',
              error: 'EOS_L10_BUCKET binding not found',
              timestamp: new Date().toISOString()
            }), {
              headers: { 'Content-Type': 'application/json' },
              status: 500
            });
          }

          // Test multiple possible keys
          const [indexObj, manifestObj, testObj] = await Promise.all([
            env.EOS_L10_BUCKET.get('index.html'),
            env.EOS_L10_BUCKET.get('manifest.json'),
            env.EOS_L10_BUCKET.get('404.html')
          ]);
          
          const response: DiagnosticResponse = {
            status: 'r2-test',
            indexExists: indexObj !== null,
            manifestExists: manifestObj !== null,
            indexSize: indexObj?.size || null,
            manifestSize: manifestObj?.size || null,
            timestamp: new Date().toISOString(),
            '404Exists': testObj !== null,
            '404Size': testObj?.size || null,
            bucketBinding: 'EOS_L10_BUCKET present'
          };
          
          return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('R2 diagnostic error:', error);
          return new Response(JSON.stringify({
            status: 'r2-error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
          });
        }
      }

      // Process the pathname for file serving
      const pathname = processPathname(url.pathname);
      
      // Remove leading slash for R2 key
      const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      
      try {
        // Attempt to get file from R2
        const object = await env.EOS_L10_BUCKET.get(key);
        
        if (!object) {
          // Try fallback to index.html for client-side routing
          const indexObject = await env.EOS_L10_BUCKET.get('index.html');
          if (indexObject) {
            return new Response(indexObject.body, {
              headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'public, max-age=86400',
              },
            });
          }
          
          // Return 404
          return new Response('Not Found', { status: 404 });
        }

        // Determine content type and cache control
        const contentType = getContentType(key);
        const cacheControl = getCacheControl(key);
        
        return new Response(object.body, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': cacheControl,
            'ETag': object.etag || '',
          },
        });
        
      } catch (error) {
        console.error('R2 fetch error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;