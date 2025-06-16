/**
 * Call Center Ops R2 Worker
 * Serves static files from R2 storage with proper MIME types
 */

export interface Env {
  ASSETS: R2Bucket;
  ENVIRONMENT: string;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function getMimeType(url: string): string {
  const extension = url.substring(url.lastIndexOf('.')).toLowerCase();
  return MIME_TYPES[extension] || 'application/octet-stream';
}

function getAssetPath(url: URL): string {
  let path = url.pathname;
  
  // Handle root path
  if (path === '/') {
    return 'call-center-ops/index.html';
  }
  
  // Remove leading slash
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  
  // Handle directory paths (append index.html)
  if (path.endsWith('/')) {
    path += 'index.html';
  }
  
  // Handle paths without extension (assume they are directories)
  if (!path.includes('.') && !path.endsWith('html')) {
    path += '/index.html';
  }
  
  // Add call-center-ops prefix
  return `call-center-ops/${path}`;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      const assetPath = getAssetPath(url);
      
      console.log(`Fetching asset: ${assetPath}`);
      
      // Try to get the asset from R2
      const object = await env.ASSETS.get(assetPath);
      
      if (!object) {
        console.log(`Asset not found: ${assetPath}, trying index.html for SPA routing`);
        
        // For SPA routing, serve index.html for non-asset requests
        if (!assetPath.includes('.') || assetPath.endsWith('.html')) {
          const indexObject = await env.ASSETS.get('call-center-ops/index.html');
          if (indexObject) {
            return new Response(await indexObject.arrayBuffer(), {
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=0, must-revalidate',
              },
            });
          }
        }
        
        return new Response('Not Found', { status: 404 });
      }
      
      const mimeType = getMimeType(assetPath);
      const cacheControl = assetPath.includes('_next/static/') 
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600';
      
      return new Response(await object.arrayBuffer(), {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': cacheControl,
          'ETag': object.etag,
        },
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};